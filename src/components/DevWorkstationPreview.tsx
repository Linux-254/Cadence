import React, { useEffect, useState } from 'react';
import {
  Activity,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Terminal as TerminalIcon,
  Zap,
} from 'lucide-react';
import { playTactileTick } from '../utils/audioAlarm';
import { WorkstationStudioModal } from './WorkstationStudioModal';

interface DevWorkstationPreviewProps {
  activeTools?: string[];
  developerName?: string;
  roleLabel?: string;
  compact?: boolean;
}

interface PersonaPreset {
  id: string;
  label: string;
  role: string;
  project: string;
  stack: string[];
  checkpoint: string;
  plannedMin: number;
  activeMin: number;
  accuracy: number;
  defaultKey: string;
}

const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: 'ai_builder',
    label: 'AI Builder',
    role: 'Vibe Coder / AI Studio Architect',
    project: 'Autonomous Agent Engine & Live Decider',
    stack: ['Google AI Studio', 'Gemini API', 'TypeScript', 'Node.js'],
    checkpoint: '02 Prompt Decider Calibration',
    plannedMin: 45,
    activeMin: 28,
    accuracy: 94,
    defaultKey: 'G-AI',
  },
  {
    id: 'bootcamp',
    label: 'Bootcamp Student',
    role: 'CS & Full-Stack Apprentice',
    project: 'E-Commerce Microservices & Auth Gateway',
    stack: ['PostgreSQL', 'Express', 'React 19', 'Vite'],
    checkpoint: '01 Relational Schema & JWT Flow',
    plannedMin: 60,
    activeMin: 42,
    accuracy: 89,
    defaultKey: 'SQL',
  },
  {
    id: 'freelancer',
    label: 'Freelance Pro',
    role: 'Independent Software Consultant',
    project: 'Client SaaS Billing & Telemetry Portal',
    stack: ['Stripe', 'Docker', 'Antigravity', 'Tailwind v4'],
    checkpoint: '03 Webhook Security & Signatures',
    plannedMin: 90,
    activeMin: 64,
    accuracy: 97,
    defaultKey: 'ANT',
  },
  {
    id: 'founder',
    label: 'Indie Founder',
    role: 'Startup CTO & Multi-Repo Lead',
    project: 'Cadence Enterprise Multi-Cloud Hub',
    stack: ['Kubernetes', 'Redis', 'Python', 'Go'],
    checkpoint: '04 Distributed Event Sweep & Cron',
    plannedMin: 120,
    activeMin: 85,
    accuracy: 92,
    defaultKey: 'TRM',
  },
];

const KEY_ROWS = [
  [
    { key: 'ESC', label: 'Esc', kind: 'fn' },
    { key: 'RUN', label: 'Run', kind: 'action', tab: 'editor' },
    { key: 'SQL', label: 'SQL', kind: 'tool', tab: 'sql' },
    { key: 'TRM', label: 'CLI', kind: 'tool', tab: 'terminal' },
    { key: 'G-AI', label: 'AI', kind: 'tool', tab: 'browser' },
    { key: 'ANT', label: 'AntiG', kind: 'tool', tab: 'browser' },
    { key: 'VSC', label: 'IDE', kind: 'tool', tab: 'editor' },
    { key: 'BRK', label: 'Pause', kind: 'action' },
    { key: 'SYNC', label: 'Sync', kind: 'fn' },
  ],
  [
    { key: 'TAB', label: 'Tab', kind: 'fn' },
    { key: 'DEV', label: 'Dev', kind: 'cat' },
    { key: 'DSN', label: 'Dsn', kind: 'cat' },
    { key: 'RES', label: 'Res', kind: 'cat' },
    { key: 'REV', label: 'Rev', kind: 'cat' },
    { key: 'TST', label: 'Test', kind: 'cat' },
    { key: 'DEP', label: 'Dep', kind: 'cat' },
    { key: 'CLI', label: 'Client', kind: 'cat' },
    { key: 'HUD', label: 'HUD', kind: 'action' },
  ],
];

export const DevWorkstationPreview: React.FC<DevWorkstationPreviewProps> = ({
  developerName = 'Studio Builder',
  roleLabel = 'Full-Stack Developer',
  compact = false,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaPreset>(PERSONA_PRESETS[0]);
  const [isRunning, setIsRunning] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(28 * 60 + 14);
  const [activeKey, setActiveKey] = useState<string>('G-AI');
  const [activeZone, setActiveZone] = useState<'monitors' | 'keyboard' | 'terminal'>('keyboard');
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<'browser' | 'editor' | 'sql' | 'terminal'>('editor');
  const [studioToolName, setStudioToolName] = useState('Cadence In-Platform Studio');

  const [terminalFeed, setTerminalFeed] = useState<string[]>([
    'Cadence Dev Workstation Bridge [v1.3.0 · Server Engine Online]',
    '● Heartbeat 30s: MongoDB & SQLite parity synchronized.',
    '✓ Process hook attached to VS Code and In-Platform Studio.',
    '→ Active sprint: Autonomous Agent Engine & Live Decider.',
  ]);

  // Live timer tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectPersona = (p: PersonaPreset) => {
    playTactileTick(740);
    setSelectedPersona(p);
    setActiveKey(p.defaultKey);
    setSecondsElapsed(p.activeMin * 60);
    setTerminalFeed((prev) => [
      ...prev.slice(-3),
      `★ Persona switched to: ${p.label} (${p.role})`,
      `→ Stack initialized: ${p.stack.join(', ')}`,
      `✓ Checkpoint loaded: ${p.checkpoint} [${p.plannedMin}m budget]`,
    ]);
  };

  const handleKeyPress = (k: typeof KEY_ROWS[0][0]) => {
    playTactileTick(820);
    setActiveKey(k.key);

    if (k.key === 'BRK') {
      setIsRunning((prev) => !prev);
      setTerminalFeed((prev) => [
        ...prev.slice(-3),
        `! Break gate triggered: ${isRunning ? 'Session PAUSED' : 'Session RESUMED'}.`,
      ]);
      return;
    }

    if (k.key === 'RUN') {
      setStudioToolName('TypeScript Code Runner');
      setStudioTab('editor');
      setStudioOpen(true);
      return;
    }

    if (k.key === 'SQL') {
      setStudioToolName('In-Platform SQL Console');
      setStudioTab('sql');
      setStudioOpen(true);
      return;
    }

    if (k.key === 'TRM') {
      setStudioToolName('In-Platform Terminal CLI');
      setStudioTab('terminal');
      setStudioOpen(true);
      return;
    }

    if (k.key === 'G-AI') {
      setStudioToolName('Google AI Studio Sandbox');
      setStudioTab('browser');
      setStudioOpen(true);
      return;
    }

    if (k.key === 'ANT') {
      setStudioToolName('Antigravity Studio');
      setStudioTab('browser');
      setStudioOpen(true);
      return;
    }

    setTerminalFeed((prev) => [
      ...prev.slice(-3),
      `> Key [${k.key}] activated · Triggered telemetry slice for category: ${k.label}.`,
    ]);
  };

  const openStudioWith = (tab: 'browser' | 'editor' | 'sql' | 'terminal', name: string) => {
    playTactileTick(780);
    setStudioToolName(name);
    setStudioTab(tab);
    setStudioOpen(true);
  };

  return (
    <div className="relative space-y-6 py-2 select-none">
      {/* Top Holographic Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 hairline-bottom">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#E12D1C] animate-pulse" />
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#E12D1C] flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            <span>Workstation Command Deck · {selectedPersona.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
            ● 30s Server Heartbeat
          </span>
          <span className="font-mono text-[10px] text-[#A69B8D] hidden sm:inline">
            {roleLabel || selectedPersona.role}
          </span>
        </div>
      </div>

      {/* Interactive Persona Tabs (Switch Workstation Context) */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {PERSONA_PRESETS.map((p) => {
              const active = selectedPersona.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPersona(p)}
                  data-active={active}
                  className={`cadence-keycap rounded-lg px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase transition-all ${
                    active ? 'text-[#EDE3D2] border-[#E12D1C] bg-[#E12D1C]/15 font-semibold' : 'text-[#A69B8D] hover:text-[#EDE3D2]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => openStudioWith('editor', 'Cadence Dev Workstation')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#EDE3D2] shadow-sm hover:brightness-110"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Open Studio Workbench</span>
          </button>
        </div>
      )}

      {/* Main Dual Screen & Telemetry Visualizer Strip */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Primary Display: Interactive Sprint & Checkpoints */}
        <div
          onClick={() => setActiveZone('monitors')}
          className={`lg:col-span-8 rounded-2xl bg-[#0C0B0A] border p-5 transition-all cursor-pointer ${
            activeZone === 'monitors' ? 'border-[#E12D1C]/50 shadow-[0_0_30px_rgba(225,45,28,0.08)]' : 'border-[#EDE3D2]/10 hover:border-[#EDE3D2]/25'
          }`}
        >
          <div className="flex items-center justify-between pb-3 hairline-bottom text-xs font-mono">
            <span className="flex items-center gap-2 text-[#EDE3D2] font-semibold">
              <Monitor className="h-4 w-4 text-[#E12D1C]" />
              <span>PRIMARY ULTRAWIDE WORKSPACE</span>
            </span>
            <span className="text-[#A69B8D] text-[10px] truncate max-w-[200px]">
              {selectedPersona.project}
            </span>
          </div>

          {/* Live Checkpoint Progress & Timer Bar */}
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase text-[#E12D1C]">Active Checkpoint</span>
                <div className="font-display text-sm font-bold text-[#EDE3D2]">
                  {selectedPersona.checkpoint}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-mono text-[10px] text-[#A69B8D]">Focus Ratio</span>
                  <div className="font-mono text-sm font-bold text-emerald-400">96.4%</div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] text-[#A69B8D]">Accuracy Calib</span>
                  <div className="font-mono text-sm font-bold text-[#EDE3D2]">{selectedPersona.accuracy}%</div>
                </div>
              </div>
            </div>

            {/* Proportional Timeline Visualizer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[10px] text-[#A69B8D]">
                <span>Elapsed: {formatTimer(secondsElapsed)}</span>
                <span>Budget: {selectedPersona.plannedMin}m (Est)</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#1C1815] border border-[#EDE3D2]/10 gap-0.5 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E12D1C] to-[#ff5722] transition-all duration-700 shadow-[0_0_10px_rgba(225,45,28,0.5)]"
                  style={{ width: `${Math.min(100, Math.round((secondsElapsed / (selectedPersona.plannedMin * 60)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Active Stack Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="font-mono text-[10px] text-[#6E655B] mr-1">Stack:</span>
              {selectedPersona.stack.map((item) => (
                <span
                  key={item}
                  className="rounded bg-[#EDE3D2]/5 border border-[#EDE3D2]/10 px-2 py-0.5 font-mono text-[10px] text-[#EDE3D2]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Companion Screen: Timer Controls & Quick Launch */}
        <div
          onClick={() => setActiveZone('terminal')}
          className={`lg:col-span-4 rounded-2xl bg-[#0C0B0A] border p-5 flex flex-col justify-between transition-all cursor-pointer ${
            activeZone === 'terminal' ? 'border-[#E12D1C]/50 shadow-[0_0_30px_rgba(225,45,28,0.08)]' : 'border-[#EDE3D2]/10 hover:border-[#EDE3D2]/25'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#EDE3D2]">
            <span className="flex items-center gap-1.5">
              <Tablet className="h-4 w-4 text-[#E12D1C]" />
              <Smartphone className="h-4 w-4 text-[#A69B8D]" />
              <span className="text-[10px]">DOCKED COMPANION</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400">● LIVE</span>
          </div>

          <div className="my-auto py-3 text-center space-y-1">
            <div className="font-mono text-3xl font-bold text-[#EDE3D2] tracking-wider tabular-nums">
              {formatTimer(secondsElapsed)}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#E12D1C]">
              {isRunning ? 'CHRONOGRAPH ACTIVE' : 'PAUSED AT BREAK GATE'}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#EDE3D2]/10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playTactileTick(740);
                setIsRunning((prev) => !prev);
              }}
              className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#EDE3D2]"
            >
              {isRunning ? <Pause className="h-3 w-3 text-[#E12D1C]" /> : <Play className="h-3 w-3 text-[#E12D1C]" />}
              <span>{isRunning ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playTactileTick(740);
                setSecondsElapsed(0);
              }}
              className="cadence-keycap rounded-lg p-1.5 text-[#A69B8D] hover:text-[#EDE3D2]"
              title="Reset Timer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mechanical Anodized LED Backlit Keycap Deck */}
      <div
        onClick={() => setActiveZone('keyboard')}
        className={`rounded-2xl bg-[#0C0B0A] border p-5 transition-all ${
          activeZone === 'keyboard' ? 'border-[#E12D1C]/40' : 'border-[#EDE3D2]/10'
        }`}
      >
        <div className="flex items-center justify-between pb-3 hairline-bottom font-mono text-[10px]">
          <span className="text-[#A69B8D] uppercase tracking-widest">
            Backlit LED Macro Deck · Click any key to trigger action or launch studio
          </span>
          <span className="text-[#E12D1C] font-semibold">ACTIVE KEY · [{activeKey}]</span>
        </div>

        <div className="space-y-2 mt-4">
          {KEY_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-9 gap-1.5 sm:gap-2">
              {row.map((btn) => {
                const lit = activeKey === btn.key;
                return (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKeyPress(btn);
                    }}
                    className={`cadence-keycap relative rounded-xl py-2.5 font-mono text-center transition-all ${
                      lit
                        ? 'border-[#E12D1C] bg-[#E12D1C]/20 text-[#EDE3D2] shadow-[0_0_16px_rgba(225,45,28,0.5)] font-bold scale-[1.03]'
                        : 'text-[#A69B8D] hover:text-[#EDE3D2] hover:border-[#EDE3D2]/30'
                    }`}
                  >
                    <div className="text-[10px] sm:text-xs">{btn.key}</div>
                    <div className="text-[8px] sm:text-[9px] opacity-65 truncate px-0.5">{btn.label}</div>
                    {lit && (
                      <span className="absolute inset-x-2 bottom-1 h-[2px] rounded-full bg-[#E12D1C] shadow-[0_0_8px_#E12D1C]" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Live Terminal Diagnostic Feed Stream */}
        <div className="mt-4 pt-3 border-t border-[#EDE3D2]/10">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6E655B] mb-1.5">
            <span className="flex items-center gap-1.5 text-[#A69B8D]">
              <TerminalIcon className="h-3 w-3 text-[#E12D1C]" />
              <span>LIVE WORKSTATION LOG STREAM</span>
            </span>
            <span className="text-emerald-400">READY</span>
          </div>
          <div className="rounded-xl bg-[#060505] p-3 font-mono text-[11px] text-[#EDE3D2]/90 space-y-1">
            {terminalFeed.map((line, idx) => (
              <div key={idx} className={line.startsWith('!') ? 'text-amber-400' : line.startsWith('★') ? 'text-[#E12D1C]' : ''}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* In-Platform Workstation Studio Modal Launcher */}
      <WorkstationStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        toolName={studioToolName}
        initialTab={studioTab}
      />
    </div>
  );
};
