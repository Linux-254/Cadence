import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { z } from 'zod';
import {
  clearRefreshCookie,
  hashPassword,
  hashToken,
  optionalAuth,
  parseCookieValue,
  requireAuth,
  setRefreshCookie,
  signAccessToken,
  verifyPassword,
  type AuthedRequest,
} from './auth.ts';
import {
  clampLapseGraceMin,
  DatabaseNotConfiguredError,
  HEARTBEAT_EXT_S,
  HEARTBEAT_WEB_S,
  LAPSE_GRACE_MIN,
} from './config.ts';
import { buildDashboardPayload } from './dashboardEngine.ts';
import { rateLimit } from './rateLimit.ts';
import {
  ALL_TOOL_CATEGORIES,
  getTaxonomyPayload,
  normalizeTrackId,
} from './seed/taxonomy.ts';
import {
  awardSessionBadges,
  calculateAwardedXp,
  computeImprovementAreas,
  computeSessionTimings,
  finalizeStaleSessionIfNeeded,
  isSafePublicWebhookUrl,
  runLapseSweep,
  updateUserStreakAndXp,
} from './sessionMath.ts';
import {
  discoverStackWithSearch,
  fetchCheckpointGuideWithSearch,
  summarizeProjectDocument,
} from './gemini.ts';
import {
  ensureStorageReady,
  getStorageEngine,
  isMongoConfigured,
  storage,
  stripPasswordHash,
} from './storage.ts';
import { getSqliteDb } from './db.ts';
import { seedDemoAccountsMongo, seedDemoAccountsSqlite } from './seed/demoSeeder.ts';
import type {
  ActivitySlice,
  ApplicationStatus,
  CheckpointItem,
  DashboardLens,
  DeviceEvent,
  DeviceKind,
  IntentId,
  PauseInterval,
  PauseReason,
  ProjectType,
  ResourceOpenMode,
  SessionRecord,
  SkillLevel,
  SkillLevelV13,
  ToolCategory,
  TrackId,
} from '../src/types/cadence.ts';

const VALID_MODES = new Set<ProjectType>(['personal', 'business', 'learning']);
const VALID_CATEGORIES = new Set<ToolCategory>(ALL_TOOL_CATEGORIES.map((c) => c.id));
const VALID_INTENTS = new Set<IntentId>([
  'learner',
  'student',
  'job_seeker',
  'freelancer',
  'employed',
  'founder',
]);
const VALID_LEVELS_V13 = new Set<SkillLevelV13>(['beginner', 'intermediate', 'advanced']);
const VALID_OPEN_MODES = new Set<ResourceOpenMode>(['popout', 'split', 'embed', 'tab']);
const VALID_APP_STATUS = new Set<ApplicationStatus>(['saved', 'applied', 'interview', 'offer', 'rejected']);

const WindowPrefSchema = z.object({
  width: z.number().min(240).max(4000),
  height: z.number().min(240).max(4000),
  screenIndex: z.number().int().min(0).max(16).optional(),
});

const OnboardingPatchSchema = z.object({
  step: z.number().int().min(1).max(6).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  country: z.string().trim().max(80).optional(),
  skillLevel: z.enum(['beginner', 'vibe_coder', 'bootcamp', 'intermediate', 'professional']).optional(),
  primaryRole: z.string().trim().max(120).optional(),
  tracks: z.array(z.string()).max(3).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  intent: z.enum(['learner', 'student', 'job_seeker', 'freelancer', 'employed', 'founder']).optional(),
  buildsWithAI: z.boolean().optional(),
  programmingLanguages: z.array(z.string().max(32)).max(19).optional(),
  contentLanguages: z.array(z.string().max(16)).max(10).optional(),
  freeOnly: z.boolean().optional(),
  hasStudentDiscount: z.boolean().optional(),
  defaultToolSlugs: z.array(z.string().max(64)).max(24).optional(),
  weeklyGoal: z
    .object({
      days: z.number().int().min(1).max(7),
      minutes: z.number().int().min(30).max(4200),
    })
    .optional(),
  resourceOpenMode: z.enum(['popout', 'split', 'embed', 'tab']).optional(),
  resourceWindowPrefs: z.record(z.string(), WindowPrefSchema).optional(),
  selectedPathSlug: z.string().max(120).nullable().optional(),
  portfolioUrl: z.string().max(300).optional(),
  businessSiteUrl: z.string().max(300).optional(),
  complete: z.boolean().optional(),
  startAction: z.enum(['first_session', 'create_project', 'dashboard']).optional(),
  initialProjectName: z.string().trim().max(120).optional(),
  initialProjectType: z.enum(['personal', 'business', 'learning']).optional(),
  initialProjectIndustry: z.string().trim().max(80).optional(),
  initialProjectStack: z.array(z.string().max(60)).max(16).optional(),
});

const ProfilePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  skillLevel: z.enum(['beginner', 'vibe_coder', 'bootcamp', 'intermediate', 'professional']).optional(),
  primaryRole: z.string().trim().max(120).optional(),
  portfolioUrl: z.string().max(300).optional(),
  businessSiteUrl: z.string().max(300).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  defaultToolSlugs: z.array(z.string().max(64)).max(24).optional(),
  dashboardLens: z.enum(['learner', 'student', 'job_seeker', 'freelancer', 'employed', 'founder']).optional(),
  dismissedProfilePrompt: z.boolean().optional(),
  lapseGraceMin: z.number().int().min(3).max(30).optional(),
  resourceOpenMode: z.enum(['popout', 'split', 'embed', 'tab']).optional(),
  resourceWindowPrefs: z.record(z.string(), WindowPrefSchema).optional(),
  freeOnly: z.boolean().optional(),
  hasStudentDiscount: z.boolean().optional(),
  buildsWithAI: z.boolean().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  intent: z.enum(['learner', 'student', 'job_seeker', 'freelancer', 'employed', 'founder']).optional(),
  tracks: z.array(z.string()).max(3).optional(),
  programmingLanguages: z.array(z.string().max(32)).max(19).optional(),
  contentLanguages: z.array(z.string().max(16)).max(10).optional(),
  country: z.string().trim().max(80).optional(),
  weeklyGoal: z
    .object({
      days: z.number().int().min(1).max(7),
      minutes: z.number().int().min(30).max(4200),
    })
    .optional(),
});

const ApplicationCreateSchema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']).optional(),
  url: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
  appliedAt: z.string().max(40).nullable().optional(),
});

const ApplicationUpdateSchema = ApplicationCreateSchema.partial();

const ResourceProgressPatchSchema = z.object({
  status: z.enum(['saved', 'in_progress', 'completed']).optional(),
  completedSteps: z.array(z.string().max(40)).max(60).optional(),
  notes: z.string().max(2000).optional(),
  linkedSessionId: z.string().max(64).nullable().optional(),
  lastOpenedAt: z.string().max(40).nullable().optional(),
});

const PathStepToggleSchema = z.object({
  stepIndex: z.number().int().min(0).max(50),
  completed: z.boolean(),
});

const PathStartSessionSchema = z.object({
  stepIndex: z.number().int().min(0).max(50).optional(),
  projectId: z.string().max(64).optional(),
});

const PracticeStepSchema = z.object({
  stepIndex: z.number().int().min(0).max(20).optional(),
  completed: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

const PracticeStartSessionSchema = z.object({
  projectId: z.string().max(64).optional(),
});

let loggedDbMissingOnce = false;
const VALID_PAUSE_REASONS = new Set<PauseReason>([
  'break',
  'meal',
  'blocked',
  'distraction',
  'client_call',
  'other',
]);
const VALID_SKILL_LEVELS = new Set<SkillLevel>([
  'beginner',
  'vibe_coder',
  'bootcamp',
  'intermediate',
  'professional',
]);

function asyncHandler(
  fn: (req: AuthedRequest, res: express.Response, next: express.NextFunction) => Promise<unknown> | unknown
): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthedRequest, res, next)).catch(next);
  };
}

function getIncomingDevice(req: express.Request): DeviceKind {
  const header = String(req.headers['x-cadence-device'] || '').toLowerCase();
  if (header === 'mobile_pwa' || header === 'mobile') return 'mobile_pwa';
  return 'web';
}

function hydrateSessionTimings(session: SessionRecord, liveCompute = true): SessionRecord {
  if (!liveCompute || (session.status !== 'active' && session.status !== 'paused')) {
    return session;
  }
  const liveTimings = computeSessionTimings(session.startedAt, null, session.pauses, Date.now());
  return {
    ...session,
    activeMinutes: liveTimings.activeMinutes,
    pausedMinutes: liveTimings.pausedMinutes,
    overrunMinutes: liveTimings.overrunMinutes,
    focusRatio: liveTimings.focusRatio,
  };
}

async function issueRefreshToken(res: express.Response, userId: string) {
  const raw = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  await storage.createRefreshToken(
    `rt_${crypto.randomUUID().slice(0, 12)}`,
    userId,
    hashToken(raw),
    expiresAt
  );
  setRefreshCookie(res, raw);
}

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '2mb' }));

  // Ensure MongoDB (if MONGODB_URI is configured) is ready before handling API traffic
  app.use(
    '/api',
    asyncHandler(async (_req, _res, next) => {
      await ensureStorageReady();
      next();
    })
  );

  // ---------------- HEALTH, TAXONOMY & PDF SPEC DOWNLOAD ----------------
  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      const engine = getStorageEngine();
      res.json({
        ok: true,
        database: engine,
        demoMode: engine === 'sqlite_preview',
        mernReady: true,
        config: {
          heartbeatWebSec: HEARTBEAT_WEB_S,
          heartbeatExtSec: HEARTBEAT_EXT_S,
          defaultLapseGraceMin: LAPSE_GRACE_MIN,
        },
        timestamp: new Date().toISOString(),
      });
    })
  );

  app.get('/api/taxonomy', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.json(getTaxonomyPayload());
  });

  app.get(
    '/api/paths',
    rateLimit({ keyPrefix: 'paths', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req, res) => {
      const track = req.query.track ? String(req.query.track) : undefined;
      const level = req.query.level ? String(req.query.level) : undefined;
      const freeOnly = req.query.freeOnly === 'true' || req.query.freeOnly === '1';
      const languagesRaw = req.query.languages ? String(req.query.languages) : '';
      const languages = languagesRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const limit = Math.max(1, Math.min(30, Number(req.query.limit) || 22));
      const paths = await storage.listLearningPaths({ track, level, freeOnly, languages });
      return res.json({ paths: paths.slice(0, limit) });
    })
  );

  app.get(
    '/api/paths/:slug',
    optionalAuth,
    rateLimit({ keyPrefix: 'path_detail', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const slug = String(req.params.slug || '').trim();
      const lp = await storage.findLearningPathBySlug(slug);
      if (!lp) return res.status(404).json({ error: 'Learning path not found.' });

      const allResources = await storage.listLearningResources();
      const resMap = new Map(allResources.map((r) => [r.slug, r]));
      const userProgressList = req.user ? await storage.listResourceProgressForUser(req.user.id) : [];
      const progMap = new Map(userProgressList.map((p) => [p.resourceSlug, p]));
      const pathProgress = progMap.get(`path:${lp.slug}`);
      const doneSet = new Set(pathProgress?.completedSteps || []);

      const steps = lp.steps.map((st, idx) => {
        const resRecord = resMap.get(st.resourceSlug) || null;
        return {
          ...st,
          index: idx,
          completed: doneSet.has(String(idx)),
          resource: resRecord ? { ...resRecord, progress: progMap.get(resRecord.slug) || null } : null,
        };
      });

      const completedStepIndexes = lp.steps
        .map((_, idx) => idx)
        .filter((idx) => doneSet.has(String(idx)));

      return res.json({ path: lp, steps, completedStepIndexes });
    })
  );

  app.post(
    '/api/paths/:slug/steps',
    requireAuth,
    rateLimit({ keyPrefix: 'path_steps_write', max: 60, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = PathStepToggleSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid path step payload.' });
      }
      const lp = await storage.findLearningPathBySlug(String(req.params.slug || '').trim());
      if (!lp) return res.status(404).json({ error: 'Learning path not found.' });
      if (parsed.data.stepIndex >= lp.steps.length) {
        return res.status(404).json({ error: 'Path step index out of range.' });
      }

      const existing = await storage.findResourceProgress(req.user!.id, `path:${lp.slug}`);
      const stepSet = new Set(existing?.completedSteps || []);
      if (parsed.data.completed) {
        stepSet.add(String(parsed.data.stepIndex));
      } else {
        stepSet.delete(String(parsed.data.stepIndex));
      }
      const completedSteps = Array.from(stepSet).sort((a, b) => Number(a) - Number(b));
      const nextStatus =
        completedSteps.length >= lp.steps.length
          ? 'completed'
          : completedSteps.length > 0
            ? 'in_progress'
            : 'saved';

      const progress = await storage.upsertResourceProgress(req.user!.id, `path:${lp.slug}`, {
        status: nextStatus,
        completedSteps,
      });

      return res.json({
        pathSlug: lp.slug,
        completedStepIndexes: completedSteps.map(Number),
        progress,
      });
    })
  );

  app.post(
    '/api/paths/:slug/start-session',
    requireAuth,
    rateLimit({ keyPrefix: 'path_start_session', max: 30, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = PathStartSessionSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid path session launch payload.' });
      }
      const existingOpen = await storage.findActiveSessionForUser(req.user!.id);
      if (existingOpen) {
        return res.status(409).json({
          error: 'You already have an active or paused session. Finish or resume it before starting another.',
          activeSessionId: existingOpen.id,
        });
      }

      const lp = await storage.findLearningPathBySlug(String(req.params.slug || '').trim());
      if (!lp) return res.status(404).json({ error: 'Learning path not found.' });

      let targetProject = parsed.data.projectId
        ? await storage.findProjectById(parsed.data.projectId, req.user!.id)
        : null;

      if (!targetProject) {
        const userProjects = await storage.listProjectsForUser(req.user!.id);
        targetProject =
          userProjects.find((p) => p.type === 'learning' && p.name.toLowerCase() === lp.title.toLowerCase()) ||
          null;
      }

      if (!targetProject) {
        const newProjId = `proj_${crypto.randomUUID().slice(0, 12)}`;
        targetProject = await storage.createProject({
          id: newProjId,
          userId: req.user!.id,
          name: lp.title,
          type: 'learning',
          clientName: '',
          industry: 'Software Learning',
          languages: lp.languages.slice(0, 4),
          stack: [lp.sourceName, lp.track.replace(/_/g, ' ')],
          links: { repo: '', live: '', portfolio: '' },
          isPublicPortfolio: false,
          createdAt: new Date().toISOString(),
        });
      }

      const startIdx =
        parsed.data.stepIndex !== undefined && parsed.data.stepIndex < lp.steps.length
          ? parsed.data.stepIndex
          : 0;
      const now = new Date().toISOString();
      const orderedSteps = [...lp.steps.slice(startIdx), ...lp.steps.slice(0, startIdx)];
      const checkpoints: CheckpointItem[] = orderedSteps.map((st, idx) => ({
        id: `cp_${crypto.randomUUID().slice(0, 8)}`,
        category: VALID_CATEGORIES.has(st.category) ? st.category : 'learning',
        title: st.title,
        toolSlugs: Array.from(new Set([...(req.user!.defaultToolSlugs || []).slice(0, 2), st.resourceSlug])),
        plannedMinutes: Math.max(10, st.plannedMinutes || 45),
        actualMinutes: 0,
        status: idx === 0 ? 'active' : 'pending',
        startedAt: idx === 0 ? now : null,
        completedAt: null,
        notes: `Resource: ${st.resourceSlug}`,
      }));

      const plannedMinutes = checkpoints.reduce((sum, c) => sum + c.plannedMinutes, 0);
      const sessId = `sess_${crypto.randomUUID().slice(0, 12)}`;
      const created = await storage.createSession({
        id: sessId,
        userId: req.user!.id,
        projectId: targetProject.id,
        mode: 'learning',
        status: 'active',
        plannedMinutes,
        startedAt: now,
        endedAt: null,
        lastHeartbeat: now,
        currentDevice: getIncomingDevice(req),
        activeCheckpointId: checkpoints[0]?.id || null,
        title: '',
        summary: '',
        whatILearned: '',
        improvementAreas: [],
        checkpoints,
        pauses: [],
        deviceEvents: [],
        activitySlices: [],
        xpAwarded: 0,
        estimateAccuracy: 0,
        focusRatio: 1,
        activeMinutes: 0,
        pausedMinutes: 0,
        overrunMinutes: 0,
      });

      await storage.upsertResourceProgress(req.user!.id, `path:${lp.slug}`, {
        status: 'in_progress',
        linkedSessionId: created.id,
        lastOpenedAt: now,
      });

      return res.status(201).json({ session: hydrateSessionTimings(created, true), serverNow: Date.now() });
    })
  );

  // ---------------- LEARNING RESOURCES & USER PROGRESS (PHASE B) ----------------
  app.get(
    '/api/resources',
    optionalAuth,
    rateLimit({ keyPrefix: 'resources_list', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const track = req.query.track ? String(req.query.track) : undefined;
      const level = req.query.level ? String(req.query.level) : undefined;
      const language = req.query.language ? String(req.query.language) : undefined;
      const contentLanguage = req.query.contentLanguage ? String(req.query.contentLanguage) : undefined;
      const freeOnly = req.query.freeOnly === 'true' || req.query.freeOnly === '1';
      const format = req.query.format ? String(req.query.format) : undefined;
      const q = req.query.q ? String(req.query.q) : undefined;

      const resources = await storage.listLearningResources({
        track,
        level,
        language,
        contentLanguage,
        freeOnly,
        format,
        q,
      });

      if (!req.user) {
        return res.json({ resources: resources.map((r) => ({ ...r, progress: null })) });
      }

      const userProgressList = await storage.listResourceProgressForUser(req.user.id);
      const progMap = new Map(userProgressList.map((p) => [p.resourceSlug, p]));
      return res.json({
        resources: resources.map((r) => ({
          ...r,
          progress: progMap.get(r.slug) || null,
        })),
      });
    })
  );

  app.get(
    '/api/resources/progress',
    requireAuth,
    rateLimit({ keyPrefix: 'resources_progress_read', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const progress = await storage.listResourceProgressForUser(req.user!.id);
      return res.json({ progress });
    })
  );

  app.get(
    '/api/resources/:slug',
    optionalAuth,
    rateLimit({ keyPrefix: 'resource_detail', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const slug = String(req.params.slug || '').trim();
      const resource = await storage.findLearningResourceBySlug(slug);
      if (!resource) return res.status(404).json({ error: 'Learning resource not found.' });
      const progress = req.user ? await storage.findResourceProgress(req.user.id, slug) : null;
      return res.json({ resource: { ...resource, progress } });
    })
  );

  app.post(
    '/api/resources/:slug/progress',
    requireAuth,
    rateLimit({ keyPrefix: 'resource_progress_write', max: 60, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = ResourceProgressPatchSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid resource progress payload.', details: parsed.error.flatten() });
      }
      const slug = String(req.params.slug || '').trim();
      const resource = await storage.findLearningResourceBySlug(slug);
      if (!resource) return res.status(404).json({ error: 'Learning resource not found.' });

      const progress = await storage.upsertResourceProgress(req.user!.id, slug, {
        status: parsed.data.status,
        completedSteps: parsed.data.completedSteps,
        notes: parsed.data.notes,
        linkedSessionId: parsed.data.linkedSessionId,
        lastOpenedAt: parsed.data.lastOpenedAt,
      });

      return res.json({ progress });
    })
  );

  // ---------------- GUIDED PRACTICE HUB & UNIFIED SEARCH (PHASE C) ----------------
  app.get(
    '/api/practice',
    optionalAuth,
    rateLimit({ keyPrefix: 'practice_list', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const drills = await storage.listPracticeDrills({
        track: req.query.track ? String(req.query.track) : undefined,
        level: req.query.level ? String(req.query.level) : undefined,
        language: req.query.language ? String(req.query.language) : undefined,
        mode: req.query.mode ? String(req.query.mode) : undefined,
        q: req.query.q ? String(req.query.q) : undefined,
      });

      if (!req.user) {
        return res.json({
          drills: drills.map((d) => ({ ...d, completedStepIndexes: [], progress: null })),
        });
      }

      const progressList = await storage.listResourceProgressForUser(req.user.id);
      const progMap = new Map(progressList.map((p) => [p.resourceSlug, p]));

      return res.json({
        drills: drills.map((d) => {
          const prog = progMap.get(`practice:${d.slug}`) || null;
          return {
            ...d,
            completedStepIndexes: (prog?.completedSteps || []).map(Number).filter((n) => !Number.isNaN(n)),
            progress: prog,
          };
        }),
      });
    })
  );

  app.get(
    '/api/practice/:slug',
    optionalAuth,
    rateLimit({ keyPrefix: 'practice_detail', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const slug = String(req.params.slug || '').trim();
      const drill = await storage.findPracticeDrillBySlug(slug);
      if (!drill) return res.status(404).json({ error: 'Practice drill not found.' });

      const resource = drill.resourceSlug
        ? await storage.findLearningResourceBySlug(drill.resourceSlug)
        : null;

      let progress = null;
      let resourceProg = null;
      if (req.user) {
        [progress, resourceProg] = await Promise.all([
          storage.findResourceProgress(req.user.id, `practice:${drill.slug}`),
          resource ? storage.findResourceProgress(req.user.id, resource.slug) : Promise.resolve(null),
        ]);
      }

      const completedStepIndexes = (progress?.completedSteps || [])
        .map(Number)
        .filter((n) => !Number.isNaN(n) && n >= 0 && n < drill.steps.length);

      return res.json({
        drill: { ...drill, completedStepIndexes, progress },
        resource: resource ? { ...resource, progress: resourceProg } : null,
        completedStepIndexes,
        progress,
      });
    })
  );

  app.post(
    '/api/practice/:slug/steps',
    requireAuth,
    rateLimit({ keyPrefix: 'practice_steps_write', max: 60, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = PracticeStepSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid practice progress payload.' });
      }
      const slug = String(req.params.slug || '').trim();
      const drill = await storage.findPracticeDrillBySlug(slug);
      if (!drill) return res.status(404).json({ error: 'Practice drill not found.' });

      const existing = await storage.findResourceProgress(req.user!.id, `practice:${drill.slug}`);
      const stepSet = new Set(existing?.completedSteps || []);

      if (parsed.data.stepIndex !== undefined) {
        if (parsed.data.stepIndex >= drill.steps.length) {
          return res.status(404).json({ error: 'Practice step index out of range.' });
        }
        if (parsed.data.completed) {
          stepSet.add(String(parsed.data.stepIndex));
        } else {
          stepSet.delete(String(parsed.data.stepIndex));
        }
      }

      const completedSteps = Array.from(stepSet).sort((a, b) => Number(a) - Number(b));
      const nextStatus =
        completedSteps.length >= drill.steps.length
          ? 'completed'
          : completedSteps.length > 0 || parsed.data.notes
            ? 'in_progress'
            : existing?.status || 'saved';

      const progress = await storage.upsertResourceProgress(req.user!.id, `practice:${drill.slug}`, {
        status: nextStatus,
        completedSteps,
        notes: parsed.data.notes !== undefined ? parsed.data.notes : existing?.notes ?? '',
      });

      return res.json({
        drillSlug: drill.slug,
        completedStepIndexes: completedSteps.map(Number),
        progress,
      });
    })
  );

  app.post(
    '/api/practice/:slug/start-session',
    requireAuth,
    rateLimit({ keyPrefix: 'practice_start_session', max: 30, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = PracticeStartSessionSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid practice session launch payload.' });
      }
      const existingOpen = await storage.findActiveSessionForUser(req.user!.id);
      if (existingOpen) {
        return res.status(409).json({
          error: 'You already have an active or paused session. Finish or resume it before starting another.',
          activeSessionId: existingOpen.id,
        });
      }

      const drill = await storage.findPracticeDrillBySlug(String(req.params.slug || '').trim());
      if (!drill) return res.status(404).json({ error: 'Practice drill not found.' });

      let targetProject = parsed.data.projectId
        ? await storage.findProjectById(parsed.data.projectId, req.user!.id)
        : null;

      if (!targetProject) {
        const userProjects = await storage.listProjectsForUser(req.user!.id);
        targetProject =
          userProjects.find((p) => p.type === 'learning' && p.name.toLowerCase() === drill.title.toLowerCase()) ||
          null;
      }

      if (!targetProject) {
        const newProjId = `proj_${crypto.randomUUID().slice(0, 12)}`;
        targetProject = await storage.createProject({
          id: newProjId,
          userId: req.user!.id,
          name: drill.title,
          type: 'learning',
          clientName: '',
          industry: 'Guided Practice',
          languages: drill.languages.slice(0, 4),
          stack: [drill.mode.replace(/_/g, ' '), drill.track.replace(/_/g, ' ')],
          links: { repo: '', live: '', portfolio: '' },
          isPublicPortfolio: false,
          createdAt: new Date().toISOString(),
        });
      }

      const categoryMap: Record<string, ToolCategory> = {
        coding: 'dev',
        sql: 'data',
        security_lab: 'security',
        architecture: 'deployment',
        qa_debug: 'testing',
      };
      const primaryCategory: ToolCategory = categoryMap[drill.mode] || 'dev';
      const now = new Date().toISOString();

      const checkpoints: CheckpointItem[] = drill.steps.map((st, idx) => ({
        id: `cp_${crypto.randomUUID().slice(0, 8)}`,
        category: idx === 0 ? primaryCategory : 'testing',
        title: st.title,
        toolSlugs: Array.from(new Set([...(req.user!.defaultToolSlugs || []).slice(0, 2), drill.resourceSlug].filter(Boolean))),
        plannedMinutes: Math.max(5, st.plannedMinutes || 15),
        actualMinutes: 0,
        status: idx === 0 ? 'active' : 'pending',
        startedAt: idx === 0 ? now : null,
        completedAt: null,
        notes: `${st.prompt} | Verify: ${st.verificationHint}`,
      }));

      const plannedMinutes = checkpoints.reduce((sum, c) => sum + c.plannedMinutes, 0);
      const sessId = `sess_${crypto.randomUUID().slice(0, 12)}`;
      const created = await storage.createSession({
        id: sessId,
        userId: req.user!.id,
        projectId: targetProject.id,
        mode: 'learning',
        status: 'active',
        plannedMinutes,
        startedAt: now,
        endedAt: null,
        lastHeartbeat: now,
        currentDevice: getIncomingDevice(req),
        activeCheckpointId: checkpoints[0]?.id || null,
        title: '',
        summary: '',
        whatILearned: '',
        improvementAreas: [],
        checkpoints,
        pauses: [],
        deviceEvents: [],
        activitySlices: [],
        xpAwarded: 0,
        estimateAccuracy: 0,
        focusRatio: 1,
        activeMinutes: 0,
        pausedMinutes: 0,
        overrunMinutes: 0,
      });

      await storage.upsertResourceProgress(req.user!.id, `practice:${drill.slug}`, {
        status: 'in_progress',
        linkedSessionId: created.id,
        lastOpenedAt: now,
      });

      return res.status(201).json({ session: hydrateSessionTimings(created, true), serverNow: Date.now() });
    })
  );

  app.get(
    '/api/search',
    requireAuth,
    rateLimit({ keyPrefix: 'workspace_search', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const q = String(req.query.q || '').trim().slice(0, 100);
      if (q.length < 2) {
        return res.json({
          query: q,
          learningPaths: [],
          resources: [],
          practiceDrills: [],
          tools: [],
          projects: [],
          sessions: [],
        });
      }
      const results = await storage.searchWorkspaceForUser(req.user!.id, q, 6);
      return res.json(results);
    })
  );

  app.get(
    '/api/docs/pdf',
    asyncHandler(async (req, res) => {
      const candidates = [
        path.resolve(process.cwd(), 'public/Cadence_Complete_Documentation.pdf'),
        path.resolve(process.cwd(), 'dist/Cadence_Complete_Documentation.pdf'),
      ];
      const pdfPath = candidates.find((p) => fs.existsSync(p));
      if (!pdfPath) {
        return res.status(404).json({ error: 'Generated PDF specification not found.' });
      }
      const stat = fs.statSync(pdfPath);
      const inline = req.query.inline === '1' || req.query.inline === 'true';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="Cadence_Complete_Documentation.pdf"`
      );
      res.setHeader('Cache-Control', 'no-cache');
      return fs.createReadStream(pdfPath).pipe(res);
    })
  );

  // ---------------- AUTH ROUTES ----------------
  app.post(
    '/api/auth/register',
    rateLimit({ keyPrefix: 'auth_register', max: 20, windowMs: 60_000 }),
    asyncHandler(async (req, res) => {
      const name = String(req.body?.name || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const skillLevel = VALID_SKILL_LEVELS.has(req.body?.skillLevel)
        ? (req.body.skillLevel as SkillLevel)
        : 'beginner';

      if (!name || !email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid name and email are required.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      const existing = await storage.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const id = `usr_${crypto.randomUUID().slice(0, 12)}`;
      const baseUsername =
        email
          .split('@')[0]
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 14) || 'builder';
      const username = `${baseUsername}${crypto.randomBytes(2).toString('hex')}`;
      const now = new Date().toISOString();

      const created = await storage.createUser({
        id,
        username,
        name,
        email,
        passwordHash: hashPassword(password),
        skillLevel,
        createdAt: now,
      });

      await issueRefreshToken(res, id);
      const accessToken = signAccessToken(id);
      return res.status(201).json({ accessToken, user: stripPasswordHash(created) });
    })
  );

  app.post(
    '/api/auth/login',
    rateLimit({ keyPrefix: 'auth_login', max: 30, windowMs: 60_000 }),
    asyncHandler(async (req, res) => {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
      const userRecord = await storage.findUserByEmail(email);
      if (!userRecord || !verifyPassword(password, userRecord.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      await issueRefreshToken(res, userRecord.id);
      const accessToken = signAccessToken(userRecord.id);
      return res.json({ accessToken, user: stripPasswordHash(userRecord) });
    })
  );

  app.post(
    '/api/auth/demo-login',
    rateLimit({ keyPrefix: 'auth_demo_login', max: 60, windowMs: 60_000 }),
    asyncHandler(async (req, res) => {
      const intent = String(req.body?.intent || req.query?.intent || 'learner').trim().toLowerCase();
      const normalized = intent.replace(/[_-]/g, '');
      const candidates = [
        `${normalized}@cadence.dev`,
        `${intent}@cadence.dev`,
        'learner@cadence.dev',
      ];
      let userRecord = null;
      for (const email of candidates) {
        userRecord = await storage.findUserByEmail(email);
        if (userRecord) break;
      }

      if (!userRecord) {
        if (isMongoConfigured()) {
          await seedDemoAccountsMongo();
        } else {
          seedDemoAccountsSqlite(getSqliteDb());
        }
        for (const email of candidates) {
          userRecord = await storage.findUserByEmail(email);
          if (userRecord) break;
        }
      }

      if (!userRecord) {
        return res.status(404).json({ error: 'Demo account not found.' });
      }

      await issueRefreshToken(res, userRecord.id);
      const accessToken = signAccessToken(userRecord.id);
      return res.json({ accessToken, user: stripPasswordHash(userRecord) });
    })
  );

  app.post(
    '/api/auth/refresh',
    asyncHandler(async (req, res) => {
      const raw = parseCookieValue(req.headers.cookie, 'cadence_refresh');
      if (!raw) return res.status(401).json({ error: 'No session cookie.' });

      const rtRow = await storage.findValidRefreshToken(hashToken(raw));
      if (!rtRow || new Date(rtRow.expiresAt).getTime() <= Date.now()) {
        clearRefreshCookie(res);
        return res.status(401).json({ error: 'Session expired.' });
      }

      const userRecord = await storage.findUserById(rtRow.userId);
      if (!userRecord) return res.status(401).json({ error: 'User not found.' });

      await storage.revokeRefreshTokenById(rtRow.id);
      await issueRefreshToken(res, rtRow.userId);
      const accessToken = signAccessToken(rtRow.userId);
      return res.json({ accessToken, user: stripPasswordHash(userRecord) });
    })
  );

  app.post(
    '/api/auth/logout',
    asyncHandler(async (req, res) => {
      const raw = parseCookieValue(req.headers.cookie, 'cadence_refresh');
      if (raw) {
        await storage.revokeRefreshTokenByHash(hashToken(raw));
      }
      clearRefreshCookie(res);
      return res.json({ ok: true });
    })
  );

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    return res.json({ user: req.user });
  });

  app.patch(
    '/api/users/onboarding',
    requireAuth,
    rateLimit({ keyPrefix: 'onboarding', max: 60, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = OnboardingPatchSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid onboarding payload.', details: parsed.error.flatten() });
      }

      const user = req.user!;
      const body = parsed.data;
      const profilePatch: Record<string, unknown> = {};

      if (body.step !== undefined) profilePatch.onboardingStep = body.step;
      if (body.country !== undefined) profilePatch.country = body.country;
      if (body.tracks !== undefined) {
        const normalized = body.tracks
          .map((t) => normalizeTrackId(t))
          .filter((t): t is TrackId => Boolean(t))
          .slice(0, 3);
        if (normalized.length > 0) profilePatch.tracks = normalized;
      }
      if (body.level !== undefined && VALID_LEVELS_V13.has(body.level)) profilePatch.level = body.level;
      if (body.intent !== undefined && VALID_INTENTS.has(body.intent)) profilePatch.intent = body.intent;
      if (body.buildsWithAI !== undefined) profilePatch.buildsWithAI = body.buildsWithAI;
      if (body.programmingLanguages !== undefined) profilePatch.programmingLanguages = body.programmingLanguages;
      if (body.contentLanguages !== undefined && body.contentLanguages.length > 0) {
        profilePatch.contentLanguages = body.contentLanguages;
      }
      if (body.freeOnly !== undefined) profilePatch.freeOnly = body.freeOnly;
      if (body.hasStudentDiscount !== undefined) profilePatch.hasStudentDiscount = body.hasStudentDiscount;
      if (body.weeklyGoal !== undefined) profilePatch.weeklyGoal = body.weeklyGoal;
      if (body.resourceOpenMode !== undefined && VALID_OPEN_MODES.has(body.resourceOpenMode)) {
        profilePatch.resourceOpenMode = body.resourceOpenMode;
      }
      if (body.resourceWindowPrefs !== undefined) {
        profilePatch.resourceWindowPrefs = {
          ...user.profile.resourceWindowPrefs,
          ...body.resourceWindowPrefs,
        };
      }
      if (body.selectedPathSlug !== undefined) profilePatch.selectedPathSlug = body.selectedPathSlug;

      const derivedSkillLevel: SkillLevel =
        body.skillLevel ??
        (body.level === 'advanced'
          ? 'professional'
          : body.level === 'intermediate'
            ? 'intermediate'
            : body.buildsWithAI
              ? 'vibe_coder'
              : user.skillLevel);

      const updated = await storage.updateUserOnboardingStep(user.id, {
        name: body.name,
        timezone: body.timezone,
        skillLevel: derivedSkillLevel,
        primaryRole: body.primaryRole,
        defaultToolSlugs: body.defaultToolSlugs,
        portfolioUrl: body.portfolioUrl,
        businessSiteUrl: body.businessSiteUrl,
        complete: Boolean(body.complete),
        profilePatch,
      });

      const quickProjectName = String(body.initialProjectName || '').trim();
      let createdProjectId: string | null = null;
      if (quickProjectName) {
        const projType = body.initialProjectType && VALID_MODES.has(body.initialProjectType)
          ? body.initialProjectType
          : 'personal';
        createdProjectId = `proj_${crypto.randomUUID().slice(0, 12)}`;
        await storage.createProject({
          id: createdProjectId,
          userId: user.id,
          name: quickProjectName,
          type: projType,
          clientName: '',
          industry: String(body.initialProjectIndustry || 'Software'),
          languages: updated.profile.programmingLanguages.slice(0, 3),
          stack: body.initialProjectStack || ['TypeScript'],
          links: { repo: '', live: '', portfolio: body.portfolioUrl || '' },
          isPublicPortfolio: false,
          createdAt: new Date().toISOString(),
        });
      }

      // If finishing onboarding with startAction === 'first_session' and selectedPathSlug, bootstrap a learning project + session
      let startedSessionId: string | null = null;
      if (body.complete && body.startAction === 'first_session') {
        const existingActive = await storage.findActiveSessionForUser(user.id);
        if (!existingActive) {
          let projects = await storage.listProjectsForUser(user.id);
          let targetProjectId = createdProjectId || projects[0]?.id || '';
          let targetMode: ProjectType = projects[0]?.type || 'learning';
          const paths = await storage.listLearningPaths({
            track: updated.profile.tracks[0],
            level: updated.profile.level,
            freeOnly: updated.profile.freeOnly,
          });
          const pickedPath =
            paths.find((p) => p.slug === updated.profile.selectedPathSlug) || paths[0] || null;

          if (!targetProjectId) {
            targetProjectId = `proj_${crypto.randomUUID().slice(0, 12)}`;
            targetMode = 'learning';
            await storage.createProject({
              id: targetProjectId,
              userId: user.id,
              name: pickedPath ? pickedPath.title : `${updated.profile.tracks[0]} Practice`,
              type: 'learning',
              clientName: '',
              industry: 'Software Learning',
              languages: updated.profile.programmingLanguages.slice(0, 3),
              stack: updated.defaultToolSlugs.slice(0, 4),
              links: { repo: '', live: '', portfolio: '' },
              isPublicPortfolio: false,
              createdAt: new Date().toISOString(),
            });
          }

          const now = new Date().toISOString();
          const firstStep = pickedPath?.steps[0];
          const cpId = `cp_${crypto.randomUUID().slice(0, 8)}`;
          const sessId = `sess_${crypto.randomUUID().slice(0, 12)}`;
          const plannedMins = firstStep?.plannedMinutes || 45;

          await storage.createSession({
            id: sessId,
            userId: user.id,
            projectId: targetProjectId,
            mode: targetMode,
            status: 'active',
            plannedMinutes: plannedMins,
            startedAt: now,
            endedAt: null,
            lastHeartbeat: now,
            currentDevice: getIncomingDevice(req),
            activeCheckpointId: cpId,
            title: '',
            summary: '',
            whatILearned: '',
            improvementAreas: [],
            checkpoints: [
              {
                id: cpId,
                category: firstStep?.category || 'learning',
                title: firstStep?.title || 'Starter learning checkpoint',
                toolSlugs: updated.defaultToolSlugs.slice(0, 3),
                plannedMinutes: plannedMins,
                actualMinutes: 0,
                status: 'active',
                startedAt: now,
                completedAt: null,
                notes: '',
              },
            ],
            pauses: [],
            deviceEvents: [],
            activitySlices: [],
            xpAwarded: 0,
            estimateAccuracy: 0,
            focusRatio: 1,
            activeMinutes: 0,
            pausedMinutes: 0,
            overrunMinutes: 0,
          });
          startedSessionId = sessId;
        } else {
          startedSessionId = existingActive.id;
        }
      }

      return res.json({ user: stripPasswordHash(updated), startedSessionId });
    })
  );

  app.patch(
    '/api/users/profile',
    requireAuth,
    rateLimit({ keyPrefix: 'profile_patch', max: 60, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = ProfilePatchSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid profile update payload.', details: parsed.error.flatten() });
      }
      const user = req.user!;
      const body = parsed.data;
      const profilePatch: Record<string, unknown> = {};

      if (body.dashboardLens !== undefined) profilePatch.dashboardLens = body.dashboardLens;
      if (body.dismissedProfilePrompt !== undefined) profilePatch.dismissedProfilePrompt = body.dismissedProfilePrompt;
      if (body.lapseGraceMin !== undefined) profilePatch.lapseGraceMin = clampLapseGraceMin(body.lapseGraceMin);
      if (body.resourceOpenMode !== undefined) profilePatch.resourceOpenMode = body.resourceOpenMode;
      if (body.resourceWindowPrefs !== undefined) {
        profilePatch.resourceWindowPrefs = {
          ...user.profile.resourceWindowPrefs,
          ...body.resourceWindowPrefs,
        };
      }
      if (body.freeOnly !== undefined) profilePatch.freeOnly = body.freeOnly;
      if (body.hasStudentDiscount !== undefined) profilePatch.hasStudentDiscount = body.hasStudentDiscount;
      if (body.buildsWithAI !== undefined) profilePatch.buildsWithAI = body.buildsWithAI;
      if (body.level !== undefined) profilePatch.level = body.level;
      if (body.intent !== undefined) profilePatch.intent = body.intent;
      if (body.tracks !== undefined) {
        const normalized = body.tracks
          .map((t) => normalizeTrackId(t))
          .filter((t): t is TrackId => Boolean(t))
          .slice(0, 3);
        if (normalized.length > 0) profilePatch.tracks = normalized;
      }
      if (body.programmingLanguages !== undefined) profilePatch.programmingLanguages = body.programmingLanguages;
      if (body.contentLanguages !== undefined) profilePatch.contentLanguages = body.contentLanguages;
      if (body.country !== undefined) profilePatch.country = body.country;
      if (body.weeklyGoal !== undefined) profilePatch.weeklyGoal = body.weeklyGoal;

      const updated = await storage.updateUserProfilePatch(user.id, {
        name: body.name,
        skillLevel: body.skillLevel,
        primaryRole: body.primaryRole,
        portfolioUrl: body.portfolioUrl,
        businessSiteUrl: body.businessSiteUrl,
        timezone: body.timezone,
        defaultToolSlugs: body.defaultToolSlugs,
        profilePatch,
      });
      return res.json({ user: stripPasswordHash(updated) });
    })
  );

  // ---------------- ROLE DASHBOARD & APPLICATION TRACKER ----------------
  app.get(
    '/api/dashboard',
    requireAuth,
    rateLimit({ keyPrefix: 'dashboard', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const user = req.user!;
      const rawLens = req.query.lens ? String(req.query.lens) : '';
      const lens: DashboardLens = VALID_INTENTS.has(rawLens as IntentId)
        ? (rawLens as DashboardLens)
        : user.profile.dashboardLens || user.profile.intent || 'learner';

      // K3: run lazy stale session check on dashboard read
      const activeCandidate = await storage.findActiveSessionForUser(user.id);
      let activeSession = activeCandidate;
      if (activeCandidate) {
        const checked = await finalizeStaleSessionIfNeeded(activeCandidate, user.profile.lapseGraceMin);
        activeSession = checked.status === 'active' || checked.status === 'paused' ? checked : null;
      }

      const [sessions, projects, applications, learningPaths, portfolioSites, resourceProgressList] = await Promise.all([
        storage.listSessionsForUser(user.id, 60),
        storage.listProjectsForUser(user.id),
        storage.listApplicationsForUser(user.id),
        storage.listLearningPaths({
          track: user.profile.tracks[0],
          level: user.profile.level,
          freeOnly: user.profile.freeOnly,
          languages: user.profile.programmingLanguages,
        }),
        storage.listPortfolioSites(user.id),
        storage.listResourceProgressForUser(user.id),
      ]);

      const payload = buildDashboardPayload({
        user,
        lens,
        activeSession: activeSession ? hydrateSessionTimings(activeSession, true) : null,
        sessions: sessions.map((s) => hydrateSessionTimings(s, true)),
        projects,
        applications,
        learningPaths,
        portfolioSites,
        resourceProgressList,
        engine: getStorageEngine(),
      });

      return res.json(payload);
    })
  );

  app.get(
    '/api/applications',
    requireAuth,
    rateLimit({ keyPrefix: 'applications', max: 90, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const applications = await storage.listApplicationsForUser(req.user!.id);
      return res.json({ applications });
    })
  );

  app.post(
    '/api/applications',
    requireAuth,
    rateLimit({ keyPrefix: 'applications_write', max: 40, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = ApplicationCreateSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Company and role are required.', details: parsed.error.flatten() });
      }
      const now = new Date().toISOString();
      const status = parsed.data.status && VALID_APP_STATUS.has(parsed.data.status) ? parsed.data.status : 'saved';
      const created = await storage.createApplication({
        id: `app_${crypto.randomUUID().slice(0, 12)}`,
        userId: req.user!.id,
        company: parsed.data.company,
        role: parsed.data.role,
        status,
        url: parsed.data.url || '',
        notes: parsed.data.notes || '',
        appliedAt: parsed.data.appliedAt !== undefined ? parsed.data.appliedAt : status === 'applied' ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      return res.status(201).json({ application: created });
    })
  );

  app.patch(
    '/api/applications/:id',
    requireAuth,
    rateLimit({ keyPrefix: 'applications_write', max: 40, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const parsed = ApplicationUpdateSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid application update payload.' });
      }
      const updated = await storage.updateApplication(String(req.params.id), req.user!.id, parsed.data);
      if (!updated) return res.status(404).json({ error: 'Application not found.' });
      return res.json({ application: updated });
    })
  );

  app.delete(
    '/api/applications/:id',
    requireAuth,
    rateLimit({ keyPrefix: 'applications_write', max: 40, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const deleted = await storage.deleteApplication(String(req.params.id), req.user!.id);
      if (!deleted) return res.status(404).json({ error: 'Application not found.' });
      return res.json({ ok: true });
    })
  );

  // ---------------- TOOLS & GOOGLE SEARCH DISCOVERY ----------------
  app.get(
    '/api/tools',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const categoryFilter = req.query.category ? String(req.query.category) : '';
      let tools = await storage.listToolsForUser(req.user!.id);
      if (categoryFilter && VALID_CATEGORIES.has(categoryFilter as ToolCategory)) {
        tools = tools.filter((t) => t.categories.includes(categoryFilter as ToolCategory));
      }
      return res.json({ tools });
    })
  );

  app.post(
    '/api/tools',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const name = String(req.body?.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Tool name is required.' });
      const categories = (
        Array.isArray(req.body?.categories) ? req.body.categories : ['dev']
      ).filter((c: string): c is ToolCategory => VALID_CATEGORIES.has(c as ToolCategory));
      if (categories.length === 0) categories.push('dev');

      const baseSlug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'custom-tool';
      const slug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
      const id = `tool_${crypto.randomUUID().slice(0, 12)}`;

      const tool = await storage.createCustomTool({
        id,
        slug,
        name,
        categories,
        launchProtocol: String(req.body?.launchProtocol || '').trim(),
        domainPattern: String(req.body?.domainPattern || '').trim(),
        trackingLayer: String(req.body?.trackingLayer || 'manual'),
        description: String(req.body?.description || '').trim(),
        docsUrl: String(req.body?.docsUrl || '').trim(),
        createdBy: req.user!.id,
      });
      return res.status(201).json({ tool });
    })
  );

  app.post(
    '/api/ai/discover-stack',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const query = String(req.body?.query || '').trim();
      if (!query) return res.status(400).json({ error: 'Search query or tech stack goal is required.' });
      const mode = VALID_MODES.has(req.body?.mode) ? (req.body.mode as ProjectType) : 'personal';

      try {
        const result = await discoverStackWithSearch({
          query,
          skillLevel: req.user!.skillLevel,
          mode,
        });
        return res.json({ result });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to run Google Search discovery.';
        return res.status(502).json({ error: message });
      }
    })
  );

  app.post(
    '/api/ai/checkpoint-guide',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const checkpointTitle = String(req.body?.checkpointTitle || '').trim();
      if (!checkpointTitle) return res.status(400).json({ error: 'Checkpoint title is required.' });
      const category = VALID_CATEGORIES.has(req.body?.category)
        ? (req.body.category as ToolCategory)
        : 'dev';
      const stack = Array.isArray(req.body?.stack) ? req.body.stack.map(String) : [];

      try {
        const guide = await fetchCheckpointGuideWithSearch({
          checkpointTitle,
          category,
          stack,
          skillLevel: req.user!.skillLevel,
        });
        return res.json({ guide });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch grounded checkpoint guide.';
        return res.status(502).json({ error: message });
      }
    })
  );

  // ---------------- PROJECTS & DOCUMENTS ----------------
  app.get(
    '/api/projects',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const typeFilter = req.query.type ? String(req.query.type) : '';
      let projects = await storage.listProjectsForUser(req.user!.id);
      if (typeFilter && VALID_MODES.has(typeFilter as ProjectType)) {
        projects = projects.filter((p) => p.type === typeFilter);
      }
      return res.json({ projects });
    })
  );

  app.post(
    '/api/projects',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const name = String(req.body?.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Project name is required.' });
      const type = VALID_MODES.has(req.body?.type) ? (req.body.type as ProjectType) : 'personal';

      const project = await storage.createProject({
        id: `proj_${crypto.randomUUID().slice(0, 12)}`,
        userId: req.user!.id,
        name,
        type,
        clientName: String(req.body?.clientName || '').trim(),
        industry: String(req.body?.industry || 'Software').trim(),
        languages: Array.isArray(req.body?.languages) ? req.body.languages.map(String) : [],
        stack: Array.isArray(req.body?.stack) ? req.body.stack.map(String) : [],
        links: {
          repo: String(req.body?.links?.repo || '').trim(),
          live: String(req.body?.links?.live || '').trim(),
          portfolio: String(req.body?.links?.portfolio || '').trim(),
        },
        isPublicPortfolio: Boolean(req.body?.isPublicPortfolio),
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({ project });
    })
  );

  app.get(
    '/api/projects/:id',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const project = await storage.findProjectById(String(req.params.id), req.user!.id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const [documents, sessions] = await Promise.all([
        storage.listDocumentsForProject(project.id),
        storage.listSessionsForProject(project.id),
      ]);

      return res.json({
        project,
        documents,
        sessions,
      });
    })
  );

  app.patch(
    '/api/projects/:id',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const current = await storage.findProjectById(String(req.params.id), req.user!.id);
      if (!current) return res.status(404).json({ error: 'Project not found.' });

      const updated = await storage.updateProject(current.id, req.user!.id, {
        name: String(req.body?.name ?? current.name).trim(),
        type: VALID_MODES.has(req.body?.type) ? (req.body.type as ProjectType) : current.type,
        clientName: String(req.body?.clientName ?? current.clientName).trim(),
        industry: String(req.body?.industry ?? current.industry).trim(),
        languages: Array.isArray(req.body?.languages)
          ? req.body.languages.map(String)
          : current.languages,
        stack: Array.isArray(req.body?.stack) ? req.body.stack.map(String) : current.stack,
        links: req.body?.links ? req.body.links : current.links,
        isPublicPortfolio:
          req.body?.isPublicPortfolio !== undefined
            ? Boolean(req.body.isPublicPortfolio)
            : current.isPublicPortfolio,
      });
      return res.json({ project: updated });
    })
  );

  app.delete(
    '/api/projects/:id',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const deleted = await storage.deleteProject(String(req.params.id), req.user!.id);
      if (!deleted) return res.status(404).json({ error: 'Project not found.' });
      return res.json({ ok: true });
    })
  );

  app.post(
    '/api/projects/:id/documents',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const project = await storage.findProjectById(String(req.params.id), req.user!.id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const fileName = String(req.body?.fileName || 'project-brief.md').trim();
      const rawText = String(req.body?.rawText || '').trim();
      if (!rawText) return res.status(400).json({ error: 'Document text content is required.' });

      try {
        const summaryCard = await summarizeProjectDocument({
          fileName,
          rawText,
          projectType: project.type,
        });
        const document = {
          id: `doc_${crypto.randomUUID().slice(0, 12)}`,
          projectId: project.id,
          userId: req.user!.id,
          fileName,
          rawText,
          summaryCard,
          createdAt: new Date().toISOString(),
        };
        await storage.createDocument(document);
        return res.status(201).json({ document });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to summarize document.';
        return res.status(502).json({ error: message });
      }
    })
  );

  // ---------------- SESSIONS, HEARTBEAT, PAUSE, END & TELEMETRY ----------------
  app.get(
    '/api/sessions/active',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const active = await storage.findActiveSessionForUser(req.user!.id);
      if (!active) return res.json({ session: null });

      // K3: lazy stale session finalization
      const checked = await finalizeStaleSessionIfNeeded(active, req.user!.profile.lapseGraceMin);
      if (checked.status !== 'active' && checked.status !== 'paused') {
        return res.json({ session: null, lastLapsedSessionId: checked.id });
      }

      const incomingDevice = getIncomingDevice(req);
      let nextSession = checked;

      if (req.authSource === 'web' && incomingDevice !== checked.currentDevice) {
        const nextEvents: DeviceEvent[] = [
          ...checked.deviceEvents,
          {
            fromDevice: checked.currentDevice,
            toDevice: incomingDevice,
            at: new Date().toISOString(),
            checkpointId: checked.activeCheckpointId,
          },
        ];
        nextSession = await storage.saveSession({
          ...checked,
          currentDevice: incomingDevice,
          deviceEvents: nextEvents,
        });
      }

      return res.json({ session: hydrateSessionTimings(nextSession, true), serverNow: Date.now() });
    })
  );

  app.get(
    '/api/sessions',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const rawSessions = await storage.listSessionsForUser(req.user!.id, 50);
      const sessions = await Promise.all(
        rawSessions.map((s) =>
          s.status === 'active' ? finalizeStaleSessionIfNeeded(s, req.user!.profile.lapseGraceMin) : Promise.resolve(s)
        )
      );
      return res.json({ sessions: sessions.map((s) => hydrateSessionTimings(s, true)) });
    })
  );

  app.get(
    '/api/sessions/:id',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const rawSession = await storage.findSessionById(String(req.params.id), req.user!.id);
      if (!rawSession) return res.status(404).json({ error: 'Session not found.' });
      const session = await finalizeStaleSessionIfNeeded(rawSession, req.user!.profile.lapseGraceMin);
      return res.json({ session: hydrateSessionTimings(session, true), serverNow: Date.now() });
    })
  );

  app.post(
    '/api/sessions',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const existingOpen = await storage.findActiveSessionForUser(req.user!.id);
      if (existingOpen) {
        return res.status(409).json({
          error: 'You already have an active or paused session. Finish or resume it before starting another.',
          activeSessionId: existingOpen.id,
        });
      }

      const projectId = String(req.body?.projectId || '');
      const project = await storage.findProjectById(projectId, req.user!.id);
      if (!project) return res.status(404).json({ error: 'Selected project not found.' });

      const mode = VALID_MODES.has(req.body?.mode) ? (req.body.mode as ProjectType) : project.type;
      const rawCheckpoints = Array.isArray(req.body?.checkpoints) ? req.body.checkpoints : [];
      if (rawCheckpoints.length === 0) {
        return res.status(400).json({ error: 'At least one category checkpoint is required.' });
      }

      const now = new Date().toISOString();
      const checkpoints: CheckpointItem[] = rawCheckpoints.map(
        (cp: Record<string, unknown>, idx: number) => ({
          id: `cp_${crypto.randomUUID().slice(0, 8)}`,
          category: VALID_CATEGORIES.has(String(cp.category) as ToolCategory)
            ? (String(cp.category) as ToolCategory)
            : 'dev',
          title: String(cp.title || `Checkpoint ${idx + 1}`).trim(),
          toolSlugs: Array.isArray(cp.toolSlugs) ? cp.toolSlugs.map(String) : [],
          plannedMinutes: Math.max(5, Number(cp.plannedMinutes) || 30),
          actualMinutes: 0,
          status: idx === 0 ? 'active' : 'pending',
          startedAt: idx === 0 ? now : null,
          completedAt: null,
          notes: '',
        })
      );

      const plannedMinutes =
        Number(req.body?.plannedMinutes) ||
        checkpoints.reduce((sum, c) => sum + c.plannedMinutes, 0);

      const device = getIncomingDevice(req);
      const id = `sess_${crypto.randomUUID().slice(0, 12)}`;

      const created = await storage.createSession({
        id,
        userId: req.user!.id,
        projectId,
        mode,
        status: 'active',
        plannedMinutes,
        startedAt: now,
        endedAt: null,
        lastHeartbeat: now,
        currentDevice: device,
        activeCheckpointId: checkpoints[0].id,
        title: '',
        summary: '',
        whatILearned: '',
        improvementAreas: [],
        checkpoints,
        pauses: [],
        deviceEvents: [],
        activitySlices: [],
        xpAwarded: 0,
        estimateAccuracy: 0,
        focusRatio: 1,
        activeMinutes: 0,
        pausedMinutes: 0,
        overrunMinutes: 0,
      });

      return res.status(201).json({ session: hydrateSessionTimings(created, true), serverNow: Date.now() });
    })
  );

  app.post(
    '/api/sessions/:id/heartbeat',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const session = await storage.findSessionById(String(req.params.id), req.user!.id);
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      if (session.status !== 'active' && session.status !== 'paused') {
        return res.json({ session: hydrateSessionTimings(session, true), serverNow: Date.now() });
      }

      const now = new Date().toISOString();
      const incomingDevice = getIncomingDevice(req);
      const events = [...session.deviceEvents];

      if (incomingDevice !== session.currentDevice) {
        events.push({
          fromDevice: session.currentDevice,
          toDevice: incomingDevice,
          at: now,
          checkpointId: session.activeCheckpointId,
        });
      }

      const updated = await storage.saveSession({
        ...session,
        lastHeartbeat: now,
        currentDevice: incomingDevice,
        deviceEvents: events,
      });

      return res.json({ session: hydrateSessionTimings(updated, true), serverNow: Date.now() });
    })
  );

  app.post(
    '/api/sessions/:id/switch-device',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const session = await storage.findSessionById(String(req.params.id), req.user!.id);
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      const toDevice: DeviceKind = req.body?.toDevice === 'mobile_pwa' ? 'mobile_pwa' : 'web';
      const events = [...session.deviceEvents];
      let updated = session;

      if (toDevice !== session.currentDevice) {
        const now = new Date().toISOString();
        events.push({
          fromDevice: session.currentDevice,
          toDevice,
          at: now,
          checkpointId: session.activeCheckpointId,
        });
        updated = await storage.saveSession({
          ...session,
          currentDevice: toDevice,
          deviceEvents: events,
          lastHeartbeat: now,
        });
      }

      return res.json({ session: hydrateSessionTimings(updated, true) });
    })
  );

  app.patch(
    '/api/sessions/:id/checkpoint',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const session = await storage.findSessionById(String(req.params.id), req.user!.id);
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      if (session.status !== 'active') {
        return res.status(400).json({ error: 'Checkpoints can only be updated while session is active.' });
      }

      const targetId = String(req.body?.checkpointId || '');
      const action = String(req.body?.action || 'activate'); // activate | complete
      const notes = req.body?.notes !== undefined ? String(req.body.notes) : undefined;
      const now = new Date().toISOString();
      const nowMs = Date.now();

      let nextActiveId = session.activeCheckpointId;

      const updatedCheckpoints = session.checkpoints.map((cp) => {
        if (cp.status === 'active' && cp.id !== targetId && action === 'activate') {
          const elapsed = cp.startedAt
            ? Math.max(1, Math.round((nowMs - new Date(cp.startedAt).getTime()) / 60_000))
            : 0;
          return {
            ...cp,
            actualMinutes: cp.actualMinutes + elapsed,
            status: 'completed' as const,
            completedAt: now,
          };
        }
        if (cp.id === targetId) {
          if (action === 'complete') {
            const elapsed = cp.startedAt
              ? Math.max(1, Math.round((nowMs - new Date(cp.startedAt).getTime()) / 60_000))
              : 0;
            return {
              ...cp,
              actualMinutes: cp.actualMinutes + elapsed,
              status: 'completed' as const,
              completedAt: now,
              notes: notes !== undefined ? notes : cp.notes,
            };
          }
          nextActiveId = cp.id;
          return {
            ...cp,
            status: 'active' as const,
            startedAt: cp.startedAt || now,
            notes: notes !== undefined ? notes : cp.notes,
          };
        }
        return cp;
      });

      if (action === 'complete' && nextActiveId === targetId) {
        const nextPending = updatedCheckpoints.find((c) => c.status === 'pending');
        if (nextPending) {
          nextPending.status = 'active';
          nextPending.startedAt = now;
          nextActiveId = nextPending.id;
        }
      }

      const saved = await storage.saveSession({
        ...session,
        checkpoints: updatedCheckpoints,
        activeCheckpointId: nextActiveId,
        lastHeartbeat: now,
      });

      return res.json({ session: hydrateSessionTimings(saved, true) });
    })
  );

  app.patch(
    '/api/sessions/:id/pause',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const session = await storage.findSessionById(String(req.params.id), req.user!.id);
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      if (session.status !== 'active') {
        return res.status(400).json({ error: 'Only an active session can be paused.' });
      }

      const reason = String(req.body?.reason || '') as PauseReason;
      if (!VALID_PAUSE_REASONS.has(reason)) {
        return res.status(400).json({ error: 'A valid pause reason is required before pausing.' });
      }
      const plannedMinutes = Math.max(1, Math.min(180, Number(req.body?.plannedMinutes) || 0));
      if (!plannedMinutes) {
        return res.status(400).json({ error: 'Planned pause duration (minutes) is required.' });
      }

      const now = new Date().toISOString();
      const pauses: PauseInterval[] = [
        ...session.pauses,
        {
          id: `pau_${crypto.randomUUID().slice(0, 8)}`,
          reason,
          note: String(req.body?.note || '').trim(),
          startedAt: now,
          plannedMinutes,
          resumedAt: null,
          overrunMinutes: 0,
        },
      ];

      const saved = await storage.saveSession({
        ...session,
        status: 'paused',
        pauses,
        lastHeartbeat: now,
      });

      return res.json({ session: hydrateSessionTimings(saved, true), serverNow: Date.now() });
    })
  );

  app.patch(
    '/api/sessions/:id/resume',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const session = await storage.findSessionById(String(req.params.id), req.user!.id);
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      if (session.status !== 'paused') {
        return res.status(400).json({ error: 'Session is not currently paused.' });
      }

      const now = new Date().toISOString();
      const nowMs = Date.now();
      const pauses = session.pauses.map((p) => ({ ...p }));
      const lastPause = pauses[pauses.length - 1];
      if (lastPause && !lastPause.resumedAt) {
        lastPause.resumedAt = now;
        const actualPauseMin = Math.round((nowMs - new Date(lastPause.startedAt).getTime()) / 60_000);
        lastPause.overrunMinutes = Math.max(0, actualPauseMin - lastPause.plannedMinutes);
      }

      const saved = await storage.saveSession({
        ...session,
        status: 'active',
        pauses,
        lastHeartbeat: now,
      });

      return res.json({ session: hydrateSessionTimings(saved, true), serverNow: Date.now() });
    })
  );

  app.patch(
    '/api/sessions/:id/end',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const session = await storage.findSessionById(String(req.params.id), req.user!.id);
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      if (session.status !== 'active' && session.status !== 'paused') {
        return res.status(400).json({ error: 'Session is already closed.' });
      }

      const title = String(req.body?.title || '').trim();
      const summary = String(req.body?.summary || '').trim();
      const whatILearned = String(req.body?.whatILearned || '').trim();
      if (!title || !summary) {
        return res.status(400).json({ error: 'Session title and one-line summary are required to finish.' });
      }
      if (session.mode === 'learning' && !whatILearned) {
        return res.status(400).json({ error: 'Learning mode requires a brief "What I Learned" takeaway.' });
      }

      const now = new Date().toISOString();
      const nowMs = Date.now();
      const pauses = session.pauses.map((p) => ({ ...p }));
      const openPause = pauses[pauses.length - 1];
      if (openPause && !openPause.resumedAt) {
        openPause.resumedAt = now;
        const actualPauseMin = Math.round((nowMs - new Date(openPause.startedAt).getTime()) / 60_000);
        openPause.overrunMinutes = Math.max(0, actualPauseMin - openPause.plannedMinutes);
      }

      const finalizedCheckpoints = session.checkpoints.map((cp) => {
        if (cp.status === 'active' && cp.startedAt) {
          const elapsed = Math.max(1, Math.round((nowMs - new Date(cp.startedAt).getTime()) / 60_000));
          return {
            ...cp,
            actualMinutes: cp.actualMinutes + elapsed,
            status: 'completed' as const,
            completedAt: now,
          };
        }
        return cp;
      });

      const timings = computeSessionTimings(session.startedAt, now, pauses, nowMs);
      const completedCount = finalizedCheckpoints.filter((c) => c.status === 'completed').length;
      const { xpAwarded, estimateAccuracy } = await calculateAwardedXp({
        userId: req.user!.id,
        activeMinutes: timings.activeMinutes,
        plannedMinutes: session.plannedMinutes,
        focusRatio: timings.focusRatio,
        completedCheckpoints: completedCount,
        streakDays: req.user!.streakDays,
      });

      const improvementAreas = computeImprovementAreas(finalizedCheckpoints, timings.overrunMinutes);

      const savedSession = await storage.saveSession({
        ...session,
        status: 'completed',
        endedAt: now,
        lastHeartbeat: now,
        title,
        summary,
        whatILearned,
        checkpoints: finalizedCheckpoints,
        pauses,
        improvementAreas,
        activeMinutes: timings.activeMinutes,
        pausedMinutes: timings.pausedMinutes,
        overrunMinutes: timings.overrunMinutes,
        focusRatio: timings.focusRatio,
        xpAwarded,
        estimateAccuracy,
      });

      const userProgress = await updateUserStreakAndXp(req.user!.id, xpAwarded);
      await awardSessionBadges(req.user!.id, savedSession, userProgress.streakDays);

      return res.json({ session: savedSession, userProgress });
    })
  );

  app.post(
    '/api/sessions/:id/disconnect',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const session = await storage.findSessionById(String(req.params.id), req.user!.id);
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      if (session.status !== 'active' && session.status !== 'paused') {
        return res.json({ session });
      }

      const now = new Date().toISOString();
      const timings = computeSessionTimings(session.startedAt, now, session.pauses, Date.now());
      const finalizedCheckpoints = session.checkpoints.map((cp) =>
        cp.status === 'active'
          ? {
              ...cp,
              actualMinutes: Math.max(cp.actualMinutes, timings.activeMinutes),
              status: 'completed' as const,
              completedAt: now,
            }
          : cp
      );
      const areas = computeImprovementAreas(finalizedCheckpoints, timings.overrunMinutes);
      areas.unshift('App closed mid-session — exact timestamp, duration, and IDE logs preserved cleanly.');

      const saved = await storage.saveSession({
        ...session,
        status: 'lapsed',
        endedAt: now,
        lastHeartbeat: now,
        title: session.title || 'Closed App Session (Auto-Logged)',
        summary:
          session.summary ||
          'Ended when app closed; exact date, time, duration, and tool slices recorded.',
        checkpoints: finalizedCheckpoints,
        improvementAreas: areas,
        activeMinutes: timings.activeMinutes,
        pausedMinutes: timings.pausedMinutes,
        overrunMinutes: timings.overrunMinutes,
        focusRatio: timings.focusRatio,
      });

      return res.json({ session: saved });
    })
  );

  app.post(
    '/api/activity',
    requireAuth,
    rateLimit({ keyPrefix: 'activity', max: 120, windowMs: 60_000 }),
    asyncHandler(async (req: AuthedRequest, res) => {
      const requestedSessionId = req.body?.sessionId ? String(req.body.sessionId) : null;
      const session = requestedSessionId
        ? await storage.findSessionById(requestedSessionId, req.user!.id)
        : await storage.findActiveSessionForUser(req.user!.id);

      if (!session) {
        return res.status(404).json({ error: 'No active session found to attach activity telemetry.' });
      }
      if (session.status !== 'active') {
        return res.status(400).json({ error: 'Session is not active.' });
      }

      const source = ['ide', 'chrome', 'manual'].includes(String(req.body?.source))
        ? (String(req.body.source) as ActivitySlice['source'])
        : 'manual';

      // K2: map IDE appName/slug cleanly and validate against seeded/custom tools with 'custom' fallback
      const rawToolInput = String(req.body?.toolSlug || req.body?.appName || 'vscode').slice(0, 64);
      const validToolSlug = await storage.resolveValidToolSlug(rawToolInput);

      const slices: ActivitySlice[] = [
        ...session.activitySlices,
        {
          id: `act_${crypto.randomUUID().slice(0, 8)}`,
          source,
          toolSlug: validToolSlug,
          language: String(req.body?.language || 'typescript').slice(0, 30),
          projectName: String(req.body?.projectName || '').slice(0, 60),
          gitCommitMessage: String(req.body?.gitCommitMessage || '').slice(0, 140),
          ts: new Date().toISOString(),
        },
      ].slice(-120);

      const updated = await storage.saveSession({
        ...session,
        activitySlices: slices,
        lastHeartbeat: new Date().toISOString(),
      });

      return res.json({ session: hydrateSessionTimings(updated, true) });
    })
  );

  // ---------------- EXTENSION PAIRING ----------------
  app.get(
    '/api/extensions/tokens',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const tokens = await storage.listExtensionTokens(req.user!.id);
      return res.json({ tokens });
    })
  );

  app.post(
    '/api/extensions/pair-code',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const source = req.body?.source === 'chrome' ? 'chrome' : 'ide';
      const code = String(crypto.randomInt(100000, 999999));
      const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
      await storage.createPairingCode(code, req.user!.id, source, expiresAt);
      return res.json({ code, source, expiresAt });
    })
  );

  app.post(
    '/api/extensions/pair',
    asyncHandler(async (req, res) => {
      const code = String(req.body?.code || '').trim();
      const consumed = await storage.consumePairingCode(code);
      if (!consumed) {
        return res.status(400).json({ error: 'Invalid or expired pairing code.' });
      }

      const source = req.body?.source === 'chrome' ? 'chrome' : consumed.source;
      const label = String(
        req.body?.appName || (source === 'chrome' ? 'Chrome MV3 Extension' : 'VS Code / Cursor IDE')
      ).slice(0, 50);
      const rawToken = `ext_${source}_${crypto.randomBytes(20).toString('hex')}`;
      const id = `extok_${crypto.randomUUID().slice(0, 10)}`;
      const now = new Date().toISOString();

      await storage.createExtensionToken({
        id,
        userId: consumed.userId,
        source,
        label,
        tokenHash: hashToken(rawToken),
        tokenPrefix: rawToken.slice(0, 14),
        createdAt: now,
      });

      return res.json({ token: rawToken, source, label });
    })
  );

  app.delete(
    '/api/extensions/tokens/:id',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      await storage.revokeExtensionToken(String(req.params.id), req.user!.id);
      return res.json({ ok: true });
    })
  );

  // ---------------- STATS, LEADERBOARD & PORTFOLIO SYNC ----------------
  app.get(
    '/api/stats/overview',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const sessions = await storage.listClosedSessionsForUser(req.user!.id);

      const categoryTotals: Record<string, { planned: number; actual: number }> = {};
      const toolTotals: Record<string, number> = {};
      let accuracySum = 0;
      let accuracyCount = 0;
      let totalActiveMinutes = 0;

      for (const s of sessions) {
        totalActiveMinutes += s.activeMinutes;
        if (s.status === 'completed' && s.estimateAccuracy > 0) {
          accuracySum += s.estimateAccuracy;
          accuracyCount++;
        }
        for (const cp of s.checkpoints) {
          if (!categoryTotals[cp.category]) categoryTotals[cp.category] = { planned: 0, actual: 0 };
          categoryTotals[cp.category].planned += cp.plannedMinutes;
          categoryTotals[cp.category].actual += cp.actualMinutes;
        }
        for (const slice of s.activitySlices) {
          toolTotals[slice.toolSlug] = (toolTotals[slice.toolSlug] || 0) + 1;
        }
      }

      const badges = await storage.listAchievementsForUser(req.user!.id);
      const recentAreas = sessions
        .flatMap((s) => s.improvementAreas)
        .filter((msg, idx, arr) => arr.indexOf(msg) === idx)
        .slice(0, 6);

      return res.json({
        totalSessions: sessions.length,
        totalActiveMinutes,
        avgAccuracy: accuracyCount > 0 ? Number((accuracySum / accuracyCount).toFixed(3)) : 0,
        categoryTotals,
        toolTotals,
        recentAreas,
        badges,
      });
    })
  );

  app.get(
    '/api/leaderboard',
    requireAuth,
    asyncHandler(async (_req: AuthedRequest, res) => {
      const users = await storage.listLeaderboard();
      return res.json({
        leaders: users.map((u, idx) => ({
          rank: idx + 1,
          ...u,
        })),
      });
    })
  );

  app.get(
    '/api/portfolio/sites',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const sites = await storage.listPortfolioSites(req.user!.id);
      return res.json({
        sites: sites.map((s) => ({
          id: s.id,
          userId: s.userId,
          siteType: s.siteType,
          label: s.label,
          siteUrl: s.siteUrl,
          webhookUrl: s.webhookUrl,
          autoPublishOnDeploy: s.autoPublishOnDeploy,
          lastSyncAt: s.lastSyncAt,
          lastSyncStatus: s.lastSyncStatus,
        })),
      });
    })
  );

  app.post(
    '/api/portfolio/sites',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const label = String(req.body?.label || '').trim();
      const siteUrl = String(req.body?.siteUrl || '').trim();
      const webhookUrl = String(req.body?.webhookUrl || '').trim();
      const siteType = req.body?.siteType === 'business' ? 'business' : 'personal';

      if (!label || !siteUrl) return res.status(400).json({ error: 'Site label and URL are required.' });
      if (webhookUrl) {
        const check = isSafePublicWebhookUrl(webhookUrl);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }

      const id = `psite_${crypto.randomUUID().slice(0, 10)}`;
      const secret = `whsec_${crypto.randomBytes(20).toString('hex')}`;
      await storage.createPortfolioSite({
        id,
        userId: req.user!.id,
        siteType,
        label,
        siteUrl,
        webhookUrl,
        webhookSecret: secret,
        autoPublishOnDeploy: Boolean(req.body?.autoPublishOnDeploy),
      });

      return res.status(201).json({ id, label, siteType, siteUrl, webhookUrl, webhookSecret: secret });
    })
  );

  app.delete(
    '/api/portfolio/sites/:id',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      await storage.deletePortfolioSite(String(req.params.id), req.user!.id);
      return res.json({ ok: true });
    })
  );

  app.post(
    '/api/portfolio/publish/:projectId',
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const project = await storage.findProjectById(String(req.params.projectId), req.user!.id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const now = new Date().toISOString();
      await storage.markProjectPublished(project.id, now);

      const projectSessions = (await storage.listSessionsForProject(project.id)).filter(
        (s) => s.status === 'completed' || s.status === 'lapsed'
      );
      const totalMins = projectSessions.reduce((sum, s) => sum + s.activeMinutes, 0);
      const avgAcc =
        projectSessions.length > 0
          ? projectSessions.reduce((sum, s) => sum + s.estimateAccuracy, 0) / projectSessions.length
          : 0;

      const targetSiteType = project.type === 'business' ? 'business' : 'personal';
      const sites = await storage.listPortfolioSites(req.user!.id, targetSiteType);

      const deliveryResults: { siteId: string; status: string }[] = [];
      const payloadObj = {
        event: 'project.published',
        timestamp: now,
        targetSiteType,
        project: {
          id: project.id,
          name: project.name,
          type: project.type,
          industry: project.industry,
          languages: project.languages,
          stack: project.stack,
          links: project.links,
          verifiedMetrics: {
            totalHours: Number((totalMins / 60).toFixed(1)),
            sessionsCompleted: projectSessions.length,
            estimateAccuracyAvg: Number(avgAcc.toFixed(2)),
          },
        },
      };
      const payloadStr = JSON.stringify(payloadObj);

      for (const site of sites) {
        if (!site.webhookUrl) {
          await storage.updatePortfolioSiteSync(site.id, now, 'feed_updated');
          deliveryResults.push({ siteId: site.id, status: 'feed_updated' });
          continue;
        }
        const check = isSafePublicWebhookUrl(site.webhookUrl);
        if (!check.ok) {
          deliveryResults.push({ siteId: site.id, status: 'blocked_invalid_url' });
          continue;
        }
        try {
          const sig = crypto.createHmac('sha256', site.webhookSecret).update(payloadStr).digest('hex');
          const resp = await fetch(site.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Cadence-Signature': `sha256=${sig}` },
            body: payloadStr,
            signal: AbortSignal.timeout(4000),
          });
          const statusText = `http_${resp.status}`;
          await storage.updatePortfolioSiteSync(site.id, now, statusText);
          deliveryResults.push({ siteId: site.id, status: statusText });
        } catch {
          await storage.updatePortfolioSiteSync(site.id, now, 'unreachable_feed_live');
          deliveryResults.push({ siteId: site.id, status: 'unreachable_feed_live' });
        }
      }

      return res.json({
        publishedAt: now,
        publicFeedUrl: `/api/public/portfolio/${req.user!.username}`,
        deliveryResults,
      });
    })
  );

  app.get(
    '/api/public/portfolio/:username',
    asyncHandler(async (req, res) => {
      const user = await storage.findUserByUsername(String(req.params.username));
      if (!user) return res.status(404).json({ error: 'Portfolio feed not found.' });

      const published = await storage.listPublicPortfolioProjects(user.id);
      const projects = published.map(({ mapped, sessionsCompleted, totalMinutes }) => ({
        id: mapped.id,
        name: mapped.name,
        type: mapped.type,
        industry: mapped.industry,
        languages: mapped.languages,
        stack: mapped.stack,
        links: mapped.links,
        verifiedHours: Number((totalMinutes / 60).toFixed(1)),
        sessionsCompleted,
        publishedAt: mapped.portfolioPublishedAt,
      }));

      return res.json({
        developer: {
          username: user.username,
          name: user.name,
          role: user.primaryRole,
          tier: user.tier,
          xp: user.xp,
        },
        projects,
      });
    })
  );

  // ---------------- CRON LAPSE CHECK (CRON_SECRET OPTIONAL) ----------------
  app.get(
    '/api/cron/lapse-check',
    asyncHandler(async (req, res) => {
      const cronSecret = process.env.CRON_SECRET?.trim();
      if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized cron trigger.' });
      }
      const lapsed = await runLapseSweep();
      return res.json({ ok: true, lapsed });
    })
  );

  // Global JSON error handler for /api/* routes
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.path.startsWith('/api')) return next(err);
    if (err instanceof DatabaseNotConfiguredError) {
      if (!loggedDbMissingOnce) {
        loggedDbMissingOnce = true;
        console.error('Database not configured for production Vercel deployment: set MONGODB_URI.');
      }
      return res.status(503).json({ error: 'Database not configured.' });
    }
    console.error('API Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return res.status(500).json({ error: message });
  });

  return app;
}
