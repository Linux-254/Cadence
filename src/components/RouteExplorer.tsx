import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { playTactileClick } from '../utils/audioAlarm';

type SimAuthState = 'guest' | 'authed_unboarded' | 'authed_ready' | 'session_paused' | 'session_completed';

interface RouteRule {
  path: string;
  label: string;
  evaluate: (state: SimAuthState) => {
    outcome: 'Allow Render' | 'Redirect';
    destination: string;
    reason: string;
  };
}

const ROUTE_RULES: RouteRule[] = [
  {
    path: '/',
    label: 'Landing Page',
    evaluate: (s) =>
      s === 'guest'
        ? { outcome: 'Allow Render', destination: '/', reason: 'Public 2D Chronograph & Workstation showcase rendered for unauthenticated visitor.' }
        : s === 'authed_unboarded'
          ? { outcome: 'Redirect', destination: '/onboarding', reason: 'Authenticated user has not completed 4-step onboarding.' }
          : { outcome: 'Redirect', destination: '/dashboard', reason: 'Authenticated users bypass marketing landing page.' },
  },
  {
    path: '/register',
    label: 'Registration',
    evaluate: (s) =>
      s === 'guest'
        ? { outcome: 'Allow Render', destination: '/register', reason: 'Shows 3-step progressive registration with scrypt hashing & terms gate.' }
        : { outcome: 'Redirect', destination: '/dashboard', reason: 'GuestOnly guard prevents already signed-in users from re-registering.' },
  },
  {
    path: '/dashboard',
    label: 'Main Dashboard',
    evaluate: (s) => {
      if (s === 'guest') return { outcome: 'Redirect', destination: '/login?redirect=%2Fdashboard', reason: 'RequireAuth guard preserves target URL in ?redirect query.' };
      if (s === 'authed_unboarded') return { outcome: 'Redirect', destination: '/onboarding', reason: 'RequireOnboarding guard enforces initial stack & timezone setup.' };
      return { outcome: 'Allow Render', destination: '/dashboard', reason: 'Renders workspace overview (plus live Resume Banner if session active/paused).' };
    },
  },
  {
    path: '/sessions/new',
    label: 'Session Planner',
    evaluate: (s) => {
      if (s === 'guest') return { outcome: 'Redirect', destination: '/login?redirect=%2Fsessions%2Fnew', reason: 'RequireAuth guard redirects to login first.' };
      if (s === 'authed_unboarded') return { outcome: 'Redirect', destination: '/onboarding', reason: 'RequireOnboarding guard completes setup before first session.' };
      if (s === 'session_paused') return { outcome: 'Redirect', destination: '/session/sess_89/pause', reason: 'Single-open-session constraint redirects to active/paused session.' };
      return { outcome: 'Allow Render', destination: '/sessions/new', reason: 'User chooses Project, Mode, Categories, Tools, and Checkpoint Splits.' };
    },
  },
  {
    path: '/session/sess_89/focus',
    label: 'Live Focus View',
    evaluate: (s) => {
      if (s === 'guest') return { outcome: 'Redirect', destination: '/login?redirect=%2Fsession%2Fsess_89%2Ffocus', reason: 'RequireAuth guard protects session ownership.' };
      if (s === 'session_paused') return { outcome: 'Redirect', destination: '/session/sess_89/pause', reason: 'Session status is paused; enforces mandatory pause lock screen.' };
      if (s === 'session_completed') return { outcome: 'Redirect', destination: '/session/sess_89/summary', reason: 'Completed/lapsed sessions cannot re-enter timer; shows summary & XP.' };
      if (s === 'authed_unboarded') return { outcome: 'Redirect', destination: '/onboarding', reason: 'Onboarding must complete before executing sessions.' };
      return { outcome: 'Allow Render', destination: '/session/sess_89/focus', reason: 'Renders live server-synced timer, IDE deep links, and Document Summary Card.' };
    },
  },
];

const STATE_OPTIONS: { id: SimAuthState; label: string }[] = [
  { id: 'guest', label: 'Guest (No JWT)' },
  { id: 'authed_unboarded', label: 'Signed In · Unboarded' },
  { id: 'authed_ready', label: 'Signed In · Active Session' },
  { id: 'session_paused', label: 'Session Paused' },
  { id: 'session_completed', label: 'Session Completed' },
];

export const RouteExplorer: React.FC = () => {
  const [simState, setSimState] = useState<SimAuthState>('guest');
  const [selectedPath, setSelectedPath] = useState<string>('/dashboard');

  const activeRule = ROUTE_RULES.find((r) => r.path === selectedPath) || ROUTE_RULES[0];
  const result = activeRule.evaluate(simState);

  return (
    <div className="editorial-band-ember hairline-top hairline-bottom my-6 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[#EDE3D2]">Interactive Route &amp; Redirect Guard Simulator</h4>
          <p className="text-xs text-[#A69B8D]">
            Select an authentication or session state and target route to trace the exact guard outcome.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
          1. Simulated User &amp; Session State
        </div>
        <div className="flex flex-wrap gap-2">
          {STATE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              data-active={simState === opt.id ? 'true' : 'false'}
              onClick={() => {
                playTactileClick('tick');
                setSimState(opt.id);
              }}
              className="cadence-keycap whitespace-nowrap shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium text-[#EDE3D2]"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
          2. Requested Route
        </div>
        <div className="flex flex-wrap gap-2">
          {ROUTE_RULES.map((rule) => (
            <button
              key={rule.path}
              type="button"
              data-active={selectedPath === rule.path ? 'true' : 'false'}
              onClick={() => {
                playTactileClick('tick');
                setSelectedPath(rule.path);
              }}
              className="cadence-keycap whitespace-nowrap shrink-0 rounded-xl px-3 py-1.5 font-mono text-xs text-[#EDE3D2]"
            >
              {rule.path}
            </button>
          ))}
        </div>
      </div>

      <div className="cadence-seam flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className={result.outcome === 'Allow Render' ? 'text-[#EDE3D2]' : 'text-[#E12D1C]'}>
              {result.outcome}
            </span>
            <span aria-hidden="true" className="text-[#6E655B]">·</span>
            <span className="font-mono text-[#EDE3D2]">{activeRule.path}</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#A69B8D]" aria-hidden="true" />
            <span className="font-mono text-[#E12D1C]">{result.destination}</span>
          </div>
          <p className="text-xs text-[#A69B8D]">{result.reason}</p>
        </div>
      </div>
    </div>
  );
};
