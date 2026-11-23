export interface DocTable {
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface DocCodeBlock {
  title: string;
  language: string;
  code: string;
}

export interface DocCallout {
  label: string;
  body: string;
}

export interface DocSubsection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  orderedList?: string[];
  tables?: DocTable[];
  codeBlocks?: DocCodeBlock[];
  callout?: DocCallout;
}

export interface DocChapter {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  category:
    | 'Product'
    | 'Routing & Auth'
    | 'Backend & Data'
    | 'Extensions & Devices'
    | 'Codebase & UI/UX'
    | 'Deployment & Pitch';
  summary: string;
  diagramType?: 'auth-redirect' | 'session-state' | 'three-layer-tracking' | 'device-handoff';
  subsections: DocSubsection[];
}

export const DOC_METADATA = {
  productName: 'Cadence',
  subtitle: 'Session-Based Accountability, Role-Aware Learning & Progression Platform for Developers',
  docTitle: 'Complete Engineering, UI/UX & Codebase Specification',
  version: '1.3.0',
  date: 'November 2026',
  stack: 'React 19 (Vite SPA + 2D Scroll Chronograph) · Express / Node.js · MongoDB Atlas (+ SQLite Fallback) · Vercel Serverless · VS Code API · Chrome MV3',
  author: 'Cadence Architecture Blueprint',
};

export const CADENCE_CHAPTERS: DocChapter[] = [
  {
    id: 'executive-prd',
    number: '01',
    title: 'Product Requirements Document (PRD)',
    shortTitle: 'PRD & Scope',
    category: 'Product',
    summary:
      'Defines the core problem, target developer personas, session accountability loop, project modes (Personal, Business/Client, Learning), and phased delivery roadmap from MVP to V2.',
    subsections: [
      {
        id: 'vision-positioning',
        title: '1.1 Problem Statement & Market Positioning',
        paragraphs: [
          'AI-assisted tools such as Cursor, Windsurf, Antigravity, Google AI Studio, Stitch, Claude, Lovable, and Manus have dramatically accelerated software creation. However, existing time trackers either measure raw generic hours (Toggl, Clockify) or passive keystroke volume inside a single editor (WakaTime). Neither captures the multi-tool workflow of modern developers or measures whether a developer is improving their planning accuracy over time.',
          'Cadence is a session-based accountability and progression platform. Developers plan a session by choosing a project mode, selecting categories and tools, allocating checkpoint durations, running a server-authoritative timer with enforced pause accountability, and logging concrete outcomes. Ranking rewards estimate accuracy, focus ratio, and consistency rather than raw hours spent.',
        ],
        tables: [
          {
            title: 'Competitive Positioning & Business Model',
            headers: ['Dimension', 'WakaTime', 'Toggl / Clockify', 'Cadence'],
            rows: [
              ['Primary Signal', 'Raw IDE coding time', 'Manual generic stopwatch', 'Checkpoints, tool stack & estimate accuracy'],
              ['AI Tool Coverage', 'IDE plugins only', 'None (manual labels)', 'IDEs + AI web builders (Chrome Ext + manual)'],
              ['Accountability Gate', 'Passive background', 'Start / stop timer', 'Mandatory pause reason, overrun penalty, end summary'],
              ['Progression Model', 'Hours leaderboard', 'None', 'Accuracy-weighted XP, 5 tiers, daily cap, streaks'],
              ['Monetization', 'Freemium ($9/mo)', 'Per-seat SaaS', 'Free · Pro ($5–$8/mo) · Bootcamp Cohorts (B2B2C)'],
            ],
          },
        ],
      },
      {
        id: 'personas-modes',
        title: '1.2 Target Personas & Project Modes',
        paragraphs: [
          'Every project in Cadence belongs to one of three primary modes. This classification governs session reflection prompts, portfolio visibility, and streak credit.',
        ],
        tables: [
          {
            title: 'Project & Session Mode Matrix',
            headers: ['Mode', 'Target User', 'Required Metadata', 'Session End Prompt Additions', 'Portfolio / Export Behavior'],
            rows: [
              [
                'Personal',
                'Indie hackers, side-project builders',
                'Industry, languages[], stack[], repo/live links',
                'Title, one-line summary, improvement notes',
                'Optional auto-publish to Personal Portfolio site',
              ],
              [
                'Business / Client',
                'Freelancers, agencies, contract devs',
                'Client name, industry, languages[], stack[], business site link',
                'Title, deliverable summary, client-ready checkpoint log',
                'Push to Business Site + CSV/PDF billable time export',
              ],
              [
                'Learning',
                'Bootcamp students (e.g. GOMYCODE), upskilling devs',
                'Topic/curriculum track, languages[], stack[]',
                'Title, summary + mandatory "What I Learned" takeaway',
                'Counts toward Practice Streaks & Cohort Dashboards',
              ],
            ],
          },
        ],
      },
      {
        id: 'phased-roadmap',
        title: '1.3 Phased Feature Matrix (MVP, V1, V2)',
        tables: [
          {
            title: 'Release Scope Breakdown',
            headers: ['Phase', 'Included Capabilities', 'Verification Criteria'],
            rows: [
              [
                'MVP (Showcase)',
                'Email/OAuth registration, onboarding, project CRUD (type, industry, stack, links), tool catalog with 7 category filters, flexible session planner (12h / 24h / 48h / 7d / 30d / custom) & checkpoint splits, server-authoritative timer, mandatory pause reason & alarm, heartbeat lapse detection, end-session log, XP/tiers/streaks dashboard, PWA mobile mode & device switch logging.',
                'Complete end-to-end session runs across Desktop, Tablet, and Mobile responsive web layouts with real MongoDB persistence and lapse cron verified.',
              ],
              [
                'V1 (Ecosystem)',
                'VS Code / Cursor / Windsurf / Antigravity extension (.vsix) with live heartbeats & URI deep links, document upload + Gemini AI Summary Card, portfolio/business site webhook sync, weekly digest reports, client PDF time exports.',
                'Typing in Cursor updates active dashboard checkpoint within 60s; uploaded PRD generates Reference Card inside Focus View.',
              ],
              [
                'V2 (Scale)',
                'Chrome Manifest V3 extension for web AI tools, GitHub commit auto-linking per checkpoint, bootcamp cohort dashboards, team accountability rooms, seasonal accuracy leagues.',
                'Chrome tab switches between Google AI Studio and Lovable attribute time automatically to matching checkpoints.',
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pages-routes-redirects',
    number: '02',
    title: 'Complete Page Map, Routes, Redirects & Guard Logic',
    shortTitle: 'Pages & Redirects',
    category: 'Routing & Auth',
    summary:
      'Exhaustive specification of every client-side route, public/private/onboarding guard, redirect condition, query parameter handoff, deep-link URI connection, and 404 recovery behavior.',
    diagramType: 'auth-redirect',
    subsections: [
      {
        id: 'route-guards',
        title: '2.1 Route Guard Pipeline',
        paragraphs: [
          'Every navigation request in the React SPA passes through a deterministic 4-layer guard pipeline before rendering a view. This prevents stale session states, unverified onboarding access, or broken deep links.',
        ],
        orderedList: [
          'Layer 1 — Session Hydration Guard: On initial load, client checks in-memory Access JWT or attempts silent refresh via POST /api/auth/refresh (HttpOnly cookie). While resolving, renders neutral layout skeleton without flashing login screens.',
          'Layer 2 — Auth Guard (RequireAuth): Unauthenticated requests to protected routes redirect to /login?redirect=<encodedCurrentPathAndQuery>.',
          'Layer 3 — Onboarding Guard (RequireOnboarding): Authenticated users with user.onboardingCompleted === false are redirected from any app route to /onboarding (except /logout or /auth/*).',
          'Layer 4 — Active Session Lock Guard: Accessing /session/:id/focus when status is paused redirects to /session/:id/pause. Accessing /focus or /pause when status is completed, lapsed, or abandoned redirects to /session/:id/summary.',
        ],
      },
      {
        id: 'public-auth-routes',
        title: '2.2 Public, Registration & Auth Redirect Matrix',
        tables: [
          {
            title: 'Public & Authentication Routes',
            headers: ['Route', 'Purpose', 'Access Guard', 'Redirect Conditions & Destination'],
            rows: [
              [
                '/',
                'Public Landing Page',
                'Public (Guest-first)',
                'If authenticated & onboardingCompleted=true → /dashboard. If onboardingCompleted=false → /onboarding.',
              ],
              [
                '/register',
                'Account Creation (Email + OAuth)',
                'GuestOnly',
                'If already authenticated → /dashboard. After Email signup → /auth/verify-email?email=... After OAuth → /auth/callback.',
              ],
              [
                '/login',
                'Sign In Page',
                'GuestOnly',
                'Reads ?redirect= param. On success: if !onboardingCompleted → /onboarding; else → sanitized ?redirect or /dashboard.',
              ],
              [
                '/auth/callback',
                'OAuth 2.0 Code Exchange (Google / GitHub)',
                'Public Callback',
                'Validates state & exchanges code. Sets HttpOnly refresh cookie. New user → /onboarding; returning user → /dashboard; error → /login?error=oauth_failed.',
              ],
              [
                '/auth/verify-email',
                'Email Verification Token Handler',
                'Public Token',
                'Reads ?token=. Valid → marks emailVerified=true, auto-redirects after 2s to /onboarding (or /dashboard). Expired → shows Resend Verification action.',
              ],
              [
                '/auth/forgot-password',
                'Password Reset Request',
                'GuestOnly',
                'Submits email to POST /api/auth/forgot-password. Displays neutral confirmation message regardless of account existence (anti-enumeration).',
              ],
              [
                '/auth/reset-password',
                'Password Reset Form',
                'Public Token',
                'Reads ?token=. Valid submit → updates hash, revokes all refresh tokens, redirects → /login?reset=success.',
              ],
              [
                '/onboarding',
                'First-Run Profile & Stack Setup',
                'RequireAuth (Unfinished)',
                'If onboardingCompleted=true → /dashboard. On Save/Complete → sets flag true & redirects → /dashboard.',
              ],
              [
                '/privacy & /terms',
                'Legal Compliance Pages',
                'Public',
                'Accessible from footer, registration form, and settings without authentication.',
              ],
              [
                '* (Catch-All)',
                'Custom 404 Recovery Page',
                'Public',
                'Displays branded 404 state with quick links back to /dashboard (if authed) or / (if guest) and /sessions/new.',
              ],
            ],
          },
        ],
      },
      {
        id: 'app-workspace-routes',
        title: '2.3 Core Application & Session Execution Routes',
        tables: [
          {
            title: 'Authenticated Workspace & Session Routes',
            headers: ['Route', 'Purpose', 'Guards & Data Checks', 'Redirect & Transition Rules'],
            rows: [
              [
                '/dashboard',
                'Main Overview (Desktop & Tablet) / Home Tab (Mobile)',
                'RequireAuth + Onboarding',
                'Fetches GET /api/sessions/active. If an active/paused session exists, renders top Resume Banner linking directly to /session/:id/focus or /pause.',
              ],
              [
                '/projects',
                'Projects Directory (Personal, Business, Learning)',
                'RequireAuth + Onboarding',
                'Supports ?type=personal|business|learning query filter. Click row → /projects/:projectId.',
              ],
              [
                '/projects/new',
                'Create Project Wizard',
                'RequireAuth + Onboarding',
                'On POST /api/projects success → redirects to /projects/:newId or /sessions/new?projectId=:newId if launched from planner.',
              ],
              [
                '/projects/:projectId',
                'Project Detail, Documents & Portfolio Sync',
                'RequireAuth + OwnerCheck',
                'If 404 or not owner → redirects /projects?error=not_found. "Start Session" CTA → /sessions/new?projectId=:projectId.',
              ],
              [
                '/tools',
                'Tool Catalog, Category Filters & Custom Tools',
                'RequireAuth + Onboarding',
                'Filterable by 7 categories (dev, design, research, review, testing, deployment, clientele). Links to /settings/extensions for IDE pairing.',
              ],
              [
                '/sessions/new',
                'Session & Checkpoint Planner',
                'RequireAuth + Onboarding',
                'Blocks creation if an active/paused session already exists (redirects with prompt to /session/:activeId/focus). On Start → redirects /session/:id/focus.',
              ],
              [
                '/session/:id/focus',
                'Live Focus Timer, Checkpoints & Tool Launcher',
                'RequireAuth + SessionActive',
                'Status=paused → /session/:id/pause. Status=completed|lapsed|abandoned → /session/:id/summary. Clicking Pause → /session/:id/pause. Clicking End → /session/:id/end.',
              ],
              [
                '/session/:id/pause',
                'Pause Reason Gate & Alarm Countdown',
                'RequireAuth + SessionOwner',
                'If status=active & not confirming pause → /session/:id/focus. On Resume → /session/:id/focus. On End from Pause → /session/:id/end.',
              ],
              [
                '/session/:id/end',
                'Session Wrap-Up, Title & Improvement Log',
                'RequireAuth + SessionOpen',
                'Requires title + summary (+ whatILearned in Learning mode). On POST end → redirects /session/:id/summary.',
              ],
              [
                '/session/:id/summary',
                'Post-Session Analytics, XP & Portfolio Push',
                'RequireAuth + SessionOwner',
                'If status=active → /session/:id/focus. If lapsed and unreviewed, displays "Complete Lapsed Session Notes" inline form.',
              ],
              [
                '/analytics',
                'Time Split, Estimate Accuracy & Improvement Areas',
                'RequireAuth + Onboarding',
                'Supports ?range=7d|30d|all&mode=... query state synced to URL.',
              ],
              [
                '/leaderboard',
                'XP Tiers, Streaks & Cohort Rankings',
                'RequireAuth + Onboarding',
                'Tabs: Global Consistency, Weekly Accuracy, Bootcamp Cohort (if enrolled).',
              ],
              [
                '/portfolio-sync',
                'Portfolio & Business Site Connector',
                'RequireAuth + Onboarding',
                'Manages personal & business webhook targets, HMAC secret, and public JSON feed URLs.',
              ],
              [
                '/settings',
                'Profile, Extension Pairing, Push & Account',
                'RequireAuth + Onboarding',
                'Sub-routes /settings/extensions (IDE & Chrome pairing) and /settings/notifications (Web Push VAPID test).',
              ],
            ],
          },
        ],
      },
      {
        id: 'deeplink-redirects',
        title: '2.4 Cross-App Deep Links & Extension Pairing Redirects',
        paragraphs: [
          'Connecting the web dashboard with local desktop IDEs and the Chrome extension uses custom URI protocols and short-lived pairing tokens so users never copy-paste raw JWTs into insecure local configs.',
        ],
        tables: [
          {
            title: 'Protocol & External Redirect Flows',
            headers: ['Trigger Source', 'Target URI / Redirect', 'Purpose & Fallback Behavior'],
            rows: [
              [
                'Focus View → "Open in IDE"',
                'vscode://cadence-dev.cadence/start?session=<id>&workspace=<slug>',
                'Launches VS Code (or cursor://, windsurf://, antigravity://) and binds extension telemetry to the active session. Fallback modal offers one-click .vsix install if handler times out.',
              ],
              [
                'IDE Extension → "Pair Account"',
                'https://app.cadence.dev/settings/extensions?pair=ide&state=<nonce>',
                'Opens browser to extension pairing page. User clicks Approve → web generates 6-digit code or redirects to vscode://cadence-dev.cadence/auth?code=<oneTimeCode>.',
              ],
              [
                'Chrome Extension → "Connect"',
                'https://app.cadence.dev/settings/extensions?pair=chrome&extId=<id>',
                'Issues scoped ext_chrome_... token stored in chrome.storage.local. Redirects back to extension popup confirmation.',
              ],
              [
                'Web Push Notification Click',
                '/session/:id/pause?alarm=expired (or /session/:id/focus)',
                'Service Worker notificationclick handler focuses existing PWA tab and navigates directly to the active or expired pause screen.',
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'registration-auth',
    number: '03',
    title: 'Registration, Onboarding & Authentication Architecture',
    shortTitle: 'Registration & Auth',
    category: 'Routing & Auth',
    summary:
      'End-to-end user registration, OAuth 2.0 PKCE flows, JWT + HttpOnly refresh token rotation, email verification, and scoped extension authentication.',
    subsections: [
      {
        id: 'registration-flows',
        title: '3.1 Registration & Verification Lifecycle',
        orderedList: [
          'Method A — Email & Password Registration: User submits name, email, password (min 10 chars, Argon2id/bcrypt cost 12 hashed server-side) plus explicit acceptance of Privacy Policy and Terms.',
          'Email Verification Dispatch: Server creates user with emailVerified: false, stores SHA-256 hashed 32-byte token (TTL 24h), and dispatches transactional verification link to /auth/verify-email?token=....',
          'Method B — OAuth 2.0 (GitHub & Google): Client navigates to /api/auth/oauth/github or /google with PKCE code_challenge and signed state cookie. Callback verifies state, exchanges code, sets emailVerified: true (if provider verified), and merges or creates user.',
          'Device Context Capture: Every login/register request records initial device classification (web vs mobile_pwa) based on display-mode media query + User-Agent.',
        ],
        callout: {
          label: 'Security Rule — Open Redirect Prevention',
          body: 'The ?redirect= parameter on /login must be validated against an allowlist of relative internal paths starting with "/" (and not "//"). External URLs in ?redirect= are stripped and defaulted to /dashboard.',
        },
      },
      {
        id: 'onboarding-steps',
        title: '3.2 Mandatory 4-Step Onboarding Flow (/onboarding)',
        tables: [
          {
            title: 'Onboarding Wizard Steps',
            headers: ['Step', 'Captured Data', 'Default / Skip Behavior', 'Downstream Effect'],
            rows: [
              ['1. Developer Profile', 'Primary persona (Solo Builder, Freelancer, Bootcamp Student), timezone', 'Auto-detected browser timezone', 'Sets daily streak boundary at user local midnight & weekly report schedule'],
              ['2. Default Tool Stack', 'Preferred IDE (VS Code, Cursor, Windsurf, Antigravity) & AI tools', 'Pre-selects VS Code + Google AI Studio', 'Pre-populates Session Planner tool selector'],
              ['3. First Project Seed', 'Optional quick project (Name, Personal/Business/Learning, Stack)', 'Skippable (can create later in /projects/new)', 'Unlocks immediate 1-click session launch on Dashboard'],
              ['4. Push & Extensions', 'Request Notification permission + optional IDE pairing code', 'Skippable (audio alarm still works in-tab)', 'Registers PushSubscription for background pause expiry alarms'],
            ],
          },
        ],
      },
      {
        id: 'token-security',
        title: '3.3 Token Architecture & Extension Scopes',
        tables: [
          {
            title: 'Credential & Token Matrix',
            headers: ['Token Type', 'Storage Location', 'TTL', 'Scope & Rotation Rules'],
            rows: [
              ['Access JWT', 'React memory (AuthContext)', '15 min', 'Signed RS256/HS256; carries sub, tier, onboardingCompleted. Never stored in localStorage.'],
              ['Refresh Token', 'HttpOnly; Secure; SameSite=Lax cookie', '30 days', 'Stored hashed in refreshTokens collection. Rotated on every /api/auth/refresh call; reuse triggers family revocation.'],
              ['Extension Token', 'VS Code SecretStorage / chrome.storage.local', '90 days (revocable)', 'Prefixed ext_ide_ or ext_chr_. Restricted strictly to POST /api/activity, GET /api/sessions/active, and session pause/resume/end triggers.'],
              ['Portfolio Webhook Secret', 'Encrypted in portfolioSites collection', 'Until rotated', 'Used to compute X-Cadence-Signature: sha256=<hmac> on outbound project publish webhooks.'],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'session-engine',
    number: '04',
    title: 'Session Engine, Timer Math, Pause Alarms & Lapse Detection',
    shortTitle: 'Session Engine',
    category: 'Product',
    summary:
      'Server-authoritative timer calculations, flexible duration checkpoints, mandatory pause governance, dual session-end paths (manual vs app-close lapse), and audio/push alarms.',
    diagramType: 'session-state',
    subsections: [
      {
        id: 'state-machine',
        title: '4.1 Session State Machine & Transitions',
        paragraphs: [
          'Sessions follow a strict finite state machine enforced on the backend. Client timers are purely visual projections derived from server timestamps so page reloads, browser crashes, or device switches never corrupt recorded duration.',
        ],
        tables: [
          {
            title: 'Valid State Transitions',
            headers: ['From State', 'Event / Endpoint', 'To State', 'Preconditions & Side Effects'],
            rows: [
              ['planned', 'POST /api/sessions/:id/start', 'active', 'Sets startedAt = now, lastHeartbeat = now, first checkpoint startedAt = now.'],
              ['active', 'PATCH /api/sessions/:id/pause', 'paused', 'Requires reason enum + plannedMinutes (1–180). Closes active slice, opens pauses[] entry.'],
              ['paused', 'PATCH /api/sessions/:id/resume', 'active', 'Sets pause.resumedAt = now, computes overrunMinutes = max(0, actualPause - plannedMinutes).'],
              ['active / paused', 'PATCH /api/sessions/:id/end', 'completed', 'Requires title + summary (+ whatILearned if Learning mode). Computes final XP & accuracy.'],
              ['active', 'Vercel Cron or Lazy Sweep (no heartbeat > 5m default)', 'lapsed', 'Sets endedAt = lastHeartbeat, status = lapsed, preserves all IDE/Chrome activity slices & logs exact date/time/duration.'],
              ['active / paused', 'PATCH /api/sessions/:id/abandon', 'abandoned', 'User cancels early without logging summary; awards 0 XP and preserves audit record.'],
            ],
          },
        ],
      },
      {
        id: 'timer-math',
        title: '4.2 Server-Authoritative Timer Formula & Checkpoint Splits',
        paragraphs: [
          'When planning a session, the user selects a total commitment window—12 hours, 24 hours (1 day), 48 hours, 1 week, 1 month, or any custom duration—and distributes that budget across selected category checkpoints (Dev, Design, Research, Review, Testing, Deployment, Clientele). For multi-day allocations (48h, 1 week, 1 month), sessions act as milestone sprints where daily focus blocks roll up into the parent checkpoint budget.',
        ],
        codeBlocks: [
          {
            title: 'Authoritative Elapsed Time Computation (Shared TypeScript Logic)',
            language: 'typescript',
            code: `export function computeSessionTimings(session: SessionDoc, nowMs: number = Date.now()) {
  const startedMs = new Date(session.startedAt).getTime();
  const effectiveEndMs = session.endedAt ? new Date(session.endedAt).getTime() : nowMs;

  let totalPausedMs = 0;
  let totalPlannedPauseMs = 0;
  let totalOverrunMs = 0;

  for (const p of session.pauses) {
    const pStart = new Date(p.startedAt).getTime();
    const pEnd = p.resumedAt ? new Date(p.resumedAt).getTime() : effectiveEndMs;
    const actualPauseMs = Math.max(0, pEnd - pStart);
    const plannedPauseMs = p.plannedMinutes * 60_000;

    totalPausedMs += actualPauseMs;
    totalPlannedPauseMs += plannedPauseMs;
    totalOverrunMs += Math.max(0, actualPauseMs - plannedPauseMs);
  }

  const activeMs = Math.max(0, effectiveEndMs - startedMs - totalPausedMs);
  return {
    activeMinutes: Math.round(activeMs / 60_000),
    pausedMinutes: Math.round(totalPausedMs / 60_000),
    overrunMinutes: Math.round(totalOverrunMs / 60_000),
    focusRatio: activeMs + totalOverrunMs > 0 ? activeMs / (activeMs + totalOverrunMs) : 1,
  };
}`,
          },
        ],
      },
      {
        id: 'pause-and-two-end-paths',
        title: '4.3 Mandatory Pause Gate & Two Ways to End a Session',
        bullets: [
          'Pause Reason & Duration Gate: Pressing Pause opens /session/:id/pause where the user must pick a reason (break, meal, blocked, distraction, client_call, other) and select a planned duration (5m, 10m, 15m, 30m, 45m, 60m, custom).',
          'Dual Alarm Trigger: When Date.now() reaches pause.startedAt + plannedMinutes, an in-tab Web Audio API chime plays (if open) AND the backend/cron dispatches a Web Push notification via the PWA Service Worker so the user is alerted even if the browser is minimized or they switched to mobile.',
          'End Path 1 — Explicit Completion: User clicks End Session (from Focus or Pause view), enters a brief title, one-line summary of what was covered, reviews checkpoint planned vs actual minutes, and submits. Exact start, end, and duration are locked.',
          'End Path 2 — Closing App / Lost Connection (Zero IDE Loss): Client sends POST /api/sessions/:id/heartbeat every 30s and fires navigator.sendBeacon on pagehide. If the user closes the app without ending, the IDE extension keeps buffering/sending telemetry until the 5-minute default lapse threshold (user-configurable 3–30m) triggers. Lazy session sweeps on reads plus Vercel Cron automatically end stale sessions at endedAt = lastHeartbeat without losing logged IDE or checkpoint work.',
        ],
      },
    ],
  },
  {
    id: 'device-switching-pwa',
    number: '05',
    title: 'Desktop, Tablet & Mobile Flow + Device Switch Tracking',
    shortTitle: 'Multi-Device Layouts',
    category: 'Extensions & Devices',
    summary:
      'Automatic breakpoint layouts across Desktop, Tablet Companion, and Mobile Web, bottom-tab mobile navigation, live device-switch timeline recording, and notification architecture.',
    diagramType: 'device-handoff',
    subsections: [
      {
        id: 'desktop-vs-mobile-flows',
        title: '5.1 Responsive Architecture: Desktop, Tablet Companion & Mobile',
        tables: [
          {
            title: 'Screen & Navigation Parity Matrix',
            headers: ['Flow Stage', 'Desktop Workstation (>= 1024px)', 'Tablet Companion (768px - 1023px)', 'Mobile Layout (< 768px)'],
            rows: [
              ['Shell Navigation', 'Left 252px persistent sidebar + breadcrumb header', 'Compact 72px icon rail maximizing center grid width', 'Slide-out drawer + 56px bottom 4-tab thumb bar (<= 15% height)'],
              ['Session Planner', '4-column KPI strip + side-by-side Category/Tool Matrix & Timeline', '2-column grid + full-width visual checkpoint budget bar', 'Single-column stacked cards with 44px+ touch buttons'],
              ['Focus Screen', 'Timer + Checkpoint stepper + IDE Launch buttons + Reference Cards', 'Companion monitor view ideal beside desktop IDE', 'High-contrast timer + current step + 44px+ Pause / End buttons'],
              ['Pause Screen', 'Reason selector + Countdown + Overrun ratio meter', 'Clear side-by-side countdown and resume controls', 'Full-width break countdown + Web Audio & Browser notification'],
              ['Device Detection', 'Automatic via viewport width (>= 768px reports web)', 'Automatic companion layout without manual toggles', 'Automatic (< 768px reports mobile_pwa telemetry on API sync)'],
            ],
          },
        ],
      },
      {
        id: 'device-switch-recording',
        title: '5.2 Real-Time Cross-Device Sync & Audit Trail',
        paragraphs: [
          'Instead of requiring manual mode toggles, Cadence detects device class automatically from the browser viewport. When a developer plans on Desktop and opens the same live session on their phone away from the desk, Cadence logs the transition automatically.',
        ],
        orderedList: [
          'Every client API call sends header X-Cadence-Device: web | mobile_pwa derived automatically from responsive viewport breakpoints.',
          'On GET /api/sessions/active, heartbeat, pause, resume, or end actions, the backend compares the incoming device class against session.currentDevice.',
          'When the device class changes, the server pushes { fromDevice, toDevice, at, checkpointId } into session.deviceEvents[] and updates session.currentDevice.',
          'Both Desktop and Tablet layouts share the full workspace feature set, while Mobile prioritizes one-handed focus timer checks, pause timers, and reflection submission.',
        ],
      },
      {
        id: 'pwa-manifest-push',
        title: '5.3 PWA Manifest & Service Worker Web Push Spec',
        codeBlocks: [
          {
            title: 'public/manifest.webmanifest & Service Worker Push Handler',
            language: 'json',
            code: `{
  "name": "Cadence — Developer Accountability",
  "short_name": "Cadence",
  "start_url": "/dashboard?source=pwa",
  "display": "standalone",
  "background_color": "#0A0908",
  "theme_color": "#E12D1C",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}`,
          },
        ],
      },
    ],
  },
  {
    id: 'tools-projects-portfolio',
    number: '06',
    title: 'Tool Catalog, Project Taxonomy & Portfolio Site Sync',
    shortTitle: 'Tools & Portfolio',
    category: 'Product',
    summary:
      '7-category filterable tool catalog, custom tool registration, project metadata (industry, languages, stack), and automated Personal/Business Portfolio site publishing.',
    subsections: [
      {
        id: 'tool-catalog',
        title: '6.1 Seeded Tool Catalog & 7 Category Filters',
        tables: [
          {
            title: 'Default Seeded Tools by Category & Integration Layer',
            headers: ['Tool Name', 'Categories', 'Launch / Domain Identifier', 'Tracking Layer'],
            rows: [
              ['VS Code', 'dev, review, testing', 'vscode:// · appName: Visual Studio Code', 'Layer 1 (IDE Ext) + Deep Link'],
              ['Cursor', 'dev, review', 'cursor:// · appName: Cursor', 'Layer 1 (IDE Ext) + Deep Link'],
              ['Windsurf', 'dev, review', 'windsurf:// · appName: Windsurf', 'Layer 1 (IDE Ext) + Deep Link'],
              ['Antigravity', 'dev, design, review', 'antigravity:// · appName: Antigravity', 'Layer 1 (IDE Ext) + Deep Link'],
              ['Google AI Studio', 'dev, research, design', 'aistudio.google.com', 'Layer 2 (Chrome Ext) + Manual'],
              ['Stitch', 'design, dev', 'stitch.withgoogle.com', 'Layer 2 (Chrome Ext) + Manual'],
              ['Claude', 'research, dev, review', 'claude.ai', 'Layer 2 (Chrome Ext) + Manual'],
              ['ChatGPT / GPT', 'research, dev, review', 'chatgpt.com', 'Layer 2 (Chrome Ext) + Manual'],
              ['Lovable', 'dev, design', 'lovable.dev', 'Layer 2 (Chrome Ext) + Manual'],
              ['Manus', 'research, dev, clientele', 'manus.im', 'Layer 2 (Chrome Ext) + Manual'],
              ['Figma', 'design, review', 'figma.com', 'Layer 2 (Chrome Ext) + Manual'],
              ['Playwright / Postman', 'testing', 'localhost / postman.co', 'Layer 1/2 + Manual'],
              ['Vercel / GitHub Actions', 'deployment', 'vercel.com / github.com', 'Layer 2 + Git Commit Hook'],
              ['Linear / Notion / Meet', 'clientele, research', 'linear.app / notion.so / meet.google.com', 'Layer 2 (Chrome Ext) + Manual'],
            ],
          },
        ],
      },
      {
        id: 'portfolio-connector',
        title: '6.2 Personal & Business Portfolio Site Integration',
        paragraphs: [
          'Once a developer connects their Personal Portfolio site or Business/Clientele website in /portfolio-sync, any project or completed deployment checkpoint can be published automatically or with one click—eliminating manual portfolio updates.',
        ],
        tables: [
          {
            title: 'Portfolio Integration Modes',
            headers: ['Integration Mode', 'How It Works', 'Target Site Compatibility'],
            rows: [
              [
                'Option A: Signed Webhook Push',
                'When user clicks "Publish to Portfolio" (or completes a deployment checkpoint with autoPublish=true), Cadence sends POST <portfolioWebhookUrl> signed with X-Cadence-Signature (HMAC-SHA256).',
                'Next.js API routes, Express/Node backends, Vercel Serverless, CMS webhooks (Sanity, Strapi, Ghost).',
              ],
              [
                'Option B: Public Read-Only JSON Feed',
                'Cadence exposes GET /api/public/portfolio/:username?type=personal|business returning only projects marked isPublicPortfolio=true with verified session hours and checkpoint milestones.',
                'Static sites (Astro, Vite SPA, GitHub Pages, Next.js ISR) fetching live verified build logs at build/runtime.',
              ],
            ],
          },
        ],
        codeBlocks: [
          {
            title: 'Signed Portfolio Webhook Payload (POST to User Personal/Business Site)',
            language: 'json',
            code: `{
  "event": "project.published",
  "timestamp": "2026-11-22T14:30:00Z",
  "targetSiteType": "business",
  "project": {
    "id": "proj_98a1c",
    "name": "FinLedger Client Portal",
    "type": "business",
    "industry": "FinTech",
    "languages": ["TypeScript", "SQL"],
    "stack": ["React", "Express", "MongoDB", "Tailwind CSS"],
    "links": { "live": "https://finledger.example.com", "repo": null },
    "verifiedMetrics": {
      "totalHours": 42.5,
      "sessionsCompleted": 18,
      "estimateAccuracyAvg": 0.91,
      "shippedCheckpoints": ["Architecture", "Core API", "UI & QA", "Vercel Deployment"]
    }
  }
}`,
          },
        ],
      },
    ],
  },
  {
    id: 'documents-and-rankings',
    number: '07',
    title: 'Document Summary Cards, Improvement Engine & Rankings',
    shortTitle: 'Docs & Rankings',
    category: 'Product',
    summary:
      'Uploading PRDs/briefs to generate live Focus Reference Cards via Gemini API, plus the anti-burnout XP formula, 5-tier progression system, badges, and estimate-gap analytics.',
    subsections: [
      {
        id: 'document-pipeline',
        title: '7.1 Document Upload & AI Summary Card Pipeline',
        orderedList: [
          'User uploads a project brief, PRD, client scope, or study notes (PDF, Markdown, TXT, DOCX up to 10 MB) inside /projects/:id or /sessions/new.',
          'Server issues a presigned Object Storage URL (Vercel Blob / S3 / R2) via POST /api/documents/upload-url so large files never hit serverless body size limits.',
          'POST /api/documents/:id/summarize extracts text and invokes Gemini API (structured JSON schema output) to generate a concise Reference Card.',
          'The Reference Card displays inside the active Focus View sidebar/drawer with: 1-line objective, 3–5 deliverable checkboxes, technical constraints, and "Import Suggested Checkpoints" for future sessions.',
        ],
      },
      {
        id: 'xp-ranking-math',
        title: '7.2 Fair Rankings, Estimate Accuracy & Anti-Gaming Formula',
        paragraphs: [
          'Ranking by raw hours incentivizes leaving timers running and leads to burnout. Cadence ranks developers on planning calibration, focus discipline, and daily streaks, governed by a 500 XP daily soft cap.',
        ],
        codeBlocks: [
          {
            title: 'XP, Estimate Accuracy & Improvement Delta Equations',
            language: 'typescript',
            code: `// 1. Estimate Accuracy (1.0 = exact match; 0.0 = >=100% off target)
const accuracy = Math.max(0, 1 - Math.abs(actualMinutes - plannedMinutes) / Math.max(1, plannedMinutes));

// 2. Focus Ratio (penalizes overrun pauses, not planned breaks)
const focusRatio = activeMinutes / Math.max(1, activeMinutes + overrunPauseMinutes);

// 3. Session XP (min 15m active required to earn session XP)
const baseXP = Math.min(180, Math.round(activeMinutes * 1.2));
const checkpointBonus = completedCheckpoints * 15;
const streakMultiplier = Math.min(1.5, 1 + streakDays * 0.05);

const rawXP = Math.round((baseXP + checkpointBonus) * (0.5 + 0.5 * accuracy) * focusRatio * streakMultiplier);

// 4. Daily Soft Cap (500 XP full rate; 25% rate thereafter)
const remainingFullCap = Math.max(0, 500 - xpEarnedToday);
const awardedXP = Math.min(rawXP, remainingFullCap) + Math.round(Math.max(0, rawXP - remainingFullCap) * 0.25);`,
          },
        ],
        tables: [
          {
            title: 'Progression Tiers & Unlockable Badges',
            headers: ['Tier', 'XP Threshold', 'Representative Badges'],
            rows: [
              ['Apprentice', '0 – 999 XP', 'First Shipped Session · Zero-Overrun Pause'],
              ['Journeyman', '1,000 – 3,499 XP', '7-Day Streak · Estimated Within 10% · Multi-Device Handoff'],
              ['Craftsman', '3,500 – 8,499 XP', 'Deployment Checkpoint Shipped · 30-Day Learning Streak'],
              ['Architect', '8,500 – 19,999 XP', '90%+ Accuracy Across 10 Sessions · Portfolio Synced'],
              ['Principal', '20,000+ XP', '100-Day Consistency · Cohort Mentor'],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mongodb-schema',
    number: '08',
    title: 'Database Design & MongoDB Mongoose Schema',
    shortTitle: 'Database Schema',
    category: 'Backend & Data',
    summary:
      'Complete MongoDB Atlas document models, embedded subdocuments, compound indexes for fast leaderboard/cron queries, and data integrity constraints.',
    subsections: [
      {
        id: 'collections-overview',
        title: '8.1 Collections & Index Strategy',
        tables: [
          {
            title: 'MongoDB Collections & Indexes',
            headers: ['Collection', 'Key Fields', 'Critical Indexes'],
            rows: [
              ['users', 'name, email, passwordHash, oauthProviders[], xp, tier, streak, onboardingCompleted, settings', '{ email: 1 } unique, { xp: -1 }'],
              ['refreshTokens', 'userId, tokenHash, familyId, expiresAt, revokedAt', '{ tokenHash: 1 } unique, TTL { expiresAt: 1 }'],
              ['extensionTokens', 'userId, source (ide|chrome), tokenHash, label, lastUsedAt, revokedAt', '{ tokenHash: 1 } unique, { userId: 1 }'],
              ['projects', 'userId, name, type, industry, languages[], stack[], links, isPublicPortfolio', '{ userId: 1, type: 1 }'],
              ['portfolioSites', 'userId, siteType (personal|business), label, webhookUrl, secretEncrypted, autoPublish', '{ userId: 1 }'],
              ['tools', 'name, slug, categories[], launchProtocol, domainPattern, isSeeded, createdBy', '{ slug: 1 } unique, { categories: 1 }'],
              ['sessions', 'userId, projectId, mode, status, plannedMinutes, startedAt, endedAt, lastHeartbeat, currentDevice, checkpoints[], pauses[], deviceEvents[], activitySlices[], title, summary, whatILearned, xpAwarded', '{ userId: 1, status: 1 }, { status: 1, lastHeartbeat: 1 } (Cron)'],
              ['documents', 'userId, projectId, fileName, fileUrl, mimeType, summaryCard, status', '{ projectId: 1 }'],
              ['achievements', 'userId, badgeKey, title, awardedAt, sessionId', '{ userId: 1, badgeKey: 1 } unique'],
              ['pushSubscriptions', 'userId, endpoint, keys { p256dh, auth }, deviceLabel', '{ userId: 1 }, { endpoint: 1 } unique'],
            ],
          },
        ],
      },
      {
        id: 'session-mongoose-schema',
        title: '8.2 Core Session & Embedded Subdocument Schema (Mongoose)',
        codeBlocks: [
          {
            title: 'models/Session.ts',
            language: 'typescript',
            code: `import { Schema, model, Types } from 'mongoose';

const CheckpointSchema = new Schema({
  category: { type: String, enum: ['dev','design','research','review','testing','deployment','clientele'], required: true },
  title: { type: String, required: true, trim: true },
  toolIds: [{ type: Types.ObjectId, ref: 'Tool' }],
  plannedMinutes: { type: Number, required: true, min: 1 },
  actualMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'active', 'completed', 'skipped'], default: 'pending' },
  notes: { type: String, default: '' },
});

const PauseSchema = new Schema({
  reason: { type: String, enum: ['break', 'meal', 'blocked', 'distraction', 'client_call', 'other'], required: true },
  note: { type: String, default: '' },
  startedAt: { type: Date, required: true },
  plannedMinutes: { type: Number, required: true, min: 1, max: 180 },
  resumedAt: { type: Date, default: null },
  overrunMinutes: { type: Number, default: 0 },
  alarmSent: { type: Boolean, default: false },
});

const DeviceEventSchema = new Schema({
  fromDevice: { type: String, enum: ['web', 'mobile_pwa'], required: true },
  toDevice: { type: String, enum: ['web', 'mobile_pwa'], required: true },
  at: { type: Date, default: Date.now },
  checkpointId: { type: Types.ObjectId },
});

const ActivitySliceSchema = new Schema({
  source: { type: String, enum: ['ide', 'chrome', 'manual'], required: true },
  toolSlug: { type: String, required: true },
  language: { type: String },
  projectName: { type: String },
  gitCommitHash: { type: String },
  gitCommitMessage: { type: String },
  ts: { type: Date, required: true },
});

const SessionSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: Types.ObjectId, ref: 'Project', required: true },
  mode: { type: String, enum: ['personal', 'business', 'learning'], required: true },
  status: { type: String, enum: ['planned', 'active', 'paused', 'completed', 'lapsed', 'abandoned'], default: 'active' },
  plannedMinutes: { type: Number, required: true },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, default: null },
  lastHeartbeat: { type: Date, required: true },
  currentDevice: { type: String, enum: ['web', 'mobile_pwa'], default: 'web' },
  title: { type: String, default: '' },
  summary: { type: String, default: '' },
  whatILearned: { type: String, default: '' },
  checkpoints: [CheckpointSchema],
  pauses: [PauseSchema],
  deviceEvents: [DeviceEventSchema],
  activitySlices: [ActivitySliceSchema],
  xpAwarded: { type: Number, default: 0 },
  estimateAccuracy: { type: Number, default: 0 },
}, { timestamps: true });

SessionSchema.index({ status: 1, lastHeartbeat: 1 });
export const Session = model('Session', SessionSchema);`,
          },
        ],
      },
    ],
  },
  {
    id: 'rest-api-spec',
    number: '09',
    title: 'Complete REST API Specification',
    shortTitle: 'API Reference',
    category: 'Backend & Data',
    summary:
      'Every Express API endpoint grouped by domain, including authentication, session lifecycle, activity ingestion, document summarization, portfolio webhooks, and cron jobs.',
    subsections: [
      {
        id: 'api-endpoints-table',
        title: '9.1 Endpoint Catalog',
        tables: [
          {
            title: 'Auth, Projects, Tools & Documents Endpoints',
            headers: ['Method', 'Endpoint', 'Auth', 'Request / Behavior Summary'],
            rows: [
              ['POST', '/api/auth/register', 'Public', 'Creates user, hashes password, sends email verification link.'],
              ['POST', '/api/auth/login', 'Public', 'Verifies credentials, sets HttpOnly refresh cookie, returns Access JWT.'],
              ['GET', '/api/auth/oauth/:provider', 'Public', 'Redirects to Google/GitHub OAuth consent screen with PKCE & state.'],
              ['GET', '/api/auth/oauth/:provider/callback', 'Public', 'Exchanges code, upserts user, sets cookie, redirects to /onboarding or /dashboard.'],
              ['POST', '/api/auth/refresh', 'Cookie', 'Rotates refresh token and issues fresh 15m Access JWT.'],
              ['POST', '/api/auth/verify-email', 'Public', 'Validates token, sets emailVerified=true.'],
              ['PATCH', '/api/users/onboarding', 'JWT', 'Saves persona, default tools, timezone, marks onboardingCompleted=true.'],
              ['GET/POST', '/api/projects', 'JWT', 'Lists user projects (filter by type/industry) or creates new project.'],
              ['GET/PATCH/DEL', '/api/projects/:id', 'JWT', 'Fetches, updates, or archives a project owned by current user.'],
              ['GET/POST', '/api/tools', 'JWT', 'Lists seeded + user custom tools filtered by category; adds custom tool.'],
              ['POST', '/api/documents/upload-url', 'JWT', 'Returns signed upload URL + document record ID.'],
              ['POST', '/api/documents/:id/summarize', 'JWT', 'Extracts text and generates Gemini Summary Card JSON.'],
            ],
          },
          {
            title: 'Sessions, Telemetry, Stats, Portfolio & Cron Endpoints',
            headers: ['Method', 'Endpoint', 'Auth', 'Request / Behavior Summary'],
            rows: [
              ['GET', '/api/sessions/active', 'JWT / Ext', 'Returns current active or paused session (used on load & mobile handoff).'],
              ['POST', '/api/sessions', 'JWT', 'Creates & starts session with checkpoints[]; rejects if another session is open.'],
              ['POST', '/api/sessions/:id/heartbeat', 'JWT', 'Updates lastHeartbeat, records device switch if X-Cadence-Device changed, returns serverNow.'],
              ['PATCH', '/api/sessions/:id/pause', 'JWT / Ext', 'Requires { reason, plannedMinutes }; schedules pause alarm timestamp.'],
              ['PATCH', '/api/sessions/:id/resume', 'JWT / Ext', 'Closes active pause, computes overrunMinutes, logs deviceEvents if switched.'],
              ['PATCH', '/api/sessions/:id/checkpoint', 'JWT', 'Advances or switches active checkpoint and updates actualMinutes.'],
              ['PATCH', '/api/sessions/:id/end', 'JWT / Ext', 'Requires { title, summary, whatILearned? }; finalizes timings, XP, accuracy, badges.'],
              ['POST', '/api/activity', 'Ext / JWT', 'Ingests IDE or Chrome heartbeat { sessionId, source, toolSlug, language, project, gitCommit?, ts }.'],
              ['POST', '/api/extensions/pair', 'JWT / Code', 'Exchanges 6-digit pairing code for scoped ext_ide_ or ext_chr_ token.'],
              ['GET', '/api/stats/overview', 'JWT', 'Returns time by category, estimate accuracy trend, areas to improve, streak & XP.'],
              ['GET', '/api/leaderboard', 'JWT', 'Returns paginated ranking by accuracy-weighted XP & streaks.'],
              ['POST', '/api/portfolio/publish/:projectId', 'JWT', 'Dispatches signed HMAC webhook to connected Personal/Business portfolio site.'],
              ['GET', '/api/public/portfolio/:username', 'Public', 'Read-only JSON feed of public verified projects for static/ISR portfolio sites.'],
              ['POST', '/api/push/subscribe', 'JWT', 'Stores Web Push subscription keys for pause expiry alerts.'],
              ['GET', '/api/cron/lapse-check', 'Cron Secret', 'Marks stale active sessions (lastHeartbeat > user lapseGraceMin, default 5m) as lapsed & fires expired pause Web Push alarms.'],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ide-chrome-extensions',
    number: '10',
    title: 'IDE Extension (VS Code API) & Chrome Extension Scaffolds',
    shortTitle: 'IDE & Chrome Ext',
    category: 'Extensions & Devices',
    summary:
      'Layered activity tracking across VS Code, Cursor, Windsurf, and Antigravity via one unified VS Code API extension, plus Chrome MV3 domain-only tracking for web AI tools.',
    diagramType: 'three-layer-tracking',
    subsections: [
      {
        id: 'three-layer-strategy',
        title: '10.1 Three-Layer Tool Tracking Architecture',
        paragraphs: [
          'Browsers cannot inspect local desktop applications. Cadence solves this cleanly without heavy desktop spyware by using a 3-layer telemetry architecture: one VS Code-compatible extension (covering VS Code, Cursor, Windsurf, and Antigravity), one minimal-permission Chrome extension (covering web-based AI tools), and manual/deep-link switching inside the web app.',
          'Privacy Guarantee: Cadence extensions NEVER transmit source code, file contents, keystrokes, or browser page DOM. Only metadata (tool name, language ID, workspace name, domain hostname, and optional commit message) is sent.',
        ],
      },
      {
        id: 'vscode-extension-scaffold',
        title: '10.2 Unified IDE Extension Scaffold (VS Code, Cursor, Windsurf, Antigravity)',
        codeBlocks: [
          {
            title: 'extensions/cadence-ide/package.json',
            language: 'json',
            code: `{
  "name": "cadence",
  "displayName": "Cadence Developer Accountability",
  "publisher": "cadence-dev",
  "version": "1.0.0",
  "engines": { "vscode": "^1.85.0" },
  "activationEvents": ["onStartupFinished", "onUri"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      { "command": "cadence.pairToken", "title": "Cadence: Pair Account Token" },
      { "command": "cadence.togglePause", "title": "Cadence: Pause / Resume Session" },
      { "command": "cadence.endSession", "title": "Cadence: End Session in Web App" }
    ]
  }
}`,
          },
          {
            title: 'extensions/cadence-ide/src/extension.ts',
            language: 'typescript',
            code: `import * as vscode from 'vscode';

const API_BASE = 'https://app.cadence.dev/api';
const IDLE_THRESHOLD_MS = 120_000;
const HEARTBEAT_INTERVAL_MS = 60_000;

export async function activate(ctx: vscode.ExtensionContext) {
  let lastActiveAt = Date.now();
  let activeSessionId = ctx.globalState.get<string>('cadence.sessionId') || '';

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'cadence.togglePause';
  statusBar.text = '$(clock) Cadence: Idle';
  statusBar.show();

  const bumpActivity = () => { lastActiveAt = Date.now(); };

  ctx.subscriptions.push(
    statusBar,
    vscode.workspace.onDidChangeTextDocument(bumpActivity),
    vscode.workspace.onDidSaveTextDocument(bumpActivity),
    vscode.window.onDidChangeTextEditorSelection(bumpActivity),
    vscode.window.onDidChangeWindowState((e) => { if (e.focused) bumpActivity(); }),

    // URI Handler: vscode://cadence-dev.cadence/start?session=abc&code=123456
    vscode.window.registerUriHandler({
      async handleUri(uri) {
        const params = new URLSearchParams(uri.query);
        const session = params.get('session');
        const code = params.get('code');
        if (code) {
          const res = await fetch(\`\${API_BASE}/extensions/pair\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, source: 'ide', appName: vscode.env.appName }),
          });
          if (res.ok) {
            const { token } = await res.json();
            await ctx.secrets.store('cadence.token', token);
            vscode.window.showInformationMessage(\`Cadence paired with \${vscode.env.appName}\`);
          }
        }
        if (session) {
          activeSessionId = session;
          await ctx.globalState.update('cadence.sessionId', session);
          statusBar.text = '$(pulse) Cadence: Active';
        }
      },
    }),

    vscode.commands.registerCommand('cadence.pairToken', async () => {
      const code = await vscode.window.showInputBox({ prompt: 'Enter 6-digit pairing code from Cadence Settings' });
      if (!code) return;
      const res = await fetch(\`\${API_BASE}/extensions/pair\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, source: 'ide', appName: vscode.env.appName }),
      });
      if (res.ok) {
        const { token } = await res.json();
        await ctx.secrets.store('cadence.token', token);
        vscode.window.showInformationMessage('Cadence IDE extension connected.');
      }
    }),

    vscode.commands.registerCommand('cadence.endSession', () => {
      if (activeSessionId) {
        vscode.env.openExternal(vscode.Uri.parse(\`https://app.cadence.dev/session/\${activeSessionId}/end\`));
      }
    })
  );

  const timer = setInterval(async () => {
    const token = await ctx.secrets.get('cadence.token');
    if (!token || !vscode.window.state.focused || Date.now() - lastActiveAt > IDLE_THRESHOLD_MS) return;

    const editor = vscode.window.activeTextEditor;
    await fetch(\`\${API_BASE}/activity\`, {
      method: 'POST',
      headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: activeSessionId || undefined,
        source: 'ide',
        toolSlug: vscode.env.appName.toLowerCase(),
        language: editor?.document.languageId || 'unknown',
        projectName: vscode.workspace.name || 'untitled',
        ts: Date.now(),
      }),
    }).catch(() => {});
  }, HEARTBEAT_INTERVAL_MS);

  ctx.subscriptions.push({ dispose: () => clearInterval(timer) });
}`,
          },
        ],
      },
      {
        id: 'chrome-extension-scaffold',
        title: '10.3 Chrome Manifest V3 Extension (Web AI & Design Tools)',
        codeBlocks: [
          {
            title: 'extensions/cadence-chrome/manifest.json & background.js',
            language: 'javascript',
            code: `// manifest.json
{
  "manifest_version": 3,
  "name": "Cadence Web Tool Tracker",
  "version": "1.0.0",
  "permissions": ["tabs", "idle", "storage", "alarms"],
  "background": { "service_worker": "background.js" }
}

// background.js (domain-allowlist matching only)
const ALLOWED_TOOL_DOMAINS = {
  "aistudio.google.com": "google-ai-studio",
  "stitch.withgoogle.com": "stitch",
  "claude.ai": "claude",
  "chatgpt.com": "chatgpt",
  "lovable.dev": "lovable",
  "manus.im": "manus",
  "figma.com": "figma"
};

chrome.alarms.create("cadence-ping", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "cadence-ping") return;
  const idleState = await chrome.idle.queryState(120);
  if (idleState !== "active") return;

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.url) return;

  const hostname = new URL(tab.url).hostname;
  const toolSlug = ALLOWED_TOOL_DOMAINS[hostname];
  const { cadenceToken, activeSessionId } = await chrome.storage.local.get(["cadenceToken", "activeSessionId"]);
  if (!toolSlug || !cadenceToken) return;

  await fetch("https://app.cadence.dev/api/activity", {
    method: "POST",
    headers: { Authorization: \`Bearer \${cadenceToken}\`, "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: activeSessionId,
      source: "chrome",
      toolSlug,
      ts: Date.now()
    })
  }).catch(() => {});
});`,
          },
        ],
      },
    ],
  },
  {
    id: 'vercel-deployment-pitch',
    number: '11',
    title: 'Vercel Deployment, Cron Architecture, Env Config & Pitch',
    shortTitle: 'Vercel & Pitch',
    category: 'Deployment & Pitch',
    summary:
      'Vercel serverless Express adapter, vercel.json SPA rewrites & cron schedules, environment variable manifest, pre-launch checklist, and 6-slide showcase pitch script.',
    subsections: [
      {
        id: 'vercel-architecture',
        title: '11.1 Vercel Serverless Constraints & Configuration',
        paragraphs: [
          'Vercel Serverless Functions do not maintain persistent WebSocket connections. Cadence replaces Socket.io with a 30-second client heartbeat (for active timers and device sync), Web Push notifications (for background pause alarms), and Vercel Cron (for server-side lapse detection and overdue pause alerts).',
        ],
        codeBlocks: [
          {
            title: 'vercel.json (SPA Rewrites + API Handler + Cron Jobs)',
            language: 'json',
            code: `{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.ts" },
    { "source": "/((?!api|assets|icons|Cadence_Complete_Documentation\\.pdf|favicon\\.svg|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml).*)", "destination": "/index.html" }
  ],
  "crons": [
    { "path": "/api/cron/lapse-check", "schedule": "0 0 * * *" }
  ]
}`,
          },
        ],
      },
      {
        id: 'env-vars',
        title: '11.2 Required Environment Variables',
        tables: [
          {
            title: 'Production Environment Manifest (.env.example)',
            headers: ['Variable', 'Scope', 'Purpose'],
            rows: [
              ['MONGODB_URI', 'Serverless', 'MongoDB Atlas connection string (pooled via global cache)'],
              ['JWT_ACCESS_SECRET / JWT_REFRESH_SECRET', 'Serverless', 'Asymmetric or 256-bit secrets for auth tokens'],
              ['GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET', 'Serverless', 'GitHub OAuth 2.0 application credentials'],
              ['GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET', 'Serverless', 'Google OAuth 2.0 application credentials'],
              ['GEMINI_API_KEY', 'Serverless', 'Server-side document summarization into Reference Cards'],
              ['BLOB_READ_WRITE_TOKEN', 'Serverless', 'Vercel Blob / S3 signed document upload credentials'],
              ['VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY', 'Public / Server', 'Web Push alarm delivery for pause expiration'],
              ['CRON_SECRET', 'Serverless', 'Bearer token verified on /api/cron/* routes'],
              ['APP_URL', 'Serverless', 'Canonical deployment URL for OAuth callbacks & deep links'],
            ],
          },
        ],
      },
      {
        id: 'pitch-and-qa',
        title: '11.3 6-Slide Showcase Pitch Script & Launch Checklist',
        tables: [
          {
            title: '6-Slide Demo & Pitch Deck Outline',
            headers: ['Slide', 'Focus', 'Core Narrative'],
            rows: [
              ['1. The Gap', 'Why AI-era devs still fly blind', 'AI tools speed up shipping, but WakaTime only sees raw IDE keystrokes and Toggl sees generic hours. Neither tracks tool stacks, checkpoints, or estimate improvement.'],
              ['2. The Loop', 'Plan → Track → Pause → Log', 'Pick Personal, Business, or Learning mode; filter tools across 7 categories; split a 12h/48h/week goal into timed checkpoints.'],
              ['3. Accountability', 'Mandatory Pause & Heartbeat Lapse', 'Cannot pause without a reason and timer; overrun hurts focus score. Closing the app triggers server-side lapse at last heartbeat without losing IDE work.'],
              ['4. Live IDE Demo', 'VS Code / Cursor / Antigravity Ext', 'Open IDE, type code, watch live metadata-only heartbeats populate the dashboard and resize seamlessly across Desktop, Tablet, and Mobile.'],
              ['5. Fair Progression', 'Accuracy & Consistency > Grinding', 'XP rewards hitting estimates within 10% and holding streaks, with a 500 XP daily soft cap and Portfolio Sync.'],
              ['6. Business & Traction', 'Freemium + GOMYCODE Cohorts', 'Free tier, $5–$8/mo Pro, B2B2C bootcamp cohort dashboards—proven live with the real session logs used to build Cadence itself.'],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'codebase-file-structure',
    number: '12',
    title: 'Codebase Map & File-by-File Architecture',
    shortTitle: 'Codebase Map',
    category: 'Codebase & UI/UX',
    summary:
      'Complete annotated directory tree and responsibility breakdown for every backend module, client page, 2D interactive stage, context provider, utility, and build script in Cadence.',
    subsections: [
      {
        id: 'repo-directory-tree',
        title: '12.1 Annotated Repository Directory Tree',
        paragraphs: [
          'Cadence follows a single-repository full-stack layout where a unified Express server serves both JSON REST API endpoints (/api/*) and the React 19 Vite SPA bundle. Production deployments can run either as a long-lived Node server (server.ts) or inside Vercel Serverless Functions (api/index.ts).',
        ],
        codeBlocks: [
          {
            title: 'Complete Workspace File Structure',
            language: 'text',
            code: `cadence/
├── api/
│   └── index.ts                      Vercel serverless entry forwarding requests to Express
├── public/
│   ├── assets/aistudio/              Macro chronograph & optical glass reference photography
│   ├── Cadence_Complete_Documentation.pdf   Generated A4 engineering handbook (PDFKit)
│   ├── manifest.webmanifest          Web app icon & theme manifest (#0A0908 / #E12D1C)
│   └── robots.txt                    Search crawler directives
├── scripts/
│   └── generate-pdf.ts               Compiles src/data/cadenceDocs.ts into printable PDF
├── server/
│   ├── app.ts                        Express app, security headers, rate limits & all API routes
│   ├── auth.ts                       scrypt password hashing, JWT sign/verify, token rotation
│   ├── db.ts                         Dual MongoDB Mongoose + SQLite preview persistence selector
│   ├── gemini.ts                     Server-side Gemini Reference Card & Stack Search service
│   ├── models/mongooseModels.ts      Mongoose schemas & indexes for 8 core collections
│   ├── sessionMath.ts                Server-authoritative elapsed/pause/overrun/XP math
│   └── storage.ts                    Repository abstraction unifying Mongo & SQLite queries
├── src/
│   ├── assets/images/                2D workstation, multi-device & chronograph double-exposures
│   ├── components/
│   │   ├── ChronographStage2D.tsx    2D scroll-choreographed chronograph, CAD toggle & 1/12x pulse
│   │   ├── DevWorkstationPreview.tsx Dual-screen IDE monitor + clickable 27-key LED keyboard rig
│   │   ├── ChapterView.tsx           Markdown-free structured docs renderer
│   │   ├── FlowDiagram.tsx           Architectural & state-machine SVGs (#0A0908/#EDE3D2/#E12D1C)
│   │   ├── LayoutShell.tsx           Responsive obsidian rail, tablet icon rail & active session bar
│   │   └── RouteExplorer.tsx         Filterable interactive SPA route & guard inspector
│   ├── context/AuthContext.tsx       Client auth state, silent refresh, SPA router & navigation
│   ├── data/cadenceDocs.ts           Single source of truth for Web Docs + PDF export
│   ├── pages/
│   │   ├── AnalyticsLeaderboardPages.tsx  XP accuracy analytics & anti-gaming leaderboard
│   │   ├── AuthPages.tsx             3-step Register, Workstation Login, /signed-out & Onboarding
│   │   ├── DashboardPage.tsx         Command center, live active session banner & recent logs
│   │   ├── DocsPortalPage.tsx        Searchable docs workbench with keycap filters & PDF export
│   │   ├── LandingPage.tsx           2D Chronograph Stage, Parallax Index & Workstation Rig
│   │   ├── PortfolioSettingsPages.tsx Personal/Business portfolio connectors, Webhooks & Pairing
│   │   ├── ProjectsPage.tsx          Personal / Business / Learning workspaces & doc uploader
│   │   ├── SessionEndSummaryPage.tsx Title, learning takeaways & accuracy-weighted XP wrap-up
│   │   ├── SessionFocusPage.tsx      30s heartbeat timer, tool switcher, deep-links & Mobile sync
│   │   ├── SessionPausePage.tsx      Mandatory pause reason + duration gate + alarm watchdog
│   │   ├── SessionPlannerPage.tsx    Mode, multi-category tools & visual checkpoint timeline
│   │   └── ToolsPage.tsx             7-category curated catalog + Google Search stack discovery
│   ├── types/cadence.ts              Shared TypeScript contracts for users, sessions & tools
│   ├── utils/audioAlarm.ts           Web Audio API pause alarm + tactile pitch-tick synthesizer
│   ├── App.tsx                       Route table, auth/onboarding guards & fallback 404 recovery
│   ├── index.css                     2-Neutral + 1-Bold tokens, .cadence-field & .cadence-keycap
│   └── main.tsx                      React 19 root mount
├── index.html                        HTML entry, Bricolage/Jakarta/Mono fonts & #0A0908 canvas
├── server.ts                         Local dev & Node production entrypoint (Express + Vite SSR)
├── vercel.json                       SPA history fallback rewrites + Cron job schedules
└── vite.config.ts                    Vite 8 + Tailwind v4 + asset copy plugin`,
          },
        ],
      },
      {
        id: 'backend-file-inventory',
        title: '12.2 Backend & Infrastructure Files Explained',
        tables: [
          {
            title: 'Server, API & Tooling File Responsibilities',
            headers: ['File Path', 'Layer', 'Primary Responsibility & Key Patterns'],
            rows: [
              [
                'server.ts',
                'Entry / Runtime',
                'Bootstraps Express API on port 3000. In development attaches Vite middlewares for instant SPA serving; in production serves static assets from dist/.',
              ],
              [
                'api/index.ts',
                'Serverless',
                'Vercel Functions entrypoint exporting the lazy-initialized Express app so serverless cold starts reuse pooled database connections.',
              ],
              [
                'server/app.ts',
                'HTTP / Routes',
                'Configures cookie-parser, JSON size limits, CORS/security headers, in-memory rate limiting, and all /api/auth, /api/projects, /api/sessions, /api/tools, /api/extensions, /api/portfolio, and /api/cron endpoints.',
              ],
              [
                'server/auth.ts',
                'Security',
                'Implements Node crypto.scrypt password hashing with random 16-byte salt and timingSafeEqual comparison, HMAC-SHA256 JWT tokens, and Refresh Token rotation with family reuse revocation.',
              ],
              [
                'server/db.ts',
                'Database',
                'Connects to MongoDB Atlas via global cached Mongoose connection when MONGODB_URI is configured, or falls back transparently to an embedded SQLite engine in zero-config preview environments.',
              ],
              [
                'server/storage.ts',
                'Repository',
                'Adapter layer exposing identical async CRUD methods regardless of whether MongoDB or SQLite backs the runtime—preventing database lock-in inside route handlers.',
              ],
              [
                'server/models/mongooseModels.ts',
                'Schemas',
                'Defines Mongoose documents and compound indexes for Users, RefreshTokens, Projects, Tools, Sessions, ActivityPings, PairingCodes, and PortfolioTargets.',
              ],
              [
                'server/sessionMath.ts',
                'Domain Math',
                'Computes authoritative activeSeconds, pausedSeconds, overrunSeconds, checkpoint completion, accuracyPercentage, focusScore, and 500 XP daily-capped rewards from server timestamps.',
              ],
              [
                'server/gemini.ts',
                'AI Utility',
                'Calls @google/genai server-side using GEMINI_API_KEY to distill uploaded PRDs/specs into structured Reference Cards (summary, key specs, pitfalls), falling back gracefully when no key is set.',
              ],
              [
                'scripts/generate-pdf.ts',
                'Build Tool',
                'Compiles CADENCE_CHAPTERS into an A4 multi-chapter PDF with dynamic page numbers, running headers, vector diagrams, and formatted tables.',
              ],
            ],
          },
        ],
      },
      {
        id: 'frontend-file-inventory',
        title: '12.3 Frontend Components, Pages & State Files Explained',
        tables: [
          {
            title: 'Client Architecture File Responsibilities',
            headers: ['File Path', 'Layer', 'Primary Responsibility & UX Role'],
            rows: [
              [
                'src/context/AuthContext.tsx',
                'Global State',
                'Manages authenticated user profile, refresh-token hydration, login/register/logout transitions (navigating to /signed-out), and History API SPA routing without page reloads.',
              ],
              [
                'src/components/ChronographStage2D.tsx',
                '2D Interactive Stage',
                'Pure 2D scroll-choreographed mechanical chronograph combining double-exposure photography, synchronized SVG escapement & rotary crown, CAD wireframe toggle, and 1/12x pulse hold.',
              ],
              [
                'src/components/DevWorkstationPreview.tsx',
                'Interactive Rig',
                'Dual-screen developer IDE monitor + companion tablet/mobile sync readout + interactive 27-key backlit LED mechanical keyboard matrix.',
              ],
              [
                'src/components/LayoutShell.tsx',
                'App Chrome',
                'Obsidian carbon navigation rail, 72px tablet rail, mobile bottom bar, persistent live-session resume bar, user rank indicator, and instant sign-out trigger.',
              ],
              [
                'src/pages/LandingPage.tsx',
                'Public Showcase',
                'Hosts the 2D Chronograph scroll narrative, 4-Layer Architecture grid, asymmetric editorial flow, Interactive Workstation rig, and multi-device showcase.',
              ],
              [
                'src/pages/AuthPages.tsx',
                'Auth Flows',
                '3-step progressive Registration (Identity -> Archetype -> Security) with live profile card preview, Split Studio Login, dedicated /signed-out debrief screen, and 4-stage Onboarding.',
              ],
              [
                'src/pages/SessionPlannerPage.tsx',
                'Core Loop 1',
                'Selects project, allocates checkpoint splits across tools/categories, renders a proportional color-coded timeline bar, and generates server session records.',
              ],
              [
                'src/pages/SessionFocusPage.tsx',
                'Core Loop 2',
                'Runs 30s server heartbeats, IDE deep-link launchers (vscode://, cursor://), automatic breakpoint device reporting (Desktop / Tablet / Mobile), and Reference Card drawer.',
              ],
              [
                'src/pages/SessionPausePage.tsx',
                'Accountability',
                'Enforces mandatory pause reason + duration limit before breaking; triggers Web Audio + Web Push watchdog alarm if break exceeds target.',
              ],
              [
                'src/pages/SessionEndSummaryPage.tsx',
                'Reflection',
                'Collects concrete session title, summary, improvement notes, awards accuracy-weighted XP, and optionally queues Portfolio Sync.',
              ],
              [
                'src/pages/ProjectsPage.tsx & ToolsPage.tsx',
                'Workspace',
                'Manages Personal/Business/Learning repositories, uploads documents for AI Reference Cards, and customizes the 7-category developer tool stack.',
              ],
              [
                'src/pages/AnalyticsLeaderboardPages.tsx & PortfolioSettingsPages.tsx',
                'Insights & Config',
                'Visualizes estimate accuracy trends, rank standings, IDE/Chrome 6-digit extension pairing, and Personal/Business portfolio webhooks.',
              ],
              [
                'src/utils/audioAlarm.ts',
                'Web Audio',
                'Zero-dependency AudioContext synthesizer producing both pause-expiration alarms and subtle 10–14ms tactile click feedback during progressive interactions.',
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'system-design-security',
    number: '13',
    title: 'System Design, Persistence & Security Architecture',
    shortTitle: 'System & Security',
    category: 'Backend & Data',
    summary:
      'Explains why Cadence makes each infrastructure decision: dual MongoDB/SQLite persistence, cryptographic auth hardening, server-authoritative clocks, SSRF defense, and Vercel Cron reliability.',
    subsections: [
      {
        id: 'dual-storage-design',
        title: '13.1 Dual-Engine Storage Strategy (MongoDB Atlas + SQLite Fallback)',
        paragraphs: [
          'A frequent failure point when demonstrating MERN applications across local dev, CI, and cloud sandboxes is immediate crash when MONGODB_URI is absent or firewalled. Cadence avoids brittle startup crashes by abstracting persistence behind server/storage.ts.',
          'When MONGODB_URI is defined, server/db.ts establishes a cached Mongoose connection pool suitable for serverless reuse. When running locally without external credentials, Cadence seamlessly provisions a local SQLite database enforcing identical schema constraints, allowing full registration, sessions, XP calculation, and device handoffs out of the box.',
        ],
        callout: {
          label: 'ARCHITECTURAL PRINCIPLE — REPOSITORY PATTERN',
          body: 'Express route handlers in server/app.ts never import Mongoose models directly; they call typed methods on storage.ts. Swapping between MongoDB, SQLite, or PostgreSQL requires changing only the storage implementation.',
        },
      },
      {
        id: 'security-controls',
        title: '13.2 Defense-in-Depth Security Controls',
        tables: [
          {
            title: 'Implemented Security Controls & Threat Mitigations',
            headers: ['Threat Vector', 'Mitigation in Cadence', 'Exact Implementation Detail'],
            rows: [
              [
                'Password Cracking / Rainbow Tables',
                'Per-user random salt + scrypt KDF',
                'server/auth.ts generates 16 random hex bytes per user and runs crypto.scryptSync(password, salt, 64), compared via crypto.timingSafeEqual to defeat timing side-channels.',
              ],
              [
                'Stolen Refresh Token Replay',
                'Token Family Rotation & Reuse Revocation',
                'Each refresh exchange marks the presented token used and issues a fresh child token in the same familyId. Presenting an already-used token immediately revokes the entire family.',
              ],
              [
                'Client Timer Cheating / XP Farming',
                'Server-Authoritative Clock + Daily Cap',
                'Browser countdowns are strictly visual projections. server/sessionMath.ts derives elapsed/pause seconds solely from DB timestamps and enforces a 500 XP daily soft cap.',
              ],
              [
                'Open Redirects on Auth Callback',
                'Relative Path Allowlist',
                'sanitizeRedirect() verifies post-login destinations start with a single leading slash (/) and rejects protocol-relative (//) or external URLs.',
              ],
              [
                'SSRF via Portfolio Webhooks',
                'Private IP & Loopback Blocklist',
                'Portfolio target registration validates HTTPS/HTTP schemes and rejects localhost, 127.0.0.1, ::1, and RFC-1918 private network CIDR ranges.',
              ],
              [
                'Abusive Cron or Brute Force',
                'CRON_SECRET Bearer + Rate Limiter',
                'Cron routes verify Bearer CRON_SECRET; auth endpoints enforce sliding-window request rate limits and HttpOnly/SameSite cookie flags.',
              ],
            ],
          },
        ],
      },
      {
        id: 'clock-and-lapse',
        title: '13.3 Server-Authoritative Clock & Tab-Close Lapse Guarantee',
        paragraphs: [
          'If a developer closes their browser tab mid-session, client JavaScript timers vanish immediately. Cadence solves this with two cooperating mechanisms: a navigator.sendBeacon flush on pagehide/visibilitychange for clean exits, and a server-side lastHeartbeatAt timestamp updated every 30 seconds while active.',
          'Whenever /api/cron/lapse-check runs (or when the user re-opens their workspace), any active session whose lastHeartbeatAt exceeds the 5-minute grace window is automatically closed with endedAt = lastHeartbeatAt. Work performed in VS Code or Cursor continues undisturbed on disk while the web log records an exact, uninflated duration.',
        ],
      },
    ],
  },
  {
    id: 'uiux-3d-rationale',
    number: '14',
    title: 'UI/UX Design System & 2D Chronograph Engineering Meaning',
    shortTitle: 'UI/UX & 2D Design',
    category: 'Codebase & UI/UX',
    summary:
      'Deep breakdown of every visual, spatial, typographic, and 2D motion decision—explaining WHY Cadence enforces a strict 2-Neutral + 1-Bold palette, borderless gradient blending, and tactile developer hardware metaphors.',
    subsections: [
      {
        id: 'obsidian-palette-typography',
        title: '14.1 2-Neutral + 1-Bold Color System & Anti-Slop Discipline',
        paragraphs: [
          'Generic AI-generated developer apps rely on saturated blue/purple gradients, pure white boxes, and repetitive card borders that fatigue eyes during long coding sprints. Cadence enforces a disciplined 2-Neutral + 1-Bold palette with zero blue anywhere: warm Obsidian Carbon, Warm Sandstone, and Vermilion Crimson Ember.',
        ],
        tables: [
          {
            title: 'Color Tokens & Optical Ergonomics',
            headers: ['Token / Surface', 'Hex Value', 'Intentional Design Meaning'],
            rows: [
              ['Neutral 1 — Obsidian Carbon Canvas', '#0A0908', 'Warm volcanic obsidian eliminates cold blue glare and blends seamlessly with dark architectural photography via radial feathering masks.'],
              ['Neutral 1 — Elevated Smoked Slate', '#13110F -> #1C1815', 'Borderless editorial bands and hairline dividers separate sections cleanly without rectangular boxed card outlines.'],
              ['Neutral 2 — Warm Sandstone & Ash', '#EDE3D2 / #A69B8D', 'Soft parchment-tinted typography prevents stark #FFFFFF halation on dark surfaces while maintaining WCAG AA contrast.'],
              ['Bold Accent — Vermilion Ember', '#E12D1C', 'Used with surgical precision for active chronometer sweeps, primary CTAs, LED key-switch illumination, and left-datum editorial rules (.cadence-seam).'],
              ['Typography Pairing', 'Bricolage Grotesque + Plus Jakarta Sans + JetBrains Mono', 'Expressive editorial display headlines paired with clean geometric body text and tabular monospace timer figures that never jitter at 1Hz ticks.'],
            ],
          },
        ],
      },
      {
        id: 'chronograph-2d-pipeline',
        title: '14.2 2D Scroll-Choreographed Chronograph & Workstation Architecture',
        paragraphs: [
          'Instead of shipping a heavy WebGL 3D runtime that risks context loss or stalls software renderers, ChronographStage2D.tsx and DevWorkstationPreview.tsx achieve tactile mechanical depth using layered 2D double-exposure artwork, compositor-only transforms, and precision SVG horology.',
        ],
        orderedList: [
          'Double-Exposure Mask Feathering (.mask-fade-bottom / .mask-fade-radial / .mask-fade-right): Blends macro titanium chronographs and workstation photography directly into #0A0908 obsidian haze without rectangular frame edges.',
          'Deterministic Scroll-Beat State Machine: Five <section data-beat="..."> narrative anchors synchronize cleanly with window scroll offsets, shifting camera zoom, rotation, CAD blueprint overlays, and Beat 03 two-column exploded callouts.',
          'Hold-to-1/12x-Pulse Escapement: Pressing and holding the inspection control slows angular velocity smoothly to 1/12th cadence while triggering pitch-shifted Web Audio mechanical ticks.',
          'Interactive LED Keycap Matrix (.cadence-keycap): Replaces generic pill tags with tactile CNC key-switches and custom developer tool keys (VS Code, Cursor, Claude, Figma, Vercel) that illuminate with vermilion underglow on click.',
          'Borderless Underline Form Architecture (.cadence-field): Replaces boxy form inputs across Auth, Project Setup, and Session Planning with sleek datum tracks that sweep vermilion on focus.',
        ],
      },
      {
        id: 'modern-web-qualifications',
        title: '14.3 Interactive Patterns & Progressive Auth UX',
        tables: [
          {
            title: 'Interactive Patterns & Why They Improve Comprehension',
            headers: ['Pattern', 'Implementation in Cadence', 'Functional User Benefit'],
            rows: [
              [
                '2D Mechanical Hero',
                'Scroll-choreographed 2D Chronograph above the fold responding to pointer tilt + Hold 1/12x pulse.',
                'Communicates "precision time & hardware discipline" immediately at 60fps on every GPU and mobile browser.',
              ],
              [
                'Editorial Scroll Beats',
                'Narrative blocks scroll beside a fixed 2D chronograph stage inside overflow-x-clip containers.',
                'Mechanically demonstrates checkpoint planning, CAD blueprint inspection, and pause accountability.',
              ],
              [
                'Interactive Workstation Rig',
                'Dual IDE monitor preview synced with clickable 27-key backlit LED mechanical keyboard matrix.',
                'Showcases live workspace context from dual displays down to individual developer tool key-switches.',
              ],
              [
                'Borderless Underline Forms',
                'Auth, Onboarding, Project Creation, and Session Planning use .cadence-field + .cadence-keycap.',
                'Eliminates generic SaaS form fatigue while maintaining explicit accessible focus indicators.',
              ],
              [
                'Progressive Registration & Sign-Out',
                '3-step Register (Identity -> Archetype -> Security) + live preview card + dedicated /signed-out debrief.',
                'Reduces cognitive load during sign-up and honors session closure cleanly instead of abruptly dumping users to login.',
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'instructor-viva-qa',
    number: '15',
    title: 'Instructor Defense & Technical Viva Q&A Matrix',
    shortTitle: 'Instructor Q&A',
    category: 'Codebase & UI/UX',
    summary:
      'Direct, evidence-backed answers to anticipated instructor questions across any random file, architectural boundary, database schema, security guard, or UI/2D design decision.',
    subsections: [
      {
        id: 'backend-security-qa',
        title: '15.1 Backend, Database & Security Questions',
        tables: [
          {
            title: 'Viva Readiness — Backend & Auth',
            headers: ['Instructor Question', 'Confident Technical Answer (with Code Evidence)'],
            rows: [
              [
                'How do you prevent users from faking session durations or XP in DevTools?',
                'The client timer in SessionFocusPage.tsx is display-only. Server timestamps (startedAt, pausedAt, lastHeartbeatAt) live in MongoDB/SQLite, and server/sessionMath.ts recalculates activeSeconds, accuracyPercentage, and daily-capped 500 XP strictly server-side.',
              ],
              [
                'What happens if a developer closes their browser without clicking End Session?',
                'Two safeguards fire: pagehide dispatches navigator.sendBeacon to persist immediate closure, and /api/cron/lapse-check closes any active session whose 30s heartbeat stops for over 5 minutes, setting endedAt = lastHeartbeatAt so IDE work is never lost and hours are never inflated.',
              ],
              [
                'Why use scrypt instead of plain SHA-256, and how do you mitigate timing attacks?',
                'SHA-256 is too fast and crackable on GPUs. server/auth.ts uses memory-hard Node crypto.scryptSync with a unique 16-byte random salt per user, and verifies hashes with constant-time crypto.timingSafeEqual.',
              ],
              [
                'How does your MERN app avoid crashing when MongoDB credentials are missing?',
                'server/storage.ts implements a Repository pattern backed by server/db.ts. When MONGODB_URI is present it connects via cached Mongoose; otherwise it switches automatically to an embedded SQLite adapter exposing the exact same async interface.',
              ],
              [
                'How do you protect against compromised Refresh Tokens or SSRF on webhooks?',
                'Refresh tokens track a familyId and used flag; replaying a rotated token revokes the entire family. Portfolio webhook URLs are checked against a private-IP/loopback blocklist before saving or dispatching.',
              ],
            ],
          },
        ],
      },
      {
        id: 'frontend-2d-ux-qa',
        title: '15.2 Frontend, 2D Chronograph, Routing & UI/UX Questions',
        tables: [
          {
            title: 'Viva Readiness — Frontend & UX',
            headers: ['Instructor Question', 'Confident Technical Answer (with Code Evidence)'],
            rows: [
              [
                'Why did you choose a 2D layered Chronograph over a 3D WebGL canvas?',
                'A 2D double-exposure + SVG escapement stage eliminates WebGL context loss on low-power devices, removes large 3D bundle overhead, guarantees instant First Contentful Paint, and supports crisp radial mask feathering directly into the #0A0908 canvas.',
              ],
              [
                'How does sticky scroll choreography work without horizontal overflow breaking?',
                'Using overflow-x-hidden breaks CSS position: sticky in browsers, whereas overflow-x-clip clips horizontal bleed while preserving sticky rails. Beat sections drive deterministic state updates in ChronographStage2D.tsx.',
              ],
              [
                'Why enforce a 2-Neutral + 1-Bold color system with zero blue?',
                'Restricting the palette to Obsidian Carbon (#0A0908), Warm Sandstone (#EDE3D2), and Vermilion Ember (#E12D1C) prevents visual clutter, eliminates cold blue eye strain, and makes active session telemetry unmistakable at a glance.',
              ],
              [
                'How do borderless forms and keycap selectors maintain accessibility?',
                'Each .cadence-field pairs an explicit label with a high-contrast #E12D1C focus bottom-datum glow, and .cadence-keycap buttons use semantic <button> elements with data-active states and prefers-reduced-motion fallbacks.',
              ],
              [
                'Why does Logout route to /signed-out instead of immediately redirecting to /login?',
                'A dedicated /signed-out debrief confirms clean local state teardown, reminds the user that server-side session heartbeats remain safe, and offers deliberate paths back to /login or the showcase.',
              ],
              [
                'How do desktop browsers launch VS Code or Cursor, and why not read open tabs directly?',
                'Browsers sandbox local OS inspection. Cadence launches editors via URI schemes (vscode://, cursor://) for workspace handoff and pairs a minimal metadata-only VS Code API extension + Chrome MV3 extension via 6-digit codes for accurate live telemetry.',
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'v13-architecture',
    number: '16',
    title: 'v1.3.0 Role Onboarding, Lenses, Learning & Practice Hubs, Companion Launcher & Search',
    shortTitle: 'v1.3.0 Release Spec',
    category: 'Backend & Data',
    summary:
      'Documents every addition shipped in Cadence v1.3.0 across Phases A, B, and C: 12-track role-aware onboarding, 6 intent dashboard lenses, K1-K5 stability hardening, 41 curated learning resources, 14 guided practice drills, pop-out/split/embed launcher, and userId-scoped workspace search.',
    subsections: [
      {
        id: 'v13-onboarding-lenses-k1-k5',
        title: '16.1 Role Onboarding, 6 Dashboard Lenses & K1-K5 Hardening',
        paragraphs: [
          'Cadence v1.3.0 upgrades new-user onboarding to a 6-step role-aware calibration pipeline covering 12 specialized developer tracks, skill depth, 6 builder intents (learner, student, job_seeker, freelancer, employed, founder), programming and content languages, pricing/student filters, and starter tool/path selection.',
          'Rather than duplicating dashboard components, server/dashboardEngine.ts computes a lens-weighted 3-column layout and widget payload from GET /api/dashboard?lens=..., allowing a user to pivot views across Learner, Student, Job Seeker, Freelancer, Employed, and Founder without losing their session history.',
        ],
        tables: [
          {
            title: 'v1.3.0 Known-Issue Hardening (K1-K5) & Storage Parity',
            headers: ['Code', 'Area', 'Implemented Safeguard'],
            rows: [
              ['K1', 'Zod Schema Validation & Error Hygiene', 'Every onboarding, profile, resource progress, practice drill, and application tracker endpoint validates payloads through Zod schemas with strict length/enum bounds.'],
              ['K2', 'IDE Telemetry Slug Normalization', 'server/storage.ts resolves incoming IDE appName aliases (e.g. Visual Studio Code -> vscode) and falls back cleanly to custom rather than rejecting payloads.'],
              ['K3', 'Lazy Stale Session Finalization', 'Active session, dashboard, and session history reads run finalizeStaleSessionIfNeeded() using the configurable lapseGraceMin threshold (default 5 min).'],
              ['K4', 'Truthful Persistence Banner', 'GET /api/health and /api/dashboard surface engine: sqlite_preview + demoBanner flags when MONGODB_URI is absent so local preview resets are transparent.'],
              ['K5', 'Persistent Rate Limiting', 'server/rateLimit.ts backs sliding windows via Mongoose TTL documents (RateLimitModel) or SQLite rate_limits rows instead of brittle process-only maps.'],
            ],
          },
        ],
      },
      {
        id: 'v13-hubs-launcher-search',
        title: '16.2 Learning Hub, Practice Drills, Companion Launcher & Search',
        paragraphs: [
          'The Learning Hub (/learn, /learn/:slug) and Guided Practice Hub (/practice, /practice/:slug) share seeded relational/document catalogs synchronized idempotently by scripts/seed.ts and ensureStorageReady() across both Mongoose and SQLite adapters.',
          'External platforms frequently forbid inside-page iframes via X-Frame-Options or CSP frame-ancestors headers, and browsers can block programmatic pop-out windows. Cadence stores verifiable embeddable metadata (yes, no, or unknown—never fabricated), attempts window.open() at user-saved dimensions, and falls back immediately to the Split/Tab drawer when blocked.',
        ],
        tables: [
          {
            title: 'v1.3.0 Expanded Seed Catalogs & Routes',
            headers: ['Module / Route', 'Backing Storage', 'Capabilities'],
            rows: [
              ['/learn & /learn/:slug', 'learning_paths (22) + learning_resources (41) + resource_progress', 'Filter by track, level, code/content language, free/student pricing; check off steps; start checkpointed learning sessions.'],
              ['/practice & /practice/:slug', 'practice_drills (14) + resource_progress (practice:<slug>)', 'Filter coding, SQL, security, architecture, and QA drills; verify step prompts; log verification notes; launch timed sessions.'],
              ['ResourceLauncherDrawer', 'user.profile.resourceOpenMode & resourceWindowPrefs', 'Supports Pop-out, Split pane, Embed, and New tab with saved window size presets, study status, and popup-blocker recovery.'],
              ['/search & Cmd+K Modal', 'GET /api/search?q=...', 'Searches learning paths, resources, practice drills, seeded + own custom tools, and strictly userId-scoped projects and sessions.'],
            ],
          },
        ],
      },
      {
        id: 'v13-viva-qa',
        title: '16.3 v1.3.0 Release Defense & Technical Viva Q&A',
        tables: [
          {
            title: 'Viva Readiness — v1.3.0 Upgrades',
            headers: ['Reviewer Question', 'Evidence-Backed Technical Answer'],
            rows: [
              [
                'How does hybrid user migration upgrade existing accounts without breaking logins?',
                'mapSqliteUser and mapMongoUser invoke migrateLegacyUserToV13(user, sessionCount), lazily populating the v1.3.0 profile sub-document while inferring starter tracks from existing roles and respecting legacy active session history.',
              ],
              [
                'How do you guarantee /api/search cannot expose another account’s projects or sessions?',
                'GET /api/search requires a verified JWT (requireAuth). In server/storage.ts, queries for projects and sessions filter unconditionally on userId = req.user.id, tools filter to (isSeeded = true OR createdBy = userId), and Mongo regex literals are escaped to prevent regex injection.',
              ],
              [
                'Why do some learning resources open in a pop-out or new tab instead of an inline iframe?',
                'Hosts like PortSwigger, Mozilla MDN, GitHub, and Expo send X-Frame-Options / CSP frame-ancestors headers that browsers block inside iframes. Marking those explicitly as embeddable: "no" lets ResourceLauncherDrawer offer an honest sized companion window or new tab immediately instead of a broken grey frame.',
              ],
              [
                'How is progress shared across learning paths, resources, and practice drills without table bloat?',
                'ResourceProgressModel / resource_progress keys progress records uniquely by (userId, resourceSlug), storing resource progress under <slug>, path steps under path:<slug>, and drill verification steps under practice:<slug> with linkedSessionId provenance.',
              ],
            ],
          },
        ],
      },
    ],
  },
];

