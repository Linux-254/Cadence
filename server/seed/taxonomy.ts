import crypto from 'node:crypto';
import type {
  IntentId,
  LearningPathRecord,
  SkillLevel,
  SkillLevelV13,
  TaxonomyContentLanguage,
  TaxonomyIntent,
  TaxonomyLanguageCode,
  TaxonomyLevel,
  TaxonomyPayload,
  TaxonomyTrack,
  ToolCategory,
  ToolPricingTier,
  TrackId,
  TrackPreset,
  UserProfileV13,
} from '../../src/types/cadence.ts';
import { clampLapseGraceMin, LAPSE_GRACE_MIN } from '../config.ts';

export interface SeedToolDef {
  slug: string;
  name: string;
  categories: ToolCategory[];
  launchProtocol: string;
  domainPattern: string;
  trackingLayer: 'ide_ext' | 'chrome_ext' | 'manual';
  description: string;
  docsUrl: string;
  pricingTier: ToolPricingTier;
}

export const ALL_TOOL_CATEGORIES: { id: ToolCategory; label: string }[] = [
  { id: 'dev', label: 'Development' },
  { id: 'design', label: 'Design' },
  { id: 'research', label: 'Research' },
  { id: 'review', label: 'Code Review' },
  { id: 'testing', label: 'Testing & QA' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'clientele', label: 'Client Ops' },
  { id: 'learning', label: 'Learning' },
  { id: 'security', label: 'Security' },
  { id: 'data', label: 'Data & SQL' },
  { id: 'ai', label: 'AI Tooling' },
  { id: 'cloud', label: 'Cloud & DevOps' },
  { id: 'mobile', label: 'Mobile' },
];

export const TAXONOMY_TRACKS: TaxonomyTrack[] = [
  {
    id: 'frontend',
    label: 'Frontend web',
    description: 'Accessible interfaces, TypeScript components, styling systems, and state.',
    aliases: ['frontend'],
    defaultProjectType: 'personal',
  },
  {
    id: 'backend',
    label: 'Backend & APIs',
    description: 'REST/GraphQL services, schemas, auth, caching, and background jobs.',
    aliases: ['backend'],
    defaultProjectType: 'personal',
  },
  {
    id: 'fullstack',
    label: 'Full-stack web',
    description: 'End-to-end delivery across frontend, server routes, database, and deploy.',
    aliases: ['fullstack', 'full-stack'],
    defaultProjectType: 'personal',
  },
  {
    id: 'mobile',
    label: 'Mobile apps',
    description: 'iOS, Android, React Native, and Flutter interfaces.',
    aliases: ['mobile'],
    defaultProjectType: 'personal',
  },
  {
    id: 'ai_engineering',
    label: 'AI engineering',
    description: 'LLM APIs, structured prompts, retrieval workflows, and eval harnesses.',
    aliases: ['ai', 'ai_engineering'],
    defaultProjectType: 'personal',
  },
  {
    id: 'data_analytics',
    label: 'Data & analytics',
    description: 'SQL queries, notebooks, warehouse models, and reporting dashboards.',
    aliases: ['data', 'data_analytics'],
    defaultProjectType: 'learning',
  },
  {
    id: 'devops_cloud',
    label: 'DevOps & cloud',
    description: 'Containers, pipelines, cloud infrastructure, and observability.',
    aliases: ['devops', 'cloud', 'devops_cloud'],
    defaultProjectType: 'business',
  },
  {
    id: 'cybersecurity',
    label: 'Cybersecurity',
    description: 'AppSec, OWASP testing, network labs, and defensive reviews.',
    aliases: ['security', 'cybersecurity'],
    defaultProjectType: 'learning',
  },
  {
    id: 'ui_ux_design',
    label: 'UI/UX & design systems',
    description: 'Wireframes, visual systems, tokens, prototypes, and design handoff.',
    aliases: ['design', 'design_eng', 'ui_ux_design'],
    defaultProjectType: 'business',
  },
  {
    id: 'game_dev',
    label: 'Game & interactive dev',
    description: '2D/3D engines, frame loops, shaders, and interactive physics.',
    aliases: ['game', 'game_dev'],
    defaultProjectType: 'personal',
  },
  {
    id: 'qa_testing',
    label: 'QA & test engineering',
    description: 'End-to-end suites, API contracts, regressions, and release gates.',
    aliases: ['qa', 'qa_testing'],
    defaultProjectType: 'business',
  },
  {
    id: 'product_management',
    label: 'Technical product',
    description: 'Specs, sprint triage, user research, and milestone tracking.',
    aliases: ['pm', 'product_management'],
    defaultProjectType: 'business',
  },
];

const TRACK_ALIAS_MAP = new Map<string, TrackId>();
for (const t of TAXONOMY_TRACKS) {
  TRACK_ALIAS_MAP.set(t.id, t.id);
  for (const a of t.aliases) TRACK_ALIAS_MAP.set(a.toLowerCase(), t.id);
}

export function normalizeTrackId(raw: unknown): TrackId | null {
  if (typeof raw !== 'string') return null;
  return TRACK_ALIAS_MAP.get(raw.trim().toLowerCase()) || null;
}

export const TAXONOMY_LEVELS: TaxonomyLevel[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Learning syntax, core concepts, and guided builds with smaller time blocks.',
    sessionDefaults: {
      blockMinutes: 45,
      checkpointMix: [
        { category: 'learning', ratio: 0.45 },
        { category: 'dev', ratio: 0.4 },
        { category: 'review', ratio: 0.15 },
      ],
      hints: true,
      pauseMaxMinutes: 15,
    },
    weeklyGoal: { days: 4, minutes: 180 },
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Building features independently, writing tests, and debugging full stacks.',
    sessionDefaults: {
      blockMinutes: 90,
      checkpointMix: [
        { category: 'research', ratio: 0.15 },
        { category: 'dev', ratio: 0.55 },
        { category: 'testing', ratio: 0.2 },
        { category: 'review', ratio: 0.1 },
      ],
      hints: true,
      pauseMaxMinutes: 20,
    },
    weeklyGoal: { days: 5, minutes: 360 },
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Shipping production architecture, security reviews, and client deliverables.',
    sessionDefaults: {
      blockMinutes: 120,
      checkpointMix: [
        { category: 'design', ratio: 0.15 },
        { category: 'dev', ratio: 0.5 },
        { category: 'testing', ratio: 0.2 },
        { category: 'deployment', ratio: 0.15 },
      ],
      hints: false,
      pauseMaxMinutes: 30,
    },
    weeklyGoal: { days: 5, minutes: 600 },
  },
];

export const TAXONOMY_INTENTS: TaxonomyIntent[] = [
  { id: 'learner', label: 'Self-taught learner', description: 'Follow guided paths, practice daily, and track growth.' },
  { id: 'student', label: 'Student / Bootcamp', description: 'Organize cohort work, coursework deadlines, and projects.' },
  { id: 'job_seeker', label: 'Job seeker', description: 'Polish portfolio work, track applications, and prep interviews.' },
  { id: 'freelancer', label: 'Freelancer / Agency', description: 'Log client hours, manage deadlines, and prepare invoices.' },
  { id: 'employed', label: 'Working engineer', description: 'Protect deep work blocks and sharpen adjacent skills.' },
  { id: 'founder', label: 'Indie builder / Founder', description: 'Ship product milestones, devlogs, and public launches.' },
];

export const TAXONOMY_LANGUAGE_CODES: TaxonomyLanguageCode[] = [
  { code: 'ts', label: 'TypeScript', tracks: ['frontend', 'backend', 'fullstack', 'mobile', 'qa_testing'] },
  { code: 'js', label: 'JavaScript', tracks: ['frontend', 'backend', 'fullstack', 'qa_testing'] },
  { code: 'py', label: 'Python', tracks: ['backend', 'ai_engineering', 'data_analytics', 'cybersecurity', 'qa_testing'] },
  { code: 'sql', label: 'SQL', tracks: ['backend', 'fullstack', 'data_analytics', 'product_management'] },
  { code: 'sh', label: 'Shell / Bash', tracks: ['devops_cloud', 'cybersecurity', 'backend'] },
  { code: 'html_css', label: 'HTML & CSS', tracks: ['frontend', 'fullstack', 'ui_ux_design'] },
  { code: 'go', label: 'Go', tracks: ['backend', 'devops_cloud', 'cybersecurity'] },
  { code: 'rs', label: 'Rust', tracks: ['backend', 'cybersecurity', 'game_dev'] },
  { code: 'java', label: 'Java', tracks: ['backend', 'mobile', 'qa_testing'] },
  { code: 'cs', label: 'C#', tracks: ['backend', 'game_dev'] },
  { code: 'cpp', label: 'C++', tracks: ['game_dev', 'cybersecurity'] },
  { code: 'php', label: 'PHP', tracks: ['backend', 'fullstack'] },
  { code: 'rb', label: 'Ruby', tracks: ['backend', 'fullstack'] },
  { code: 'swift', label: 'Swift', tracks: ['mobile'] },
  { code: 'kt', label: 'Kotlin', tracks: ['mobile', 'backend'] },
  { code: 'dart', label: 'Dart', tracks: ['mobile'] },
  { code: 'yaml', label: 'YAML / HCL', tracks: ['devops_cloud'] },
  { code: 'r', label: 'R', tracks: ['data_analytics'] },
  { code: 'sol', label: 'Solidity', tracks: ['backend', 'cybersecurity'] },
];

export const TAXONOMY_CONTENT_LANGUAGES: TaxonomyContentLanguage[] = [
  { code: 'en', label: 'English', coverageNote: 'Full resource coverage' },
  { code: 'es', label: 'Spanish', coverageNote: 'Growing coverage; English fallback included' },
  { code: 'fr', label: 'French', coverageNote: 'Limited curated coverage; English fallback included' },
  { code: 'pt', label: 'Portuguese', coverageNote: 'Growing coverage; English fallback included' },
  { code: 'sw', label: 'Swahili', coverageNote: 'Limited coverage; English fallback included' },
  { code: 'ar', label: 'Arabic', coverageNote: 'Limited coverage; English fallback included' },
  { code: 'hi', label: 'Hindi', coverageNote: 'Limited coverage; English fallback included' },
  { code: 'de', label: 'German', coverageNote: 'Limited coverage; English fallback included' },
];

export const TRACK_PRESETS: Record<TrackId, TrackPreset> = {
  frontend: {
    tools: ['vscode', 'figma', 'github', 'playwright'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['ts', 'js', 'html_css'],
    defaultCheckpoints: [
      { category: 'design', title: 'Layout & responsive tokens', ratio: 0.2 },
      { category: 'dev', title: 'Component & state implementation', ratio: 0.55 },
      { category: 'testing', title: 'Accessibility & viewport check', ratio: 0.25 },
    ],
  },
  backend: {
    tools: ['vscode', 'postgresql', 'postman', 'github'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['ts', 'py', 'sql', 'go'],
    defaultCheckpoints: [
      { category: 'research', title: 'Schema & API contract design', ratio: 0.2 },
      { category: 'dev', title: 'Route & storage handlers', ratio: 0.55 },
      { category: 'testing', title: 'Contract & error-path tests', ratio: 0.25 },
    ],
  },
  fullstack: {
    tools: ['vscode', 'github', 'mongodb', 'vercel'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['ts', 'sql', 'html_css'],
    defaultCheckpoints: [
      { category: 'design', title: 'Data flow & interface sketch', ratio: 0.15 },
      { category: 'dev', title: 'Full-stack slice implementation', ratio: 0.55 },
      { category: 'testing', title: 'Integration & deploy smoke test', ratio: 0.3 },
    ],
  },
  mobile: {
    tools: ['vscode', 'expo', 'flutter', 'android-studio'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['ts', 'dart', 'kt', 'swift'],
    defaultCheckpoints: [
      { category: 'design', title: 'Mobile viewport & gesture layout', ratio: 0.2 },
      { category: 'mobile', title: 'Screen navigation & local state', ratio: 0.55 },
      { category: 'testing', title: 'Simulator & offline check', ratio: 0.25 },
    ],
  },
  ai_engineering: {
    tools: ['vscode', 'google-ai-studio', 'gemini-api', 'hugging-face'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['py', 'ts', 'sql'],
    defaultCheckpoints: [
      { category: 'research', title: 'Prompt schema & eval criteria', ratio: 0.25 },
      { category: 'ai', title: 'SDK pipeline & tool calls', ratio: 0.5 },
      { category: 'testing', title: 'Output verification & edge cases', ratio: 0.25 },
    ],
  },
  data_analytics: {
    tools: ['jupyter', 'postgresql', 'kaggle', 'looker-studio'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['sql', 'py', 'r'],
    defaultCheckpoints: [
      { category: 'data', title: 'Query cleanup & feature prep', ratio: 0.35 },
      { category: 'research', title: 'Exploration & metric validation', ratio: 0.45 },
      { category: 'review', title: 'Chart clarity & findings note', ratio: 0.2 },
    ],
  },
  devops_cloud: {
    tools: ['terminal-cli', 'docker', 'github-actions', 'grafana'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['sh', 'yaml', 'py', 'go'],
    defaultCheckpoints: [
      { category: 'cloud', title: 'Container & environment config', ratio: 0.3 },
      { category: 'deployment', title: 'Pipeline automation & rollout', ratio: 0.45 },
      { category: 'testing', title: 'Health check & rollback test', ratio: 0.25 },
    ],
  },
  cybersecurity: {
    tools: ['tryhackme', 'burp-suite', 'owasp-zap', 'terminal-cli'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['py', 'sh'],
    defaultCheckpoints: [
      { category: 'learning', title: 'Threat model & room brief', ratio: 0.25 },
      { category: 'security', title: 'Lab enumeration & verification', ratio: 0.55 },
      { category: 'review', title: 'Remediation notes & write-up', ratio: 0.2 },
    ],
  },
  ui_ux_design: {
    tools: ['figma', 'stitch', 'canva', 'vscode'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['html_css', 'ts'],
    defaultCheckpoints: [
      { category: 'research', title: 'User flow & hierarchy audit', ratio: 0.25 },
      { category: 'design', title: 'Component frames & tokens', ratio: 0.55 },
      { category: 'review', title: 'Contrast & keyboard review', ratio: 0.2 },
    ],
  },
  game_dev: {
    tools: ['vscode', 'github', 'figma', 'terminal-cli'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['cs', 'cpp', 'rs', 'ts'],
    defaultCheckpoints: [
      { category: 'design', title: 'Mechanic loop & state sketch', ratio: 0.2 },
      { category: 'dev', title: 'Physics, input & render pass', ratio: 0.6 },
      { category: 'testing', title: 'Frame pacing & playtest fix', ratio: 0.2 },
    ],
  },
  qa_testing: {
    tools: ['playwright', 'postman', 'cypress', 'jest'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['ts', 'js', 'py'],
    defaultCheckpoints: [
      { category: 'research', title: 'Test matrix & failure modes', ratio: 0.25 },
      { category: 'testing', title: 'Automated E2E & API assertions', ratio: 0.55 },
      { category: 'review', title: 'Flake check & bug report log', ratio: 0.2 },
    ],
  },
  product_management: {
    tools: ['notion', 'linear', 'figma', 'looker-studio'],
    aiBonusTools: ['claude', 'google-ai-studio', 'cursor'],
    languages: ['sql'],
    defaultCheckpoints: [
      { category: 'research', title: 'User signal & metric review', ratio: 0.35 },
      { category: 'clientele', title: 'Spec writing & acceptance scope', ratio: 0.45 },
      { category: 'review', title: 'Roadmap sync & next sprint', ratio: 0.2 },
    ],
  },
};

export const SEED_TOOLS_V13: SeedToolDef[] = [
  {
    slug: 'vscode',
    name: 'VS Code',
    categories: ['dev', 'review', 'testing'],
    launchProtocol: 'vscode://',
    domainPattern: '',
    trackingLayer: 'ide_ext',
    description: 'Extensible desktop code editor with integrated terminal, debugging, and Git workflows.',
    docsUrl: 'https://code.visualstudio.com/docs',
    pricingTier: 'free',
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    categories: ['dev', 'review', 'ai'],
    launchProtocol: 'cursor://',
    domainPattern: '',
    trackingLayer: 'ide_ext',
    description: 'AI-assisted code editor supporting multi-file diffs and project indexing.',
    docsUrl: 'https://docs.cursor.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'windsurf',
    name: 'Windsurf',
    categories: ['dev', 'review', 'ai'],
    launchProtocol: 'windsurf://',
    domainPattern: '',
    trackingLayer: 'ide_ext',
    description: 'Editor with multi-step workspace context for coding sessions.',
    docsUrl: 'https://docs.windsurf.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'antigravity',
    name: 'Antigravity',
    categories: ['dev', 'design', 'review', 'ai'],
    launchProtocol: 'antigravity://',
    domainPattern: '',
    trackingLayer: 'ide_ext',
    description: 'Workspace editor designed for structured planning, edits, and verification.',
    docsUrl: 'https://antigravity.google',
    pricingTier: null,
  },
  {
    slug: 'google-ai-studio',
    name: 'Google AI Studio',
    categories: ['dev', 'research', 'design', 'ai'],
    launchProtocol: 'https://aistudio.google.com',
    domainPattern: 'aistudio.google.com',
    trackingLayer: 'chrome_ext',
    description: 'Prompt prototyping and Gemini model workbench.',
    docsUrl: 'https://ai.google.dev/docs',
    pricingTier: 'freemium',
  },
  {
    slug: 'claude',
    name: 'Claude',
    categories: ['research', 'dev', 'review', 'ai'],
    launchProtocol: 'https://claude.ai',
    domainPattern: 'claude.ai',
    trackingLayer: 'chrome_ext',
    description: 'Assistant for architecture reviews, code comprehension, and specs.',
    docsUrl: 'https://docs.anthropic.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'chatgpt',
    name: 'ChatGPT',
    categories: ['research', 'dev', 'review', 'ai'],
    launchProtocol: 'https://chatgpt.com',
    domainPattern: 'chatgpt.com',
    trackingLayer: 'chrome_ext',
    description: 'General coding, debugging, and technical research workspace.',
    docsUrl: 'https://platform.openai.com/docs',
    pricingTier: 'freemium',
  },
  {
    slug: 'stitch',
    name: 'Stitch',
    categories: ['design', 'dev'],
    launchProtocol: 'https://stitch.withgoogle.com',
    domainPattern: 'stitch.withgoogle.com',
    trackingLayer: 'chrome_ext',
    description: 'Interface design generator exporting structured layout markup.',
    docsUrl: 'https://stitch.withgoogle.com',
    pricingTier: null,
  },
  {
    slug: 'lovable',
    name: 'Lovable',
    categories: ['dev', 'design', 'ai'],
    launchProtocol: 'https://lovable.dev',
    domainPattern: 'lovable.dev',
    trackingLayer: 'chrome_ext',
    description: 'Web application prototyping environment.',
    docsUrl: 'https://docs.lovable.dev',
    pricingTier: 'freemium',
  },
  {
    slug: 'manus',
    name: 'Manus',
    categories: ['research', 'dev', 'clientele', 'ai'],
    launchProtocol: 'https://manus.im',
    domainPattern: 'manus.im',
    trackingLayer: 'chrome_ext',
    description: 'Task execution workspace for research synthesis and deliverables.',
    docsUrl: 'https://manus.im',
    pricingTier: null,
  },
  {
    slug: 'figma',
    name: 'Figma',
    categories: ['design', 'review', 'clientele'],
    launchProtocol: 'https://figma.com',
    domainPattern: 'figma.com',
    trackingLayer: 'chrome_ext',
    description: 'Collaborative UI design, design tokens, and developer handoff.',
    docsUrl: 'https://help.figma.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'canva',
    name: 'Canva',
    categories: ['design', 'clientele'],
    launchProtocol: 'https://www.canva.com',
    domainPattern: 'canva.com',
    trackingLayer: 'chrome_ext',
    description: 'Presentation decks, visual assets, and social preview graphics.',
    docsUrl: 'https://www.canva.com/help',
    pricingTier: 'freemium',
  },
  {
    slug: 'playwright',
    name: 'Playwright',
    categories: ['testing'],
    launchProtocol: 'https://playwright.dev',
    domainPattern: 'playwright.dev',
    trackingLayer: 'manual',
    description: 'Cross-browser end-to-end automated verification framework.',
    docsUrl: 'https://playwright.dev/docs/intro',
    pricingTier: 'free',
  },
  {
    slug: 'cypress',
    name: 'Cypress',
    categories: ['testing'],
    launchProtocol: 'https://docs.cypress.io',
    domainPattern: 'cypress.io',
    trackingLayer: 'manual',
    description: 'Frontend component and end-to-end browser test runner.',
    docsUrl: 'https://docs.cypress.io',
    pricingTier: 'freemium',
  },
  {
    slug: 'jest',
    name: 'Jest',
    categories: ['testing', 'dev'],
    launchProtocol: 'https://jestjs.io',
    domainPattern: 'jestjs.io',
    trackingLayer: 'manual',
    description: 'JavaScript and TypeScript unit and integration test framework.',
    docsUrl: 'https://jestjs.io/docs/getting-started',
    pricingTier: 'free',
  },
  {
    slug: 'selenium',
    name: 'Selenium',
    categories: ['testing'],
    launchProtocol: 'https://www.selenium.dev/documentation/',
    domainPattern: 'selenium.dev',
    trackingLayer: 'manual',
    description: 'WebDriver browser automation across languages.',
    docsUrl: 'https://www.selenium.dev/documentation/',
    pricingTier: 'free',
  },
  {
    slug: 'postman',
    name: 'Postman',
    categories: ['testing', 'dev'],
    launchProtocol: 'https://web.postman.co',
    domainPattern: 'postman.co',
    trackingLayer: 'chrome_ext',
    description: 'API request collections, environment variables, and contract tests.',
    docsUrl: 'https://learning.postman.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'vercel',
    name: 'Vercel',
    categories: ['deployment', 'cloud', 'testing'],
    launchProtocol: 'https://vercel.com',
    domainPattern: 'vercel.com',
    trackingLayer: 'chrome_ext',
    description: 'Web hosting with preview branches, serverless functions, and logs.',
    docsUrl: 'https://vercel.com/docs',
    pricingTier: 'freemium',
  },
  {
    slug: 'github',
    name: 'GitHub',
    categories: ['dev', 'review', 'deployment'],
    launchProtocol: 'https://github.com',
    domainPattern: 'github.com',
    trackingLayer: 'chrome_ext',
    description: 'Git hosting, pull requests, issues, and CI workflows.',
    docsUrl: 'https://docs.github.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'github-actions',
    name: 'GitHub Actions',
    categories: ['deployment', 'cloud', 'testing'],
    launchProtocol: 'https://docs.github.com/actions',
    domainPattern: 'github.com',
    trackingLayer: 'chrome_ext',
    description: 'CI/CD pipelines triggered by repository pushes and pull requests.',
    docsUrl: 'https://docs.github.com/actions',
    pricingTier: 'freemium',
  },
  {
    slug: 'linear',
    name: 'Linear',
    categories: ['clientele', 'review'],
    launchProtocol: 'https://linear.app',
    domainPattern: 'linear.app',
    trackingLayer: 'chrome_ext',
    description: 'Issue tracking, sprint planning, and project milestones.',
    docsUrl: 'https://linear.app/docs',
    pricingTier: 'freemium',
  },
  {
    slug: 'notion',
    name: 'Notion',
    categories: ['research', 'clientele', 'learning'],
    launchProtocol: 'https://notion.so',
    domainPattern: 'notion.so',
    trackingLayer: 'chrome_ext',
    description: 'Technical specs, study notes, and client briefs.',
    docsUrl: 'https://www.notion.so/help',
    pricingTier: 'freemium',
  },
  {
    slug: 'tryhackme',
    name: 'TryHackMe',
    categories: ['security', 'learning'],
    launchProtocol: 'https://tryhackme.com',
    domainPattern: 'tryhackme.com',
    trackingLayer: 'chrome_ext',
    description: 'Guided browser labs for defensive and offensive cybersecurity.',
    docsUrl: 'https://tryhackme.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'hack-the-box',
    name: 'Hack The Box',
    categories: ['security', 'learning'],
    launchProtocol: 'https://www.hackthebox.com',
    domainPattern: 'hackthebox.com',
    trackingLayer: 'chrome_ext',
    description: 'Hands-on penetration testing machines and defensive challenges.',
    docsUrl: 'https://help.hackthebox.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'portswigger',
    name: 'PortSwigger Academy',
    categories: ['security', 'learning'],
    launchProtocol: 'https://portswigger.net/web-security',
    domainPattern: 'portswigger.net',
    trackingLayer: 'chrome_ext',
    description: 'Free web application security labs and vulnerability guides.',
    docsUrl: 'https://portswigger.net/web-security',
    pricingTier: 'free',
  },
  {
    slug: 'burp-suite',
    name: 'Burp Suite',
    categories: ['security', 'testing'],
    launchProtocol: '',
    domainPattern: '',
    trackingLayer: 'manual',
    description: 'HTTP intercepting proxy and web security scanner.',
    docsUrl: 'https://portswigger.net/burp/documentation',
    pricingTier: 'freemium',
  },
  {
    slug: 'owasp-zap',
    name: 'OWASP ZAP',
    categories: ['security', 'testing'],
    launchProtocol: 'https://www.zaproxy.org/docs/',
    domainPattern: 'zaproxy.org',
    trackingLayer: 'manual',
    description: 'Open-source web application security scanner.',
    docsUrl: 'https://www.zaproxy.org/docs/',
    pricingTier: 'free',
  },
  {
    slug: 'terminal-cli',
    name: 'Terminal / CLI',
    categories: ['dev', 'security', 'cloud'],
    launchProtocol: '',
    domainPattern: '',
    trackingLayer: 'manual',
    description: 'Shell environment, SSH, package runners, and system utilities.',
    docsUrl: 'https://www.gnu.org/software/bash/manual/',
    pricingTier: 'free',
  },
  {
    slug: 'docker',
    name: 'Docker',
    categories: ['cloud', 'deployment', 'dev'],
    launchProtocol: 'https://docs.docker.com',
    domainPattern: 'docker.com',
    trackingLayer: 'manual',
    description: 'Container images and reproducible local service stacks.',
    docsUrl: 'https://docs.docker.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'kubernetes',
    name: 'Kubernetes',
    categories: ['cloud', 'deployment'],
    launchProtocol: 'https://kubernetes.io/docs/home/',
    domainPattern: 'kubernetes.io',
    trackingLayer: 'manual',
    description: 'Container orchestration for multi-service workloads.',
    docsUrl: 'https://kubernetes.io/docs/home/',
    pricingTier: 'free',
  },
  {
    slug: 'grafana',
    name: 'Grafana',
    categories: ['cloud', 'data', 'deployment'],
    launchProtocol: 'https://grafana.com/docs/',
    domainPattern: 'grafana.com',
    trackingLayer: 'chrome_ext',
    description: 'Metrics dashboards, logs, and alerting.',
    docsUrl: 'https://grafana.com/docs/',
    pricingTier: 'freemium',
  },
  {
    slug: 'aws',
    name: 'AWS Console',
    categories: ['cloud', 'deployment'],
    launchProtocol: 'https://console.aws.amazon.com',
    domainPattern: 'aws.amazon.com',
    trackingLayer: 'chrome_ext',
    description: 'Cloud compute, object storage, and managed databases.',
    docsUrl: 'https://docs.aws.amazon.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'google-cloud',
    name: 'Google Cloud',
    categories: ['cloud', 'deployment', 'data'],
    launchProtocol: 'https://console.cloud.google.com',
    domainPattern: 'cloud.google.com',
    trackingLayer: 'chrome_ext',
    description: 'Cloud Run, BigQuery, Cloud SQL, and IAM management.',
    docsUrl: 'https://cloud.google.com/docs',
    pricingTier: 'freemium',
  },
  {
    slug: 'google-colab',
    name: 'Google Colab',
    categories: ['data', 'ai', 'learning'],
    launchProtocol: 'https://colab.research.google.com',
    domainPattern: 'colab.research.google.com',
    trackingLayer: 'chrome_ext',
    description: 'Hosted Python notebooks for data analysis and ML experiments.',
    docsUrl: 'https://colab.research.google.com',
    pricingTier: 'freemium',
  },
  {
    slug: 'kaggle',
    name: 'Kaggle',
    categories: ['data', 'ai', 'learning'],
    launchProtocol: 'https://www.kaggle.com',
    domainPattern: 'kaggle.com',
    trackingLayer: 'chrome_ext',
    description: 'Public datasets, notebooks, and free data science courses.',
    docsUrl: 'https://www.kaggle.com/docs',
    pricingTier: 'free',
  },
  {
    slug: 'jupyter',
    name: 'Jupyter',
    categories: ['data', 'ai', 'dev'],
    launchProtocol: 'https://docs.jupyter.org',
    domainPattern: 'jupyter.org',
    trackingLayer: 'manual',
    description: 'Interactive notebooks for Python, SQL, and visualization.',
    docsUrl: 'https://docs.jupyter.org',
    pricingTier: 'free',
  },
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    categories: ['data', 'dev'],
    launchProtocol: 'https://www.postgresql.org/docs/',
    domainPattern: 'postgresql.org',
    trackingLayer: 'manual',
    description: 'Relational SQL database for transactional and analytical workloads.',
    docsUrl: 'https://www.postgresql.org/docs/',
    pricingTier: 'free',
  },
  {
    slug: 'mongodb',
    name: 'MongoDB Atlas',
    categories: ['data', 'dev', 'cloud'],
    launchProtocol: 'https://cloud.mongodb.com',
    domainPattern: 'mongodb.com',
    trackingLayer: 'chrome_ext',
    description: 'Document database with flexible schemas and aggregation pipelines.',
    docsUrl: 'https://www.mongodb.com/docs/',
    pricingTier: 'freemium',
  },
  {
    slug: 'bigquery',
    name: 'BigQuery',
    categories: ['data', 'cloud'],
    launchProtocol: 'https://console.cloud.google.com/bigquery',
    domainPattern: 'cloud.google.com',
    trackingLayer: 'chrome_ext',
    description: 'Serverless SQL analytics warehouse.',
    docsUrl: 'https://cloud.google.com/bigquery/docs',
    pricingTier: 'freemium',
  },
  {
    slug: 'looker-studio',
    name: 'Looker Studio',
    categories: ['data', 'clientele'],
    launchProtocol: 'https://lookerstudio.google.com',
    domainPattern: 'lookerstudio.google.com',
    trackingLayer: 'chrome_ext',
    description: 'Free browser reporting and dashboard builder.',
    docsUrl: 'https://support.google.com/looker-studio',
    pricingTier: 'free',
  },
  {
    slug: 'hugging-face',
    name: 'Hugging Face',
    categories: ['ai', 'data', 'learning'],
    launchProtocol: 'https://huggingface.co',
    domainPattern: 'huggingface.co',
    trackingLayer: 'chrome_ext',
    description: 'Open models, datasets, Spaces demos, and NLP courses.',
    docsUrl: 'https://huggingface.co/docs',
    pricingTier: 'freemium',
  },
  {
    slug: 'gemini-api',
    name: 'Gemini API',
    categories: ['ai', 'dev'],
    launchProtocol: 'https://ai.google.dev',
    domainPattern: 'ai.google.dev',
    trackingLayer: 'chrome_ext',
    description: 'Google GenAI SDK for structured text, vision, and tool calling.',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    pricingTier: 'freemium',
  },
  {
    slug: 'notebooklm',
    name: 'NotebookLM',
    categories: ['research', 'learning', 'ai'],
    launchProtocol: 'https://notebooklm.google.com',
    domainPattern: 'notebooklm.google.com',
    trackingLayer: 'chrome_ext',
    description: 'Source-grounded research notebook for synthesis and study briefs.',
    docsUrl: 'https://support.google.com/notebooklm',
    pricingTier: 'free',
  },
  {
    slug: 'android-studio',
    name: 'Android Studio',
    categories: ['mobile', 'dev'],
    launchProtocol: '',
    domainPattern: '',
    trackingLayer: 'manual',
    description: 'Official IDE and emulator for Kotlin and Android builds.',
    docsUrl: 'https://developer.android.com/docs',
    pricingTier: 'free',
  },
  {
    slug: 'xcode',
    name: 'Xcode',
    categories: ['mobile', 'dev'],
    launchProtocol: '',
    domainPattern: '',
    trackingLayer: 'manual',
    description: 'macOS IDE for Swift and iOS simulators.',
    docsUrl: 'https://developer.apple.com/documentation/xcode',
    pricingTier: 'free',
  },
  {
    slug: 'flutter',
    name: 'Flutter',
    categories: ['mobile', 'dev', 'design'],
    launchProtocol: 'https://docs.flutter.dev',
    domainPattern: 'flutter.dev',
    trackingLayer: 'manual',
    description: 'Cross-platform UI toolkit for mobile, web, and desktop.',
    docsUrl: 'https://docs.flutter.dev',
    pricingTier: 'free',
  },
  {
    slug: 'expo',
    name: 'Expo',
    categories: ['mobile', 'dev', 'deployment'],
    launchProtocol: 'https://docs.expo.dev',
    domainPattern: 'expo.dev',
    trackingLayer: 'chrome_ext',
    description: 'React Native workflow for builds, previews, and OTA updates.',
    docsUrl: 'https://docs.expo.dev',
    pricingTier: 'freemium',
  },
];

export const SEED_LEARNING_PATHS: LearningPathRecord[] = [
  {
    id: 'path_security_starter',
    slug: 'security-starter',
    title: 'Security starter',
    track: 'cybersecurity',
    level: 'beginner',
    languages: ['py', 'sh'],
    freeOnly: true,
    estimatedHours: 18,
    sourceName: 'PortSwigger Academy & TryHackMe',
    summary: 'HTTP fundamentals, Linux shell safety, and beginner web vulnerability labs.',
    steps: [
      { title: 'Linux shell navigation & permissions', category: 'learning', plannedMinutes: 45, resourceSlug: 'linux-journey' },
      { title: 'HTTP proxy basics with OWASP ZAP', category: 'security', plannedMinutes: 45, resourceSlug: 'portswigger-academy' },
      { title: 'Intro offensive & defensive rooms', category: 'security', plannedMinutes: 60, resourceSlug: 'tryhackme-free' },
      { title: 'Automate recon checks with Python', category: 'dev', plannedMinutes: 45, resourceSlug: 'python-docs' },
    ],
  },
  {
    id: 'path_security_web_appsec',
    slug: 'web-appsec-intermediate',
    title: 'Web AppSec & OWASP testing',
    track: 'cybersecurity',
    level: 'intermediate',
    languages: ['py', 'sh', 'js'],
    freeOnly: true,
    estimatedHours: 24,
    sourceName: 'PortSwigger Academy',
    summary: 'Authentication flaws, SSRF, injection testing, and remediation verification.',
    steps: [
      { title: 'Intercepting requests in Burp Suite', category: 'security', plannedMinutes: 60, resourceSlug: 'portswigger-academy' },
      { title: 'Auth & session flaw verification', category: 'testing', plannedMinutes: 60, resourceSlug: 'owasp-cheatsheets' },
      { title: 'Write exploit PoC scripts in Python', category: 'dev', plannedMinutes: 45, resourceSlug: 'python-docs' },
    ],
  },
  {
    id: 'path_frontend_foundations',
    slug: 'frontend-foundations',
    title: 'Frontend web foundations',
    track: 'frontend',
    level: 'beginner',
    languages: ['html_css', 'js', 'ts'],
    freeOnly: true,
    estimatedHours: 20,
    sourceName: 'freeCodeCamp & MDN',
    summary: 'Semantic HTML, modern CSS grid, DOM accessibility, and TypeScript basics.',
    steps: [
      { title: 'Semantic structure & keyboard focus', category: 'learning', plannedMinutes: 45, resourceSlug: 'mdn-web-docs' },
      { title: 'Responsive grid & layout challenge', category: 'design', plannedMinutes: 45, resourceSlug: 'freecodecamp-web' },
      { title: 'TypeScript state interactions', category: 'dev', plannedMinutes: 60, resourceSlug: 'typescript-handbook' },
    ],
  },
  {
    id: 'path_frontend_react_systems',
    slug: 'frontend-react-systems',
    title: 'React architecture & accessibility',
    track: 'frontend',
    level: 'intermediate',
    languages: ['ts', 'js', 'html_css'],
    freeOnly: true,
    estimatedHours: 28,
    sourceName: 'React Docs & Full Stack Open',
    summary: 'Component composition, ARIA patterns, performance profiling, and Playwright checks.',
    steps: [
      { title: 'State lifting & custom hooks', category: 'dev', plannedMinutes: 60, resourceSlug: 'react-docs' },
      { title: 'End-to-end tests with Playwright', category: 'testing', plannedMinutes: 45, resourceSlug: 'playwright-docs' },
    ],
  },
  {
    id: 'path_backend_api_craft',
    slug: 'backend-api-craft',
    title: 'Backend APIs & persistence',
    track: 'backend',
    level: 'beginner',
    languages: ['ts', 'js', 'sql'],
    freeOnly: true,
    estimatedHours: 22,
    sourceName: 'The Odin Project & PostgreSQL',
    summary: 'HTTP routing, Zod input validation, SQL relations, and auth cookies.',
    steps: [
      { title: 'Express route validation with Zod', category: 'dev', plannedMinutes: 45, resourceSlug: 'express-guide' },
      { title: 'Relational modeling in SQL', category: 'data', plannedMinutes: 45, resourceSlug: 'postgres-tutorial' },
    ],
  },
  {
    id: 'path_backend_distributed',
    slug: 'backend-reliable-systems',
    title: 'Reliable APIs, queues & auth',
    track: 'backend',
    level: 'advanced',
    languages: ['go', 'ts', 'sql'],
    freeOnly: true,
    estimatedHours: 32,
    sourceName: 'Go Docs & System Design Primer',
    summary: 'Rate limiting, idempotency keys, connection pooling, and telemetry.',
    steps: [
      { title: 'Rate limit & idempotency design', category: 'design', plannedMinutes: 60, resourceSlug: 'system-design-primer' },
      { title: 'Load testing & contract suite', category: 'testing', plannedMinutes: 60, resourceSlug: 'postman-learning' },
    ],
  },
  {
    id: 'path_fullstack_mern',
    slug: 'fullstack-typescript-web',
    title: 'Full-stack TypeScript & deployment',
    track: 'fullstack',
    level: 'beginner',
    languages: ['ts', 'sql', 'html_css'],
    freeOnly: true,
    estimatedHours: 26,
    sourceName: 'Full Stack Open',
    summary: 'Build a typed SPA backed by REST endpoints, dual database storage, and live preview.',
    steps: [
      { title: 'Data schema & API contract', category: 'learning', plannedMinutes: 45, resourceSlug: 'fullstackopen' },
      { title: 'Connect React form to Express API', category: 'dev', plannedMinutes: 60, resourceSlug: 'react-docs' },
      { title: 'Verify production build & deploy', category: 'deployment', plannedMinutes: 30, resourceSlug: 'vercel-docs' },
    ],
  },
  {
    id: 'path_fullstack_production',
    slug: 'fullstack-production-ship',
    title: 'Production full-stack shipping',
    track: 'fullstack',
    level: 'intermediate',
    languages: ['ts', 'sql'],
    freeOnly: true,
    estimatedHours: 30,
    sourceName: 'Full Stack Open',
    summary: 'JWT rotation, rate limits, webhook signing, and CI checks before release.',
    steps: [
      { title: 'Auth rotation & CSRF guard', category: 'security', plannedMinutes: 60, resourceSlug: 'owasp-cheatsheets' },
      { title: 'Automated build & smoke run', category: 'testing', plannedMinutes: 45, resourceSlug: 'playwright-docs' },
    ],
  },
  {
    id: 'path_mobile_starter',
    slug: 'mobile-cross-platform',
    title: 'Cross-platform mobile starter',
    track: 'mobile',
    level: 'beginner',
    languages: ['ts', 'dart'],
    freeOnly: true,
    estimatedHours: 20,
    sourceName: 'Expo & Flutter Docs',
    summary: 'Navigation stacks, offline storage, and 44px touch ergonomics.',
    steps: [
      { title: 'Expo router & touch target layout', category: 'mobile', plannedMinutes: 45, resourceSlug: 'expo-docs' },
      { title: 'Offline state persistence test', category: 'testing', plannedMinutes: 45, resourceSlug: 'flutter-docs' },
    ],
  },
  {
    id: 'path_mobile_native',
    slug: 'mobile-native-performance',
    title: 'Native device features & release',
    track: 'mobile',
    level: 'intermediate',
    languages: ['kt', 'swift', 'dart'],
    freeOnly: true,
    estimatedHours: 25,
    sourceName: 'Android Developers & Apple Docs',
    summary: 'Notifications, background sync, and store build pipelines.',
    steps: [
      { title: 'Background tasks & permissions', category: 'mobile', plannedMinutes: 60, resourceSlug: 'android-docs' },
      { title: 'Simulator profiling & release check', category: 'testing', plannedMinutes: 45, resourceSlug: 'expo-docs' },
    ],
  },
  {
    id: 'path_ai_starter',
    slug: 'ai-engineering-starter',
    title: 'Applied AI engineering starter',
    track: 'ai_engineering',
    level: 'beginner',
    languages: ['py', 'ts'],
    freeOnly: true,
    estimatedHours: 16,
    sourceName: 'Google AI Studio & DeepLearning.AI',
    summary: 'Structured JSON outputs, prompt versioning, and ground-truth evaluations.',
    steps: [
      { title: 'Schema-constrained Gemini API calls', category: 'ai', plannedMinutes: 45, resourceSlug: 'gemini-api-docs' },
      { title: 'Build a lightweight eval set', category: 'testing', plannedMinutes: 45, resourceSlug: 'huggingface-course' },
    ],
  },
  {
    id: 'path_ai_rag_evals',
    slug: 'ai-rag-and-evals',
    title: 'RAG pipelines & agent evaluation',
    track: 'ai_engineering',
    level: 'intermediate',
    languages: ['py', 'ts', 'sql'],
    freeOnly: true,
    estimatedHours: 24,
    sourceName: 'Hugging Face & Gemini Docs',
    summary: 'Chunking strategies, hybrid search, citation verification, and latency budgets.',
    steps: [
      { title: 'Embedding & retrieval benchmark', category: 'ai', plannedMinutes: 60, resourceSlug: 'huggingface-course' },
      { title: 'Automated faithfulness checks', category: 'testing', plannedMinutes: 45, resourceSlug: 'gemini-api-docs' },
    ],
  },
  {
    id: 'path_data_sql_starter',
    slug: 'data-sql-notebooks',
    title: 'SQL & Python data starter',
    track: 'data_analytics',
    level: 'beginner',
    languages: ['sql', 'py'],
    freeOnly: true,
    estimatedHours: 18,
    sourceName: 'Kaggle Learn',
    summary: 'Joins, window functions, pandas cleaning, and clear chart storytelling.',
    steps: [
      { title: 'SQL aggregations & joins practice', category: 'data', plannedMinutes: 45, resourceSlug: 'kaggle-learn' },
      { title: 'Clean dataset in Google Colab', category: 'learning', plannedMinutes: 45, resourceSlug: 'colab-intro' },
    ],
  },
  {
    id: 'path_data_warehouse',
    slug: 'data-modeling-dashboards',
    title: 'Warehouse modeling & BI reporting',
    track: 'data_analytics',
    level: 'intermediate',
    languages: ['sql', 'py', 'r'],
    freeOnly: true,
    estimatedHours: 24,
    sourceName: 'BigQuery & Looker Studio Docs',
    summary: 'Star schemas, incremental transforms, and stakeholder KPI dashboards.',
    steps: [
      { title: 'Partitioned query modeling', category: 'data', plannedMinutes: 60, resourceSlug: 'bigquery-docs' },
      { title: 'Publish verifiable metric view', category: 'review', plannedMinutes: 45, resourceSlug: 'looker-studio' },
    ],
  },
  {
    id: 'path_devops_starter',
    slug: 'devops-containers-ci',
    title: 'Containers & CI/CD starter',
    track: 'devops_cloud',
    level: 'beginner',
    languages: ['sh', 'yaml'],
    freeOnly: true,
    estimatedHours: 18,
    sourceName: 'Docker & GitHub Actions Docs',
    summary: 'Shell scripting, Dockerfiles, environment hygiene, and automated test runs.',
    steps: [
      { title: 'Containerize an Express service', category: 'cloud', plannedMinutes: 45, resourceSlug: 'docker-docs' },
      { title: 'Wire lint & build CI workflow', category: 'deployment', plannedMinutes: 45, resourceSlug: 'github-actions-docs' },
    ],
  },
  {
    id: 'path_devops_observability',
    slug: 'devops-kubernetes-ops',
    title: 'Orchestration, metrics & SLOs',
    track: 'devops_cloud',
    level: 'advanced',
    languages: ['sh', 'yaml', 'go'],
    freeOnly: true,
    estimatedHours: 30,
    sourceName: 'Kubernetes & Grafana Docs',
    summary: 'Readiness probes, rolling deploys, Grafana alerts, and incident drills.',
    steps: [
      { title: 'Health probes & resource limits', category: 'cloud', plannedMinutes: 60, resourceSlug: 'kubernetes-docs' },
      { title: 'Dashboard & alert thresholds', category: 'deployment', plannedMinutes: 60, resourceSlug: 'grafana-docs' },
    ],
  },
  {
    id: 'path_design_systems',
    slug: 'ui-ux-design-systems',
    title: 'UI systems & accessible handoff',
    track: 'ui_ux_design',
    level: 'beginner',
    languages: ['html_css', 'ts'],
    freeOnly: true,
    estimatedHours: 16,
    sourceName: 'Figma Learn & WCAG Quickref',
    summary: 'Type scales, contrast math, token naming, and Figma-to-CSS parity.',
    steps: [
      { title: 'Contrast & type hierarchy audit', category: 'design', plannedMinutes: 45, resourceSlug: 'wcag-quickref' },
      { title: 'Tokenize palette & spacing in Figma', category: 'design', plannedMinutes: 45, resourceSlug: 'figma-learn' },
    ],
  },
  {
    id: 'path_design_eng',
    slug: 'design-engineering-motion',
    title: 'Design engineering & motion',
    track: 'ui_ux_design',
    level: 'intermediate',
    languages: ['html_css', 'ts'],
    freeOnly: true,
    estimatedHours: 22,
    sourceName: 'MDN & Web.dev',
    summary: 'GPU-only transforms, reduced motion fallbacks, and tactile keycap states.',
    steps: [
      { title: 'Reduced-motion & focus verification', category: 'design', plannedMinutes: 60, resourceSlug: 'web-dev-css' },
      { title: 'Component token parity review', category: 'review', plannedMinutes: 45, resourceSlug: 'figma-learn' },
    ],
  },
  {
    id: 'path_game_loop',
    slug: 'game-dev-2d-loops',
    title: '2D game loop & collision starter',
    track: 'game_dev',
    level: 'beginner',
    languages: ['cs', 'ts'],
    freeOnly: true,
    estimatedHours: 20,
    sourceName: 'Godot Docs & MDN Canvas',
    summary: 'Fixed timestep updates, input buffering, tile collisions, and audio hooks.',
    steps: [
      { title: 'Fixed-delta frame loop & input', category: 'dev', plannedMinutes: 60, resourceSlug: 'godot-docs' },
      { title: 'Playtest physics edge cases', category: 'testing', plannedMinutes: 45, resourceSlug: 'mdn-canvas' },
    ],
  },
  {
    id: 'path_qa_automation',
    slug: 'qa-e2e-automation',
    title: 'QA & E2E verification starter',
    track: 'qa_testing',
    level: 'beginner',
    languages: ['ts', 'js', 'py'],
    freeOnly: true,
    estimatedHours: 16,
    sourceName: 'Playwright & Postman Docs',
    summary: 'Reliable selectors, API contract assertions, and CI regression runs.',
    steps: [
      { title: 'Write deterministic Playwright flows', category: 'testing', plannedMinutes: 45, resourceSlug: 'playwright-docs' },
      { title: 'Assert error codes in Postman', category: 'testing', plannedMinutes: 45, resourceSlug: 'postman-learning' },
    ],
  },
  {
    id: 'path_qa_security_contracts',
    slug: 'qa-contracts-and-load',
    title: 'Contract testing & release gates',
    track: 'qa_testing',
    level: 'intermediate',
    languages: ['ts', 'py'],
    freeOnly: true,
    estimatedHours: 22,
    sourceName: 'Cypress & OWASP Docs',
    summary: 'API fuzzing, accessibility assertions, and flaky test quarantine.',
    steps: [
      { title: 'Automated accessibility checks', category: 'testing', plannedMinutes: 60, resourceSlug: 'playwright-docs' },
      { title: 'Auth & rate-limit negative tests', category: 'security', plannedMinutes: 45, resourceSlug: 'owasp-cheatsheets' },
    ],
  },
  {
    id: 'path_pm_technical',
    slug: 'technical-product-specs',
    title: 'Technical product & shipping specs',
    track: 'product_management',
    level: 'beginner',
    languages: ['sql'],
    freeOnly: true,
    estimatedHours: 14,
    sourceName: 'Linear & Notion Guides',
    summary: 'Acceptance criteria, funnel instrumentation in SQL, and scoped milestones.',
    steps: [
      { title: 'Write testable acceptance specs', category: 'clientele', plannedMinutes: 45, resourceSlug: 'linear-method' },
      { title: 'Query cohort retention in SQL', category: 'data', plannedMinutes: 45, resourceSlug: 'kaggle-learn' },
    ],
  },
];

export function getTaxonomyPayload(): TaxonomyPayload {
  return {
    tracks: TAXONOMY_TRACKS,
    levels: TAXONOMY_LEVELS,
    intents: TAXONOMY_INTENTS,
    languageCodes: TAXONOMY_LANGUAGE_CODES,
    contentLanguages: TAXONOMY_CONTENT_LANGUAGES,
    presets: TRACK_PRESETS,
    categories: ALL_TOOL_CATEGORIES,
  };
}

export function deterministicToolId(slug: string): string {
  return `tool_${crypto.createHash('sha1').update(slug).digest('hex').slice(0, 12)}`;
}

export function migrateLegacyUserToV13(
  legacy: {
    skillLevel?: SkillLevel | string;
    primaryRole?: string;
    timezone?: string;
    onboardingCompleted?: boolean;
    defaultToolSlugs?: string[];
    profile?: Partial<UserProfileV13> | null;
  },
  sessionCount: number
): { profile: UserProfileV13; onboardingCompleted: boolean } {
  const existing = legacy.profile && typeof legacy.profile === 'object' ? legacy.profile : null;

  // Map legacy personas and skill levels deterministically
  const roleStr = String(legacy.primaryRole || '').toLowerCase();
  let mappedIntent: IntentId = 'learner';
  if (roleStr.includes('solo_builder') || roleStr.includes('founder') || roleStr.includes('indie')) {
    mappedIntent = 'founder';
  } else if (roleStr.includes('freelanc') || roleStr.includes('agency') || roleStr.includes('client')) {
    mappedIntent = 'freelancer';
  } else if (roleStr.includes('bootcamp') || roleStr.includes('student')) {
    mappedIntent = 'student';
  } else if (roleStr.includes('job')) {
    mappedIntent = 'job_seeker';
  } else if (roleStr.includes('engineer') || roleStr.includes('developer')) {
    mappedIntent = 'employed';
  }

  let mappedLevel: SkillLevelV13 = 'beginner';
  let buildsWithAI = false;
  switch (legacy.skillLevel) {
    case 'vibe_coder':
      mappedLevel = 'beginner';
      buildsWithAI = true;
      break;
    case 'bootcamp':
      mappedLevel = 'beginner';
      break;
    case 'intermediate':
      mappedLevel = 'intermediate';
      break;
    case 'professional':
    case 'advanced':
      mappedLevel = 'advanced';
      break;
    default:
      mappedLevel = 'beginner';
  }

  const levelConfig = TAXONOMY_LEVELS.find((l) => l.id === (existing?.level || mappedLevel)) || TAXONOMY_LEVELS[0];

  const normalizedTracks: TrackId[] = Array.isArray(existing?.tracks) && existing.tracks.length > 0
    ? existing.tracks
        .map((t) => normalizeTrackId(t))
        .filter((t): t is TrackId => Boolean(t))
        .slice(0, 3)
    : ['fullstack'];

  if (normalizedTracks.length === 0) normalizedTracks.push('fullstack');

  const hadMissingLevel = !existing?.level;
  // Rule: onboardingCompleted = false ONLY for users whose profile.level is missing AND who have zero sessions.
  const computedOnboardingCompleted = hadMissingLevel
    ? sessionCount > 0 || Boolean(legacy.onboardingCompleted)
    : Boolean(legacy.onboardingCompleted);

  const intent: IntentId = (existing?.intent as IntentId) || mappedIntent;
  const profile: UserProfileV13 = {
    tracks: normalizedTracks,
    level: (existing?.level as SkillLevelV13) || mappedLevel,
    intent,
    buildsWithAI: existing?.buildsWithAI !== undefined ? Boolean(existing.buildsWithAI) : buildsWithAI,
    programmingLanguages: Array.isArray(existing?.programmingLanguages) && existing.programmingLanguages.length > 0
      ? existing.programmingLanguages.map(String)
      : TRACK_PRESETS[normalizedTracks[0]].languages.slice(0, 3),
    contentLanguages: Array.isArray(existing?.contentLanguages) && existing.contentLanguages.length > 0
      ? existing.contentLanguages.map(String)
      : ['en'],
    freeOnly: existing?.freeOnly !== undefined ? Boolean(existing.freeOnly) : true,
    hasStudentDiscount: Boolean(existing?.hasStudentDiscount),
    country: String(existing?.country || ''),
    weeklyGoal: existing?.weeklyGoal?.days && existing?.weeklyGoal?.minutes
      ? {
          days: Math.max(1, Math.min(7, Number(existing.weeklyGoal.days))),
          minutes: Math.max(30, Number(existing.weeklyGoal.minutes)),
        }
      : { ...levelConfig.weeklyGoal },
    resourceOpenMode: existing?.resourceOpenMode || 'popout',
    dashboardLens: (existing?.dashboardLens as IntentId) || intent,
    resourceWindowPrefs: existing?.resourceWindowPrefs && typeof existing.resourceWindowPrefs === 'object'
      ? existing.resourceWindowPrefs
      : {},
    onboardingStep: typeof existing?.onboardingStep === 'number'
      ? Math.max(1, Math.min(6, existing.onboardingStep))
      : 1,
    dismissedProfilePrompt: Boolean(existing?.dismissedProfilePrompt),
    lapseGraceMin: clampLapseGraceMin(existing?.lapseGraceMin ?? LAPSE_GRACE_MIN),
    selectedPathSlug: existing?.selectedPathSlug ?? null,
    migratedV13: existing?.migratedV13 !== undefined ? Boolean(existing.migratedV13) : Boolean(sessionCount > 0 && hadMissingLevel),
  };

  return { profile, onboardingCompleted: computedOnboardingCompleted };
}
