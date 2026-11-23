import React, { useEffect, useState } from 'react';
import { Award, Cpu, Download, Radar, ShieldAlert, Zap } from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { ScrollRevealBand } from '../components/ScrollChoreography';
import { useAuth } from '../context/AuthContext';
import type { SessionRecord } from '../types/cadence';

interface OverviewStats {
  totalSessions: number;
  totalActiveMinutes: number;
  avgAccuracy: number;
  categoryTotals: Record<string, { planned: number; actual: number }>;
  toolTotals: Record<string, number>;
  recentAreas: string[];
  badges: Array<{ id: string; badge_key: string; title: string; description: string; awarded_at: string }>;
}

interface LeaderRow {
  rank: number;
  id: string;
  username: string;
  name: string;
  skillLevel: string;
  primaryRole?: string;
  xp: number;
  tier: string;
  streakDays: number;
}

export const AnalyticsPage: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [st, ss] = await Promise.all([
          apiFetch<OverviewStats>('/api/stats/overview'),
          apiFetch<{ sessions: SessionRecord[] }>('/api/sessions'),
        ]);
        setStats(st);
        setSessions(ss.sessions);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetch]);

  const handleExportCsv = () => {
    const header = ['Date', 'Title', 'Mode', 'Status', 'PlannedMinutes', 'ActiveMinutes', 'PausedMinutes', 'AccuracyPct', 'XP'];
    const rows = sessions.map((s) => [
      new Date(s.startedAt).toISOString(),
      `"${(s.title || 'Session').replace(/"/g, '""')}"`,
      s.mode,
      s.status,
      String(s.plannedMinutes),
      String(s.activeMinutes),
      String(s.pausedMinutes),
      String(Math.round(s.estimateAccuracy * 100)),
      String(s.xpAwarded),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cadence_jarvis_telemetry.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = Object.entries(stats?.categoryTotals || {});
  const totalHours = ((stats?.totalActiveMinutes || 0) / 60).toFixed(1);
  const avgAccPct = Math.round((stats?.avgAccuracy || 0) * 100);

  return (
    <LayoutShell breadcrumb="JARVIS Core / Telemetry HUD">
      <div className="space-y-10">
        {/* JARVIS AI HUD Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#13100E] via-[#0C0B0A] to-[#0A0908] p-8 border border-[#E12D1C]/30 shadow-[0_0_50px_rgba(225,45,28,0.12)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,45,28,0.15),transparent_50%)] pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-[#E12D1C]">
                <Cpu className="h-4 w-4 animate-pulse" />
                <span>JARVIS AI Telemetry HUD // Core Online</span>
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#EDE3D2]">
                Operator: {user?.name || 'Authorized Builder'}
              </h1>
              <p className="max-w-xl text-xs leading-relaxed text-[#A69B8D]">
                Real-time synchronization across IDE processes, active checkpoint deltas, and neural clock telemetry.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={sessions.length === 0}
                onClick={handleExportCsv}
                className="cadence-keycap inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold text-[#EDE3D2] disabled:opacity-40 hover:border-[#E12D1C] transition-all"
              >
                <Download className="h-4 w-4 text-[#E12D1C]" />
                <span>Export Jarvis CSV</span>
              </button>
            </div>
          </div>

          {/* Holographic Metrics Grid */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-[#EDE3D2]/10 font-mono">
            <div className="cadence-keycap rounded-xl p-4 bg-[#0A0908]/60">
              <div className="text-[10px] uppercase tracking-wider text-[#A69B8D]">Total Active Time</div>
              <div className="mt-1 font-display text-2xl font-bold text-[#EDE3D2]">{totalHours} hrs</div>
              <div className="mt-1 text-[10px] text-emerald-400">● Nominal Flow</div>
            </div>
            <div className="cadence-keycap rounded-xl p-4 bg-[#0A0908]/60">
              <div className="text-[10px] uppercase tracking-wider text-[#A69B8D]">Estimate Accuracy</div>
              <div className="mt-1 font-display text-2xl font-bold text-[#E12D1C]">{avgAccPct}%</div>
              <div className="mt-1 text-[10px] text-[#A69B8D]">Precision Calibrated</div>
            </div>
            <div className="cadence-keycap rounded-xl p-4 bg-[#0A0908]/60">
              <div className="text-[10px] uppercase tracking-wider text-[#A69B8D]">Completed Sessions</div>
              <div className="mt-1 font-display text-2xl font-bold text-[#EDE3D2]">{stats?.totalSessions ?? 0}</div>
              <div className="mt-1 text-[10px] text-[#E12D1C]">Server-Authoritative</div>
            </div>
            <div className="cadence-keycap rounded-xl p-4 bg-[#0A0908]/60">
              <div className="text-[10px] uppercase tracking-wider text-[#A69B8D]">Streak Stability</div>
              <div className="mt-1 font-display text-2xl font-bold text-[#EDE3D2]">{user?.streakDays ?? 0} Days</div>
              <div className="mt-1 text-[10px] text-amber-400">▲ Peak Efficiency</div>
            </div>
          </div>
        </section>

        {/* Jarvis Waveform & Telemetry Analysis */}
        <ScrollRevealBand className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Category Waveform Breakdown */}
          <div className="lg:col-span-7 rounded-2xl bg-[#13100E] border border-[#EDE3D2]/10 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EDE3D2]/10 pb-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#EDE3D2]">
                <Radar className="h-4 w-4 text-[#E12D1C]" />
                <span>Neural Category Waveforms (Planned vs Actual)</span>
              </div>
              <span className="font-mono text-[10px] text-[#E12D1C]">LIVE FEED</span>
            </div>

            {loading ? (
              <div className="h-48 bg-[#0C0B0A] animate-pulse rounded-xl" />
            ) : categories.length === 0 ? (
              <p className="text-xs text-[#A69B8D]">No active checkpoint waveforms recorded yet.</p>
            ) : (
              <div className="space-y-6">
                {categories.map(([cat, vals]) => {
                  const maxVal = Math.max(vals.planned, vals.actual, 1);
                  const pct = Math.min(100, Math.round((vals.actual / maxVal) * 100));
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="capitalize font-semibold text-[#EDE3D2]">{cat}</span>
                        <span className="text-[#A69B8D] tabular-nums">
                          {vals.actual}m active / {vals.planned}m planned ({pct}%)
                        </span>
                      </div>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#0A0908] border border-[#EDE3D2]/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#E12D1C] via-[#ff5722] to-[#EDE3D2] transition-all duration-700 shadow-[0_0_12px_rgba(225,45,28,0.5)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tool Telemetry Diagnostic Stream */}
          <div className="lg:col-span-5 rounded-2xl bg-[#13100E] border border-[#EDE3D2]/10 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EDE3D2]/10 pb-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#EDE3D2]">
                <Zap className="h-4 w-4 text-[#E12D1C]" />
                <span>IDE Tool Telemetry Pings</span>
              </div>
              <span className="font-mono text-[10px] text-[#A69B8D]">STREAM ACTIVE</span>
            </div>

            {loading ? (
              <div className="h-48 bg-[#0C0B0A] animate-pulse rounded-xl" />
            ) : Object.keys(stats?.toolTotals || {}).length === 0 ? (
              <p className="text-xs text-[#A69B8D]">No IDE telemetry events captured. Switch tools during active focus sessions.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {Object.entries(stats?.toolTotals || {}).map(([slug, count]) => (
                  <div
                    key={slug}
                    className="cadence-keycap flex items-center justify-between p-3 rounded-xl bg-[#0A0908]/80"
                  >
                    <span className="font-mono text-xs font-semibold text-[#EDE3D2]">{slug}</span>
                    <span className="font-mono text-xs text-[#E12D1C] tabular-nums">{count} pings</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollRevealBand>

        {/* Earned Jarvis Badges */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
              JARVIS Commendation Badges ({stats?.badges.length ?? 0})
            </h2>
            <span className="font-mono text-xs text-[#E12D1C]">VERIFIED CREDENTIALS</span>
          </div>

          {!stats || stats.badges.length === 0 ? (
            <div className="rounded-xl bg-[#13100E] border border-[#EDE3D2]/10 p-6 text-center text-xs text-[#A69B8D]">
              Complete your first verified session to unlock neural badges.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.badges.map((b) => (
                <div key={b.id} className="cadence-keycap rounded-2xl p-5 bg-[#13100E] border border-[#EDE3D2]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <Award className="h-5 w-5 text-[#E12D1C]" />
                    <span className="font-mono text-[10px] text-[#A69B8D]">UNLOCKED</span>
                  </div>
                  <div className="font-display text-base font-bold text-[#EDE3D2]">{b.title}</div>
                  <p className="text-xs text-[#A69B8D] leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </LayoutShell>
  );
};

export const LeaderboardPage: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ leaders: LeaderRow[] }>('/api/leaderboard');
        setLeaders(res.leaders);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetch]);

  return (
    <LayoutShell breadcrumb="JARVIS Core / Rankings">
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#13100E] via-[#0C0B0A] to-[#0A0908] p-8 border border-[#E12D1C]/30 shadow-[0_0_50px_rgba(225,45,28,0.12)]">
          <div className="relative z-10 space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#E12D1C]">
              500 XP Daily Soft Cap · Accuracy Priority
            </div>
            <h1 className="font-display text-3xl font-bold text-[#EDE3D2]">JARVIS Operator Leaderboard</h1>
            <p className="max-w-xl text-xs text-[#A69B8D]">
              Consistent execution, high focus ratio, and precise estimate accuracy govern global operator standing.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { name: 'Apprentice', req: '0+ XP' },
            { name: 'Journeyman', req: '1,000+ XP' },
            { name: 'Craftsman', req: '3,500+ XP' },
            { name: 'Architect', req: '8,500+ XP' },
            { name: 'Principal', req: '20,000+ XP' },
          ].map((t) => {
            const active = user?.tier === t.name;
            return (
              <div
                key={t.name}
                data-active={active ? 'true' : 'false'}
                className="cadence-keycap rounded-xl p-4 bg-[#13100E]"
              >
                <div className={`text-xs font-semibold ${active ? 'text-[#E12D1C]' : 'text-[#EDE3D2]'}`}>
                  {t.name}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#A69B8D] tabular-nums">{t.req}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#13100E] border border-[#EDE3D2]/10 overflow-hidden">
          <div className="px-6 py-4 bg-[#0C0B0A] border-b border-[#EDE3D2]/10 font-mono text-xs uppercase tracking-wider text-[#A69B8D] flex justify-between items-center">
            <span>Operator Rank &amp; Standing</span>
            <span>XP / Tier</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#A69B8D]">Syncing operator telemetry...</div>
          ) : leaders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A69B8D]">No operators ranked yet.</div>
          ) : (
            <div className="divide-y divide-[#EDE3D2]/[0.06]">
              {leaders.map((ldr) => {
                const isMe = user?.id === ldr.id;
                return (
                  <div key={ldr.id} className={`flex items-center justify-between p-4 px-6 ${isMe ? 'bg-[#E12D1C]/10 border-l-4 border-[#E12D1C]' : 'hover:bg-[#EDE3D2]/[0.02]'}`}>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-bold text-[#E12D1C] w-6">#{ldr.rank}</span>
                      <div>
                        <div className="text-sm font-semibold text-[#EDE3D2] flex items-center gap-2">
                          <span>{ldr.name}</span>
                          {isMe && <span className="font-mono text-[10px] bg-[#E12D1C] text-[#EDE3D2] px-1.5 py-0.5 rounded">YOU</span>}
                        </div>
                        <div className="font-mono text-[11px] text-[#A69B8D]">{ldr.primaryRole || ldr.skillLevel} · {ldr.streakDays}d streak</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-[#EDE3D2] tabular-nums">{ldr.xp.toLocaleString()} XP</div>
                      <div className="font-mono text-[10px] text-[#E12D1C] uppercase">{ldr.tier}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
};
