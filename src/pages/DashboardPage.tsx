import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ExternalLink,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { ResourceLauncherDrawer } from '../components/ResourceLauncher';
import { useAuth } from '../context/AuthContext';
import { useResourceLauncher } from '../hooks/useResourceLauncher';
import type {
  ApplicationStatus,
  ApplicationTrackerRecord,
  DashboardLens,
  DashboardPayload,
  LearningResourceRecord,
} from '../types/cadence';
import { playTactileTick } from '../utils/audioAlarm';

interface WidgetRenderProps {
  data: any;
  navigate: (to: string, replace?: boolean) => void;
  onRefreshDashboard: () => void;
  apiFetch: <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
  onLaunchResourceSlug?: (slug: string) => void;
}

const fmtHours = (mins: number) => {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h > 0 ? `${h}h ${rem}m` : `${rem}m`;
};

const WidgetShell: React.FC<{ title: string; actionLabel?: string; onAction?: () => void; children: React.ReactNode }> = ({
  title,
  actionLabel,
  onAction,
  children,
}) => (
  <section className="py-5 hairline-bottom space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-display text-base font-semibold text-[#EDE3D2]">{title}</h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="font-mono text-xs text-[#E12D1C] hover:text-[#EDE3D2] whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
    <div className="text-xs text-[#A69B8D]">{children}</div>
  </section>
);

const LiveSessionBannerWidget: React.FC<WidgetRenderProps> = ({ data, navigate }) => {
  if (data?.hasActive) {
    return (
      <section className="cadence-seam bg-[#181210] p-4 space-y-2 hairline-bottom">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[#EDE3D2]">
              {data.status === 'paused' ? 'Session paused' : 'Focus session running'} · {data.projectName}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-[#A69B8D] tabular-nums">
              {data.activeMinutes}m elapsed of {data.plannedMinutes}m planned · {data.currentDevice === 'mobile_pwa' ? 'Mobile' : 'Desktop/Web'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(data.status === 'paused' ? `/session/${data.id}/pause` : `/session/${data.id}/focus`)
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-4 py-2 text-xs font-semibold text-[#EDE3D2]"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{data.status === 'paused' ? 'Manage pause' : 'Return to focus'}</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="cadence-seam py-4 hairline-bottom flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-display text-base font-semibold text-[#EDE3D2]">Ready for your next block</h2>
        <p className="mt-0.5 text-xs text-[#A69B8D]">
          Suggested block for your level: <span className="font-mono text-[#EDE3D2]">{data?.suggestedMinutes || 45}m</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/sessions/new')}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-semibold text-[#EDE3D2]"
      >
        <span>Start a {data?.suggestedMinutes || 45}m block</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </section>
  );
};

const ApplicationTrackerWidget: React.FC<WidgetRenderProps> = ({ data, apiFetch, onRefreshDashboard }) => {
  const apps: ApplicationTrackerRecord[] = data?.applications || [];
  const counts = data?.counts || { saved: 0, applied: 0, interview: 0, offer: 0 };
  const [showAdd, setShowAdd] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('saved');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    setBusy(true);
    setErrMsg('');
    try {
      await apiFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ company: company.trim(), role: role.trim(), status, url: url.trim() }),
      });
      setCompany('');
      setRole('');
      setUrl('');
      setShowAdd(false);
      onRefreshDashboard();
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Could not save application.');
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (id: string, nextStatus: ApplicationStatus) => {
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      onRefreshDashboard();
    } catch {
      // Ignore transient error
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/applications/${id}`, { method: 'DELETE' });
      onRefreshDashboard();
    } catch {
      // Ignore transient error
    }
  };

  return (
    <WidgetShell
      title="Application tracker"
      actionLabel={showAdd ? 'Cancel' : '+ Add role'}
      onAction={() => setShowAdd((v) => !v)}
    >
      <div className="font-mono text-[11px] text-[#EDE3D2] mb-3 tabular-nums">
        Saved {counts.saved} · Applied {counts.applied} · Interview {counts.interview} · Offer {counts.offer}
      </div>

      {errMsg && <div className="mb-2 text-xs text-[#E12D1C]">{errMsg}</div>}

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 bg-[#14110F] p-3 space-y-2.5 cadence-seam">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              className="cadence-field text-xs"
            />
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role title"
              className="cadence-field text-xs"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="cadence-field bg-[#14110F] text-xs"
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Job URL (optional)"
              className="cadence-field text-xs sm:col-span-2"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[#E12D1C] px-3.5 py-1.5 text-xs font-semibold text-[#EDE3D2] disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Save application'}
          </button>
        </form>
      )}

      {apps.length === 0 ? (
        <p>{data?.emptyAction}</p>
      ) : (
        <div className="divide-y divide-[#EDE3D2]/[0.07]">
          {apps.map((app) => (
            <div key={app.id} className="py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-[#EDE3D2] truncate">{app.role}</div>
                <div className="text-[11px] text-[#A69B8D] truncate">{app.company}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  aria-label={`Status for ${app.company} ${app.role}`}
                  value={app.status}
                  onChange={(e) => void handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                  className="bg-[#14110F] text-[#EDE3D2] text-[11px] font-mono px-2 py-1 rounded border-b border-[#EDE3D2]/20"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  type="button"
                  onClick={() => void handleDelete(app.id)}
                  aria-label={`Delete ${app.role}`}
                  className="p-1 text-[#A69B8D] hover:text-[#E12D1C]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
};

const WIDGET_MAP: Record<string, React.FC<WidgetRenderProps>> = {
  LiveSessionBanner: LiveSessionBannerWidget,
  ApplicationTracker: ApplicationTrackerWidget,
  TodayPlan: ({ data, navigate }) => (
    <WidgetShell title="Today's plan" actionLabel="Open planner →" onAction={() => navigate('/sessions/new')}>
      <p className="text-[#EDE3D2]">
        Default block: <span className="font-mono text-[#E12D1C]">{data?.blockMinutes || 45}m</span>
      </p>
      {Array.isArray(data?.checkpointMix) && data.checkpointMix.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.checkpointMix.map((c: any, idx: number) => (
            <span key={idx} className="font-mono text-[11px] text-[#A69B8D] capitalize">
              {c.category} {Math.round((c.ratio || 0) * 100)}%
            </span>
          ))}
        </div>
      )}
      {!data?.hasProjects && <p className="mt-2">{data?.emptyAction}</p>}
    </WidgetShell>
  ),
  NextLesson: ({ data, navigate, onLaunchResourceSlug }) => (
    <WidgetShell
      title="Next lesson"
      actionLabel={data?.pathSlug ? 'Open path →' : 'Browse Learn →'}
      onAction={() => navigate(data?.pathSlug ? `/learn/${data.pathSlug}` : '/learn')}
    >
      {data?.pathTitle ? (
        <div className="space-y-2">
          <div className="font-semibold text-[#EDE3D2]">{data.pathTitle}</div>
          {data.nextStep && (
            <div className="text-[#A69B8D]">
              Next step: <span className="text-[#EDE3D2]">{data.nextStep.title}</span> ({data.nextStep.plannedMinutes}m)
            </div>
          )}
          <div className="font-mono text-[11px] text-[#8C8175]">
            Source: {data.sourceName} · ~{data.estimatedHours}h total
          </div>
          {data.nextStep?.resourceSlug && onLaunchResourceSlug && (
            <button
              type="button"
              onClick={() => onLaunchResourceSlug(data.nextStep.resourceSlug)}
              className="cadence-keycap mt-1 inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium text-[#EDE3D2]"
            >
              <ExternalLink className="h-3 w-3 text-[#E12D1C]" aria-hidden="true" />
              <span>Open step resource</span>
            </button>
          )}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  WeeklyGoalRing: ({ data }) => {
    const goal = Math.max(1, data?.goalMinutes || 135);
    const done = data?.completedMinutes || 0;
    const pct = Math.min(100, Math.round((done / goal) * 100));
    return (
      <WidgetShell title="Weekly rhythm">
        <div className="flex justify-between font-mono text-xs text-[#EDE3D2] tabular-nums">
          <span>{fmtHours(done)} logged</span>
          <span>Goal {fmtHours(goal)}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1C1815]">
          <div className="h-full bg-gradient-to-r from-[#EDE3D2] to-[#E12D1C]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 font-mono text-[11px] tabular-nums">
          Active days this week: {data?.activeDays ?? 0} / {data?.goalDays ?? 3}
        </div>
      </WidgetShell>
    );
  },
  PathProgress: ({ data, navigate }) => (
    <WidgetShell
      title="Path progress"
      actionLabel={data?.pathSlug ? 'Inspect path →' : 'Start practice →'}
      onAction={() => navigate(data?.pathSlug ? `/learn/${data.pathSlug}` : '/sessions/new')}
    >
      {data?.pathTitle ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[#EDE3D2]">
            <span className="font-semibold">{data.pathTitle}</span>
            <span className="font-mono text-[11px] text-[#E12D1C]">
              {data.completedSteps}/{data.stepsCount} steps
            </span>
          </div>
          <ol className="divide-y divide-[#EDE3D2]/[0.06]">
            {(data.steps || []).map((st: any, idx: number) => (
              <li key={idx} className="py-1.5 flex items-center justify-between gap-2">
                <span className={st.completed ? 'line-through text-[#8C8175]' : 'text-[#EDE3D2]'}>
                  {idx + 1}. {st.title}
                </span>
                <span className="font-mono text-[11px] text-[#A69B8D] shrink-0">{st.plannedMinutes}m</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  SkillLadder: ({ data }) => (
    <WidgetShell title="Skill ladder">
      <div className="mb-2 text-[#EDE3D2]">
        Tier: <span className="font-semibold text-[#E12D1C]">{data?.tier}</span> · {data?.xp ?? 0} XP
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(data?.steps || []).map((s: any) => (
          <div
            key={s.id}
            className={`cadence-keycap rounded-lg px-2.5 py-2 text-[11px] ${
              s.active ? 'text-[#EDE3D2]' : 'text-[#8C8175]'
            }`}
            data-active={Boolean(s.active)}
          >
            {s.label}
          </div>
        ))}
      </div>
    </WidgetShell>
  ),
  StreakXP: ({ data, navigate }) => (
    <WidgetShell title="Streak & XP" actionLabel="Rankings →" onAction={() => navigate('/leaderboard')}>
      <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
        <div>
          <div className="text-[11px]">Current streak</div>
          <div className="mt-0.5 text-lg font-bold text-[#EDE3D2]">{data?.streakDays ?? 0}d</div>
        </div>
        <div>
          <div className="text-[11px]">Estimate accuracy</div>
          <div className="mt-0.5 text-lg font-bold text-[#E12D1C]">
            {data?.avgAccuracy !== null && data?.avgAccuracy !== undefined ? `${data.avgAccuracy}%` : '—'}
          </div>
        </div>
      </div>
      <div className="mt-2 font-mono text-[11px] text-[#8C8175] tabular-nums">
        {data?.totalSessions ?? 0} completed or lapsed sessions logged
      </div>
    </WidgetShell>
  ),
  ResourceTray: ({ data, navigate }) => (
    <WidgetShell title="Resource tray" actionLabel="Configure →" onAction={() => navigate('/settings')}>
      <div>
        Default open mode: <span className="font-mono text-[#EDE3D2]">{data?.openMode || 'popout'}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(data?.tools || []).map((slug: string) => (
          <span key={slug} className="cadence-keycap rounded px-2 py-1 font-mono text-[11px] text-[#EDE3D2]">
            {slug}
          </span>
        ))}
      </div>
    </WidgetShell>
  ),
  ReflectionPrompt: ({ data, navigate }) => (
    <WidgetShell title="Latest reflection" actionLabel="New learning block →" onAction={() => navigate('/sessions/new?preset=beginner_learn')}>
      {data?.hasEntry ? (
        <div className="space-y-1">
          <div className="text-[#EDE3D2]">{data.lastTakeaway}</div>
          <div className="font-mono text-[11px] text-[#8C8175]">
            {data.sessionTitle} · {data.date ? String(data.date).slice(0, 10) : ''}
          </div>
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  AssignmentDeadlines: ({ data, navigate }) => (
    <WidgetShell title="Coursework & labs" actionLabel="Projects →" onAction={() => navigate('/projects')}>
      {Array.isArray(data?.items) && data.items.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.items.map((item: any) => (
            <div key={item.id} className="py-1.5 flex justify-between">
              <span className="text-[#EDE3D2] truncate">{item.name}</span>
              <span className="font-mono text-[11px] tabular-nums">{fmtHours(item.totalMinutes)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  CohortBoard: ({ data, navigate }) => (
    <WidgetShell title="Study cohort" actionLabel="Rankings →" onAction={() => navigate('/leaderboard')}>
      <p>{data?.emptyAction}</p>
    </WidgetShell>
  ),
  PortfolioReadiness: ({ data, navigate }) => (
    <WidgetShell title="Portfolio readiness" actionLabel="Portfolio Sync →" onAction={() => navigate('/portfolio-sync')}>
      {Array.isArray(data?.items) && data.items.length > 0 ? (
        <div className="space-y-2">
          <div className="font-mono text-[11px] text-[#EDE3D2] tabular-nums">
            {data.publishedCount} public of {data.totalProjects} projects · {data.sitesConnected} sites synced
          </div>
          <div className="divide-y divide-[#EDE3D2]/[0.06]">
            {data.items.map((p: any) => (
              <div key={p.id} className="py-1.5 flex items-center justify-between gap-2">
                <span className="text-[#EDE3D2] truncate">{p.name}</span>
                <span className="font-mono text-[11px] text-[#A69B8D] shrink-0">
                  {p.hasRepo ? 'repo' : 'no repo'} · {p.hasLive ? 'live' : 'draft'} · {p.hours}h
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  CVStatus: ({ data, navigate }) => (
    <WidgetShell title="CV & proof readiness" actionLabel="Settings →" onAction={() => navigate('/settings')}>
      <div className="space-y-1.5">
        <div className="font-mono text-xs text-[#EDE3D2] tabular-nums">
          {data?.verifiedProjects ?? 0} verified repo/live links · {data?.totalTrackedHours ?? 0}h tracked
        </div>
        {data?.portfolioUrl ? (
          <a
            href={data.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#E12D1C] hover:underline"
          >
            <span>{data.portfolioUrl}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p>{data?.emptyAction}</p>
        )}
      </div>
    </WidgetShell>
  ),
  InterviewPracticeQueue: ({ data, navigate }) => (
    <WidgetShell title="Interview practice" actionLabel="Schedule prep →" onAction={() => navigate('/sessions/new')}>
      {Array.isArray(data?.recentPractice) && data.recentPractice.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.recentPractice.map((s: any) => (
            <div key={s.id} className="py-1.5 flex justify-between">
              <span className="text-[#EDE3D2] truncate">{s.title}</span>
              <span className="font-mono text-[11px]">{s.minutes}m</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  SkillGapRadar: ({ data }) => {
    const entries = Object.entries((data?.categoryMinutes || {}) as Record<string, number>);
    return (
      <WidgetShell title="Checkpoint time balance">
        {entries.length > 0 ? (
          <div className="space-y-1.5">
            {entries.map(([cat, mins]) => (
              <div key={cat} className="flex justify-between font-mono text-[11px]">
                <span className="capitalize text-[#EDE3D2]">{cat}</span>
                <span className="tabular-nums">{fmtHours(mins)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>{data?.emptyAction}</p>
        )}
      </WidgetShell>
    );
  },
  ClientHours: ({ data, navigate }) => (
    <WidgetShell title="Client hours" actionLabel="New client block →" onAction={() => navigate('/sessions/new?preset=client_12h')}>
      {data?.clientProjectCount > 0 || data?.totalClientMinutes > 0 ? (
        <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
          <div>
            <div className="text-[11px]">Last 7 days</div>
            <div className="text-lg font-bold text-[#EDE3D2]">{fmtHours(data.weekClientMinutes)}</div>
          </div>
          <div>
            <div className="text-[11px]">Total client time</div>
            <div className="text-lg font-bold text-[#E12D1C]">{fmtHours(data.totalClientMinutes)}</div>
          </div>
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  DeadlineRadar: ({ data, navigate }) => (
    <WidgetShell title="Client projects" actionLabel="All projects →" onAction={() => navigate('/projects')}>
      {Array.isArray(data?.projects) && data.projects.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.projects.map((p: any) => (
            <div key={p.id} className="py-1.5 flex justify-between gap-2">
              <span className="text-[#EDE3D2] truncate">
                {p.name} ({p.clientName})
              </span>
              <span className="font-mono text-[11px] shrink-0">{fmtHours(p.totalMinutes)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  ProjectHealth: ({ data, navigate }) => (
    <WidgetShell title="Project health" actionLabel="Manage →" onAction={() => navigate('/projects')}>
      {Array.isArray(data?.projects) && data.projects.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.projects.map((p: any) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/projects/${p.id}`)}
              className="w-full py-2 flex items-center justify-between text-left hover:text-[#EDE3D2]"
            >
              <span className="text-[#EDE3D2] truncate">{p.name}</span>
              <span className="font-mono text-[11px] tabular-nums">
                {p.sessionsCount} sessions · {p.hours}h
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  InvoiceReadyLogs: ({ data, navigate }) => (
    <WidgetShell title="Timestamped work logs" actionLabel="Analytics →" onAction={() => navigate('/analytics')}>
      {Array.isArray(data?.logs) && data.logs.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.logs.map((l: any) => (
            <div key={l.id} className="py-1.5 flex justify-between gap-2">
              <span className="text-[#EDE3D2] truncate">
                {l.date} · {l.title}
              </span>
              <span className="font-mono text-[11px] text-[#E12D1C] shrink-0">{l.activeMinutes}m</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  ToolSplit: ({ data, navigate }) => (
    <WidgetShell title="Tool split" actionLabel="Catalog →" onAction={() => navigate('/tools')}>
      {Array.isArray(data?.tools) && data.tools.length > 0 ? (
        <div className="space-y-1.5">
          {data.tools.map((t: any) => (
            <div key={t.slug} className="flex justify-between font-mono text-[11px]">
              <span className="text-[#EDE3D2]">{t.slug}</span>
              <span className="tabular-nums">{t.count} slices</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  FocusTrend: ({ data, navigate }) => (
    <WidgetShell title="Focus trend" actionLabel="Full charts →" onAction={() => navigate('/analytics')}>
      {Array.isArray(data?.points) && data.points.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.points.map((pt: any) => (
            <div key={pt.id} className="py-1.5 flex justify-between gap-2 font-mono text-[11px]">
              <span className="text-[#EDE3D2] truncate">
                {pt.date} · {pt.title}
              </span>
              <span className="tabular-nums shrink-0">
                {pt.activeMinutes}m · {pt.focusPct}% focus
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  SkillGrowth: ({ data }) => (
    <WidgetShell title="Skill growth alongside work">
      <div className="font-mono text-xs text-[#EDE3D2] tabular-nums">
        {fmtHours(data?.weekMinutes || 0)} this week · {fmtHours(data?.learningMinutes || 0)} learning sessions total
      </div>
      {!(data?.learningMinutes > 0) && <p className="mt-1.5">{data?.emptyAction}</p>}
    </WidgetShell>
  ),
  SideProject: ({ data, navigate }) => (
    <WidgetShell title="Side projects" actionLabel="New project →" onAction={() => navigate('/projects/new')}>
      {Array.isArray(data?.projects) && data.projects.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.projects.map((p: any) => (
            <div key={p.id} className="py-1.5 flex justify-between">
              <span className="text-[#EDE3D2] truncate">{p.name}</span>
              <span className="font-mono text-[11px]">{p.hours}h</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  ShipLog: ({ data }) => (
    <WidgetShell title="Ship log">
      {Array.isArray(data?.entries) && data.entries.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.entries.map((entry: any) => (
            <div key={entry.id} className="py-2 space-y-0.5">
              <div className="flex justify-between gap-2 text-[#EDE3D2]">
                <span className="font-medium truncate">{entry.title}</span>
                <span className="font-mono text-[11px] shrink-0">{entry.minutes}m</span>
              </div>
              {entry.summary && <p className="text-[11px] text-[#A69B8D]">{entry.summary}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  MilestoneBoard: ({ data, navigate }) => (
    <WidgetShell title="Product milestones" actionLabel="Projects →" onAction={() => navigate('/projects')}>
      {Array.isArray(data?.projects) && data.projects.length > 0 ? (
        <div className="divide-y divide-[#EDE3D2]/[0.06]">
          {data.projects.map((p: any) => (
            <div key={p.id} className="py-1.5 flex justify-between">
              <span className="text-[#EDE3D2] truncate">{p.name}</span>
              <span className="font-mono text-[11px]">{p.sessionsCount} blocks</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  PortfolioSyncStatus: ({ data, navigate }) => (
    <WidgetShell title="Portfolio webhook sync" actionLabel="Configure →" onAction={() => navigate('/portfolio-sync')}>
      <div className="font-mono text-[11px] text-[#EDE3D2] tabular-nums">
        {data?.sitesCount ?? 0} webhooks connected · {data?.publishedCount ?? 0} published projects
      </div>
      {data?.sitesCount === 0 && <p className="mt-1.5">{data?.emptyAction}</p>}
    </WidgetShell>
  ),
  // Track Extras
  VulnerabilityRoomLog: ({ data }) => (
    <WidgetShell title="Security lab hours">
      <div className="font-mono text-xs text-[#EDE3D2]">{fmtHours(data?.minutes || 0)} security checkpoint time</div>
      {!(data?.minutes > 0) && <p className="mt-1">{data?.emptyAction}</p>}
    </WidgetShell>
  ),
  ChallengeStreak: ({ data }) => (
    <WidgetShell title="Lab consistency streak">
      <div className="font-mono text-xs text-[#EDE3D2] tabular-nums">
        {data?.streakDays ?? 0}d streak · {data?.activeDaysThisWeek ?? 0}/{data?.goalDays ?? 3} days this week
      </div>
    </WidgetShell>
  ),
  QueryDatasetHours: ({ data }) => (
    <WidgetShell title="Query & dataset hours">
      <div className="font-mono text-xs text-[#EDE3D2]">{fmtHours(data?.minutes || 0)}</div>
      {!(data?.minutes > 0) && <p className="mt-1">{data?.emptyAction}</p>}
    </WidgetShell>
  ),
  NotebookSessions: ({ data }) => (
    <WidgetShell title="Notebook activity">
      <div className="font-mono text-xs text-[#EDE3D2]">{data?.count ?? 0} Jupyter/Colab slices</div>
      {!(data?.count > 0) && <p className="mt-1">{data?.emptyAction}</p>}
    </WidgetShell>
  ),
  PromptExperimentLog: ({ data }) => (
    <WidgetShell title="AI prompt & eval hours">
      <div className="font-mono text-xs text-[#EDE3D2]">{fmtHours(data?.minutes || 0)}</div>
      {!(data?.minutes > 0) && <p className="mt-1">{data?.emptyAction}</p>}
    </WidgetShell>
  ),
  ModelToolSplit: ({ data }) => (
    <WidgetShell title="AI workspace split">
      {Array.isArray(data?.aiSlices) && data.aiSlices.length > 0 ? (
        <div className="space-y-1 font-mono text-[11px]">
          {data.aiSlices.map(([slug, count]: [string, number]) => (
            <div key={slug} className="flex justify-between">
              <span className="text-[#EDE3D2]">{slug}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  BuildShipFeed: ({ data }) => (
    <WidgetShell title="UI build feed">
      {Array.isArray(data?.items) && data.items.length > 0 ? (
        <div className="space-y-1">
          {data.items.map((it: any) => (
            <div key={it.id} className="flex justify-between">
              <span className="text-[#EDE3D2] truncate">{it.title}</span>
              <span className="font-mono text-[11px]">{it.minutes}m</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{data?.emptyAction}</p>
      )}
    </WidgetShell>
  ),
  ResponsiveCoverage: ({ data }) => (
    <WidgetShell title="Responsive & QA check time">
      <div className="font-mono text-xs text-[#EDE3D2]">{fmtHours(data?.testingMinutes || 0)}</div>
      {!(data?.testingMinutes > 0) && <p className="mt-1">{data?.emptyAction}</p>}
    </WidgetShell>
  ),
  FigmaVsCodeRatio: ({ data }) => (
    <WidgetShell title="Design vs implementation time">
      <div className="font-mono text-xs text-[#EDE3D2] tabular-nums">
        Design {fmtHours(data?.designMinutes || 0)} · Dev {fmtHours(data?.devMinutes || 0)}
      </div>
    </WidgetShell>
  ),
  ComponentDeliveryCount: ({ data }) => (
    <WidgetShell title="Completed checkpoints">
      <div className="font-mono text-xs text-[#EDE3D2] tabular-nums">{data?.completedCheckpoints ?? 0} checkpoints closed</div>
    </WidgetShell>
  ),
  DeployCheckpointRate: ({ data }) => (
    <WidgetShell title="Deployment checkpoints">
      <div className="font-mono text-xs text-[#EDE3D2] tabular-nums">
        {data?.completed ?? 0} completed of {data?.total ?? 0} deployment blocks
      </div>
    </WidgetShell>
  ),
  InfraToolSplit: ({ data }) => (
    <WidgetShell title="Cloud & deploy hours">
      <div className="font-mono text-xs text-[#EDE3D2]">{fmtHours(data?.cloudMinutes || 0)}</div>
    </WidgetShell>
  ),
  TestCoverageHours: ({ data }) => (
    <WidgetShell title="Testing hours">
      <div className="font-mono text-xs text-[#EDE3D2]">{fmtHours(data?.testingMinutes || 0)}</div>
    </WidgetShell>
  ),
  BugReproSessions: ({ data }) => (
    <WidgetShell title="Review & repro hours">
      <div className="font-mono text-xs text-[#EDE3D2]">{fmtHours(data?.reviewMinutes || 0)}</div>
    </WidgetShell>
  ),
};

export const DashboardPage: React.FC = () => {
  const { apiFetch, navigate, user, setUser } = useAuth();
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [activeLens, setActiveLens] = useState<DashboardLens | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const launcher = useResourceLauncher();

  const handleLaunchResourceSlug = useCallback(
    async (slug: string) => {
      try {
        const res = await apiFetch<{ resource: LearningResourceRecord }>(
          `/api/resources/${encodeURIComponent(slug)}`
        );
        await launcher.launchResource(res.resource);
      } catch {
        navigate('/learn');
      }
    },
    [apiFetch, launcher, navigate]
  );

  const loadDashboard = useCallback(
    async (lensOverride?: DashboardLens | null) => {
      setLoading(true);
      setError('');
      try {
        const query = lensOverride ? `?lens=${encodeURIComponent(lensOverride)}` : '';
        const res = await apiFetch<DashboardPayload>(`/api/dashboard${query}`);
        setPayload(res);
        setActiveLens(res.lens);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    void loadDashboard(null);
  }, [loadDashboard]);

  const handleSwitchLens = async (lens: DashboardLens) => {
    playTactileTick(780);
    setActiveLens(lens);
    try {
      const updated = await apiFetch<{ user: typeof user }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ dashboardLens: lens }),
      });
      if (updated.user) setUser(updated.user);
    } catch {
      // Non-fatal persistence fallback
    }
    await loadDashboard(lens);
  };

  const handleDismissPrompt = async () => {
    try {
      const updated = await apiFetch<{ user: typeof user }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ dismissedProfilePrompt: true }),
      });
      if (updated.user) setUser(updated.user);
      setPayload((prev) =>
        prev ? { ...prev, meta: { ...prev.meta, showProfileUpdatePrompt: false } } : prev
      );
    } catch {
      // Ignore
    }
  };

  const renderWidget = (name: string) => {
    if (!payload) return null;
    const Component = WIDGET_MAP[name];
    if (!Component) return null;
    return (
      <Component
        key={name}
        data={payload.widgets[name]}
        navigate={navigate}
        apiFetch={apiFetch}
        onRefreshDashboard={() => void loadDashboard(activeLens)}
        onLaunchResourceSlug={(slug) => void handleLaunchResourceSlug(slug)}
      />
    );
  };

  const centerOther = (payload?.layout.center || []).filter((w) => w !== 'LiveSessionBanner');

  return (
    <LayoutShell breadcrumb={`Workspace / ${payload?.lens ? payload.lens.replace('_', ' ') : 'Dashboard'}`}>
      <div className="space-y-8 kinetic-enter">
        {/* Dismissible Migrated User Profile Prompt */}
        {payload?.meta.showProfileUpdatePrompt && (
          <div className="cadence-seam bg-[#151210] p-4 flex flex-wrap items-center justify-between gap-3 hairline-bottom">
            <div className="text-xs text-[#EDE3D2]">
              <span className="font-semibold">Update your profile:</span> pick your primary track and skill level so Cadence can match learning paths and session defaults.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="cadence-keycap rounded-lg px-3 py-1.5 text-xs font-medium text-[#EDE3D2]"
              >
                Update profile
              </button>
              <button
                type="button"
                onClick={() => void handleDismissPrompt()}
                aria-label="Dismiss profile update prompt"
                className="p-1.5 text-[#A69B8D] hover:text-[#EDE3D2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header + Keycap Lens Switcher + Compact Single-Line KPI Readout */}
        <section className="pb-6 hairline-bottom space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="cadence-seam space-y-2">
              <h1 className="font-display text-3xl font-bold text-[#EDE3D2] sm:text-4xl">
                Welcome back, {user?.name}
              </h1>
              {payload && (
                <p className="font-mono text-xs text-[#A69B8D] tabular-nums">
                  {payload.kpiLine.xp} XP · {payload.kpiLine.tier} · {payload.kpiLine.streakDays}d streak ·{' '}
                  {fmtHours(payload.kpiLine.weekMinutes)} / {fmtHours(payload.kpiLine.weeklyGoalMinutes)} weekly goal ·{' '}
                  {payload.kpiLine.totalSessions} sessions
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/projects/new')}
                className="cadence-keycap inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
              >
                <Plus className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                <span>New project</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/sessions/new')}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-semibold text-[#EDE3D2]"
              >
                <span>Plan session</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 6-Lens Switcher */}
          {payload && (
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Dashboard lens switcher">
              {payload.availableLenses.map((l) => {
                const active = activeLens === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-active={active}
                    onClick={() => void handleSwitchLens(l.id)}
                    className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                  >
                    {active && <Check className="h-3 w-3 text-[#E12D1C]" aria-hidden="true" />}
                    <span>{l.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {error && (
          <div role="alert" className="cadence-seam bg-[#E12D1C]/12 p-4 flex items-center justify-between gap-3 text-xs text-[#EDE3D2]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadDashboard(activeLens)}
              className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {loading && !payload ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 h-48 bg-[#151210]/70" />
            <div className="lg:col-span-5 h-64 bg-[#151210]/70" />
            <div className="lg:col-span-3 h-48 bg-[#151210]/70" />
          </div>
        ) : payload ? (
          <>
            {/* Mobile (< 768px): LiveSessionBanner pinned first */}
            <div className="space-y-2 md:hidden">
              {renderWidget('LiveSessionBanner')}
              {centerOther.map(renderWidget)}
              {payload.layout.left.map(renderWidget)}
              {payload.layout.right.map(renderWidget)}
            </div>

            {/* Tablet (768px - 1023px): 2 columns */}
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-8 divide-x divide-[#EDE3D2]/[0.08]">
              <div className="pr-4">
                {payload.layout.center.map(renderWidget)}
              </div>
              <div className="pl-6">
                {payload.layout.left.map(renderWidget)}
                {payload.layout.right.map(renderWidget)}
              </div>
            </div>

            {/* Desktop (>= 1024px): 12-col asymmetric 4 / 5 / 3 workbench */}
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:divide-x lg:divide-[#EDE3D2]/[0.08]">
              <div className="lg:col-span-4 lg:pr-4">
                {payload.layout.left.map(renderWidget)}
              </div>
              <div className="lg:col-span-5 lg:px-6">
                {payload.layout.center.map(renderWidget)}
              </div>
              <div className="lg:col-span-3 lg:pl-6">
                {payload.layout.right.map(renderWidget)}
              </div>
            </div>

            {/* Track-Specific Extra Widgets */}
            {payload.trackExtras.length > 0 && (
              <section className="pt-4 hairline-top">
                <h2 className="font-display text-sm font-semibold text-[#A69B8D] mb-2 capitalize">
                  {payload.primaryTrack.replace(/_/g, ' ')} track signals
                </h2>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:divide-x md:divide-[#EDE3D2]/[0.08]">
                  {payload.trackExtras.map((widgetName, i) => (
                    <div key={widgetName} className={i > 0 ? 'md:pl-6' : 'md:pr-4'}>
                      {renderWidget(widgetName)}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>
      <ResourceLauncherDrawer
        resource={launcher.activeResource}
        open={launcher.drawerOpen}
        mode={launcher.drawerMode}
        blockedWarning={launcher.blockedWarning}
        onClose={launcher.closeDrawer}
        onModeChange={launcher.setDrawerMode}
        onClearBlocked={launcher.clearBlocked}
      />
    </LayoutShell>
  );
};
