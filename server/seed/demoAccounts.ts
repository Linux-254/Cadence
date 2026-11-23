import type { IntentId, SkillLevel, SkillLevelV13, TierName, TrackId } from '../../src/types/cadence';

export interface DemoAccountSeed {
  email: string;
  username: string;
  name: string;
  skillLevel: SkillLevel;
  primaryRole: string;
  timezone: string;
  tier: TierName;
  xp: number;
  streakDays: number;
  intent: IntentId;
  tracks: TrackId[];
  level: SkillLevelV13;
  buildsWithAI: boolean;
  programmingLanguages: string[];
  contentLanguages: string[];
  freeOnly: boolean;
  hasStudentDiscount: boolean;
  country: string;
  sampleProjects: {
    name: string;
    type: 'personal' | 'business' | 'learning';
    clientName: string;
    industry: string;
    languages: string[];
    stack: string[];
  }[];
}

export const DEMO_ACCOUNTS_SEED: DemoAccountSeed[] = [
  {
    email: 'learner@cadence.dev',
    username: 'learner_demo',
    name: 'Alex Learner',
    skillLevel: 'beginner',
    primaryRole: 'Frontend & AI Learner',
    timezone: 'UTC',
    tier: 'Apprentice',
    xp: 450,
    streakDays: 7,
    intent: 'learner',
    tracks: ['frontend', 'ai_engineering'],
    level: 'beginner',
    buildsWithAI: true,
    programmingLanguages: ['TypeScript', 'JavaScript', 'HTML/CSS'],
    contentLanguages: ['English'],
    freeOnly: true,
    hasStudentDiscount: false,
    country: 'US',
    sampleProjects: [
      {
        name: 'React Fundamentals Portfolio',
        type: 'learning',
        clientName: 'Self-Directed',
        industry: 'Education',
        languages: ['TypeScript', 'HTML/CSS'],
        stack: ['React', 'Vite', 'Tailwind CSS'],
      },
      {
        name: 'AI Prompt Engineering Lab',
        type: 'personal',
        clientName: 'Personal Research',
        industry: 'Artificial Intelligence',
        languages: ['TypeScript'],
        stack: ['Gemini API', 'Node.js'],
      },
    ],
  },
  {
    email: 'student@cadence.dev',
    username: 'student_demo',
    name: 'Maya Student',
    skillLevel: 'bootcamp',
    primaryRole: 'Computer Science Student',
    timezone: 'America/New_York',
    tier: 'Journeyman',
    xp: 1280,
    streakDays: 14,
    intent: 'student',
    tracks: ['fullstack', 'backend'],
    level: 'beginner',
    buildsWithAI: true,
    programmingLanguages: ['Python', 'TypeScript', 'SQL'],
    contentLanguages: ['English'],
    freeOnly: true,
    hasStudentDiscount: true,
    country: 'US',
    sampleProjects: [
      {
        name: 'University Capstone Database System',
        type: 'learning',
        clientName: 'University CS Dept',
        industry: 'EdTech',
        languages: ['Python', 'SQL'],
        stack: ['PostgreSQL', 'FastAPI', 'Docker'],
      },
      {
        name: 'Algorithm Visualizer PWA',
        type: 'personal',
        clientName: 'Study Group',
        industry: 'Developer Tools',
        languages: ['TypeScript'],
        stack: ['React', 'Vite'],
      },
    ],
  },
  {
    email: 'jobseeker@cadence.dev',
    username: 'jobseeker_demo',
    name: 'Jordan Jobseeker',
    skillLevel: 'intermediate',
    primaryRole: 'Full-Stack Software Engineer',
    timezone: 'Europe/London',
    tier: 'Craftsman',
    xp: 2950,
    streakDays: 21,
    intent: 'job_seeker',
    tracks: ['fullstack', 'devops_cloud'],
    level: 'intermediate',
    buildsWithAI: true,
    programmingLanguages: ['TypeScript', 'Node.js', 'PostgreSQL'],
    contentLanguages: ['English'],
    freeOnly: false,
    hasStudentDiscount: false,
    country: 'GB',
    sampleProjects: [
      {
        name: 'Enterprise E-Commerce Microservice',
        type: 'personal',
        clientName: 'Portfolio Showcase',
        industry: 'E-Commerce',
        languages: ['TypeScript', 'SQL'],
        stack: ['Node.js', 'Express', 'PostgreSQL', 'Docker'],
      },
      {
        name: 'Automated Resume Tracker & Interview Prep',
        type: 'personal',
        clientName: 'Job Search Campaign',
        industry: 'Career Tech',
        languages: ['TypeScript'],
        stack: ['React', 'Tailwind', 'REST APIs'],
      },
    ],
  },
  {
    email: 'freelancer@cadence.dev',
    username: 'freelancer_demo',
    name: 'Taylor Freelancer',
    skillLevel: 'professional',
    primaryRole: 'Independent Full-Stack Consultant',
    timezone: 'America/Los_Angeles',
    tier: 'Architect',
    xp: 5400,
    streakDays: 35,
    intent: 'freelancer',
    tracks: ['fullstack', 'ui_ux_design'],
    level: 'advanced',
    buildsWithAI: true,
    programmingLanguages: ['TypeScript', 'Python', 'CSS'],
    contentLanguages: ['English'],
    freeOnly: false,
    hasStudentDiscount: false,
    country: 'US',
    sampleProjects: [
      {
        name: 'Client Portal & Invoicing Dashboard',
        type: 'business',
        clientName: 'Acme Corp',
        industry: 'Fintech',
        languages: ['TypeScript'],
        stack: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
      },
      {
        name: 'Brand Design System & Component Library',
        type: 'business',
        clientName: 'Nexus Media',
        industry: 'Digital Agency',
        languages: ['CSS', 'TypeScript'],
        stack: ['Tailwind CSS', 'React', 'Storybook'],
      },
    ],
  },
  {
    email: 'employed@cadence.dev',
    username: 'employed_demo',
    name: 'Sam Engineer',
    skillLevel: 'professional',
    primaryRole: 'Senior Platform Engineer',
    timezone: 'Europe/Berlin',
    tier: 'Architect',
    xp: 7200,
    streakDays: 48,
    intent: 'employed',
    tracks: ['backend', 'devops_cloud', 'cybersecurity'],
    level: 'advanced',
    buildsWithAI: true,
    programmingLanguages: ['Go', 'TypeScript', 'SQL'],
    contentLanguages: ['English', 'German'],
    freeOnly: false,
    hasStudentDiscount: false,
    country: 'DE',
    sampleProjects: [
      {
        name: 'Core API Gateway & Auth Service',
        type: 'business',
        clientName: 'Enterprise SaaS Inc',
        industry: 'Cloud Infrastructure',
        languages: ['Go', 'TypeScript'],
        stack: ['Node.js', 'Docker', 'Kubernetes', 'Redis'],
      },
      {
        name: 'CI/CD Pipeline Security Hardening',
        type: 'business',
        clientName: 'Internal Security Guild',
        industry: 'Cybersecurity',
        languages: ['Python', 'Shell'],
        stack: ['GitHub Actions', 'Docker', 'Vault'],
      },
    ],
  },
  {
    email: 'founder@cadence.dev',
    username: 'founder_demo',
    name: 'Casey Founder',
    skillLevel: 'professional',
    primaryRole: 'Startup CTO & Indie Hacker',
    timezone: 'America/San_Francisco',
    tier: 'Principal',
    xp: 9800,
    streakDays: 62,
    intent: 'founder',
    tracks: ['fullstack', 'ai_engineering', 'product_management'],
    level: 'advanced',
    buildsWithAI: true,
    programmingLanguages: ['TypeScript', 'Python', 'SQL'],
    contentLanguages: ['English'],
    freeOnly: false,
    hasStudentDiscount: false,
    country: 'US',
    sampleProjects: [
      {
        name: 'SaaS MVP AI Workflow Engine',
        type: 'business',
        clientName: 'Venture Studio Startup',
        industry: 'Artificial Intelligence',
        languages: ['TypeScript', 'Python'],
        stack: ['React', 'Node.js', 'Gemini API', 'PostgreSQL'],
      },
      {
        name: 'Growth Analytics & Customer Feedback Hub',
        type: 'business',
        clientName: 'SaaS Metrics',
        industry: 'Analytics',
        languages: ['TypeScript'],
        stack: ['React', 'Vite', 'Tailwind'],
      },
    ],
  },
];
