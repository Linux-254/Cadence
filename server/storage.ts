import crypto from 'node:crypto';
import {
  clampLapseGraceMin,
  DatabaseNotConfiguredError,
  IDE_APP_NAME_TO_SLUG,
  isMongoEnvConfigured,
  isVercelProductionWithoutMongo,
} from './config.ts';
import { getSqliteDb } from './db.ts';
import {
  AchievementModel,
  ApplicationTrackerModel,
  connectMongo,
  DocumentModel,
  ExtensionTokenModel,
  LearningPathModel,
  LearningResourceModel,
  PairingCodeModel,
  PortfolioSiteModel,
  PracticeDrillModel,
  ProjectModel,
  RateLimitModel,
  RefreshTokenModel,
  ResourceProgressModel,
  SessionModel,
  ToolModel,
  UserModel,
} from './models/mongooseModels.ts';
import {
  deterministicToolId,
  migrateLegacyUserToV13,
  normalizeTrackId,
  SEED_LEARNING_PATHS,
  SEED_TOOLS_V13,
} from './seed/taxonomy.ts';
import {
  deterministicResourceId,
  SEED_LEARNING_RESOURCES,
} from './seed/resources.ts';
import {
  deterministicDrillId,
  SEED_PRACTICE_DRILLS,
} from './seed/practiceDrills.ts';
import { seedDemoAccountsMongo } from './seed/demoSeeder.ts';
import type {
  ApplicationStatus,
  ApplicationTrackerRecord,
  DocumentSummaryCard,
  EmbeddableStatus,
  GlobalSearchResultPayload,
  LearningPathRecord,
  LearningResourceRecord,
  PracticeDrillMode,
  PracticeDrillRecord,
  PracticeDrillStep,
  ProjectDocumentRecord,
  ProjectRecord,
  ProjectType,
  ResourceFormat,
  ResourcePricingTier,
  ResourceProgressRecord,
  ResourceStatus,
  SessionRecord,
  SkillLevel,
  SkillLevelV13,
  TierName,
  ToolCategory,
  ToolPricingTier,
  ToolRecord,
  TrackId,
  UserProfile,
  UserProfileV13,
} from '../src/types/cadence.ts';

export type StorageEngine = 'mongodb' | 'sqlite_preview';

export function isMongoConfigured(): boolean {
  return isMongoEnvConfigured();
}

export function getStorageEngine(): StorageEngine {
  return isMongoConfigured() ? 'mongodb' : 'sqlite_preview';
}

let mongoInitialized = false;

export async function ensureStorageReady(): Promise<void> {
  if (isVercelProductionWithoutMongo()) {
    throw new DatabaseNotConfiguredError('Database not configured.');
  }

  if (!isMongoConfigured()) {
    getSqliteDb();
    return;
  }

  await connectMongo();
  if (mongoInitialized) return;

  for (const tool of SEED_TOOLS_V13) {
    const toolId = deterministicToolId(tool.slug);
    await ToolModel.updateOne(
      { slug: tool.slug },
      {
        $setOnInsert: { _id: toolId, isSeeded: true, createdBy: null },
        $set: {
          slug: tool.slug,
          name: tool.name,
          categories: tool.categories,
          launchProtocol: tool.launchProtocol,
          domainPattern: tool.domainPattern,
          trackingLayer: tool.trackingLayer,
          description: tool.description,
          docsUrl: tool.docsUrl,
          pricingTier: tool.pricingTier,
        },
      },
      { upsert: true }
    );
  }

  for (const lp of SEED_LEARNING_PATHS) {
    await LearningPathModel.updateOne(
      { slug: lp.slug },
      {
        $setOnInsert: { _id: lp.id },
        $set: {
          slug: lp.slug,
          title: lp.title,
          track: lp.track,
          level: lp.level,
          languages: lp.languages,
          freeOnly: lp.freeOnly,
          estimatedHours: lp.estimatedHours,
          sourceName: lp.sourceName,
          summary: lp.summary,
          steps: lp.steps,
        },
      },
      { upsert: true }
    );
  }

  for (const res of SEED_LEARNING_RESOURCES) {
    await LearningResourceModel.updateOne(
      { slug: res.slug },
      {
        $setOnInsert: { _id: deterministicResourceId(res.slug) },
        $set: {
          slug: res.slug,
          title: res.title,
          provider: res.provider,
          url: res.url,
          tracks: res.tracks,
          level: res.level,
          languages: res.languages,
          contentLanguages: res.contentLanguages,
          pricingTier: res.pricingTier,
          embeddable: res.embeddable,
          format: res.format,
          estimatedMinutes: res.estimatedMinutes,
          summary: res.summary,
        },
      },
      { upsert: true }
    );
  }

  for (const drill of SEED_PRACTICE_DRILLS) {
    await PracticeDrillModel.updateOne(
      { slug: drill.slug },
      {
        $setOnInsert: { _id: deterministicDrillId(drill.slug) },
        $set: {
          slug: drill.slug,
          title: drill.title,
          track: drill.track,
          level: drill.level,
          mode: drill.mode,
          languages: drill.languages,
          estimatedMinutes: drill.estimatedMinutes,
          summary: drill.summary,
          deliverable: drill.deliverable,
          resourceSlug: drill.resourceSlug,
          sandboxUrl: drill.sandboxUrl,
          steps: drill.steps,
        },
      },
      { upsert: true }
    );
  }

  await seedDemoAccountsMongo();
  mongoInitialized = true;
}

export interface StoredUserRecord extends UserProfile {
  passwordHash: string;
}

function normalizeDefaultToolSlugs(slugs: unknown): string[] {
  if (!Array.isArray(slugs)) return ['vscode', 'google-ai-studio'];
  return slugs.map((s) => (s === 'vs-code' ? 'vscode' : String(s)));
}

function mapSqliteUser(row: Record<string, unknown>, sessionCount: number): StoredUserRecord {
  const defaultToolSlugs = normalizeDefaultToolSlugs(
    JSON.parse(String(row.default_tool_slugs || '["vscode","google-ai-studio"]'))
  );
  const rawProfile = row.profile_json ? (JSON.parse(String(row.profile_json)) as Partial<UserProfileV13>) : null;
  const { profile, onboardingCompleted } = migrateLegacyUserToV13(
    {
      skillLevel: String(row.skill_level) as SkillLevel,
      primaryRole: String(row.primary_role),
      timezone: String(row.timezone),
      onboardingCompleted: Boolean(row.onboarding_completed),
      defaultToolSlugs,
      profile: rawProfile,
    },
    sessionCount
  );

  return {
    id: String(row.id),
    username: String(row.username),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    skillLevel: String(row.skill_level) as SkillLevel,
    primaryRole: String(row.primary_role),
    timezone: String(row.timezone),
    xp: Number(row.xp),
    tier: String(row.tier) as TierName,
    streakDays: Number(row.streak_days),
    lastStreakDate: row.last_streak_date ? String(row.last_streak_date) : null,
    onboardingCompleted,
    defaultToolSlugs,
    portfolioUrl: String(row.portfolio_url || ''),
    businessSiteUrl: String(row.business_site_url || ''),
    createdAt: String(row.created_at),
    profile,
  };
}

function mapMongoUser(doc: Record<string, unknown>, sessionCount: number): StoredUserRecord {
  const defaultToolSlugs = normalizeDefaultToolSlugs(doc.defaultToolSlugs);
  const rawProfile = (doc.profile as Partial<UserProfileV13> | null) ?? null;
  const { profile, onboardingCompleted } = migrateLegacyUserToV13(
    {
      skillLevel: String(doc.skillLevel) as SkillLevel,
      primaryRole: String(doc.primaryRole),
      timezone: String(doc.timezone),
      onboardingCompleted: Boolean(doc.onboardingCompleted),
      defaultToolSlugs,
      profile: rawProfile,
    },
    sessionCount
  );

  return {
    id: String(doc._id),
    username: String(doc.username),
    name: String(doc.name),
    email: String(doc.email),
    passwordHash: String(doc.passwordHash),
    skillLevel: String(doc.skillLevel) as SkillLevel,
    primaryRole: String(doc.primaryRole),
    timezone: String(doc.timezone),
    xp: Number(doc.xp || 0),
    tier: String(doc.tier || 'Apprentice') as TierName,
    streakDays: Number(doc.streakDays || 0),
    lastStreakDate: doc.lastStreakDate ? String(doc.lastStreakDate) : null,
    onboardingCompleted,
    defaultToolSlugs,
    portfolioUrl: String(doc.portfolioUrl || ''),
    businessSiteUrl: String(doc.businessSiteUrl || ''),
    createdAt: String(doc.createdAt),
    profile,
  };
}

export function stripPasswordHash(u: StoredUserRecord): UserProfile {
  const { passwordHash: _omit, ...profile } = u;
  void _omit;
  return profile;
}

function mapSqliteTool(r: Record<string, unknown>): ToolRecord {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    categories: JSON.parse(String(r.categories || '[]')),
    launchProtocol: String(r.launch_protocol || ''),
    domainPattern: String(r.domain_pattern || ''),
    trackingLayer: String(r.tracking_layer || 'manual') as ToolRecord['trackingLayer'],
    description: String(r.description || ''),
    docsUrl: String(r.docs_url || ''),
    isSeeded: Boolean(r.is_seeded),
    pricingTier: (r.pricing_tier ? String(r.pricing_tier) : null) as ToolPricingTier,
  };
}

function mapMongoTool(d: Record<string, unknown>): ToolRecord {
  return {
    id: String(d._id),
    slug: String(d.slug),
    name: String(d.name),
    categories: (Array.isArray(d.categories) ? d.categories : []) as ToolCategory[],
    launchProtocol: String(d.launchProtocol || ''),
    domainPattern: String(d.domainPattern || ''),
    trackingLayer: String(d.trackingLayer || 'manual') as ToolRecord['trackingLayer'],
    description: String(d.description || ''),
    docsUrl: String(d.docsUrl || ''),
    isSeeded: Boolean(d.isSeeded),
    pricingTier: (d.pricingTier ? String(d.pricingTier) : null) as ToolPricingTier,
  };
}

function mapSqliteProject(r: Record<string, unknown>): ProjectRecord {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: String(r.name),
    type: String(r.type) as ProjectType,
    clientName: String(r.client_name || ''),
    industry: String(r.industry || 'Software'),
    languages: JSON.parse(String(r.languages || '[]')),
    stack: JSON.parse(String(r.stack || '[]')),
    links: JSON.parse(String(r.links || '{"repo":"","live":"","portfolio":""}')),
    isPublicPortfolio: Boolean(r.is_public_portfolio),
    portfolioPublishedAt: r.portfolio_published_at ? String(r.portfolio_published_at) : null,
    createdAt: String(r.created_at),
  };
}

function mapMongoProject(d: Record<string, unknown>): ProjectRecord {
  const links = (d.links || {}) as Record<string, string>;
  return {
    id: String(d._id),
    userId: String(d.userId),
    name: String(d.name),
    type: String(d.type) as ProjectType,
    clientName: String(d.clientName || ''),
    industry: String(d.industry || 'Software'),
    languages: Array.isArray(d.languages) ? d.languages.map(String) : [],
    stack: Array.isArray(d.stack) ? d.stack.map(String) : [],
    links: {
      repo: String(links.repo || ''),
      live: String(links.live || ''),
      portfolio: String(links.portfolio || ''),
    },
    isPublicPortfolio: Boolean(d.isPublicPortfolio),
    portfolioPublishedAt: d.portfolioPublishedAt ? String(d.portfolioPublishedAt) : null,
    createdAt: String(d.createdAt),
  };
}

function mapSqliteSession(r: Record<string, unknown>): SessionRecord {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    projectId: String(r.project_id),
    projectName: r.project_name ? String(r.project_name) : undefined,
    mode: String(r.mode) as ProjectType,
    status: String(r.status) as SessionRecord['status'],
    plannedMinutes: Number(r.planned_minutes),
    startedAt: String(r.started_at),
    endedAt: r.ended_at ? String(r.ended_at) : null,
    lastHeartbeat: String(r.last_heartbeat),
    currentDevice: String(r.current_device || 'web') as SessionRecord['currentDevice'],
    activeCheckpointId: r.active_checkpoint_id ? String(r.active_checkpoint_id) : null,
    title: String(r.title || ''),
    summary: String(r.summary || ''),
    whatILearned: String(r.what_i_learned || ''),
    improvementAreas: JSON.parse(String(r.improvement_areas || '[]')),
    checkpoints: JSON.parse(String(r.checkpoints || '[]')),
    pauses: JSON.parse(String(r.pauses || '[]')),
    deviceEvents: JSON.parse(String(r.device_events || '[]')),
    activitySlices: JSON.parse(String(r.activity_slices || '[]')),
    xpAwarded: Number(r.xp_awarded || 0),
    estimateAccuracy: Number(r.estimate_accuracy || 0),
    focusRatio: Number(r.focus_ratio ?? 1),
    activeMinutes: Number(r.active_minutes || 0),
    pausedMinutes: Number(r.paused_minutes || 0),
    overrunMinutes: Number(r.overrun_minutes || 0),
  };
}

function mapMongoSession(d: Record<string, unknown>, projectName?: string): SessionRecord {
  return {
    id: String(d._id),
    userId: String(d.userId),
    projectId: String(d.projectId),
    projectName,
    mode: String(d.mode) as ProjectType,
    status: String(d.status) as SessionRecord['status'],
    plannedMinutes: Number(d.plannedMinutes),
    startedAt: String(d.startedAt),
    endedAt: d.endedAt ? String(d.endedAt) : null,
    lastHeartbeat: String(d.lastHeartbeat),
    currentDevice: String(d.currentDevice || 'web') as SessionRecord['currentDevice'],
    activeCheckpointId: d.activeCheckpointId ? String(d.activeCheckpointId) : null,
    title: String(d.title || ''),
    summary: String(d.summary || ''),
    whatILearned: String(d.whatILearned || ''),
    improvementAreas: Array.isArray(d.improvementAreas) ? d.improvementAreas.map(String) : [],
    checkpoints: (Array.isArray(d.checkpoints) ? d.checkpoints : []) as SessionRecord['checkpoints'],
    pauses: (Array.isArray(d.pauses) ? d.pauses : []) as SessionRecord['pauses'],
    deviceEvents: (Array.isArray(d.deviceEvents) ? d.deviceEvents : []) as SessionRecord['deviceEvents'],
    activitySlices: (Array.isArray(d.activitySlices) ? d.activitySlices : []) as SessionRecord['activitySlices'],
    xpAwarded: Number(d.xpAwarded || 0),
    estimateAccuracy: Number(d.estimateAccuracy || 0),
    focusRatio: Number(d.focusRatio ?? 1),
    activeMinutes: Number(d.activeMinutes || 0),
    pausedMinutes: Number(d.pausedMinutes || 0),
    overrunMinutes: Number(d.overrunMinutes || 0),
  };
}

function mapSqliteApplication(r: Record<string, unknown>): ApplicationTrackerRecord {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    company: String(r.company),
    role: String(r.role),
    status: String(r.status || 'saved') as ApplicationStatus,
    url: String(r.url || ''),
    notes: String(r.notes || ''),
    appliedAt: r.applied_at ? String(r.applied_at) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapMongoApplication(d: Record<string, unknown>): ApplicationTrackerRecord {
  return {
    id: String(d._id),
    userId: String(d.userId),
    company: String(d.company),
    role: String(d.role),
    status: String(d.status || 'saved') as ApplicationStatus,
    url: String(d.url || ''),
    notes: String(d.notes || ''),
    appliedAt: d.appliedAt ? String(d.appliedAt) : null,
    createdAt: String(d.createdAt),
    updatedAt: String(d.updatedAt),
  };
}

function mapSqlitePath(r: Record<string, unknown>): LearningPathRecord {
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    track: String(r.track) as TrackId,
    level: String(r.level) as LearningPathRecord['level'],
    languages: JSON.parse(String(r.languages || '[]')),
    freeOnly: Boolean(r.free_only),
    estimatedHours: Number(r.estimated_hours || 0),
    sourceName: String(r.source_name || ''),
    summary: String(r.summary || ''),
    steps: JSON.parse(String(r.steps || '[]')),
  };
}

function mapMongoPath(d: Record<string, unknown>): LearningPathRecord {
  return {
    id: String(d._id),
    slug: String(d.slug),
    title: String(d.title),
    track: String(d.track) as TrackId,
    level: String(d.level) as LearningPathRecord['level'],
    languages: Array.isArray(d.languages) ? d.languages.map(String) : [],
    freeOnly: Boolean(d.freeOnly),
    estimatedHours: Number(d.estimatedHours || 0),
    sourceName: String(d.sourceName || ''),
    summary: String(d.summary || ''),
    steps: (Array.isArray(d.steps) ? d.steps : []) as LearningPathRecord['steps'],
  };
}

function mapSqliteResource(r: Record<string, unknown>): LearningResourceRecord {
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    provider: String(r.provider),
    url: String(r.url),
    tracks: JSON.parse(String(r.tracks || '[]')) as TrackId[],
    level: String(r.level) as SkillLevelV13,
    languages: JSON.parse(String(r.languages || '[]')),
    contentLanguages: JSON.parse(String(r.content_languages || '["en"]')),
    pricingTier: (r.pricing_tier ? String(r.pricing_tier) : null) as ResourcePricingTier,
    embeddable: String(r.embeddable || 'unknown') as EmbeddableStatus,
    format: String(r.format || 'docs') as ResourceFormat,
    estimatedMinutes: r.estimated_minutes !== null && r.estimated_minutes !== undefined ? Number(r.estimated_minutes) : null,
    summary: String(r.summary || ''),
  };
}

function mapMongoResource(d: Record<string, unknown>): LearningResourceRecord {
  return {
    id: String(d._id),
    slug: String(d.slug),
    title: String(d.title),
    provider: String(d.provider),
    url: String(d.url),
    tracks: (Array.isArray(d.tracks) ? d.tracks.map(String) : []) as TrackId[],
    level: String(d.level) as SkillLevelV13,
    languages: Array.isArray(d.languages) ? d.languages.map(String) : [],
    contentLanguages: Array.isArray(d.contentLanguages) ? d.contentLanguages.map(String) : ['en'],
    pricingTier: (d.pricingTier ? String(d.pricingTier) : null) as ResourcePricingTier,
    embeddable: String(d.embeddable || 'unknown') as EmbeddableStatus,
    format: String(d.format || 'docs') as ResourceFormat,
    estimatedMinutes: d.estimatedMinutes !== null && d.estimatedMinutes !== undefined ? Number(d.estimatedMinutes) : null,
    summary: String(d.summary || ''),
  };
}

function mapSqliteResourceProgress(r: Record<string, unknown>): ResourceProgressRecord {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    resourceSlug: String(r.resource_slug),
    status: String(r.status || 'saved') as ResourceStatus,
    completedSteps: JSON.parse(String(r.completed_steps || '[]')),
    notes: String(r.notes || ''),
    linkedSessionId: r.linked_session_id ? String(r.linked_session_id) : null,
    lastOpenedAt: r.last_opened_at ? String(r.last_opened_at) : null,
    updatedAt: String(r.updated_at),
  };
}

function mapMongoResourceProgress(d: Record<string, unknown>): ResourceProgressRecord {
  return {
    id: String(d._id),
    userId: String(d.userId),
    resourceSlug: String(d.resourceSlug),
    status: String(d.status || 'saved') as ResourceStatus,
    completedSteps: Array.isArray(d.completedSteps) ? d.completedSteps.map(String) : [],
    notes: String(d.notes || ''),
    linkedSessionId: d.linkedSessionId ? String(d.linkedSessionId) : null,
    lastOpenedAt: d.lastOpenedAt ? String(d.lastOpenedAt) : null,
    updatedAt: String(d.updatedAt),
  };
}

function mapSqliteDrill(r: Record<string, unknown>): PracticeDrillRecord {
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    track: String(r.track) as TrackId,
    level: String(r.level) as SkillLevelV13,
    mode: String(r.mode || 'coding') as PracticeDrillMode,
    languages: JSON.parse(String(r.languages || '[]')),
    estimatedMinutes: Number(r.estimated_minutes || 45),
    summary: String(r.summary || ''),
    deliverable: String(r.deliverable || ''),
    resourceSlug: String(r.resource_slug || ''),
    sandboxUrl: String(r.sandbox_url || ''),
    steps: JSON.parse(String(r.steps || '[]')) as PracticeDrillStep[],
  };
}

function mapMongoDrill(d: Record<string, unknown>): PracticeDrillRecord {
  return {
    id: String(d._id),
    slug: String(d.slug),
    title: String(d.title),
    track: String(d.track) as TrackId,
    level: String(d.level) as SkillLevelV13,
    mode: String(d.mode || 'coding') as PracticeDrillMode,
    languages: Array.isArray(d.languages) ? d.languages.map(String) : [],
    estimatedMinutes: Number(d.estimatedMinutes || 45),
    summary: String(d.summary || ''),
    deliverable: String(d.deliverable || ''),
    resourceSlug: String(d.resourceSlug || ''),
    sandboxUrl: String(d.sandboxUrl || ''),
    steps: (Array.isArray(d.steps) ? d.steps : []) as PracticeDrillStep[],
  };
}

function escapeRegexLiteral(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function countUserSessions(userId: string): Promise<number> {
  if (isMongoConfigured()) {
    return SessionModel.countDocuments({ userId });
  }
  const sqliteDb = getSqliteDb();
  const row = sqliteDb.prepare('SELECT COUNT(*) AS cnt FROM sessions WHERE user_id = ?').get(userId) as { cnt: number };
  return Number(row?.cnt || 0);
}

export const storage = {
  async findUserById(id: string): Promise<StoredUserRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await UserModel.findById(id).lean()) as Record<string, unknown> | null;
      if (!doc) return null;
      const sessionCount = doc.profile ? 0 : await countUserSessions(id);
      const mapped = mapMongoUser(doc, sessionCount);
      if (!doc.profile) {
        await UserModel.updateOne(
          { _id: id },
          { $set: { profile: mapped.profile, onboardingCompleted: mapped.onboardingCompleted } }
        );
      }
      return mapped;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    const sessionCount = row.profile_json ? 0 : await countUserSessions(id);
    const mapped = mapSqliteUser(row, sessionCount);
    if (!row.profile_json) {
      sqliteDb
        .prepare('UPDATE users SET profile_json = ?, onboarding_completed = ? WHERE id = ?')
        .run(JSON.stringify(mapped.profile), mapped.onboardingCompleted ? 1 : 0, id);
    }
    return mapped;
  },

  async findUserByEmail(email: string): Promise<StoredUserRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await UserModel.findOne({ email: email.toLowerCase() }).lean()) as Record<string, unknown> | null;
      if (!doc) return null;
      const id = String(doc._id);
      const sessionCount = doc.profile ? 0 : await countUserSessions(id);
      return mapMongoUser(doc, sessionCount);
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as Record<string, unknown> | undefined;
    if (!row) return null;
    const sessionCount = row.profile_json ? 0 : await countUserSessions(String(row.id));
    return mapSqliteUser(row, sessionCount);
  },

  async findUserByUsername(username: string): Promise<StoredUserRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await UserModel.findOne({ username }).lean()) as Record<string, unknown> | null;
      if (!doc) return null;
      const sessionCount = doc.profile ? 0 : await countUserSessions(String(doc._id));
      return mapMongoUser(doc, sessionCount);
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb.prepare('SELECT * FROM users WHERE username = ?').get(username) as Record<string, unknown> | undefined;
    if (!row) return null;
    const sessionCount = row.profile_json ? 0 : await countUserSessions(String(row.id));
    return mapSqliteUser(row, sessionCount);
  },

  async createUser(input: {
    id: string;
    username: string;
    name: string;
    email: string;
    passwordHash: string;
    skillLevel: SkillLevel;
    primaryRole?: string;
    createdAt: string;
  }): Promise<StoredUserRecord> {
    await ensureStorageReady();
    const { profile } = migrateLegacyUserToV13(
      {
        skillLevel: input.skillLevel,
        primaryRole: input.primaryRole || 'Full-Stack Builder',
        onboardingCompleted: false,
      },
      0
    );

    if (isMongoConfigured()) {
      await UserModel.create({
        _id: input.id,
        username: input.username,
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        skillLevel: input.skillLevel,
        primaryRole: input.primaryRole || 'Full-Stack Builder',
        defaultToolSlugs: ['vscode', 'google-ai-studio'],
        profile,
        createdAt: input.createdAt,
      });
      return (await this.findUserById(input.id))!;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `INSERT INTO users (id, username, name, email, password_hash, skill_level, primary_role, default_tool_slugs, profile_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.id,
        input.username,
        input.name,
        input.email.toLowerCase(),
        input.passwordHash,
        input.skillLevel,
        input.primaryRole || 'Full-Stack Builder',
        JSON.stringify(['vscode', 'google-ai-studio']),
        JSON.stringify(profile),
        input.createdAt
      );
    return (await this.findUserById(input.id))!;
  },

  async updateUserOnboardingStep(
    userId: string,
    patch: {
      name?: string;
      timezone?: string;
      skillLevel?: SkillLevel;
      primaryRole?: string;
      defaultToolSlugs?: string[];
      portfolioUrl?: string;
      businessSiteUrl?: string;
      complete?: boolean;
      profilePatch?: Partial<UserProfileV13>;
    }
  ): Promise<StoredUserRecord> {
    await ensureStorageReady();
    const current = await this.findUserById(userId);
    if (!current) throw new Error('User not found.');

    const mergedProfile: UserProfileV13 = {
      ...current.profile,
      ...(patch.profilePatch || {}),
      lapseGraceMin: clampLapseGraceMin(patch.profilePatch?.lapseGraceMin ?? current.profile.lapseGraceMin),
    };

    if (patch.complete) {
      mergedProfile.dashboardLens = patch.profilePatch?.dashboardLens || mergedProfile.intent || 'learner';
      mergedProfile.migratedV13 = false;
      mergedProfile.onboardingStep = 6;
    }

    const nextName = patch.name !== undefined ? patch.name : current.name;
    const nextTimezone = patch.timezone !== undefined ? patch.timezone : current.timezone;
    const nextSkillLevel = patch.skillLevel !== undefined ? patch.skillLevel : current.skillLevel;
    const nextRole = patch.primaryRole !== undefined ? patch.primaryRole : current.primaryRole;
    const nextTools = patch.defaultToolSlugs !== undefined ? patch.defaultToolSlugs : current.defaultToolSlugs;
    const nextPortfolio = patch.portfolioUrl !== undefined ? patch.portfolioUrl : current.portfolioUrl;
    const nextBusiness = patch.businessSiteUrl !== undefined ? patch.businessSiteUrl : current.businessSiteUrl;
    const nextCompleted = patch.complete ? true : current.onboardingCompleted;

    if (isMongoConfigured()) {
      await UserModel.updateOne(
        { _id: userId },
        {
          $set: {
            name: nextName,
            timezone: nextTimezone,
            skillLevel: nextSkillLevel,
            primaryRole: nextRole,
            defaultToolSlugs: nextTools,
            portfolioUrl: nextPortfolio,
            businessSiteUrl: nextBusiness,
            onboardingCompleted: nextCompleted,
            profile: mergedProfile,
          },
        }
      );
      return (await this.findUserById(userId))!;
    }

    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `UPDATE users SET name = ?, timezone = ?, skill_level = ?, primary_role = ?, default_tool_slugs = ?, portfolio_url = ?, business_site_url = ?, onboarding_completed = ?, profile_json = ? WHERE id = ?`
      )
      .run(
        nextName,
        nextTimezone,
        nextSkillLevel,
        nextRole,
        JSON.stringify(nextTools),
        nextPortfolio,
        nextBusiness,
        nextCompleted ? 1 : 0,
        JSON.stringify(mergedProfile),
        userId
      );
    return (await this.findUserById(userId))!;
  },

  async updateUserProfilePatch(
    userId: string,
    patch: {
      name?: string;
      skillLevel?: SkillLevel;
      primaryRole?: string;
      portfolioUrl?: string;
      businessSiteUrl?: string;
      timezone?: string;
      defaultToolSlugs?: string[];
      profilePatch?: Partial<UserProfileV13>;
    }
  ): Promise<StoredUserRecord> {
    await ensureStorageReady();
    const current = await this.findUserById(userId);
    if (!current) throw new Error('User not found.');

    const mergedProfile: UserProfileV13 = {
      ...current.profile,
      ...(patch.profilePatch || {}),
      lapseGraceMin: clampLapseGraceMin(patch.profilePatch?.lapseGraceMin ?? current.profile.lapseGraceMin),
    };

    const nextName = patch.name ?? current.name;
    const nextSkillLevel = patch.skillLevel ?? current.skillLevel;
    const nextPrimaryRole = patch.primaryRole ?? current.primaryRole;
    const nextPortfolio = patch.portfolioUrl ?? current.portfolioUrl;
    const nextBusiness = patch.businessSiteUrl ?? current.businessSiteUrl;
    const nextTimezone = patch.timezone ?? current.timezone;
    const nextTools = patch.defaultToolSlugs ?? current.defaultToolSlugs;

    if (isMongoConfigured()) {
      await UserModel.updateOne(
        { _id: userId },
        {
          $set: {
            name: nextName,
            skillLevel: nextSkillLevel,
            primaryRole: nextPrimaryRole,
            portfolioUrl: nextPortfolio,
            businessSiteUrl: nextBusiness,
            timezone: nextTimezone,
            defaultToolSlugs: nextTools,
            profile: mergedProfile,
          },
        }
      );
      return (await this.findUserById(userId))!;
    }

    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `UPDATE users SET name = ?, skill_level = ?, primary_role = ?, portfolio_url = ?, business_site_url = ?, timezone = ?, default_tool_slugs = ?, profile_json = ? WHERE id = ?`
      )
      .run(
        nextName,
        nextSkillLevel,
        nextPrimaryRole,
        nextPortfolio,
        nextBusiness,
        nextTimezone,
        JSON.stringify(nextTools),
        JSON.stringify(mergedProfile),
        userId
      );
    return (await this.findUserById(userId))!;
  },

  async updateUserStreakAndXp(userId: string, nextXp: number, nextTier: TierName, nextStreak: number, today: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await UserModel.updateOne(
        { _id: userId },
        { $set: { xp: nextXp, tier: nextTier, streakDays: nextStreak, lastStreakDate: today } }
      );
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare('UPDATE users SET xp = ?, tier = ?, streak_days = ?, last_streak_date = ? WHERE id = ?')
      .run(nextXp, nextTier, nextStreak, today, userId);
  },

  async listLeaderboard() {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await UserModel.find({}).sort({ xp: -1 }).limit(25).lean();
      return docs.map((u) => {
        const d = u as Record<string, unknown>;
        return {
          id: String(d._id),
          username: String(d.username),
          name: String(d.name),
          skillLevel: String(d.skillLevel),
          xp: Number(d.xp || 0),
          tier: String(d.tier || 'Apprentice'),
          streakDays: Number(d.streakDays || 0),
        };
      });
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare('SELECT id, username, name, skill_level, xp, tier, streak_days FROM users ORDER BY xp DESC LIMIT 25')
      .all() as Record<string, unknown>[];
    return rows.map((u) => ({
      id: String(u.id),
      username: String(u.username),
      name: String(u.name),
      skillLevel: String(u.skill_level),
      xp: Number(u.xp),
      tier: String(u.tier),
      streakDays: Number(u.streak_days),
    }));
  },

  // Rate Limits (K5)
  async consumeRateLimit(key: string, max: number, windowMs: number) {
    await ensureStorageReady();
    const now = Date.now();
    const resetDate = new Date(now + windowMs);
    const resetIso = resetDate.toISOString();

    if (isMongoConfigured()) {
      const existing = (await RateLimitModel.findById(key).lean()) as { count?: number; resetAt?: string } | null;
      if (!existing || new Date(String(existing.resetAt)).getTime() <= now) {
        await RateLimitModel.findOneAndUpdate(
          { _id: key },
          { _id: key, count: 1, resetAt: resetIso, expiresAtDate: resetDate },
          { upsert: true }
        );
        return { allowed: true, remaining: Math.max(0, max - 1), resetAt: resetIso };
      }
      const nextCount = Number(existing.count || 0) + 1;
      await RateLimitModel.updateOne({ _id: key }, { $set: { count: nextCount } });
      return {
        allowed: nextCount <= max,
        remaining: Math.max(0, max - nextCount),
        resetAt: String(existing.resetAt),
      };
    }

    const sqliteDb = getSqliteDb();
    sqliteDb.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').run(new Date(now).toISOString());
    const row = sqliteDb.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(key) as
      | { count: number; reset_at: string }
      | undefined;

    if (!row || new Date(row.reset_at).getTime() <= now) {
      sqliteDb
        .prepare('INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)')
        .run(key, resetIso);
      return { allowed: true, remaining: Math.max(0, max - 1), resetAt: resetIso };
    }

    const nextCount = row.count + 1;
    sqliteDb.prepare('UPDATE rate_limits SET count = ? WHERE key = ?').run(nextCount, key);
    return {
      allowed: nextCount <= max,
      remaining: Math.max(0, max - nextCount),
      resetAt: row.reset_at,
    };
  },

  // Tokens & Pairing
  async createRefreshToken(id: string, userId: string, tokenHash: string, expiresAt: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await RefreshTokenModel.create({ _id: id, userId, tokenHash, expiresAt });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)')
      .run(id, userId, tokenHash, expiresAt);
  },

  async findValidRefreshToken(tokenHash: string): Promise<{ id: string; userId: string; expiresAt: string } | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await RefreshTokenModel.findOne({ tokenHash, revokedAt: null }).lean()) as Record<string, unknown> | null;
      return doc ? { id: String(doc._id), userId: String(doc.userId), expiresAt: String(doc.expiresAt) } : null;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare('SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL')
      .get(tokenHash) as { id: string; user_id: string; expires_at: string } | undefined;
    return row ? { id: row.id, userId: row.user_id, expiresAt: row.expires_at } : null;
  },

  async revokeRefreshTokenByHash(tokenHash: string) {
    await ensureStorageReady();
    const now = new Date().toISOString();
    if (isMongoConfigured()) {
      await RefreshTokenModel.updateOne({ tokenHash }, { $set: { revokedAt: now } });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?').run(now, tokenHash);
  },

  async revokeRefreshTokenById(id: string) {
    await ensureStorageReady();
    const now = new Date().toISOString();
    if (isMongoConfigured()) {
      await RefreshTokenModel.updateOne({ _id: id }, { $set: { revokedAt: now } });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?').run(now, id);
  },

  async createPairingCode(code: string, userId: string, source: string, expiresAt: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await PairingCodeModel.findOneAndUpdate(
        { _id: code },
        { _id: code, userId, source, expiresAt, usedAt: null },
        { upsert: true }
      );
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare('INSERT OR REPLACE INTO pairing_codes (code, user_id, source, expires_at, used_at) VALUES (?, ?, ?, ?, NULL)')
      .run(code, userId, source, expiresAt);
  },

  async consumePairingCode(code: string): Promise<{ userId: string; source: string } | null> {
    await ensureStorageReady();
    const now = new Date().toISOString();
    if (isMongoConfigured()) {
      const doc = (await PairingCodeModel.findOne({ _id: code, usedAt: null }).lean()) as Record<string, unknown> | null;
      if (!doc || new Date(String(doc.expiresAt)).getTime() <= Date.now()) return null;
      await PairingCodeModel.updateOne({ _id: code }, { $set: { usedAt: now } });
      return { userId: String(doc.userId), source: String(doc.source) };
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare('SELECT * FROM pairing_codes WHERE code = ? AND used_at IS NULL')
      .get(code) as { user_id: string; source: string; expires_at: string } | undefined;
    if (!row || new Date(row.expires_at).getTime() <= Date.now()) return null;
    sqliteDb.prepare('UPDATE pairing_codes SET used_at = ? WHERE code = ?').run(now, code);
    return { userId: row.user_id, source: row.source };
  },

  async createExtensionToken(input: {
    id: string;
    userId: string;
    source: string;
    label: string;
    tokenHash: string;
    tokenPrefix: string;
    createdAt: string;
  }) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await ExtensionTokenModel.create({ _id: input.id, ...input });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `INSERT INTO extension_tokens (id, user_id, source, label, token_hash, token_prefix, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(input.id, input.userId, input.source, input.label, input.tokenHash, input.tokenPrefix, input.createdAt);
  },

  async findUserIdByExtensionTokenHash(tokenHash: string): Promise<string | null> {
    await ensureStorageReady();
    const now = new Date().toISOString();
    if (isMongoConfigured()) {
      const doc = (await ExtensionTokenModel.findOneAndUpdate(
        { tokenHash, revokedAt: null },
        { $set: { lastUsedAt: now } }
      ).lean()) as Record<string, unknown> | null;
      return doc ? String(doc.userId) : null;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare('SELECT user_id FROM extension_tokens WHERE token_hash = ? AND revoked_at IS NULL')
      .get(tokenHash) as { user_id: string } | undefined;
    if (!row) return null;
    sqliteDb.prepare('UPDATE extension_tokens SET last_used_at = ? WHERE token_hash = ?').run(now, tokenHash);
    return row.user_id;
  },

  async listExtensionTokens(userId: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await ExtensionTokenModel.find({ userId, revokedAt: null }).sort({ createdAt: -1 }).lean();
      return docs.map((d) => {
        const x = d as Record<string, unknown>;
        return {
          id: String(x._id),
          source: String(x.source),
          label: String(x.label),
          token_prefix: String(x.tokenPrefix),
          last_used_at: x.lastUsedAt ? String(x.lastUsedAt) : null,
          created_at: String(x.createdAt),
        };
      });
    }
    const sqliteDb = getSqliteDb();
    return sqliteDb
      .prepare('SELECT id, source, label, token_prefix, last_used_at, created_at FROM extension_tokens WHERE user_id = ? AND revoked_at IS NULL ORDER BY created_at DESC')
      .all(userId);
  },

  async revokeExtensionToken(id: string, userId: string) {
    await ensureStorageReady();
    const now = new Date().toISOString();
    if (isMongoConfigured()) {
      await ExtensionTokenModel.updateOne({ _id: id, userId }, { $set: { revokedAt: now } });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb.prepare('UPDATE extension_tokens SET revoked_at = ? WHERE id = ? AND user_id = ?').run(now, id, userId);
  },

  // Tools
  async listToolsForUser(userId: string): Promise<ToolRecord[]> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await ToolModel.find({ $or: [{ isSeeded: true }, { createdBy: userId }] })
        .sort({ isSeeded: -1, name: 1 })
        .lean();
      return docs.map((d) => mapMongoTool(d as Record<string, unknown>));
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare('SELECT * FROM tools WHERE is_seeded = 1 OR created_by = ? ORDER BY is_seeded DESC, name ASC')
      .all(userId) as Record<string, unknown>[];
    return rows.map(mapSqliteTool);
  },

  async resolveValidToolSlug(rawInput: string): Promise<string> {
    await ensureStorageReady();
    const trimmed = String(rawInput || '').trim();
    if (!trimmed) return 'custom';
    const mapped = IDE_APP_NAME_TO_SLUG[trimmed] || IDE_APP_NAME_TO_SLUG[trimmed.toLowerCase()] || trimmed.toLowerCase();

    if (isMongoConfigured()) {
      const found = await ToolModel.findOne({ slug: mapped }).select('slug').lean();
      return found ? mapped : 'custom';
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb.prepare('SELECT slug FROM tools WHERE slug = ? LIMIT 1').get(mapped) as
      | { slug: string }
      | undefined;
    return row ? row.slug : 'custom';
  },

  async createCustomTool(input: {
    id: string;
    slug: string;
    name: string;
    categories: ToolCategory[];
    launchProtocol: string;
    domainPattern: string;
    trackingLayer: string;
    description: string;
    docsUrl: string;
    createdBy: string;
  }): Promise<ToolRecord> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await ToolModel.create({ _id: input.id, ...input, pricingTier: null, isSeeded: false });
      const doc = await ToolModel.findById(input.id).lean();
      return mapMongoTool(doc as Record<string, unknown>);
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `INSERT INTO tools (id, slug, name, categories, launch_protocol, domain_pattern, tracking_layer, description, docs_url, pricing_tier, is_seeded, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)`
      )
      .run(
        input.id,
        input.slug,
        input.name,
        JSON.stringify(input.categories),
        input.launchProtocol,
        input.domainPattern,
        input.trackingLayer,
        input.description,
        input.docsUrl,
        input.createdBy
      );
    const row = sqliteDb.prepare('SELECT * FROM tools WHERE id = ?').get(input.id) as Record<string, unknown>;
    return mapSqliteTool(row);
  },

  // Learning Paths (for onboarding Step 5 & Dashboard NextLesson/PathProgress)
  async listLearningPaths(filters?: {
    track?: string;
    level?: string;
    freeOnly?: boolean;
    languages?: string[];
  }): Promise<LearningPathRecord[]> {
    await ensureStorageReady();
    let paths: LearningPathRecord[];
    if (isMongoConfigured()) {
      const docs = await LearningPathModel.find({}).lean();
      paths = docs.map((d) => mapMongoPath(d as Record<string, unknown>));
    } else {
      const sqliteDb = getSqliteDb();
      const rows = sqliteDb.prepare('SELECT * FROM learning_paths').all() as Record<string, unknown>[];
      paths = rows.map(mapSqlitePath);
    }

    const normTrack = filters?.track ? normalizeTrackId(filters.track) : null;
    const normLevel = filters?.level?.trim().toLowerCase() || '';
    const langSet = new Set((filters?.languages || []).map((l) => l.trim().toLowerCase()).filter(Boolean));

    const filtered = filters?.freeOnly ? paths.filter((p) => p.freeOnly) : paths;

    const scored = filtered.map((p) => {
      let score = 0;
      if (normTrack && p.track === normTrack) score += 100;
      if (normLevel && p.level === normLevel) score += 40;
      if (langSet.size > 0) {
        const matches = p.languages.filter((l) => langSet.has(l.toLowerCase())).length;
        score += matches * 12;
      }
      if (p.freeOnly) score += 5;
      return { path: p, score };
    });

    scored.sort((a, b) => b.score - a.score || a.path.estimatedHours - b.path.estimatedHours);
    return scored.map((s) => s.path);
  },

  async findLearningPathBySlug(slug: string): Promise<LearningPathRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await LearningPathModel.findOne({ slug }).lean()) as Record<string, unknown> | null;
      return doc ? mapMongoPath(doc) : null;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb.prepare('SELECT * FROM learning_paths WHERE slug = ? LIMIT 1').get(slug) as
      | Record<string, unknown>
      | undefined;
    return row ? mapSqlitePath(row) : null;
  },

  // Learning Resources & User Progress (Phase B)
  async listLearningResources(filters?: {
    track?: string;
    level?: string;
    language?: string;
    contentLanguage?: string;
    freeOnly?: boolean;
    format?: string;
    q?: string;
  }): Promise<LearningResourceRecord[]> {
    await ensureStorageReady();
    let resources: LearningResourceRecord[];
    if (isMongoConfigured()) {
      const docs = await LearningResourceModel.find({}).sort({ title: 1 }).lean();
      resources = docs.map((d) => mapMongoResource(d as Record<string, unknown>));
    } else {
      const sqliteDb = getSqliteDb();
      const rows = sqliteDb.prepare('SELECT * FROM learning_resources ORDER BY title ASC').all() as Record<
        string,
        unknown
      >[];
      resources = rows.map(mapSqliteResource);
    }

    const normTrack = filters?.track ? normalizeTrackId(filters.track) : null;
    const normLevel = filters?.level?.trim().toLowerCase() || '';
    const normLang = filters?.language?.trim().toLowerCase() || '';
    const normContentLang = filters?.contentLanguage?.trim().toLowerCase() || '';
    const normFormat = filters?.format?.trim().toLowerCase() || '';
    const query = filters?.q?.trim().toLowerCase() || '';

    return resources.filter((r) => {
      if (normTrack && !r.tracks.includes(normTrack)) return false;
      if (normLevel && r.level !== normLevel) return false;
      if (normLang && !r.languages.some((l) => l.toLowerCase() === normLang)) return false;
      if (normContentLang && !r.contentLanguages.some((l) => l.toLowerCase() === normContentLang)) return false;
      if (filters?.freeOnly && r.pricingTier !== 'free' && r.pricingTier !== 'freemium' && r.pricingTier !== 'student_free') {
        return false;
      }
      if (normFormat && r.format !== normFormat) return false;
      if (query) {
        const hay = `${r.title} ${r.provider} ${r.summary} ${r.slug}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  },

  async findLearningResourceBySlug(slug: string): Promise<LearningResourceRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await LearningResourceModel.findOne({ slug }).lean()) as Record<string, unknown> | null;
      return doc ? mapMongoResource(doc) : null;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb.prepare('SELECT * FROM learning_resources WHERE slug = ? LIMIT 1').get(slug) as
      | Record<string, unknown>
      | undefined;
    return row ? mapSqliteResource(row) : null;
  },

  async listResourceProgressForUser(userId: string): Promise<ResourceProgressRecord[]> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await ResourceProgressModel.find({ userId }).sort({ updatedAt: -1 }).lean();
      return docs.map((d) => mapMongoResourceProgress(d as Record<string, unknown>));
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare('SELECT * FROM resource_progress WHERE user_id = ? ORDER BY updated_at DESC')
      .all(userId) as Record<string, unknown>[];
    return rows.map(mapSqliteResourceProgress);
  },

  async findResourceProgress(userId: string, resourceSlug: string): Promise<ResourceProgressRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await ResourceProgressModel.findOne({ userId, resourceSlug }).lean()) as Record<
        string,
        unknown
      > | null;
      return doc ? mapMongoResourceProgress(doc) : null;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare('SELECT * FROM resource_progress WHERE user_id = ? AND resource_slug = ? LIMIT 1')
      .get(userId, resourceSlug) as Record<string, unknown> | undefined;
    return row ? mapSqliteResourceProgress(row) : null;
  },

  async upsertResourceProgress(
    userId: string,
    resourceSlug: string,
    patch: {
      status?: ResourceStatus;
      completedSteps?: string[];
      notes?: string;
      linkedSessionId?: string | null;
      lastOpenedAt?: string | null;
    }
  ): Promise<ResourceProgressRecord> {
    await ensureStorageReady();
    const existing = await this.findResourceProgress(userId, resourceSlug);
    const now = new Date().toISOString();
    const id = existing?.id || `rp_${crypto.randomUUID().slice(0, 12)}`;
    const status: ResourceStatus = patch.status ?? existing?.status ?? 'saved';
    const completedSteps: string[] = patch.completedSteps ?? existing?.completedSteps ?? [];
    const notes = patch.notes ?? existing?.notes ?? '';
    const linkedSessionId = patch.linkedSessionId !== undefined ? patch.linkedSessionId : existing?.linkedSessionId ?? null;
    const lastOpenedAt = patch.lastOpenedAt !== undefined ? patch.lastOpenedAt : existing?.lastOpenedAt ?? null;

    if (isMongoConfigured()) {
      await ResourceProgressModel.updateOne(
        { userId, resourceSlug },
        {
          $setOnInsert: { _id: id, userId, resourceSlug },
          $set: { status, completedSteps, notes, linkedSessionId, lastOpenedAt, updatedAt: now },
        },
        { upsert: true }
      );
      return (await this.findResourceProgress(userId, resourceSlug))!;
    }

    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `INSERT INTO resource_progress (id, user_id, resource_slug, status, completed_steps, notes, linked_session_id, last_opened_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, resource_slug) DO UPDATE SET
           status = excluded.status,
           completed_steps = excluded.completed_steps,
           notes = excluded.notes,
           linked_session_id = excluded.linked_session_id,
           last_opened_at = excluded.last_opened_at,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        userId,
        resourceSlug,
        status,
        JSON.stringify(completedSteps),
        notes,
        linkedSessionId,
        lastOpenedAt,
        now
      );
    return (await this.findResourceProgress(userId, resourceSlug))!;
  },

  // Guided Practice Drills (Phase C)
  async listPracticeDrills(filters?: {
    track?: string;
    level?: string;
    language?: string;
    mode?: string;
    q?: string;
  }): Promise<PracticeDrillRecord[]> {
    await ensureStorageReady();
    let drills: PracticeDrillRecord[];
    if (isMongoConfigured()) {
      const docs = await PracticeDrillModel.find({}).sort({ title: 1 }).lean();
      drills = docs.map((d) => mapMongoDrill(d as Record<string, unknown>));
    } else {
      const sqliteDb = getSqliteDb();
      const rows = sqliteDb.prepare('SELECT * FROM practice_drills ORDER BY title ASC').all() as Record<
        string,
        unknown
      >[];
      drills = rows.map(mapSqliteDrill);
    }

    const normTrack = filters?.track ? normalizeTrackId(filters.track) : null;
    const normLevel = filters?.level?.trim().toLowerCase() || '';
    const normLang = filters?.language?.trim().toLowerCase() || '';
    const normMode = filters?.mode?.trim().toLowerCase() || '';
    const query = filters?.q?.trim().toLowerCase() || '';

    return drills.filter((d) => {
      if (normTrack && d.track !== normTrack) return false;
      if (normLevel && d.level !== normLevel) return false;
      if (normLang && !d.languages.some((l) => l.toLowerCase() === normLang)) return false;
      if (normMode && d.mode !== normMode) return false;
      if (query) {
        const hay = `${d.title} ${d.summary} ${d.deliverable} ${d.track} ${d.mode}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  },

  async findPracticeDrillBySlug(slug: string): Promise<PracticeDrillRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await PracticeDrillModel.findOne({ slug }).lean()) as Record<string, unknown> | null;
      return doc ? mapMongoDrill(doc) : null;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb.prepare('SELECT * FROM practice_drills WHERE slug = ? LIMIT 1').get(slug) as
      | Record<string, unknown>
      | undefined;
    return row ? mapSqliteDrill(row) : null;
  },

  // Unified User-Scoped Workspace Search (Phase C)
  async searchWorkspaceForUser(
    userId: string,
    rawQuery: string,
    limitPerGroup = 6
  ): Promise<GlobalSearchResultPayload> {
    await ensureStorageReady();
    const query = rawQuery.trim();
    if (!query) {
      return {
        query: '',
        learningPaths: [],
        resources: [],
        practiceDrills: [],
        tools: [],
        projects: [],
        sessions: [],
      };
    }

    const needleLower = query.toLowerCase();
    const regex = new RegExp(escapeRegexLiteral(query), 'i');

    if (isMongoConfigured()) {
      const [pathDocs, resDocs, drillDocs, toolDocs, projectDocs, sessionDocs] = await Promise.all([
        LearningPathModel.find({
          $or: [{ title: regex }, { summary: regex }, { track: regex }, { sourceName: regex }],
        })
          .limit(limitPerGroup)
          .lean(),
        LearningResourceModel.find({
          $or: [{ title: regex }, { provider: regex }, { summary: regex }, { slug: regex }],
        })
          .limit(limitPerGroup)
          .lean(),
        PracticeDrillModel.find({
          $or: [{ title: regex }, { slug: regex }, { summary: regex }, { deliverable: regex }, { track: regex }, { mode: regex }],
        })
          .limit(limitPerGroup)
          .lean(),
        ToolModel.find({
          $and: [
            { $or: [{ isSeeded: true }, { createdBy: userId }] },
            { $or: [{ name: regex }, { description: regex }, { slug: regex }] },
          ],
        })
          .limit(limitPerGroup)
          .lean(),
        ProjectModel.find({
          userId,
          $or: [{ name: regex }, { clientName: regex }, { industry: regex }, { stack: regex }],
        })
          .sort({ createdAt: -1 })
          .limit(limitPerGroup)
          .lean(),
        SessionModel.find({
          userId,
          $or: [{ title: regex }, { summary: regex }, { whatILearned: regex }],
        })
          .sort({ startedAt: -1 })
          .limit(limitPerGroup)
          .lean(),
      ]);

      const projNameMap = new Map(
        projectDocs.map((p) => [String((p as Record<string, unknown>)._id), String((p as Record<string, unknown>).name)])
      );

      return {
        query,
        learningPaths: pathDocs.map((d) => mapMongoPath(d as Record<string, unknown>)),
        resources: resDocs.map((d) => mapMongoResource(d as Record<string, unknown>)),
        practiceDrills: drillDocs.map((d) => mapMongoDrill(d as Record<string, unknown>)),
        tools: toolDocs.map((d) => mapMongoTool(d as Record<string, unknown>)),
        projects: projectDocs.map((d) => mapMongoProject(d as Record<string, unknown>)),
        sessions: sessionDocs.map((d) =>
          mapMongoSession(d as Record<string, unknown>, projNameMap.get(String((d as Record<string, unknown>).projectId)))
        ),
      };
    }

    const sqliteDb = getSqliteDb();
    const likePattern = `%${needleLower}%`;

    const learningPaths = (
      sqliteDb
        .prepare(
          `SELECT * FROM learning_paths
           WHERE LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(track) LIKE ? OR LOWER(source_name) LIKE ?
           LIMIT ?`
        )
        .all(likePattern, likePattern, likePattern, likePattern, limitPerGroup) as Record<string, unknown>[]
    ).map(mapSqlitePath);

    const resources = (
      sqliteDb
        .prepare(
          `SELECT * FROM learning_resources
           WHERE LOWER(title) LIKE ? OR LOWER(provider) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(slug) LIKE ?
           ORDER BY title ASC LIMIT ?`
        )
        .all(likePattern, likePattern, likePattern, likePattern, limitPerGroup) as Record<string, unknown>[]
    ).map(mapSqliteResource);

    const practiceDrills = (
      sqliteDb
        .prepare(
          `SELECT * FROM practice_drills
           WHERE LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(deliverable) LIKE ? OR LOWER(track) LIKE ? OR LOWER(mode) LIKE ?
           ORDER BY title ASC LIMIT ?`
        )
        .all(likePattern, likePattern, likePattern, likePattern, likePattern, likePattern, limitPerGroup) as Record<string, unknown>[]
    ).map(mapSqliteDrill);

    const tools = (
      sqliteDb
        .prepare(
          `SELECT * FROM tools
           WHERE (is_seeded = 1 OR created_by = ?)
             AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(slug) LIKE ?)
           ORDER BY is_seeded DESC, name ASC LIMIT ?`
        )
        .all(userId, likePattern, likePattern, likePattern, limitPerGroup) as Record<string, unknown>[]
    ).map(mapSqliteTool);

    const projects = (
      sqliteDb
        .prepare(
          `SELECT * FROM projects
           WHERE user_id = ?
             AND (LOWER(name) LIKE ? OR LOWER(client_name) LIKE ? OR LOWER(industry) LIKE ? OR LOWER(stack) LIKE ?)
           ORDER BY created_at DESC LIMIT ?`
        )
        .all(userId, likePattern, likePattern, likePattern, likePattern, limitPerGroup) as Record<string, unknown>[]
    ).map(mapSqliteProject);

    const sessions = (
      sqliteDb
        .prepare(
          `SELECT s.*, p.name AS project_name
           FROM sessions s
           JOIN projects p ON p.id = s.project_id
           WHERE s.user_id = ?
             AND (LOWER(s.title) LIKE ? OR LOWER(s.summary) LIKE ? OR LOWER(s.what_i_learned) LIKE ? OR LOWER(p.name) LIKE ?)
           ORDER BY s.started_at DESC LIMIT ?`
        )
        .all(userId, likePattern, likePattern, likePattern, likePattern, limitPerGroup) as Record<string, unknown>[]
    ).map(mapSqliteSession);

    return {
      query,
      learningPaths,
      resources,
      practiceDrills,
      tools,
      projects,
      sessions,
    };
  },

  // Application Tracker (Dashboard job_seeker widget CRUD)
  async listApplicationsForUser(userId: string): Promise<ApplicationTrackerRecord[]> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await ApplicationTrackerModel.find({ userId }).sort({ updatedAt: -1 }).lean();
      return docs.map((d) => mapMongoApplication(d as Record<string, unknown>));
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare('SELECT * FROM application_tracker WHERE user_id = ? ORDER BY updated_at DESC')
      .all(userId) as Record<string, unknown>[];
    return rows.map(mapSqliteApplication);
  },

  async createApplication(input: ApplicationTrackerRecord): Promise<ApplicationTrackerRecord> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await ApplicationTrackerModel.create({ _id: input.id, ...input });
      const doc = await ApplicationTrackerModel.findOne({ _id: input.id, userId: input.userId }).lean();
      return mapMongoApplication(doc as Record<string, unknown>);
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `INSERT INTO application_tracker (id, user_id, company, role, status, url, notes, applied_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.id,
        input.userId,
        input.company,
        input.role,
        input.status,
        input.url,
        input.notes,
        input.appliedAt,
        input.createdAt,
        input.updatedAt
      );
    const row = sqliteDb.prepare('SELECT * FROM application_tracker WHERE id = ?').get(input.id) as Record<string, unknown>;
    return mapSqliteApplication(row);
  },

  async updateApplication(
    id: string,
    userId: string,
    patch: Partial<Pick<ApplicationTrackerRecord, 'company' | 'role' | 'status' | 'url' | 'notes' | 'appliedAt'>>
  ): Promise<ApplicationTrackerRecord | null> {
    await ensureStorageReady();
    const now = new Date().toISOString();
    if (isMongoConfigured()) {
      const existing = (await ApplicationTrackerModel.findOne({ _id: id, userId }).lean()) as Record<string, unknown> | null;
      if (!existing) return null;
      await ApplicationTrackerModel.updateOne({ _id: id, userId }, { $set: { ...patch, updatedAt: now } });
      const updated = await ApplicationTrackerModel.findOne({ _id: id, userId }).lean();
      return updated ? mapMongoApplication(updated as Record<string, unknown>) : null;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare('SELECT * FROM application_tracker WHERE id = ? AND user_id = ?')
      .get(id, userId) as Record<string, unknown> | undefined;
    if (!row) return null;
    const current = mapSqliteApplication(row);
    const merged = { ...current, ...patch, updatedAt: now };
    sqliteDb
      .prepare(
        `UPDATE application_tracker SET company = ?, role = ?, status = ?, url = ?, notes = ?, applied_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`
      )
      .run(
        merged.company,
        merged.role,
        merged.status,
        merged.url,
        merged.notes,
        merged.appliedAt,
        merged.updatedAt,
        id,
        userId
      );
    const updatedRow = sqliteDb
      .prepare('SELECT * FROM application_tracker WHERE id = ? AND user_id = ?')
      .get(id, userId) as Record<string, unknown>;
    return mapSqliteApplication(updatedRow);
  },

  async deleteApplication(id: string, userId: string): Promise<boolean> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const res = await ApplicationTrackerModel.deleteOne({ _id: id, userId });
      return res.deletedCount > 0;
    }
    const sqliteDb = getSqliteDb();
    const info = sqliteDb.prepare('DELETE FROM application_tracker WHERE id = ? AND user_id = ?').run(id, userId);
    return info.changes > 0;
  },

  // Projects & Documents
  async listProjectsForUser(userId: string): Promise<Array<ProjectRecord & { sessionsCount: number; totalMinutes: number }>> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await ProjectModel.find({ userId }).sort({ createdAt: -1 }).lean();
      const results = [];
      for (const d of docs) {
        const mapped = mapMongoProject(d as Record<string, unknown>);
        const sess = await SessionModel.find({ projectId: mapped.id, status: { $in: ['completed', 'lapsed'] } })
          .select('activeMinutes')
          .lean();
        const totalMinutes = sess.reduce((s, x) => s + Number((x as Record<string, unknown>).activeMinutes || 0), 0);
        results.push({ ...mapped, sessionsCount: sess.length, totalMinutes });
      }
      return results;
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as Record<string, unknown>[];
    return rows.map((r) => {
      const mapped = mapSqliteProject(r);
      const stats = sqliteDb
        .prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(active_minutes), 0) AS mins FROM sessions WHERE project_id = ? AND status IN ('completed', 'lapsed')`)
        .get(mapped.id) as { count: number; mins: number };
      return { ...mapped, sessionsCount: Number(stats.count), totalMinutes: Number(stats.mins) };
    });
  },

  async findProjectById(projectId: string, userId: string): Promise<ProjectRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = await ProjectModel.findOne({ _id: projectId, userId }).lean();
      return doc ? mapMongoProject(doc as Record<string, unknown>) : null;
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
      .get(projectId, userId) as Record<string, unknown> | undefined;
    return row ? mapSqliteProject(row) : null;
  },

  async createProject(input: Omit<ProjectRecord, 'portfolioPublishedAt'>): Promise<ProjectRecord> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await ProjectModel.create({ _id: input.id, ...input, portfolioPublishedAt: null });
      return (await this.findProjectById(input.id, input.userId))!;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `INSERT INTO projects (id, user_id, name, type, client_name, industry, languages, stack, links, is_public_portfolio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.id,
        input.userId,
        input.name,
        input.type,
        input.clientName,
        input.industry,
        JSON.stringify(input.languages),
        JSON.stringify(input.stack),
        JSON.stringify(input.links),
        input.isPublicPortfolio ? 1 : 0,
        input.createdAt
      );
    return (await this.findProjectById(input.id, input.userId))!;
  },

  async updateProject(projectId: string, userId: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    await ensureStorageReady();
    const current = await this.findProjectById(projectId, userId);
    if (!current) return null;
    const merged = { ...current, ...patch };
    if (isMongoConfigured()) {
      await ProjectModel.updateOne({ _id: projectId, userId }, { $set: merged });
      return await this.findProjectById(projectId, userId);
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `UPDATE projects SET name = ?, type = ?, client_name = ?, industry = ?, languages = ?, stack = ?, links = ?, is_public_portfolio = ? WHERE id = ? AND user_id = ?`
      )
      .run(
        merged.name,
        merged.type,
        merged.clientName,
        merged.industry,
        JSON.stringify(merged.languages),
        JSON.stringify(merged.stack),
        JSON.stringify(merged.links),
        merged.isPublicPortfolio ? 1 : 0,
        projectId,
        userId
      );
    return await this.findProjectById(projectId, userId);
  },

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const res = await ProjectModel.deleteOne({ _id: projectId, userId });
      return res.deletedCount > 0;
    }
    const sqliteDb = getSqliteDb();
    const info = sqliteDb.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(projectId, userId);
    return info.changes > 0;
  },

  async markProjectPublished(projectId: string, publishedAt: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await ProjectModel.updateOne({ _id: projectId }, { $set: { isPublicPortfolio: true, portfolioPublishedAt: publishedAt } });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare('UPDATE projects SET is_public_portfolio = 1, portfolio_published_at = ? WHERE id = ?')
      .run(publishedAt, projectId);
  },

  async listPublicPortfolioProjects(userId: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await ProjectModel.find({ userId, isPublicPortfolio: true }).sort({ portfolioPublishedAt: -1 }).lean();
      const out = [];
      for (const d of docs) {
        const mapped = mapMongoProject(d as Record<string, unknown>);
        const sess = await SessionModel.find({ projectId: mapped.id, status: { $in: ['completed', 'lapsed'] } })
          .select('activeMinutes')
          .lean();
        const mins = sess.reduce((s, x) => s + Number((x as Record<string, unknown>).activeMinutes || 0), 0);
        out.push({ mapped, sessionsCompleted: sess.length, totalMinutes: mins });
      }
      return out;
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare('SELECT * FROM projects WHERE user_id = ? AND is_public_portfolio = 1 ORDER BY portfolio_published_at DESC')
      .all(userId) as Record<string, unknown>[];
    return rows.map((p) => {
      const mapped = mapSqliteProject(p);
      const stats = sqliteDb
        .prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(active_minutes), 0) AS mins FROM sessions WHERE project_id = ? AND status IN ('completed', 'lapsed')`)
        .get(mapped.id) as { count: number; mins: number };
      return { mapped, sessionsCompleted: Number(stats.count), totalMinutes: Number(stats.mins) };
    });
  },

  async listDocumentsForProject(projectId: string): Promise<ProjectDocumentRecord[]> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await DocumentModel.find({ projectId }).sort({ createdAt: -1 }).lean();
      return docs.map((d) => {
        const x = d as Record<string, unknown>;
        return {
          id: String(x._id),
          projectId: String(x.projectId),
          userId: String(x.userId),
          fileName: String(x.fileName),
          rawText: String(x.rawText),
          summaryCard: x.summaryCard as DocumentSummaryCard,
          createdAt: String(x.createdAt),
        };
      });
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb.prepare('SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as Record<string, unknown>[];
    return rows.map((d) => ({
      id: String(d.id),
      projectId: String(d.project_id),
      userId: String(d.user_id),
      fileName: String(d.file_name),
      rawText: String(d.raw_text),
      summaryCard: JSON.parse(String(d.summary_card)) as DocumentSummaryCard,
      createdAt: String(d.created_at),
    }));
  },

  async createDocument(doc: ProjectDocumentRecord) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await DocumentModel.create({ _id: doc.id, ...doc });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(`INSERT INTO documents (id, project_id, user_id, file_name, raw_text, summary_card, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(doc.id, doc.projectId, doc.userId, doc.fileName, doc.rawText, JSON.stringify(doc.summaryCard), doc.createdAt);
  },

  // Sessions
  async findActiveSessionForUser(userId: string): Promise<SessionRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await SessionModel.findOne({ userId, status: { $in: ['active', 'paused'] } })
        .sort({ startedAt: -1 })
        .lean()) as Record<string, unknown> | null;
      if (!doc) return null;
      const proj = (await ProjectModel.findById(String(doc.projectId)).select('name').lean()) as { name?: string } | null;
      return mapMongoSession(doc, proj?.name);
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare(`SELECT s.*, p.name AS project_name FROM sessions s JOIN projects p ON p.id = s.project_id WHERE s.user_id = ? AND s.status IN ('active', 'paused') ORDER BY s.started_at DESC LIMIT 1`)
      .get(userId) as Record<string, unknown> | undefined;
    return row ? mapSqliteSession(row) : null;
  },

  async findSessionById(sessionId: string, userId: string): Promise<SessionRecord | null> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const doc = (await SessionModel.findOne({ _id: sessionId, userId }).lean()) as Record<string, unknown> | null;
      if (!doc) return null;
      const proj = (await ProjectModel.findById(String(doc.projectId)).select('name').lean()) as { name?: string } | null;
      return mapMongoSession(doc, proj?.name);
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare(`SELECT s.*, p.name AS project_name FROM sessions s JOIN projects p ON p.id = s.project_id WHERE s.id = ? AND s.user_id = ?`)
      .get(sessionId, userId) as Record<string, unknown> | undefined;
    return row ? mapSqliteSession(row) : null;
  },

  async listSessionsForUser(userId: string, limit = 50): Promise<SessionRecord[]> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await SessionModel.find({ userId }).sort({ startedAt: -1 }).limit(limit).lean();
      const projs = await ProjectModel.find({ userId }).select('_id name').lean();
      const nameMap = new Map(projs.map((p) => [String((p as Record<string, unknown>)._id), String((p as Record<string, unknown>).name)]));
      return docs.map((d) => mapMongoSession(d as Record<string, unknown>, nameMap.get(String((d as Record<string, unknown>).projectId))));
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare(`SELECT s.*, p.name AS project_name FROM sessions s JOIN projects p ON p.id = s.project_id WHERE s.user_id = ? ORDER BY s.started_at DESC LIMIT ?`)
      .all(userId, limit) as Record<string, unknown>[];
    return rows.map(mapSqliteSession);
  },

  async listSessionsForProject(projectId: string): Promise<SessionRecord[]> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await SessionModel.find({ projectId }).sort({ startedAt: -1 }).limit(20).lean();
      return docs.map((d) => mapMongoSession(d as Record<string, unknown>));
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare('SELECT * FROM sessions WHERE project_id = ? ORDER BY started_at DESC LIMIT 20')
      .all(projectId) as Record<string, unknown>[];
    return rows.map(mapSqliteSession);
  },

  async createSession(session: SessionRecord): Promise<SessionRecord> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await SessionModel.create({ _id: session.id, ...session });
      return (await this.findSessionById(session.id, session.userId))!;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `INSERT INTO sessions (id, user_id, project_id, mode, status, planned_minutes, started_at, last_heartbeat, current_device, active_checkpoint_id, checkpoints, pauses, device_events, activity_slices) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        session.id,
        session.userId,
        session.projectId,
        session.mode,
        session.status,
        session.plannedMinutes,
        session.startedAt,
        session.lastHeartbeat,
        session.currentDevice,
        session.activeCheckpointId,
        JSON.stringify(session.checkpoints),
        JSON.stringify(session.pauses),
        JSON.stringify(session.deviceEvents),
        JSON.stringify(session.activitySlices)
      );
    return (await this.findSessionById(session.id, session.userId))!;
  },

  async saveSession(session: SessionRecord): Promise<SessionRecord> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const { id, projectName: _pn, ...rest } = session;
      void _pn;
      await SessionModel.updateOne({ _id: id }, { $set: rest });
      return (await this.findSessionById(id, session.userId))!;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `UPDATE sessions SET status = ?, ended_at = ?, last_heartbeat = ?, current_device = ?, active_checkpoint_id = ?, title = ?, summary = ?, what_i_learned = ?, improvement_areas = ?, checkpoints = ?, pauses = ?, device_events = ?, activity_slices = ?, xp_awarded = ?, estimate_accuracy = ?, focus_ratio = ?, active_minutes = ?, paused_minutes = ?, overrun_minutes = ? WHERE id = ?`
      )
      .run(
        session.status,
        session.endedAt,
        session.lastHeartbeat,
        session.currentDevice,
        session.activeCheckpointId,
        session.title,
        session.summary,
        session.whatILearned,
        JSON.stringify(session.improvementAreas),
        JSON.stringify(session.checkpoints),
        JSON.stringify(session.pauses),
        JSON.stringify(session.deviceEvents),
        JSON.stringify(session.activitySlices),
        session.xpAwarded,
        session.estimateAccuracy,
        session.focusRatio,
        session.activeMinutes,
        session.pausedMinutes,
        session.overrunMinutes,
        session.id
      );
    return (await this.findSessionById(session.id, session.userId))!;
  },

  async findStaleActiveSessions(cutoffIso: string): Promise<SessionRecord[]> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await SessionModel.find({ status: 'active', lastHeartbeat: { $lt: cutoffIso } }).lean();
      return docs.map((d) => mapMongoSession(d as Record<string, unknown>));
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare(`SELECT * FROM sessions WHERE status = 'active' AND last_heartbeat < ?`)
      .all(cutoffIso) as Record<string, unknown>[];
    return rows.map(mapSqliteSession);
  },

  async sumUserXpToday(userId: string, todayPrefix: string): Promise<number> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await SessionModel.find({
        userId,
        endedAt: { $regex: `^${todayPrefix}` },
      })
        .select('xpAwarded')
        .lean();
      return docs.reduce((s, d) => s + Number((d as Record<string, unknown>).xpAwarded || 0), 0);
    }
    const sqliteDb = getSqliteDb();
    const row = sqliteDb
      .prepare(`SELECT COALESCE(SUM(xp_awarded), 0) AS total_today FROM sessions WHERE user_id = ? AND ended_at LIKE ?`)
      .get(userId, `${todayPrefix}%`) as { total_today: number };
    return Number(row?.total_today || 0);
  },

  async listClosedSessionsForUser(userId: string): Promise<SessionRecord[]> {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await SessionModel.find({ userId, status: { $in: ['completed', 'lapsed'] } })
        .sort({ startedAt: -1 })
        .lean();
      return docs.map((d) => mapMongoSession(d as Record<string, unknown>));
    }
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb
      .prepare(`SELECT * FROM sessions WHERE user_id = ? AND status IN ('completed', 'lapsed') ORDER BY started_at DESC`)
      .all(userId) as Record<string, unknown>[];
    return rows.map(mapSqliteSession);
  },

  // Achievements
  async awardAchievement(userId: string, badgeKey: string, title: string, description: string, sessionId: string) {
    await ensureStorageReady();
    const now = new Date().toISOString();
    const id = `ach_${crypto.randomUUID().slice(0, 12)}`;
    if (isMongoConfigured()) {
      await AchievementModel.updateOne(
        { userId, badgeKey },
        { $setOnInsert: { _id: id, userId, badgeKey, title, description, awardedAt: now, sessionId } },
        { upsert: true }
      );
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(`INSERT OR IGNORE INTO achievements (id, user_id, badge_key, title, description, awarded_at, session_id) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, userId, badgeKey, title, description, now, sessionId);
  },

  async listAchievementsForUser(userId: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const docs = await AchievementModel.find({ userId }).sort({ awardedAt: -1 }).lean();
      return docs.map((d) => {
        const x = d as Record<string, unknown>;
        return {
          id: String(x._id),
          badge_key: String(x.badgeKey),
          title: String(x.title),
          description: String(x.description),
          awarded_at: String(x.awardedAt),
        };
      });
    }
    const sqliteDb = getSqliteDb();
    return sqliteDb.prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY awarded_at DESC').all(userId);
  },

  // Portfolio Sites
  async listPortfolioSites(userId: string, siteType?: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      const q = siteType ? { userId, siteType } : { userId };
      const docs = await PortfolioSiteModel.find(q).sort({ createdAt: -1 }).lean();
      return docs.map((d) => {
        const x = d as Record<string, unknown>;
        return {
          id: String(x._id),
          userId: String(x.userId),
          siteType: String(x.siteType) as 'personal' | 'business',
          label: String(x.label),
          siteUrl: String(x.siteUrl),
          webhookUrl: String(x.webhookUrl || ''),
          webhookSecret: String(x.webhookSecret),
          autoPublishOnDeploy: Boolean(x.autoPublishOnDeploy),
          lastSyncAt: x.lastSyncAt ? String(x.lastSyncAt) : null,
          lastSyncStatus: x.lastSyncStatus ? String(x.lastSyncStatus) : null,
        };
      });
    }
    const sqliteDb = getSqliteDb();
    const rows = (
      siteType
        ? sqliteDb.prepare('SELECT * FROM portfolio_sites WHERE user_id = ? AND site_type = ? ORDER BY created_at DESC').all(userId, siteType)
        : sqliteDb.prepare('SELECT * FROM portfolio_sites WHERE user_id = ? ORDER BY created_at DESC').all(userId)
    ) as Record<string, unknown>[];
    return rows.map((s) => ({
      id: String(s.id),
      userId: String(s.user_id),
      siteType: String(s.site_type) as 'personal' | 'business',
      label: String(s.label),
      siteUrl: String(s.site_url),
      webhookUrl: String(s.webhook_url || ''),
      webhookSecret: String(s.webhook_secret),
      autoPublishOnDeploy: Boolean(s.auto_publish_on_deploy),
      lastSyncAt: s.last_sync_at ? String(s.last_sync_at) : null,
      lastSyncStatus: s.last_sync_status ? String(s.last_sync_status) : null,
    }));
  },

  async createPortfolioSite(input: {
    id: string;
    userId: string;
    siteType: 'personal' | 'business';
    label: string;
    siteUrl: string;
    webhookUrl: string;
    webhookSecret: string;
    autoPublishOnDeploy: boolean;
  }) {
    await ensureStorageReady();
    const now = new Date().toISOString();
    if (isMongoConfigured()) {
      await PortfolioSiteModel.create({ _id: input.id, ...input, createdAt: now });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb
      .prepare(
        `INSERT INTO portfolio_sites (id, user_id, site_type, label, site_url, webhook_url, webhook_secret, auto_publish_on_deploy, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.id,
        input.userId,
        input.siteType,
        input.label,
        input.siteUrl,
        input.webhookUrl,
        input.webhookSecret,
        input.autoPublishOnDeploy ? 1 : 0,
        now
      );
  },

  async deletePortfolioSite(id: string, userId: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await PortfolioSiteModel.deleteOne({ _id: id, userId });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb.prepare('DELETE FROM portfolio_sites WHERE id = ? AND user_id = ?').run(id, userId);
  },

  async updatePortfolioSiteSync(id: string, lastSyncAt: string, lastSyncStatus: string) {
    await ensureStorageReady();
    if (isMongoConfigured()) {
      await PortfolioSiteModel.updateOne({ _id: id }, { $set: { lastSyncAt, lastSyncStatus } });
      return;
    }
    const sqliteDb = getSqliteDb();
    sqliteDb.prepare('UPDATE portfolio_sites SET last_sync_at = ?, last_sync_status = ? WHERE id = ?').run(
      lastSyncAt,
      lastSyncStatus,
      id
    );
  },
};
