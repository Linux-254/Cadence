export type SkillLevel = 'beginner' | 'vibe_coder' | 'bootcamp' | 'intermediate' | 'professional';

export type SkillLevelV13 = 'beginner' | 'intermediate' | 'advanced';

export type TrackId =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile'
  | 'ai_engineering'
  | 'data_analytics'
  | 'devops_cloud'
  | 'cybersecurity'
  | 'ui_ux_design'
  | 'game_dev'
  | 'qa_testing'
  | 'product_management';

export type IntentId =
  | 'learner'
  | 'student'
  | 'job_seeker'
  | 'freelancer'
  | 'employed'
  | 'founder';

export type DashboardLens = IntentId;

export type ResourceOpenMode = 'popout' | 'split' | 'embed' | 'tab';

export type ProjectType = 'personal' | 'business' | 'learning';

export type ToolCategory =
  | 'dev'
  | 'design'
  | 'research'
  | 'review'
  | 'testing'
  | 'deployment'
  | 'clientele'
  | 'learning'
  | 'security'
  | 'data'
  | 'ai'
  | 'cloud'
  | 'mobile';

export type SessionStatus =
  | 'planned'
  | 'active'
  | 'paused'
  | 'completed'
  | 'lapsed'
  | 'abandoned';

export type PauseReason =
  | 'break'
  | 'meal'
  | 'blocked'
  | 'distraction'
  | 'client_call'
  | 'other';

export type DeviceKind = 'web' | 'mobile_pwa';

export type TierName = 'Apprentice' | 'Journeyman' | 'Craftsman' | 'Architect' | 'Principal';

export interface WindowPref {
  width: number;
  height: number;
  screenIndex?: number;
}

export interface UserProfileV13 {
  tracks: TrackId[];
  level: SkillLevelV13;
  intent: IntentId;
  buildsWithAI: boolean;
  programmingLanguages: string[];
  contentLanguages: string[];
  freeOnly: boolean;
  hasStudentDiscount: boolean;
  country: string;
  weeklyGoal: {
    days: number;
    minutes: number;
  };
  resourceOpenMode: ResourceOpenMode;
  dashboardLens: DashboardLens;
  resourceWindowPrefs: Record<string, WindowPref>;
  onboardingStep: number;
  dismissedProfilePrompt: boolean;
  lapseGraceMin: number;
  selectedPathSlug: string | null;
  migratedV13: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  skillLevel: SkillLevel;
  primaryRole: string;
  timezone: string;
  xp: number;
  tier: TierName;
  streakDays: number;
  lastStreakDate: string | null;
  onboardingCompleted: boolean;
  defaultToolSlugs: string[];
  portfolioUrl: string;
  businessSiteUrl: string;
  createdAt: string;
  profile: UserProfileV13;
}

export interface ProjectLinks {
  repo: string;
  live: string;
  portfolio: string;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  type: ProjectType;
  clientName: string;
  industry: string;
  languages: string[];
  stack: string[];
  links: ProjectLinks;
  isPublicPortfolio: boolean;
  portfolioPublishedAt: string | null;
  createdAt: string;
}

export type ToolPricingTier = 'free' | 'freemium' | 'paid' | 'student_free' | null;

export interface ToolRecord {
  id: string;
  slug: string;
  name: string;
  categories: ToolCategory[];
  launchProtocol: string;
  domainPattern: string;
  trackingLayer: 'ide_ext' | 'chrome_ext' | 'manual';
  description: string;
  docsUrl: string;
  isSeeded: boolean;
  pricingTier?: ToolPricingTier;
}

export interface CheckpointItem {
  id: string;
  category: ToolCategory;
  title: string;
  toolSlugs: string[];
  plannedMinutes: number;
  actualMinutes: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  notes: string;
}

export interface PauseInterval {
  id: string;
  reason: PauseReason;
  note: string;
  startedAt: string;
  plannedMinutes: number;
  resumedAt: string | null;
  overrunMinutes: number;
}

export interface DeviceEvent {
  fromDevice: DeviceKind;
  toDevice: DeviceKind;
  at: string;
  checkpointId: string | null;
}

export interface ActivitySlice {
  id: string;
  source: 'ide' | 'chrome' | 'manual';
  toolSlug: string;
  language: string;
  projectName: string;
  gitCommitMessage: string;
  ts: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  projectId: string;
  projectName?: string;
  mode: ProjectType;
  status: SessionStatus;
  plannedMinutes: number;
  startedAt: string;
  endedAt: string | null;
  lastHeartbeat: string;
  currentDevice: DeviceKind;
  activeCheckpointId: string | null;
  title: string;
  summary: string;
  whatILearned: string;
  improvementAreas: string[];
  checkpoints: CheckpointItem[];
  pauses: PauseInterval[];
  deviceEvents: DeviceEvent[];
  activitySlices: ActivitySlice[];
  xpAwarded: number;
  estimateAccuracy: number;
  focusRatio: number;
  activeMinutes: number;
  pausedMinutes: number;
  overrunMinutes: number;
}

export interface DocumentSummaryCard {
  headline: string;
  deliverables: string[];
  constraints: string[];
  suggestedCheckpoints: {
    category: ToolCategory;
    title: string;
    plannedMinutes: number;
  }[];
}

export interface ProjectDocumentRecord {
  id: string;
  projectId: string;
  userId: string;
  fileName: string;
  rawText: string;
  summaryCard: DocumentSummaryCard;
  createdAt: string;
}

export interface PortfolioSiteRecord {
  id: string;
  userId: string;
  siteType: 'personal' | 'business';
  label: string;
  siteUrl: string;
  webhookUrl: string;
  autoPublishOnDeploy: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchDiscoveryResult {
  summary: string;
  recommendedTools: {
    name: string;
    slug: string;
    categories: ToolCategory[];
    description: string;
    docsUrl: string;
    domainPattern: string;
  }[];
  suggestedCheckpoints: {
    category: ToolCategory;
    title: string;
    plannedMinutes: number;
    guidance: string;
  }[];
  beginnerTips: string[];
  sources: GroundingSource[];
}

export interface TaxonomyTrack {
  id: TrackId;
  label: string;
  description: string;
  aliases: string[];
  defaultProjectType: ProjectType;
}

export interface TaxonomyLevel {
  id: SkillLevelV13;
  label: string;
  description: string;
  sessionDefaults: {
    blockMinutes: number;
    checkpointMix: { category: ToolCategory; ratio: number }[];
    hints: boolean;
    pauseMaxMinutes: number;
  };
  weeklyGoal: {
    days: number;
    minutes: number;
  };
}

export interface TaxonomyIntent {
  id: IntentId;
  label: string;
  description: string;
}

export interface TaxonomyLanguageCode {
  code: string;
  label: string;
  tracks: TrackId[];
}

export interface TaxonomyContentLanguage {
  code: string;
  label: string;
  coverageNote: string;
}

export interface TrackPreset {
  tools: string[];
  aiBonusTools: string[];
  languages: string[];
  defaultCheckpoints: { category: ToolCategory; title: string; ratio: number }[];
}

export interface TaxonomyPayload {
  tracks: TaxonomyTrack[];
  levels: TaxonomyLevel[];
  intents: TaxonomyIntent[];
  languageCodes: TaxonomyLanguageCode[];
  contentLanguages: TaxonomyContentLanguage[];
  presets: Record<TrackId, TrackPreset>;
  categories: { id: ToolCategory; label: string }[];
}

export interface LearningPathStep {
  title: string;
  category: ToolCategory;
  plannedMinutes: number;
  resourceSlug: string;
}

export interface LearningPathRecord {
  id: string;
  slug: string;
  title: string;
  track: TrackId;
  level: SkillLevelV13;
  languages: string[];
  freeOnly: boolean;
  estimatedHours: number;
  sourceName: string;
  summary: string;
  steps: LearningPathStep[];
}

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface ApplicationTrackerRecord {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  url: string;
  notes: string;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardPayload {
  lens: DashboardLens;
  availableLenses: { id: DashboardLens; label: string }[];
  primaryTrack: TrackId;
  layout: {
    left: string[];
    center: string[];
    right: string[];
  };
  trackExtras: string[];
  kpiLine: {
    xp: number;
    tier: TierName;
    streakDays: number;
    weekMinutes: number;
    weeklyGoalMinutes: number;
    totalSessions: number;
  };
  widgets: Record<string, unknown>;
  meta: {
    engine: 'mongodb' | 'sqlite_preview';
    demoBanner: boolean;
    showProfileUpdatePrompt: boolean;
  };
}

export type ResourcePricingTier = 'free' | 'freemium' | 'paid' | 'student_free' | null;

export type ResourceFormat = 'interactive' | 'docs' | 'video' | 'lab' | 'course';

export type EmbeddableStatus = 'yes' | 'no' | 'unknown';

export type ResourceStatus = 'saved' | 'in_progress' | 'completed';

export interface ResourceProgressRecord {
  id: string;
  userId: string;
  resourceSlug: string;
  status: ResourceStatus;
  completedSteps: string[];
  notes: string;
  linkedSessionId: string | null;
  lastOpenedAt: string | null;
  updatedAt: string;
}

export interface LearningResourceRecord {
  id: string;
  slug: string;
  title: string;
  provider: string;
  url: string;
  tracks: TrackId[];
  level: SkillLevelV13;
  languages: string[];
  contentLanguages: string[];
  pricingTier: ResourcePricingTier;
  embeddable: EmbeddableStatus;
  format: ResourceFormat;
  estimatedMinutes: number | null;
  summary: string;
  progress?: ResourceProgressRecord | null;
}

export interface LearningPathStepResolved extends LearningPathStep {
  index: number;
  completed: boolean;
  resource: LearningResourceRecord | null;
}

export interface LearningPathDetailPayload {
  path: LearningPathRecord;
  steps: LearningPathStepResolved[];
  completedStepIndexes: number[];
}

export type PracticeDrillMode = 'coding' | 'sql' | 'security_lab' | 'architecture' | 'qa_debug';

export interface PracticeDrillStep {
  title: string;
  prompt: string;
  verificationHint: string;
  plannedMinutes: number;
}

export interface PracticeDrillRecord {
  id: string;
  slug: string;
  title: string;
  track: TrackId;
  level: SkillLevelV13;
  mode: PracticeDrillMode;
  languages: string[];
  estimatedMinutes: number;
  summary: string;
  deliverable: string;
  resourceSlug: string;
  sandboxUrl: string;
  steps: PracticeDrillStep[];
  completedStepIndexes?: number[];
  progress?: ResourceProgressRecord | null;
}

export interface PracticeDrillDetailPayload {
  drill: PracticeDrillRecord;
  resource: LearningResourceRecord | null;
  completedStepIndexes: number[];
  progress: ResourceProgressRecord | null;
}

export interface GlobalSearchResultPayload {
  query: string;
  learningPaths: LearningPathRecord[];
  resources: LearningResourceRecord[];
  practiceDrills: PracticeDrillRecord[];
  tools: ToolRecord[];
  projects: ProjectRecord[];
  sessions: SessionRecord[];
}
