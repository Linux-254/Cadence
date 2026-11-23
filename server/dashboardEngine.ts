import type {
  ApplicationTrackerRecord,
  DashboardLens,
  DashboardPayload,
  LearningPathRecord,
  PortfolioSiteRecord,
  ProjectRecord,
  ResourceProgressRecord,
  SessionRecord,
  TrackId,
  UserProfile,
} from '../src/types/cadence.ts';
import { TAXONOMY_INTENTS, TAXONOMY_LEVELS } from './seed/taxonomy.ts';

export const LENS_WIDGET_REGISTRY: Record<
  DashboardLens,
  { left: string[]; center: string[]; right: string[] }
> = {
  learner: {
    left: ['TodayPlan', 'NextLesson', 'WeeklyGoalRing'],
    center: ['LiveSessionBanner', 'PathProgress', 'SkillLadder'],
    right: ['StreakXP', 'ResourceTray', 'ReflectionPrompt'],
  },
  student: {
    left: ['TodayPlan', 'AssignmentDeadlines', 'WeeklyGoalRing'],
    center: ['LiveSessionBanner', 'NextLesson', 'PathProgress', 'PortfolioReadiness'],
    right: ['StreakXP', 'CohortBoard'],
  },
  job_seeker: {
    left: ['TodayPlan', 'CVStatus', 'SkillGapRadar'],
    center: ['LiveSessionBanner', 'ApplicationTracker', 'InterviewPracticeQueue', 'PortfolioReadiness'],
    right: ['StreakXP'],
  },
  freelancer: {
    left: ['TodayPlan', 'DeadlineRadar', 'ToolSplit'],
    center: ['LiveSessionBanner', 'ClientHours', 'ProjectHealth', 'InvoiceReadyLogs'],
    right: ['FocusTrend'],
  },
  employed: {
    left: ['TodayPlan', 'WeeklyGoalRing', 'ToolSplit'],
    center: ['LiveSessionBanner', 'FocusTrend', 'SkillGrowth', 'SideProject'],
    right: ['StreakXP'],
  },
  founder: {
    left: ['TodayPlan', 'MilestoneBoard', 'ToolSplit'],
    center: ['LiveSessionBanner', 'ShipLog', 'ProjectHealth', 'FocusTrend'],
    right: ['PortfolioSyncStatus'],
  },
};

export const TRACK_EXTRA_WIDGETS: Partial<Record<TrackId, string[]>> = {
  cybersecurity: ['VulnerabilityRoomLog', 'ChallengeStreak'],
  data_analytics: ['QueryDatasetHours', 'NotebookSessions'],
  ai_engineering: ['PromptExperimentLog', 'ModelToolSplit'],
  frontend: ['BuildShipFeed', 'ResponsiveCoverage'],
  ui_ux_design: ['FigmaVsCodeRatio', 'ComponentDeliveryCount'],
  devops_cloud: ['DeployCheckpointRate', 'InfraToolSplit'],
  qa_testing: ['TestCoverageHours', 'BugReproSessions'],
};

export function buildDashboardPayload(params: {
  user: UserProfile;
  lens: DashboardLens;
  activeSession: SessionRecord | null;
  sessions: SessionRecord[];
  projects: Array<ProjectRecord & { sessionsCount: number; totalMinutes: number }>;
  applications: ApplicationTrackerRecord[];
  learningPaths: LearningPathRecord[];
  portfolioSites: PortfolioSiteRecord[];
  resourceProgressList?: ResourceProgressRecord[];
  engine: 'mongodb' | 'sqlite_preview';
}): DashboardPayload {
  const {
    user,
    lens,
    activeSession,
    sessions,
    projects,
    applications,
    learningPaths,
    portfolioSites,
    resourceProgressList = [],
    engine,
  } = params;

  const profile = user.profile;
  const primaryTrack: TrackId = profile.tracks[0] || 'fullstack';
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86_400_000;
  const closedSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'lapsed');
  const recentWeekSessions = closedSessions.filter((s) => new Date(s.startedAt).getTime() >= sevenDaysAgo);
  const weekMinutes = recentWeekSessions.reduce((sum, s) => sum + (s.activeMinutes || 0), 0);
  const activeDaysSet = new Set(recentWeekSessions.map((s) => s.startedAt.slice(0, 10)));

  // Tool & Category breakdowns from real session history
  const toolCounts: Record<string, number> = {};
  const categoryMinutes: Record<string, number> = {};
  let completedDeployments = 0;
  let totalDeployments = 0;
  let accuracySum = 0;
  let accuracyCount = 0;

  for (const s of closedSessions) {
    if (s.status === 'completed' && s.estimateAccuracy > 0) {
      accuracySum += s.estimateAccuracy;
      accuracyCount++;
    }
    for (const slice of s.activitySlices || []) {
      toolCounts[slice.toolSlug] = (toolCounts[slice.toolSlug] || 0) + 1;
    }
    for (const cp of s.checkpoints || []) {
      const mins = cp.actualMinutes > 0 ? cp.actualMinutes : cp.status === 'completed' ? cp.plannedMinutes : 0;
      categoryMinutes[cp.category] = (categoryMinutes[cp.category] || 0) + mins;
      if (cp.category === 'deployment') {
        totalDeployments++;
        if (cp.status === 'completed') completedDeployments++;
      }
    }
  }

  const levelDef = TAXONOMY_LEVELS.find((l) => l.id === profile.level) || TAXONOMY_LEVELS[0];
  const recommendedPath =
    learningPaths.find((p) => p.slug === profile.selectedPathSlug) ||
    learningPaths.find((p) => p.track === primaryTrack && p.level === profile.level) ||
    learningPaths.find((p) => p.track === primaryTrack) ||
    learningPaths[0] ||
    null;

  const clientProjects = projects.filter((p) => p.type === 'business');
  const sideProjects = projects.filter((p) => p.type === 'personal');
  const learningProjects = projects.filter((p) => p.type === 'learning');
  const publishedProjects = projects.filter((p) => p.isPublicPortfolio);

  const clientMinutes = closedSessions
    .filter((s) => s.mode === 'business')
    .reduce((sum, s) => sum + (s.activeMinutes || 0), 0);

  const learningSessions = closedSessions.filter((s) => s.mode === 'learning');
  const latestReflection = closedSessions.find((s) => s.whatILearned?.trim()) || null;

  const avgAccuracy = accuracyCount > 0 ? Math.round((accuracySum / accuracyCount) * 100) : null;
  const recentFocusTrend = closedSessions.slice(0, 7).reverse().map((s) => ({
    id: s.id,
    date: s.startedAt.slice(0, 10),
    title: s.title || s.projectName || 'Session',
    activeMinutes: s.activeMinutes,
    focusPct: Math.round((s.focusRatio ?? 1) * 100),
    accuracyPct: s.estimateAccuracy ? Math.round(s.estimateAccuracy * 100) : null,
  }));

  const trackExtras = TRACK_EXTRA_WIDGETS[primaryTrack] || [];

  const widgets: Record<string, unknown> = {
    LiveSessionBanner: activeSession
      ? {
          hasActive: true,
          id: activeSession.id,
          status: activeSession.status,
          projectName: activeSession.projectName || 'Active project',
          activeMinutes: activeSession.activeMinutes,
          plannedMinutes: activeSession.plannedMinutes,
          currentDevice: activeSession.currentDevice,
        }
      : {
          hasActive: false,
          suggestedMinutes: levelDef.sessionDefaults.blockMinutes,
          primaryTrack,
        },
    TodayPlan: {
      blockMinutes: levelDef.sessionDefaults.blockMinutes,
      checkpointMix: levelDef.sessionDefaults.checkpointMix,
      defaultTools: user.defaultToolSlugs.slice(0, 5),
      hasProjects: projects.length > 0,
      firstProject: projects[0] ? { id: projects[0].id, name: projects[0].name, type: projects[0].type } : null,
      emptyAction: 'Plan one focused block for today to start recording calibrated checkpoints.',
    },
    NextLesson: (() => {
      if (!recommendedPath) {
        return {
          pathSlug: null,
          pathTitle: null,
          emptyAction: 'Pick a starter path from Learn to queue your next structured lesson.',
        };
      }
      const pathProgress = resourceProgressList.find((r) => r.resourceSlug === `path:${recommendedPath.slug}`);
      const doneSet = new Set(pathProgress?.completedSteps || []);
      const nextIdx = recommendedPath.steps.findIndex((_, i) => !doneSet.has(String(i)));
      const nextStep = nextIdx >= 0 ? recommendedPath.steps[nextIdx] : recommendedPath.steps[0] || null;
      return {
        pathSlug: recommendedPath.slug,
        pathTitle: recommendedPath.title,
        sourceName: recommendedPath.sourceName,
        nextStep,
        estimatedHours: recommendedPath.estimatedHours,
        completedSteps: doneSet.size,
        stepsCount: recommendedPath.steps.length,
      };
    })(),
    PathProgress: (() => {
      if (!recommendedPath) {
        return { emptyAction: 'Select a learning path to track module completion.' };
      }
      const pathProgress = resourceProgressList.find((r) => r.resourceSlug === `path:${recommendedPath.slug}`);
      const doneSet = new Set(pathProgress?.completedSteps || []);
      return {
        pathSlug: recommendedPath.slug,
        pathTitle: recommendedPath.title,
        track: recommendedPath.track,
        level: recommendedPath.level,
        stepsCount: recommendedPath.steps.length,
        completedSteps: Math.min(recommendedPath.steps.length, doneSet.size),
        steps: recommendedPath.steps.map((s, idx) => ({
          ...s,
          completed: doneSet.has(String(idx)),
        })),
      };
    })(),
    StreakXP: {
      xp: user.xp,
      tier: user.tier,
      streakDays: user.streakDays,
      totalSessions: closedSessions.length,
      avgAccuracy,
    },
    ResourceTray: {
      openMode: profile.resourceOpenMode,
      tools: user.defaultToolSlugs.slice(0, 6),
      languages: profile.programmingLanguages,
      freeOnly: profile.freeOnly,
    },
    SkillLadder: {
      currentLevel: profile.level,
      tier: user.tier,
      xp: user.xp,
      steps: TAXONOMY_LEVELS.map((l) => ({
        id: l.id,
        label: l.label,
        active: l.id === profile.level,
      })),
    },
    WeeklyGoalRing: {
      completedMinutes: weekMinutes,
      goalMinutes: profile.weeklyGoal.minutes,
      activeDays: activeDaysSet.size,
      goalDays: profile.weeklyGoal.days,
    },
    ReflectionPrompt: latestReflection
      ? {
          hasEntry: true,
          lastTakeaway: latestReflection.whatILearned,
          sessionTitle: latestReflection.title,
          date: latestReflection.endedAt || latestReflection.startedAt,
        }
      : {
          hasEntry: false,
          emptyAction: 'End a learning session to record your first takeaway note.',
        },
    CohortBoard: {
      configured: false,
      emptyAction: 'Join or create a study group in Rankings to compare weekly consistency.',
    },
    AssignmentDeadlines: {
      items: learningProjects.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        sessionsCount: p.sessionsCount,
        totalMinutes: p.totalMinutes,
      })),
      emptyAction: 'Add a learning project for coursework or bootcamp labs to track deadlines.',
    },
    PortfolioReadiness: {
      totalProjects: projects.length,
      publishedCount: publishedProjects.length,
      sitesConnected: portfolioSites.length,
      items: projects.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        hasRepo: Boolean(p.links?.repo),
        hasLive: Boolean(p.links?.live),
        isPublic: p.isPublicPortfolio,
        hours: Number((p.totalMinutes / 60).toFixed(1)),
      })),
      emptyAction: 'Add a project with repository and live links to verify portfolio readiness.',
    },
    CVStatus: {
      verifiedProjects: projects.filter((p) => p.links?.repo || p.links?.live).length,
      totalTrackedHours: Number((closedSessions.reduce((s, x) => s + x.activeMinutes, 0) / 60).toFixed(1)),
      topLanguages: profile.programmingLanguages.slice(0, 5),
      portfolioUrl: user.portfolioUrl || null,
      emptyAction: 'Add your portfolio URL in Settings and link at least one shipped repository.',
    },
    ApplicationTracker: {
      applications: applications.slice(0, 12),
      counts: {
        saved: applications.filter((a) => a.status === 'saved').length,
        applied: applications.filter((a) => a.status === 'applied').length,
        interview: applications.filter((a) => a.status === 'interview').length,
        offer: applications.filter((a) => a.status === 'offer').length,
      },
      emptyAction: 'Log your first job or internship application below to keep follow-ups visible.',
    },
    InterviewPracticeQueue: {
      recentPractice: learningSessions.slice(0, 4).map((s) => ({
        id: s.id,
        title: s.title || 'Practice session',
        minutes: s.activeMinutes,
      })),
      emptyAction: 'Schedule a 45-minute practice session to log technical prep blocks.',
    },
    SkillGapRadar: {
      categoryMinutes,
      targetTrack: primaryTrack,
      selectedLanguages: profile.programmingLanguages,
      emptyAction: 'Complete sessions across multiple checkpoint categories to map time balance.',
    },
    ClientHours: {
      weekClientMinutes: closedSessions
        .filter((s) => s.mode === 'business' && new Date(s.startedAt).getTime() >= sevenDaysAgo)
        .reduce((sum, s) => sum + s.activeMinutes, 0),
      totalClientMinutes: clientMinutes,
      clientProjectCount: clientProjects.length,
      emptyAction: 'Create a Business project with a client name to separate billable hours.',
    },
    DeadlineRadar: {
      projects: clientProjects.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        clientName: p.clientName || 'Client',
        totalMinutes: p.totalMinutes,
        sessionsCount: p.sessionsCount,
      })),
      emptyAction: 'Add client deliverables under Projects to monitor scope hours here.',
    },
    ProjectHealth: {
      projects: projects.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        hours: Number((p.totalMinutes / 60).toFixed(1)),
        sessionsCount: p.sessionsCount,
      })),
      emptyAction: 'Create your first project to monitor logged hours and session momentum.',
    },
    InvoiceReadyLogs: {
      logs: closedSessions
        .filter((s) => s.mode === 'business')
        .slice(0, 6)
        .map((s) => ({
          id: s.id,
          title: s.title || 'Client work block',
          date: s.startedAt.slice(0, 10),
          activeMinutes: s.activeMinutes,
          projectName: s.projectName || 'Client project',
        })),
      emptyAction: 'Complete a Business-mode session to generate timestamped billable logs.',
    },
    ToolSplit: {
      tools: Object.entries(toolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([slug, count]) => ({ slug, count })),
      emptyAction: 'Record activity slices from VS Code, Chrome, or Focus View to view tool split.',
    },
    FocusTrend: {
      points: recentFocusTrend,
      avgAccuracy,
      emptyAction: 'Finish two or more sessions to compare focus ratio and estimate accuracy.',
    },
    SkillGrowth: {
      weekMinutes,
      learningMinutes: learningSessions.reduce((sum, s) => sum + s.activeMinutes, 0),
      categoryMinutes,
      emptyAction: 'Log one dedicated learning block this week to track skill growth alongside work.',
    },
    SideProject: {
      projects: sideProjects.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        hours: Number((p.totalMinutes / 60).toFixed(1)),
        sessionsCount: p.sessionsCount,
      })),
      emptyAction: 'Start a Personal project to separate side builds from day-job sprints.',
    },
    ShipLog: {
      entries: closedSessions.slice(0, 6).map((s) => ({
        id: s.id,
        title: s.title || 'Completed sprint',
        summary: s.summary,
        date: (s.endedAt || s.startedAt).slice(0, 10),
        minutes: s.activeMinutes,
      })),
      emptyAction: 'Ship and close a session to append your first entry to the public build log.',
    },
    MilestoneBoard: {
      projects: projects.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        sessionsCount: p.sessionsCount,
        totalMinutes: p.totalMinutes,
      })),
      emptyAction: 'Add your first product project to organize build milestones.',
    },
    PortfolioSyncStatus: {
      sitesCount: portfolioSites.length,
      publishedCount: publishedProjects.length,
      publicFeedPath: `/api/public/portfolio/${user.username}`,
      sites: portfolioSites.slice(0, 3).map((s) => ({
        id: s.id,
        label: s.label,
        lastSyncStatus: s.lastSyncStatus,
        lastSyncAt: s.lastSyncAt,
      })),
      emptyAction: 'Connect a portfolio or showcase site in Portfolio Sync to auto-publish logs.',
    },
    // Track extras (computed honestly from real data, zero invented claims)
    VulnerabilityRoomLog: {
      minutes: categoryMinutes.security || 0,
      rooms: learningSessions.slice(0, 4).map((s) => ({ id: s.id, title: s.title || 'Security lab', minutes: s.activeMinutes })),
      emptyAction: 'Complete a security checkpoint session to log lab rooms and findings.',
    },
    ChallengeStreak: {
      streakDays: user.streakDays,
      goalDays: profile.weeklyGoal.days,
      activeDaysThisWeek: activeDaysSet.size,
    },
    QueryDatasetHours: {
      minutes: categoryMinutes.data || 0,
      emptyAction: 'Run a session with a Data & SQL checkpoint to track dataset hours.',
    },
    NotebookSessions: {
      count: toolCounts['jupyter'] || toolCounts['google-colab'] || 0,
      emptyAction: 'Log work with Jupyter or Google Colab attached to track notebook runs.',
    },
    PromptExperimentLog: {
      minutes: categoryMinutes.ai || 0,
      emptyAction: 'Track an AI engineering checkpoint to log prompt and eval experiments.',
    },
    ModelToolSplit: {
      aiSlices: Object.entries(toolCounts).filter(([slug]) =>
        ['google-ai-studio', 'claude', 'chatgpt', 'hugging-face', 'gemini-api', 'cursor'].includes(slug)
      ),
      emptyAction: 'Attach AI tools to a session to measure time split across models.',
    },
    BuildShipFeed: {
      items: closedSessions.slice(0, 4).map((s) => ({ id: s.id, title: s.title || 'Frontend build', minutes: s.activeMinutes })),
      emptyAction: 'Ship a UI session to populate your build feed.',
    },
    ResponsiveCoverage: {
      testingMinutes: categoryMinutes.testing || 0,
      emptyAction: 'Log testing checkpoints to track viewport and accessibility checks.',
    },
    FigmaVsCodeRatio: {
      designMinutes: categoryMinutes.design || 0,
      devMinutes: categoryMinutes.dev || 0,
    },
    ComponentDeliveryCount: {
      completedCheckpoints: closedSessions.reduce(
        (sum, s) => sum + s.checkpoints.filter((c) => c.status === 'completed').length,
        0
      ),
    },
    DeployCheckpointRate: {
      completed: completedDeployments,
      total: totalDeployments,
    },
    InfraToolSplit: {
      cloudMinutes: (categoryMinutes.cloud || 0) + (categoryMinutes.deployment || 0),
    },
    TestCoverageHours: {
      testingMinutes: categoryMinutes.testing || 0,
    },
    BugReproSessions: {
      reviewMinutes: categoryMinutes.review || 0,
    },
  };

  return {
    lens,
    availableLenses: TAXONOMY_INTENTS.map((i) => ({ id: i.id, label: i.label })),
    primaryTrack,
    layout: LENS_WIDGET_REGISTRY[lens] || LENS_WIDGET_REGISTRY.learner,
    trackExtras,
    kpiLine: {
      xp: user.xp,
      tier: user.tier,
      streakDays: user.streakDays,
      weekMinutes,
      weeklyGoalMinutes: profile.weeklyGoal.minutes,
      totalSessions: closedSessions.length,
    },
    widgets,
    meta: {
      engine,
      demoBanner: engine === 'sqlite_preview',
      showProfileUpdatePrompt: Boolean(profile.migratedV13 && !profile.dismissedProfilePrompt),
    },
  };
}
