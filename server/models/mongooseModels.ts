import mongoose, { Schema, type Model } from 'mongoose';

const globalForMongo = globalThis as unknown as {
  __cadenceMongoPromise?: Promise<typeof mongoose>;
};

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set.');
  }
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (!globalForMongo.__cadenceMongoPromise) {
    globalForMongo.__cadenceMongoPromise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      })
      .catch((err) => {
        globalForMongo.__cadenceMongoPromise = undefined;
        throw err;
      });
  }
  return globalForMongo.__cadenceMongoPromise;
}

const UserSchema = new Schema(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    skillLevel: { type: String, default: 'beginner' },
    primaryRole: { type: String, default: 'Full-Stack Builder' },
    timezone: { type: String, default: 'UTC' },
    xp: { type: Number, default: 0, index: true },
    tier: { type: String, default: 'Apprentice' },
    streakDays: { type: Number, default: 0 },
    lastStreakDate: { type: String, default: null },
    onboardingCompleted: { type: Boolean, default: false },
    defaultToolSlugs: { type: [String], default: ['vscode', 'google-ai-studio'] },
    portfolioUrl: { type: String, default: '' },
    businessSiteUrl: { type: String, default: '' },
    createdAt: { type: String, required: true },
    profile: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const RefreshTokenSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: String, required: true },
    revokedAt: { type: String, default: null },
  },
  { _id: false }
);

const ExtensionTokenSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    source: { type: String, required: true },
    label: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    tokenPrefix: { type: String, required: true },
    lastUsedAt: { type: String, default: null },
    revokedAt: { type: String, default: null },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const PairingCodeSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    source: { type: String, required: true },
    expiresAt: { type: String, required: true },
    usedAt: { type: String, default: null },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    clientName: { type: String, default: '' },
    industry: { type: String, default: 'Software' },
    languages: { type: [String], default: [] },
    stack: { type: [String], default: [] },
    links: {
      repo: { type: String, default: '' },
      live: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    isPublicPortfolio: { type: Boolean, default: false },
    portfolioPublishedAt: { type: String, default: null },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const PortfolioSiteSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    siteType: { type: String, required: true },
    label: { type: String, required: true },
    siteUrl: { type: String, required: true },
    webhookUrl: { type: String, default: '' },
    webhookSecret: { type: String, required: true },
    autoPublishOnDeploy: { type: Boolean, default: false },
    lastSyncAt: { type: String, default: null },
    lastSyncStatus: { type: String, default: null },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const ToolSchema = new Schema(
  {
    _id: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    categories: { type: [String], default: [] },
    launchProtocol: { type: String, default: '' },
    domainPattern: { type: String, default: '' },
    trackingLayer: { type: String, default: 'manual' },
    description: { type: String, default: '' },
    docsUrl: { type: String, default: '' },
    pricingTier: { type: String, default: null },
    isSeeded: { type: Boolean, default: false },
    createdBy: { type: String, default: null },
  },
  { _id: false }
);

const SessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    mode: { type: String, required: true },
    status: { type: String, required: true, index: true },
    plannedMinutes: { type: Number, required: true },
    startedAt: { type: String, required: true },
    endedAt: { type: String, default: null },
    lastHeartbeat: { type: String, required: true, index: true },
    currentDevice: { type: String, default: 'web' },
    activeCheckpointId: { type: String, default: null },
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    whatILearned: { type: String, default: '' },
    improvementAreas: { type: [String], default: [] },
    checkpoints: { type: [Schema.Types.Mixed], default: [] },
    pauses: { type: [Schema.Types.Mixed], default: [] },
    deviceEvents: { type: [Schema.Types.Mixed], default: [] },
    activitySlices: { type: [Schema.Types.Mixed], default: [] },
    xpAwarded: { type: Number, default: 0 },
    estimateAccuracy: { type: Number, default: 0 },
    focusRatio: { type: Number, default: 1 },
    activeMinutes: { type: Number, default: 0 },
    pausedMinutes: { type: Number, default: 0 },
    overrunMinutes: { type: Number, default: 0 },
  },
  { _id: false }
);

SessionSchema.index({ status: 1, lastHeartbeat: 1 });

const DocumentSchema = new Schema(
  {
    _id: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    fileName: { type: String, required: true },
    rawText: { type: String, required: true },
    summaryCard: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const AchievementSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    badgeKey: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    awardedAt: { type: String, required: true },
    sessionId: { type: String, default: null },
  },
  { _id: false }
);

AchievementSchema.index({ userId: 1, badgeKey: 1 }, { unique: true });

const LearningPathSchema = new Schema(
  {
    _id: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    track: { type: String, required: true, index: true },
    level: { type: String, required: true, index: true },
    languages: { type: [String], default: [] },
    freeOnly: { type: Boolean, default: true },
    estimatedHours: { type: Number, required: true },
    sourceName: { type: String, required: true },
    summary: { type: String, required: true },
    steps: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const LearningResourceSchema = new Schema(
  {
    _id: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    provider: { type: String, required: true },
    url: { type: String, required: true },
    tracks: { type: [String], default: [] },
    level: { type: String, required: true, index: true },
    languages: { type: [String], default: [] },
    contentLanguages: { type: [String], default: ['en'] },
    pricingTier: { type: String, default: null },
    embeddable: { type: String, default: 'unknown' },
    format: { type: String, default: 'docs' },
    estimatedMinutes: { type: Number, default: null },
    summary: { type: String, default: '' },
  },
  { _id: false }
);

const ResourceProgressSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    resourceSlug: { type: String, required: true },
    status: { type: String, default: 'saved' },
    completedSteps: { type: [String], default: [] },
    notes: { type: String, default: '' },
    linkedSessionId: { type: String, default: null },
    lastOpenedAt: { type: String, default: null },
    updatedAt: { type: String, required: true },
  },
  { _id: false }
);

ResourceProgressSchema.index({ userId: 1, resourceSlug: 1 }, { unique: true });

const PracticeDrillSchema = new Schema(
  {
    _id: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    track: { type: String, required: true, index: true },
    level: { type: String, required: true, index: true },
    mode: { type: String, required: true, index: true },
    languages: { type: [String], default: [] },
    estimatedMinutes: { type: Number, required: true },
    summary: { type: String, default: '' },
    deliverable: { type: String, default: '' },
    resourceSlug: { type: String, required: true },
    sandboxUrl: { type: String, default: '' },
    steps: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const ApplicationTrackerSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    status: { type: String, default: 'saved' },
    url: { type: String, default: '' },
    notes: { type: String, default: '' },
    appliedAt: { type: String, default: null },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false }
);

const RateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true },
    resetAt: { type: String, required: true },
    expiresAtDate: { type: Date, required: true, index: { expires: 0 } },
  },
  { _id: false }
);

function getOrCompile<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

export const UserModel = getOrCompile('User', UserSchema);
export const RefreshTokenModel = getOrCompile('RefreshToken', RefreshTokenSchema);
export const ExtensionTokenModel = getOrCompile('ExtensionToken', ExtensionTokenSchema);
export const PairingCodeModel = getOrCompile('PairingCode', PairingCodeSchema);
export const ProjectModel = getOrCompile('Project', ProjectSchema);
export const PortfolioSiteModel = getOrCompile('PortfolioSite', PortfolioSiteSchema);
export const ToolModel = getOrCompile('Tool', ToolSchema);
export const SessionModel = getOrCompile('Session', SessionSchema);
export const DocumentModel = getOrCompile('Document', DocumentSchema);
export const AchievementModel = getOrCompile('Achievement', AchievementSchema);
export const LearningPathModel = getOrCompile('LearningPath', LearningPathSchema);
export const LearningResourceModel = getOrCompile('LearningResource', LearningResourceSchema);
export const ResourceProgressModel = getOrCompile('ResourceProgress', ResourceProgressSchema);
export const PracticeDrillModel = getOrCompile('PracticeDrill', PracticeDrillSchema);
export const ApplicationTrackerModel = getOrCompile('ApplicationTracker', ApplicationTrackerSchema);
export const RateLimitModel = getOrCompile('RateLimit', RateLimitSchema);

