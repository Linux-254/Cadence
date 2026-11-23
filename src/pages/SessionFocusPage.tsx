import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Columns2,
  ExternalLink,
  FileText,
  Maximize2,
  Pause,
  PowerOff,
  Search,
  Square,
  Terminal,
} from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { formatPricingLabel, ResourceLauncherDrawer } from '../components/ResourceLauncher';
import { useAuth } from '../context/AuthContext';
import { useResourceLauncher } from '../hooks/useResourceLauncher';
import type {
  GroundingSource,
  LearningResourceRecord,
  ProjectDocumentRecord,
  ProjectRecord,
  SessionRecord,
  ToolRecord,
} from '../types/cadence';

export const SessionFocusPage: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const { apiFetch, navigate, serverOffsetMs, setActiveSession, user } = useAuth();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [companionResources, setCompanionResources] = useState<LearningResourceRecord[]>([]);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [documents, setDocuments] = useState<ProjectDocumentRecord[]>([]);
  const [nowTick, setNowTick] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const [guideText, setGuideText] = useState('');
  const [guideSources, setGuideSources] = useState<GroundingSource[]>([]);
  const [guideLoading, setGuideLoading] = useState(false);

  const [selectedToolSlug, setSelectedToolSlug] = useState('cursor');
  const [commitNote, setCommitNote] = useState('');
  const [activityNotice, setActivityNotice] = useState('');
  const [focusError, setFocusError] = useState('');

  const launcher = useResourceLauncher({
    sessionId,
    onProgressUpdated: (slug, prog) => {
      setCompanionResources((prev) =>
        prev.map((r) => (r.slug === slug ? { ...r, progress: prog } : r))
      );
    },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resParams = new URLSearchParams();
        if (user?.profile?.tracks?.[0]) resParams.set('track', user.profile.tracks[0]);
        if (user?.profile?.freeOnly !== undefined) resParams.set('freeOnly', String(user.profile.freeOnly));

        const [sRes, tRes, rRes] = await Promise.all([
          apiFetch<{ session: SessionRecord }>(`/api/sessions/${sessionId}`),
          apiFetch<{ tools: ToolRecord[] }>('/api/tools'),
          apiFetch<{ resources: LearningResourceRecord[] }>(`/api/resources`),
        ]);
        if (!mounted) return;
        const s = sRes.session;
        if (s.status === 'paused') {
          navigate(`/session/${s.id}/pause`, true);
          return;
        }
        if (s.status === 'completed' || s.status === 'lapsed' || s.status === 'abandoned') {
          navigate(`/session/${s.id}/summary`, true);
          return;
        }
        setSession(s);
        setActiveSession(s);
        setTools(tRes.tools);

        // Prioritize resources attached directly to session checkpoints, then user track resources
        const cpSlugs = new Set(s.checkpoints.flatMap((c) => c.toolSlugs));
        const userTrack = user?.profile?.tracks?.[0] || '';
        const ranked = [...rRes.resources].sort((a, b) => {
          const aMatch = (cpSlugs.has(a.slug) ? 100 : 0) + (userTrack && a.tracks.includes(userTrack) ? 20 : 0);
          const bMatch = (cpSlugs.has(b.slug) ? 100 : 0) + (userTrack && b.tracks.includes(userTrack) ? 20 : 0);
          return bMatch - aMatch;
        });
        setCompanionResources(ranked.slice(0, 6));

        const pRes = await apiFetch<{ project: ProjectRecord; documents: ProjectDocumentRecord[] }>(
          `/api/projects/${s.projectId}`
        );
        if (mounted) {
          setProject(pRes.project);
          setDocuments(pRes.documents);
        }
      } catch {
        navigate('/dashboard', true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !session) {
    return (
      <LayoutShell breadcrumb="Session / Loading">
        <div className="hairline-top hairline-bottom py-12 text-center text-sm text-[#A69B8D]">
          Syncing server timer...
        </div>
      </LayoutShell>
    );
  }

  const startedMs = new Date(session.startedAt).getTime();
  const pausedMs = session.pauses.reduce((sum, p) => {
    const pStart = new Date(p.startedAt).getTime();
    const pEnd = p.resumedAt ? new Date(p.resumedAt).getTime() : nowTick + serverOffsetMs;
    return sum + Math.max(0, pEnd - pStart);
  }, 0);
  const activeSeconds = Math.max(0, Math.floor((nowTick + serverOffsetMs - startedMs - pausedMs) / 1000));
  const hrs = Math.floor(activeSeconds / 3600);
  const mins = Math.floor((activeSeconds % 3600) / 60);
  const secs = activeSeconds % 60;
  const formattedClock = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const activeCheckpoint =
    session.checkpoints.find((c) => c.id === session.activeCheckpointId) || session.checkpoints[0];

  const handleCheckpointAction = async (checkpointId: string, action: 'activate' | 'complete') => {
    setFocusError('');
    try {
      const res = await apiFetch<{ session: SessionRecord }>(`/api/sessions/${session.id}/checkpoint`, {
        method: 'PATCH',
        body: JSON.stringify({ checkpointId, action }),
      });
      setSession(res.session);
      setActiveSession(res.session);
    } catch (err) {
      setFocusError(err instanceof Error ? err.message : 'Failed to update checkpoint.');
    }
  };

  const handleLogToolPing = async (source: 'ide' | 'manual', customSlug?: string) => {
    setFocusError('');
    try {
      const slug = customSlug || selectedToolSlug;
      const res = await apiFetch<{ session: SessionRecord }>('/api/activity', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.id,
          source,
          toolSlug: slug,
          language: project?.languages[0] || 'typescript',
          projectName: project?.name || 'workspace',
          gitCommitMessage: commitNote,
        }),
      });
      setSession(res.session);
      setCommitNote('');
      setActivityNotice(`Logged ${source.toUpperCase()} activity slice on ${slug}`);
      setTimeout(() => setActivityNotice(''), 2500);
    } catch (err) {
      setFocusError(err instanceof Error ? err.message : 'Failed to log tool activity.');
    }
  };

  const handleFetchCheckpointGuide = async () => {
    if (!activeCheckpoint) return;
    setFocusError('');
    setGuideLoading(true);
    try {
      const res = await apiFetch<{ guide: { answer: string; sources: GroundingSource[] } }>(
        '/api/ai/checkpoint-guide',
        {
          method: 'POST',
          body: JSON.stringify({
            checkpointTitle: activeCheckpoint.title,
            category: activeCheckpoint.category,
            stack: project?.stack || [],
          }),
        }
      );
      setGuideText(res.guide.answer);
      setGuideSources(res.guide.sources);
    } catch (err) {
      setFocusError(err instanceof Error ? err.message : 'Failed to fetch Google Search checkpoint guide.');
    } finally {
      setGuideLoading(false);
    }
  };

  const handleSimulateAppClose = async () => {
    setFocusError('');
    try {
      await apiFetch(`/api/sessions/${session.id}/disconnect`, { method: 'POST' });
      setActiveSession(null);
      navigate(`/session/${session.id}/summary`, true);
    } catch (err) {
      setFocusError(err instanceof Error ? err.message : 'Failed to close session.');
    }
  };

  const sessionToolSlugs = Array.from(new Set(session.checkpoints.flatMap((c) => c.toolSlugs)));
  const launchableTools = tools.filter(
    (t) => sessionToolSlugs.includes(t.slug) || ['vscode', 'cursor', 'windsurf', 'antigravity', 'google-ai-studio'].includes(t.slug)
  );

  return (
    <LayoutShell breadcrumb={`Session / ${project?.name || 'Active Focus'}`}>
      <div className="space-y-12 kinetic-enter">
        {focusError && (
          <div role="alert" className="cadence-seam py-2.5 text-xs text-[#EDE3D2]">
            {focusError}
          </div>
        )}

        {/* Primary Chronograph Focus Clock — Open Radiant Band */}
        <section className="relative overflow-hidden editorial-band-ember hairline-bottom py-8 sm:py-10">
          <img
            src="/src/assets/images/ember_chronograph_haze_1795423374897.jpg"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="mask-fade-edges pointer-events-none absolute right-0 top-0 h-full w-full lg:w-3/5 object-cover opacity-35"
          />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="cadence-seam">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.16em] uppercase text-[#A69B8D]">
                <span className="font-semibold text-[#E12D1C]">{session.mode} Mode</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Target: {session.plannedMinutes}m</span>
              </div>
              <div className="mt-2 font-mono text-5xl font-bold tracking-tight text-[#EDE3D2] sm:text-6xl tabular-nums">
                {formattedClock}
              </div>
              {activeCheckpoint && (
                <p className="mt-3 text-sm text-[#A69B8D]">
                  Active Checkpoint:{' '}
                  <span className="font-semibold text-[#EDE3D2]">
                    [{activeCheckpoint.category.toUpperCase()}] {activeCheckpoint.title}
                  </span>{' '}
                  <span className="font-mono text-xs text-[#6E655B] tabular-nums">
                    ({activeCheckpoint.plannedMinutes}m planned)
                  </span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(`/session/${session.id}/pause`)}
                className="cadence-keycap inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-[#EDE3D2]"
              >
                <Pause className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
                <span>Pause (Reason Required)</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/session/${session.id}/end`)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_10px_28px_-8px_rgba(225,45,28,0.55)]"
              >
                <Square className="h-3.5 w-3.5" aria-hidden="true" />
                <span>End &amp; Log Session</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSimulateAppClose()}
                title="Ends session at current heartbeat timestamp as if app closed, preserving IDE logs"
                className="cadence-keycap inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
              >
                <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Close &amp; Auto-Log</span>
              </button>
            </div>
          </div>
        </section>

        {/* Checkpoints + IDE / Tool Telemetry Split */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-[#EDE3D2]/[0.08]">
          <section className="space-y-5 lg:pr-10">
            <div className="flex items-center justify-between gap-2 pb-2 hairline-bottom">
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#E12D1C]">01 · Active Sprint</div>
                <h2 className="mt-1 font-display text-lg font-semibold text-[#EDE3D2]">Checkpoints</h2>
              </div>
              <button
                type="button"
                onClick={() => void handleFetchCheckpointGuide()}
                disabled={guideLoading}
                className="cadence-keycap inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[#E12D1C]"
              >
                <Search className="h-3 w-3" aria-hidden="true" />
                <span>{guideLoading ? 'Loading Guide...' : 'Search Guide'}</span>
              </button>
            </div>

            <div className="hairline-divide">
              {session.checkpoints.map((cp, idx) => (
                <div
                  key={cp.id}
                  className={`flex items-center justify-between gap-3 py-3.5 transition-colors ${
                    cp.status === 'active'
                      ? 'cadence-seam bg-gradient-to-r from-[#E12D1C]/[0.08] to-transparent pr-2'
                      : cp.status === 'completed'
                        ? 'opacity-65'
                        : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[10px] text-[#6E655B] tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono uppercase font-semibold text-[#E12D1C]">{cp.category}</span>
                      <span className="font-medium text-[#EDE3D2] truncate">{cp.title}</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[#A69B8D] tabular-nums">
                      Planned: {cp.plannedMinutes}m · Actual: {cp.actualMinutes}m · {cp.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cp.status !== 'active' && cp.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => void handleCheckpointAction(cp.id, 'activate')}
                        className="cadence-keycap rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2]"
                      >
                        Focus
                      </button>
                    )}
                    {cp.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => void handleCheckpointAction(cp.id, 'complete')}
                        className="inline-flex items-center gap-1 rounded bg-[#E12D1C] px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2] hover:brightness-110"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Done</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {guideText && (
              <div className="cadence-seam pt-2 space-y-2">
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#E12D1C]">
                  Google Search Checkpoint Guide
                </div>
                <div className="whitespace-pre-line text-xs leading-relaxed text-[#EDE3D2]">{guideText}</div>
                {guideSources.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {guideSources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#E12D1C] hover:underline"
                      >
                        <span>{s.title}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-5 lg:pl-10">
            <div className="pb-2 hairline-bottom">
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#E12D1C]">02 · Workstation Bridge</div>
              <h2 className="mt-1 font-display text-lg font-semibold text-[#EDE3D2]">IDE Deep Links &amp; Activity Telemetry</h2>
              <p className="mt-0.5 text-xs text-[#A69B8D]">
                Launch your desktop IDE via custom protocol or log a manual/IDE activity slice right into this session.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {launchableTools.slice(0, 8).map((tool) => {
                const isIde = tool.trackingLayer === 'ide_ext';
                const href = isIde
                  ? `${tool.launchProtocol}cadence-dev.cadence/start?session=${session.id}`
                  : tool.launchProtocol || tool.docsUrl;
                return (
                  <a
                    key={tool.slug}
                    href={href}
                    target={isIde ? undefined : '_blank'}
                    rel={isIde ? undefined : 'noopener noreferrer'}
                    onClick={() => void handleLogToolPing(isIde ? 'ide' : 'manual', tool.slug)}
                    className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#EDE3D2]"
                  >
                    <Terminal className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Open {tool.name}</span>
                  </a>
                );
              })}
            </div>

            <div className="hairline-top hairline-bottom py-4 space-y-2.5">
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">
                Record Tool / Commit Slice
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedToolSlug}
                  onChange={(e) => setSelectedToolSlug(e.target.value)}
                  className="cadence-field w-auto bg-[#0A0908] text-xs"
                >
                  {tools.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={commitNote}
                  onChange={(e) => setCommitNote(e.target.value)}
                  placeholder="Optional git commit or milestone note"
                  className="cadence-field flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => void handleLogToolPing('ide')}
                  className="rounded-lg bg-[#E12D1C] px-3.5 py-2 text-xs font-semibold text-[#EDE3D2]"
                >
                  Ping Activity
                </button>
              </div>
              {activityNotice && <div className="text-[11px] font-medium text-[#EDE3D2]">{activityNotice}</div>}
            </div>

            <div>
              <div className="text-xs font-semibold text-[#A69B8D]">
                Recent Telemetry Slices ({session.activitySlices.length})
              </div>
              {session.activitySlices.length === 0 ? (
                <p className="mt-1 text-xs text-[#6E655B]">
                  No tool slices logged yet. Click an IDE launch button or ping manually above.
                </p>
              ) : (
                <ul className="mt-2 max-h-40 overflow-y-auto hairline-divide text-xs">
                  {[...session.activitySlices].reverse().slice(0, 8).map((sl) => (
                    <li key={sl.id} className="flex items-center justify-between py-2">
                      <span className="font-mono text-[#EDE3D2]">
                        [{sl.source}] {sl.toolSlug} ({sl.language})
                        {sl.gitCommitMessage ? ` · "${sl.gitCommitMessage}"` : ''}
                      </span>
                      <span className="font-mono text-[11px] text-[#6E655B]">
                        {new Date(sl.ts).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Pinned Project Reference Cards + Device Transitions */}
        <div className="hairline-top pt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-[#EDE3D2]/[0.08]">
          <section className="lg:pr-10">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
              Pinned Project Reference Cards ({documents.length})
            </h2>
            {documents.length === 0 ? (
              <p className="mt-2 text-xs text-[#A69B8D]">
                No documents attached to this project yet. Upload specs in Projects to pin summary cards here.
              </p>
            ) : (
              <div className="mt-4 hairline-divide">
                {documents.map((d) => (
                  <div key={d.id} className="cadence-seam py-3.5 text-xs space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#EDE3D2]">
                      <FileText className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                      {d.fileName}
                    </div>
                    <p className="text-[#EDE3D2]">{d.summaryCard.headline}</p>
                    <ul className="space-y-0.5 text-[#A69B8D]">
                      {d.summaryCard.deliverables.map((del, i) => (
                        <li key={i}>• {del}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="lg:pl-10">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
              Device Transitions ({session.deviceEvents.length})
            </h2>
            <p className="mt-1 text-xs text-[#A69B8D]">
              Opening this active session from desktop, tablet, or mobile automatically logs cross-device transitions.
            </p>
            {session.deviceEvents.length === 0 ? (
              <p className="mt-3 text-xs text-[#A69B8D]">
                Active layout:{' '}
                <span className="font-mono font-semibold text-[#EDE3D2]">
                  {session.currentDevice === 'mobile_pwa' ? 'Mobile View' : 'Desktop / Tablet View'}
                </span>
                . Open this URL on another viewport to log a live transition.
              </p>
            ) : (
              <ul className="mt-3 hairline-divide text-xs">
                {session.deviceEvents.map((ev, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 font-mono text-[#EDE3D2]">
                    <span>
                      {ev.fromDevice === 'mobile_pwa' ? 'mobile' : 'desktop/tablet'} → {ev.toDevice === 'mobile_pwa' ? 'mobile' : 'desktop/tablet'}
                    </span>
                    <span className="text-[#6E655B]">{new Date(ev.at).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Companion Learning Resources Drawer Trigger (T7) */}
        <section className="hairline-top pt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="cadence-seam">
              <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
                Companion Learning Resources
              </h2>
              <p className="mt-0.5 text-xs text-[#A69B8D]">
                Launch linked docs or labs beside this timer in {user?.profile?.resourceOpenMode || 'popout'} mode — opens log telemetry automatically without pausing your clock.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/learn')}
              className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
              <span>Browse Learning Hub</span>
            </button>
          </div>

          {companionResources.length > 0 && (
            <div className="divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
              {companionResources.map((res) => (
                <div key={res.slug} className="py-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-[#EDE3D2]">{res.title}</span>
                      <span className="font-mono text-[11px] text-[#E12D1C]">
                        {formatPricingLabel(res.pricingTier)}
                      </span>
                      {res.progress?.status && (
                        <span className="font-mono text-[11px] text-[#8C8175] capitalize">
                          · {res.progress.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#A69B8D] truncate">{res.summary}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void launcher.launchResource(res)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-3 py-1.5 text-[11px] font-semibold text-[#EDE3D2]"
                    >
                      <Maximize2 className="h-3 w-3" aria-hidden="true" />
                      <span>Open ({user?.profile?.resourceOpenMode || 'popout'})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => launcher.openInspector(res, 'split')}
                      className="cadence-keycap inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#EDE3D2]"
                    >
                      <Columns2 className="h-3 w-3 text-[#E12D1C]" aria-hidden="true" />
                      <span>Split &amp; notes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ResourceLauncherDrawer
        resource={launcher.activeResource}
        open={launcher.drawerOpen}
        mode={launcher.drawerMode}
        blockedWarning={launcher.blockedWarning}
        sessionId={session.id}
        onClose={launcher.closeDrawer}
        onModeChange={launcher.setDrawerMode}
        onClearBlocked={launcher.clearBlocked}
        onProgressUpdated={(slug, prog) =>
          setCompanionResources((prev) =>
            prev.map((r) => (r.slug === slug ? { ...r, progress: prog } : r))
          )
        }
      />
    </LayoutShell>
  );
};
