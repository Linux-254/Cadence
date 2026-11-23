import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Columns2,
  ExternalLink,
  Maximize2,
  Play,
  Search,
} from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { ResourceLauncherDrawer } from '../components/ResourceLauncher';
import { useAuth } from '../context/AuthContext';
import { useResourceLauncher } from '../hooks/useResourceLauncher';
import type {
  PracticeDrillDetailPayload,
  PracticeDrillMode,
  PracticeDrillRecord,
  ResourceOpenMode,
  SessionRecord,
  TaxonomyPayload,
} from '../types/cadence';
import { playTactileClick } from '../utils/audioAlarm';

interface PracticeHubPageProps {
  drillSlug?: string | null;
}

const MODE_LABELS: Record<PracticeDrillMode, string> = {
  coding: 'Coding drill',
  sql: 'SQL lab',
  security_lab: 'Security audit',
  architecture: 'Architecture',
  qa_debug: 'QA & accessibility',
};

export const PracticeHubPage: React.FC<PracticeHubPageProps> = ({ drillSlug }) => {
  const { apiFetch, navigate, user, setUser, setActiveSession, activeSession } = useAuth();
  const [taxonomy, setTaxonomy] = useState<TaxonomyPayload | null>(null);

  // Catalog filters
  const [selectedTrack, setSelectedTrack] = useState<string>(user?.profile?.tracks?.[0] || '');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // List state
  const [drills, setDrills] = useState<PracticeDrillRecord[]>([]);
  const [loadingList, setLoadingList] = useState(!drillSlug);
  const [pageError, setPageError] = useState('');

  // Detail state
  const [detail, setDetail] = useState<PracticeDrillDetailPayload | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(Boolean(drillSlug));
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [startingSession, setStartingSession] = useState(false);

  const launcher = useResourceLauncher();

  useEffect(() => {
    apiFetch<TaxonomyPayload>('/api/taxonomy')
      .then(setTaxonomy)
      .catch(() => {});
  }, [apiFetch]);

  const loadDrills = useCallback(async () => {
    setLoadingList(true);
    setPageError('');
    try {
      const params = new URLSearchParams();
      if (selectedTrack) params.set('track', selectedTrack);
      if (selectedLevel) params.set('level', selectedLevel);
      if (selectedMode) params.set('mode', selectedMode);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      const res = await apiFetch<{ drills: PracticeDrillRecord[] }>(`/api/practice?${params.toString()}`);
      setDrills(res.drills);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load guided practice drills.');
    } finally {
      setLoadingList(false);
    }
  }, [apiFetch, searchQuery, selectedLevel, selectedMode, selectedTrack]);

  const loadDetail = useCallback(
    async (slug: string) => {
      setLoadingDetail(true);
      setPageError('');
      try {
        const res = await apiFetch<PracticeDrillDetailPayload>(`/api/practice/${encodeURIComponent(slug)}`);
        setDetail(res);
        setNotes(res.progress?.notes || '');
      } catch (err) {
        setDetail(null);
        setPageError(err instanceof Error ? err.message : 'Practice drill not found.');
      } finally {
        setLoadingDetail(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    if (drillSlug) {
      void loadDetail(drillSlug);
    } else {
      setDetail(null);
      void loadDrills();
    }
  }, [drillSlug, loadDetail, loadDrills]);

  const handleToggleStep = async (stepIndex: number, completed: boolean) => {
    if (!detail) return;
    playTactileClick(completed ? 'confirm' : 'tick');
    try {
      const res = await apiFetch<{ completedStepIndexes: number[] }>(
        `/api/practice/${encodeURIComponent(detail.drill.slug)}/steps`,
        {
          method: 'POST',
          body: JSON.stringify({ stepIndex, completed }),
        }
      );
      setDetail((prev) => (prev ? { ...prev, completedStepIndexes: res.completedStepIndexes } : prev));
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Unable to save step progress.');
    }
  };

  const handleSaveNotes = async () => {
    if (!detail) return;
    setSavingNotes(true);
    setStatusMessage('');
    try {
      await apiFetch(`/api/practice/${encodeURIComponent(detail.drill.slug)}/steps`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
      setStatusMessage('Verification notes saved.');
      setTimeout(() => setStatusMessage(''), 2200);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Unable to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSetOpenMode = async (mode: ResourceOpenMode) => {
    playTactileClick('tick');
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ resourceOpenMode: mode }),
      });
      if (res.user) setUser(res.user);
    } catch {
      // Non-fatal preference update
    }
  };

  const handleStartPracticeSession = async () => {
    if (!detail) return;
    setStartingSession(true);
    setPageError('');
    try {
      const res = await apiFetch<{ session: SessionRecord }>(
        `/api/practice/${encodeURIComponent(detail.drill.slug)}/start-session`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      setActiveSession(res.session);
      navigate(`/session/${res.session.id}/focus`);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Could not launch practice session.');
    } finally {
      setStartingSession(false);
    }
  };

  const preferredOpenMode: ResourceOpenMode = user?.profile?.resourceOpenMode || 'popout';

  // ---------------- DRILL DETAIL VIEW (/practice/:slug) ----------------
  if (drillSlug) {
    return (
      <LayoutShell breadcrumb={`Workspace / Practice / ${detail?.drill.title || drillSlug}`}>
        <div className="space-y-8 kinetic-enter">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/practice')}
              className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All practice drills</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {activeSession ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      activeSession.status === 'paused'
                        ? `/session/${activeSession.id}/pause`
                        : `/session/${activeSession.id}/focus`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-4 py-2 text-xs font-semibold text-[#EDE3D2]"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Resume active session</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={startingSession || !detail}
                  onClick={() => void handleStartPracticeSession()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-4 py-2 text-xs font-semibold text-[#EDE3D2] hover:brightness-110 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{startingSession ? 'Launching...' : 'Start timed practice session'}</span>
                </button>
              )}
            </div>
          </div>

          {pageError && (
            <div role="alert" className="cadence-seam bg-[#E12D1C]/12 p-4 text-xs text-[#EDE3D2]">
              {pageError}
            </div>
          )}

          {loadingDetail ? (
            <div className="space-y-4">
              <div className="h-8 w-80 rounded bg-[#181411]" />
              <div className="h-4 w-full max-w-xl rounded bg-[#151210]" />
            </div>
          ) : detail ? (
            <>
              {/* Header */}
              <div className="cadence-seam pb-6 hairline-bottom space-y-3">
                <h1 className="font-display text-3xl font-bold text-[#EDE3D2] text-balance">
                  {detail.drill.title}
                </h1>
                <p className="text-sm text-[#A69B8D] max-w-2xl leading-relaxed">{detail.drill.summary}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#A69B8D] font-mono tabular-nums pt-1">
                  <span>{MODE_LABELS[detail.drill.mode] || detail.drill.mode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{detail.drill.track.replace(/_/g, ' ')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{detail.drill.level}</span>
                  <span aria-hidden="true">·</span>
                  <span>~{detail.drill.estimatedMinutes}m block</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#EDE3D2]">
                    {detail.completedStepIndexes.length}/{detail.drill.steps.length} verified
                  </span>
                </div>
              </div>

              {/* Deliverable & Companion Resource Strip */}
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="cadence-seam space-y-2">
                  <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Target deliverable</h2>
                  <p className="text-sm text-[#EDE3D2] leading-relaxed">{detail.drill.deliverable}</p>
                  {detail.drill.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {detail.drill.languages.map((lang) => (
                        <span
                          key={lang}
                          className="cadence-keycap rounded px-2 py-0.5 font-mono text-[10px] text-[#A69B8D]"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Companion reference</h2>
                  {detail.resource ? (
                    <div className="space-y-3">
                      <div className="text-xs text-[#A69B8D]">
                        <span className="font-semibold text-[#EDE3D2]">{detail.resource.title}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{detail.resource.provider}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void launcher.launchResource({
                              slug: detail.resource!.slug,
                              title: detail.resource!.title,
                              provider: detail.resource!.provider,
                              url: detail.resource!.url,
                              embeddable: detail.resource!.embeddable,
                              format: detail.resource!.format,
                              pricingTier: detail.resource!.pricingTier,
                              summary: detail.resource!.summary,
                              progress: detail.resource!.progress,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-3.5 py-2 text-xs font-semibold text-[#EDE3D2]"
                        >
                          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Open reference ({preferredOpenMode})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            launcher.openInspector(
                              {
                                slug: detail.resource!.slug,
                                title: detail.resource!.title,
                                provider: detail.resource!.provider,
                                url: detail.resource!.url,
                                embeddable: detail.resource!.embeddable,
                                format: detail.resource!.format,
                                pricingTier: detail.resource!.pricingTier,
                                summary: detail.resource!.summary,
                                progress: detail.resource!.progress,
                              },
                              'split'
                            )
                          }
                          className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                        >
                          <Columns2 className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                          <span>Split inspect</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={detail.drill.sandboxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                    >
                      <span>Open external guide</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>

              {/* Verification Checklist Steps */}
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-[#EDE3D2]">Verification checkpoints</h2>
                <div className="divide-y divide-[rgba(237,227,210,0.08)]">
                  {detail.drill.steps.map((step, idx) => {
                    const completed = detail.completedStepIndexes.includes(idx);
                    return (
                      <div key={step.title} className="py-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => void handleToggleStep(idx, !completed)}
                            aria-label={completed ? `Mark checkpoint ${idx + 1} incomplete` : `Verify checkpoint ${idx + 1}`}
                            className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                              completed
                                ? 'border-[#E12D1C] bg-[#E12D1C] text-[#EDE3D2]'
                                : 'border-[rgba(237,227,210,0.22)] bg-[#14110F] text-transparent hover:border-[#E12D1C]'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <div className="min-w-0 space-y-1.5">
                            <div className={`text-sm font-semibold ${completed ? 'line-through text-[#A69B8D]' : 'text-[#EDE3D2]'}`}>
                              {idx + 1}. {step.title}
                            </div>
                            <p className="text-xs text-[#A69B8D] leading-relaxed">{step.prompt}</p>
                            <div className="font-mono text-[11px] text-[#EDE3D2]/85">
                              Verify: {step.verificationHint}
                            </div>
                          </div>
                        </div>

                        <span className="font-mono text-xs tabular-nums text-[#A69B8D] shrink-0 sm:pl-4">
                          {step.plannedMinutes}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verification Notes & Debrief */}
              <div className="cadence-seam pt-4 hairline-top space-y-3">
                <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Implementation &amp; verification log</h2>
                <p className="text-xs text-[#A69B8D]">
                  Record commands run, query outputs, or edge cases verified while completing this drill.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes on tests run, verification results, or architecture trade-offs..."
                    className="cadence-field flex-1 text-sm"
                  />
                  <button
                    type="button"
                    disabled={savingNotes}
                    onClick={() => void handleSaveNotes()}
                    className="cadence-keycap inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-[#EDE3D2] disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>{savingNotes ? 'Saving...' : 'Save notes'}</span>
                  </button>
                </div>
                {statusMessage && <div className="font-mono text-xs text-[#EDE3D2]">{statusMessage}</div>}
              </div>
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
  }

  // ---------------- PRACTICE DIRECTORY VIEW (/practice) ----------------
  return (
    <LayoutShell breadcrumb="Workspace / Guided Practice">
      <div className="space-y-8 kinetic-enter">
        <div className="cadence-seam pb-6 hairline-bottom flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-1.5">
            <h1 className="font-display text-3xl font-bold text-[#EDE3D2] text-balance">
              Guided practice
            </h1>
            <p className="text-xs sm:text-sm text-[#A69B8D]">
              Structured coding, SQL, security, architecture, and QA drills paired with timed Cadence verification checkpoints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-[#8C8175] mr-1">Open guides:</span>
            {(['popout', 'split', 'embed', 'tab'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                data-active={preferredOpenMode === mode}
                onClick={() => void handleSetOpenMode(mode)}
                className="cadence-keycap rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2] capitalize"
              >
                {mode === 'popout' ? 'Pop-out' : mode === 'split' ? 'Split' : mode === 'embed' ? 'Embed' : 'Tab'}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 pb-6 hairline-bottom">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_auto]">
            <div className="relative flex items-center">
              <Search className="h-4 w-4 text-[#8C8175] mr-2 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drills by skill, deliverable, SQL, OWASP, React..."
                className="cadence-field flex-1 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#A69B8D] tabular-nums">
              <span>{drills.length} drills matching</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTrack('');
                  setSelectedLevel('');
                  setSelectedMode('');
                  setSearchQuery('');
                }}
                className="text-[#E12D1C] hover:text-[#EDE3D2]"
              >
                Reset filters
              </button>
            </div>
          </div>

          {/* Track filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-active={selectedTrack === ''}
              onClick={() => {
                playTactileClick('tick');
                setSelectedTrack('');
              }}
              className="cadence-keycap rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2]"
            >
              All tracks
            </button>
            {taxonomy?.tracks.map((tr) => (
              <button
                key={tr.id}
                type="button"
                data-active={selectedTrack === tr.id}
                onClick={() => {
                  playTactileClick('tick');
                  setSelectedTrack(tr.id);
                }}
                className="cadence-keycap rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2]"
              >
                {tr.label}
              </button>
            ))}
          </div>

          {/* Mode & Level filter */}
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(MODE_LABELS) as PracticeDrillMode[]).map((modeKey) => (
              <button
                key={modeKey}
                type="button"
                data-active={selectedMode === modeKey}
                onClick={() => {
                  playTactileClick('tick');
                  setSelectedMode((prev) => (prev === modeKey ? '' : modeKey));
                }}
                className="cadence-keycap rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2]"
              >
                {MODE_LABELS[modeKey]}
              </button>
            ))}
            <span aria-hidden="true" className="text-[#6E655B] mx-1">|</span>
            {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                data-active={selectedLevel === lvl}
                onClick={() => {
                  playTactileClick('tick');
                  setSelectedLevel((prev) => (prev === lvl ? '' : lvl));
                }}
                className="cadence-keycap rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2] capitalize"
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {pageError && (
          <div role="alert" className="cadence-seam bg-[#E12D1C]/12 p-4 text-xs text-[#EDE3D2]">
            {pageError}
          </div>
        )}

        {loadingList ? (
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-24 w-full rounded bg-[#14110F]" />
            ))}
          </div>
        ) : drills.length === 0 ? (
          <div className="cadence-seam py-10 space-y-3">
            <p className="text-sm text-[#EDE3D2]">No practice drills matched those filters.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedTrack('');
                setSelectedLevel('');
                setSelectedMode('');
                setSearchQuery('');
              }}
              className="cadence-keycap rounded-lg px-4 py-2 text-xs font-medium text-[#EDE3D2]"
            >
              Show all drills
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(237,227,210,0.08)]">
            {drills.map((drill) => {
              const verified = drill.completedStepIndexes?.length || 0;
              return (
                <div key={drill.id} className="py-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 max-w-2xl space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/practice/${encodeURIComponent(drill.slug)}`)}
                      className="text-left font-display text-lg font-bold text-[#EDE3D2] hover:text-[#E12D1C] transition-colors"
                    >
                      {drill.title}
                    </button>
                    <p className="text-xs leading-relaxed text-[#A69B8D]">{drill.summary}</p>
                    <div className="text-xs text-[#EDE3D2]/85">
                      <span className="text-[#8C8175]">Deliverable: </span>
                      <span>{drill.deliverable}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#A69B8D] tabular-nums pt-0.5">
                      <span>{MODE_LABELS[drill.mode]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{drill.track.replace(/_/g, ' ')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{drill.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{drill.estimatedMinutes}m</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#EDE3D2]">
                        {verified}/{drill.steps.length} verified
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {drill.languages.map((lang) => (
                      <span
                        key={lang}
                        className="cadence-keycap rounded px-2 py-1 font-mono text-[10px] text-[#A69B8D]"
                      >
                        {lang}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => navigate(`/practice/${encodeURIComponent(drill.slug)}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-4 py-2 text-xs font-semibold text-[#EDE3D2] hover:brightness-110"
                    >
                      <span>Open drill</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LayoutShell>
  );
};
