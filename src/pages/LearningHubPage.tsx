import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Columns2,
  ExternalLink,
  Maximize2,
  Play,
  Search,
} from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { formatPricingLabel, ResourceLauncherDrawer } from '../components/ResourceLauncher';
import { useAuth } from '../context/AuthContext';
import { useResourceLauncher } from '../hooks/useResourceLauncher';
import type {
  LearningPathDetailPayload,
  LearningPathRecord,
  LearningResourceRecord,
  ResourceOpenMode,
  ResourceProgressRecord,
  SessionRecord,
  TaxonomyPayload,
} from '../types/cadence';
import { playTactileClick } from '../utils/audioAlarm';

interface LearningHubPageProps {
  pathSlug?: string | null;
}

export const LearningHubPage: React.FC<LearningHubPageProps> = ({ pathSlug }) => {
  const { apiFetch, navigate, user, setUser, setActiveSession, activeSession } = useAuth();
  const [taxonomy, setTaxonomy] = useState<TaxonomyPayload | null>(null);
  const [tab, setTab] = useState<'paths' | 'resources'>('paths');

  // Hub filters
  const [selectedTrack, setSelectedTrack] = useState<string>(user?.profile?.tracks?.[0] || '');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedContentLang, setSelectedContentLang] = useState<string>('');
  const [freeOnly, setFreeOnly] = useState<boolean>(user?.profile?.freeOnly ?? true);
  const [searchQuery, setSearchQuery] = useState('');

  // Hub data
  const [paths, setPaths] = useState<LearningPathRecord[]>([]);
  const [resources, setResources] = useState<LearningResourceRecord[]>([]);
  const [loadingHub, setLoadingHub] = useState(!pathSlug);

  // Path detail data
  const [detail, setDetail] = useState<LearningPathDetailPayload | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(Boolean(pathSlug));
  const [startingSession, setStartingSession] = useState(false);
  const [hubError, setHubError] = useState('');

  const handleProgressUpdated = useCallback(
    (slug: string, progress: ResourceProgressRecord) => {
      setResources((prev) =>
        prev.map((r) => (r.slug === slug ? { ...r, progress } : r))
      );
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              steps: prev.steps.map((st) =>
                st.resource && st.resource.slug === slug
                  ? { ...st, resource: { ...st.resource, progress } }
                  : st
              ),
            }
          : prev
      );
    },
    []
  );

  const launcher = useResourceLauncher({
    onProgressUpdated: handleProgressUpdated,
  });

  useEffect(() => {
    apiFetch<TaxonomyPayload>('/api/taxonomy')
      .then(setTaxonomy)
      .catch(() => {});
  }, [apiFetch]);

  const loadHub = useCallback(async () => {
    setLoadingHub(true);
    setHubError('');
    try {
      const pathParams = new URLSearchParams();
      if (selectedTrack) pathParams.set('track', selectedTrack);
      if (selectedLevel) pathParams.set('level', selectedLevel);
      if (freeOnly) pathParams.set('freeOnly', 'true');
      if (selectedLanguage) pathParams.set('languages', selectedLanguage);

      const resParams = new URLSearchParams();
      if (selectedTrack) resParams.set('track', selectedTrack);
      if (selectedLevel) resParams.set('level', selectedLevel);
      if (selectedLanguage) resParams.set('language', selectedLanguage);
      if (selectedContentLang) resParams.set('contentLanguage', selectedContentLang);
      if (freeOnly) resParams.set('freeOnly', 'true');
      if (searchQuery.trim()) resParams.set('q', searchQuery.trim());

      const [pRes, rRes] = await Promise.all([
        apiFetch<{ paths: LearningPathRecord[] }>(`/api/paths?${pathParams.toString()}`),
        apiFetch<{ resources: LearningResourceRecord[] }>(`/api/resources?${resParams.toString()}`),
      ]);

      const q = searchQuery.trim().toLowerCase();
      const filteredPaths = q
        ? pRes.paths.filter((p) =>
            `${p.title} ${p.summary} ${p.sourceName} ${p.track}`.toLowerCase().includes(q)
          )
        : pRes.paths;

      setPaths(filteredPaths);
      setResources(rRes.resources);
    } catch (err) {
      setHubError(err instanceof Error ? err.message : 'Failed to load learning catalog.');
    } finally {
      setLoadingHub(false);
    }
  }, [apiFetch, freeOnly, searchQuery, selectedContentLang, selectedLanguage, selectedLevel, selectedTrack]);

  const loadPathDetail = useCallback(
    async (slug: string) => {
      setLoadingDetail(true);
      setHubError('');
      try {
        const res = await apiFetch<LearningPathDetailPayload>(
          `/api/paths/${encodeURIComponent(slug)}`
        );
        setDetail(res);
      } catch (err) {
        setHubError(err instanceof Error ? err.message : 'Learning path not found.');
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    if (pathSlug) {
      void loadPathDetail(pathSlug);
    } else {
      setDetail(null);
      void loadHub();
    }
  }, [pathSlug, loadHub, loadPathDetail]);

  const handleSetOpenMode = async (mode: ResourceOpenMode) => {
    playTactileClick('tick');
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ resourceOpenMode: mode }),
      });
      if (res.user) setUser(res.user);
    } catch {
      // Non-fatal
    }
  };

  const handleStartPathSession = async (targetSlug: string, stepIndex?: number) => {
    setHubError('');
    setStartingSession(true);
    playTactileClick('confirm');
    try {
      const res = await apiFetch<{ session: SessionRecord }>(
        `/api/paths/${encodeURIComponent(targetSlug)}/start-session`,
        {
          method: 'POST',
          body: JSON.stringify(stepIndex !== undefined ? { stepIndex } : {}),
        }
      );
      setActiveSession(res.session);
      navigate(`/session/${res.session.id}/focus`);
    } catch (err) {
      setHubError(err instanceof Error ? err.message : 'Could not start path session.');
    } finally {
      setStartingSession(false);
    }
  };

  const handleToggleStep = async (stepIndex: number, currentlyDone: boolean) => {
    if (!detail) return;
    playTactileClick('tick');
    try {
      const res = await apiFetch<{ completedStepIndexes: number[] }>(
        `/api/paths/${encodeURIComponent(detail.path.slug)}/steps`,
        {
          method: 'POST',
          body: JSON.stringify({ stepIndex, completed: !currentlyDone }),
        }
      );
      const doneSet = new Set(res.completedStepIndexes);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              completedStepIndexes: res.completedStepIndexes,
              steps: prev.steps.map((s) => ({ ...s, completed: doneSet.has(s.index) })),
            }
          : prev
      );
    } catch (err) {
      setHubError(err instanceof Error ? err.message : 'Could not save step progress.');
    }
  };

  const currentOpenMode = user?.profile?.resourceOpenMode || 'popout';

  // ---------------- PATH DETAIL VIEW (/learn/:slug) ----------------
  if (pathSlug) {
    return (
      <LayoutShell breadcrumb={`Workspace / Learn / ${detail?.path.title || pathSlug}`}>
        <div className="space-y-8 kinetic-enter">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/learn')}
              className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All learning paths</span>
            </button>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-[#8C8175] mr-1">Open mode:</span>
              {(['popout', 'split', 'embed', 'tab'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  data-active={currentOpenMode === mode}
                  onClick={() => void handleSetOpenMode(mode)}
                  className="cadence-keycap rounded px-2.5 py-1 text-[11px] font-medium capitalize text-[#EDE3D2]"
                >
                  {mode === 'popout' ? 'Pop-out' : mode === 'split' ? 'Split pane' : mode}
                </button>
              ))}
            </div>
          </div>

          {hubError && (
            <div role="alert" className="cadence-seam bg-[#E12D1C]/12 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#EDE3D2]">
              <span>{hubError}</span>
              {activeSession && (
                <button
                  type="button"
                  onClick={() => navigate(`/session/${activeSession.id}/focus`)}
                  className="rounded-lg bg-[#E12D1C] px-3 py-1.5 text-xs font-semibold text-[#EDE3D2]"
                >
                  Open active session →
                </button>
              )}
            </div>
          )}

          {loadingDetail ? (
            <div className="h-52 bg-[#151210]/70" />
          ) : detail ? (
            <>
              <section className="cadence-seam pb-6 hairline-bottom flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2 max-w-2xl">
                  <h1 className="font-display text-3xl font-bold text-[#EDE3D2] sm:text-4xl">
                    {detail.path.title}
                  </h1>
                  <p className="text-sm leading-relaxed text-[#A69B8D]">{detail.path.summary}</p>
                  <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[#8C8175] tabular-nums">
                    <span className="capitalize">{detail.path.track.replace(/_/g, ' ')}</span>
                    <span>{detail.path.level}</span>
                    <span>{detail.path.sourceName}</span>
                    <span>~{detail.path.estimatedHours}h total</span>
                    <span>{detail.path.freeOnly ? 'Free resources' : 'Mixed pricing'}</span>
                    <span className="text-[#E12D1C] font-semibold">
                      {detail.completedStepIndexes.length} / {detail.steps.length} steps complete
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <button
                    type="button"
                    disabled={startingSession}
                    onClick={() => void handleStartPathSession(detail.path.slug)}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] disabled:opacity-50"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{startingSession ? 'Launching...' : 'Start path session'}</span>
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
                  Structured steps &amp; companion resources
                </h2>
                <ol className="divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
                  {detail.steps.map((step) => (
                    <li key={step.index} className="py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <button
                          type="button"
                          aria-pressed={step.completed}
                          aria-label={`Mark step ${step.index + 1} ${step.title} complete`}
                          onClick={() => void handleToggleStep(step.index, step.completed)}
                          className="cadence-keycap mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs"
                          data-active={step.completed}
                        >
                          {step.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
                          ) : (
                            <span className="font-mono text-[#A69B8D]">
                              {String(step.index + 1).padStart(2, '0')}
                            </span>
                          )}
                        </button>

                        <div className="space-y-1 min-w-0">
                          <div className={`text-sm font-semibold ${step.completed ? 'line-through text-[#8C8175]' : 'text-[#EDE3D2]'}`}>
                            {step.title}
                          </div>
                          <div className="font-mono text-[11px] text-[#A69B8D]">
                            {step.category.toUpperCase()} · {step.plannedMinutes}m checkpoint
                          </div>

                          {step.resource ? (
                            <div className="pt-1 text-xs text-[#A69B8D] space-y-0.5">
                              <div>
                                Resource:{' '}
                                <span className="font-medium text-[#EDE3D2]">{step.resource.title}</span>{' '}
                                <span className="font-mono text-[11px] text-[#8C8175]">
                                  ({step.resource.provider} · {formatPricingLabel(step.resource.pricingTier)} · {step.resource.format})
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8C8175]">{step.resource.summary}</p>
                            </div>
                          ) : (
                            <div className="pt-1 font-mono text-[11px] text-[#8C8175]">
                              Resource slug: {step.resourceSlug}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 pl-11 lg:pl-0">
                        {step.resource && (
                          <>
                            <button
                              type="button"
                              onClick={() => void launcher.launchResource(step.resource!)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1614] hover:bg-[#231D1A] cadence-keycap px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                            >
                              {currentOpenMode === 'popout' ? (
                                <Maximize2 className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                              ) : (
                                <Columns2 className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                              )}
                              <span>Open resource</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => launcher.openInspector(step.resource!, 'split')}
                              className="cadence-keycap rounded-lg px-3 py-2 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
                            >
                              Notes &amp; pane
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={startingSession}
                          onClick={() => void handleStartPathSession(detail.path.slug, step.index)}
                          className="cadence-keycap rounded-lg px-3.5 py-2 text-xs font-medium text-[#E12D1C] hover:text-[#EDE3D2]"
                        >
                          Practice step →
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-[#A69B8D]">
              This learning path could not be found.
            </div>
          )}
        </div>

        <ResourceLauncherDrawer
          resource={launcher.activeResource}
          open={launcher.drawerOpen}
          mode={launcher.drawerMode}
          blockedWarning={launcher.blockedWarning}
          onClose={launcher.closeDrawer}
          onModeChange={launcher.setDrawerMode}
          onClearBlocked={launcher.clearBlocked}
          onProgressUpdated={handleProgressUpdated}
        />
      </LayoutShell>
    );
  }

  // ---------------- LEARNING HUB DIRECTORY (/learn) ----------------
  const recommendedPaths = paths
    .filter((p) => !selectedTrack || p.track === selectedTrack)
    .slice(0, 3);

  return (
    <LayoutShell breadcrumb="Workspace / Learning Hub">
      <div className="space-y-8 kinetic-enter">
        {/* Header & Companion Launch Preference */}
        <section className="cadence-seam pb-5 hairline-bottom flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#EDE3D2] sm:text-4xl">
              Learning Hub &amp; Curated Resources
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#A69B8D]">
              Structured paths and verified free/freemium learning resources matched to your track, level, and content language. Launch resources in a companion pop-out window or split drawer while tracking sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="font-mono text-[11px] text-[#8C8175] mr-1">Launch mode:</span>
            {(['popout', 'split', 'embed', 'tab'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                data-active={currentOpenMode === mode}
                onClick={() => void handleSetOpenMode(mode)}
                className="cadence-keycap rounded px-2.5 py-1.5 text-[11px] font-medium capitalize text-[#EDE3D2]"
              >
                {mode === 'popout' ? 'Pop-out' : mode === 'split' ? 'Split pane' : mode}
              </button>
            ))}
          </div>
        </section>

        {hubError && (
          <div role="alert" className="cadence-seam bg-[#E12D1C]/12 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#EDE3D2]">
            <span>{hubError}</span>
            {activeSession && (
              <button
                type="button"
                onClick={() => navigate(`/session/${activeSession.id}/focus`)}
                className="rounded-lg bg-[#E12D1C] px-3 py-1.5 text-xs font-semibold text-[#EDE3D2]"
              >
                Resume active session →
              </button>
            )}
          </div>
        )}

        {/* Filter Bar */}
        <section className="space-y-4 pb-5 hairline-bottom">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
            <div className="relative sm:col-span-5">
              <Search className="pointer-events-none absolute left-2.5 bottom-3 h-4 w-4 text-[#A69B8D]" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by topic, platform, or skill..."
                aria-label="Filter learning paths and resources"
                className="cadence-field pl-9 text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-mono text-[10px] text-[#8C8175] mb-1">Programming language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                aria-label="Filter by programming language"
                className="cadence-field bg-[#0A0908] text-xs"
              >
                <option value="">All languages</option>
                {(taxonomy?.languageCodes || []).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono text-[10px] text-[#8C8175] mb-1">Docs language</label>
              <select
                value={selectedContentLang}
                onChange={(e) => setSelectedContentLang(e.target.value)}
                aria-label="Filter by content language"
                className="cadence-field bg-[#0A0908] text-xs"
              >
                <option value="">Any</option>
                {(taxonomy?.contentLanguages || []).map((cl) => (
                  <option key={cl.code} value={cl.code}>
                    {cl.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                type="button"
                data-active={freeOnly}
                aria-pressed={freeOnly}
                onClick={() => {
                  playTactileClick('tick');
                  setFreeOnly((v) => !v);
                }}
                className="cadence-keycap w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#EDE3D2]"
              >
                {freeOnly && <Check className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />}
                <span>Free &amp; Freemium</span>
              </button>
            </div>
          </div>

          {/* Track Filter Keycaps */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-active={selectedTrack === ''}
              onClick={() => {
                playTactileClick('tick');
                setSelectedTrack('');
              }}
              className="cadence-keycap rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#EDE3D2]"
            >
              All tracks
            </button>
            {(taxonomy?.tracks || []).map((t) => (
              <button
                key={t.id}
                type="button"
                data-active={selectedTrack === t.id}
                onClick={() => {
                  playTactileClick('tick');
                  setSelectedTrack(t.id);
                }}
                className="cadence-keycap rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#EDE3D2]"
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Level Filter Keycaps + View Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: '', label: 'All levels' },
                { id: 'beginner', label: 'Beginner' },
                { id: 'intermediate', label: 'Intermediate' },
                { id: 'advanced', label: 'Advanced' },
              ].map((lvl) => (
                <button
                  key={lvl.id || 'all'}
                  type="button"
                  data-active={selectedLevel === lvl.id}
                  onClick={() => {
                    playTactileClick('tick');
                    setSelectedLevel(lvl.id);
                  }}
                  className="cadence-keycap rounded-lg px-3 py-1 text-[11px] font-medium text-[#EDE3D2]"
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2" role="tablist" aria-label="Learning Hub view tabs">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'paths'}
                data-active={tab === 'paths'}
                onClick={() => setTab('paths')}
                className="cadence-keycap rounded-lg px-4 py-1.5 text-xs font-semibold text-[#EDE3D2]"
              >
                Learning Paths ({paths.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'resources'}
                data-active={tab === 'resources'}
                onClick={() => setTab('resources')}
                className="cadence-keycap rounded-lg px-4 py-1.5 text-xs font-semibold text-[#EDE3D2]"
              >
                Curated Resources ({resources.length})
              </button>
            </div>
          </div>
        </section>

        {/* Main Directory Content */}
        {loadingHub ? (
          <div className="h-52 bg-[#151210]/70" />
        ) : tab === 'paths' ? (
          <div className="space-y-8">
            {recommendedPaths.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
                  Top matches for your profile
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:divide-x md:divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom py-4">
                  {recommendedPaths.map((p, idx) => (
                    <div key={p.slug} className={`space-y-2.5 ${idx > 0 ? 'md:pl-5' : ''}`}>
                      <div className="font-mono text-[11px] text-[#E12D1C]">
                        {p.track.replace(/_/g, ' ')} · {p.level}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/learn/${p.slug}`)}
                        className="text-left font-display text-base font-bold text-[#EDE3D2] hover:text-[#E12D1C]"
                      >
                        {p.title}
                      </button>
                      <p className="text-xs leading-relaxed text-[#A69B8D]">{p.summary}</p>
                      <div className="font-mono text-[11px] text-[#8C8175] tabular-nums">
                        {p.steps.length} steps · ~{p.estimatedHours}h · {p.sourceName}
                      </div>
                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/learn/${p.slug}`)}
                          className="cadence-keycap inline-flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-medium text-[#EDE3D2]"
                        >
                          <BookOpen className="h-3 w-3 text-[#E12D1C]" aria-hidden="true" />
                          <span>Inspect path</span>
                        </button>
                        <button
                          type="button"
                          disabled={startingSession}
                          onClick={() => void handleStartPathSession(p.slug)}
                          className="inline-flex items-center gap-1 rounded bg-[#E12D1C] px-3 py-1.5 text-[11px] font-semibold text-[#EDE3D2]"
                        >
                          <Play className="h-3 w-3" aria-hidden="true" />
                          <span>Start session</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
                All matching learning paths ({paths.length})
              </h2>
              {paths.length === 0 ? (
                <p className="py-8 text-xs text-[#A69B8D]">
                  No paths matched those filters. Clear a track or language filter to broaden results.
                </p>
              ) : (
                <div className="divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
                  {paths.map((p) => (
                    <div
                      key={p.slug}
                      className="py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/learn/${p.slug}`)}
                          className="text-left font-display text-base font-semibold text-[#EDE3D2] hover:text-[#E12D1C]"
                        >
                          {p.title}
                        </button>
                        <p className="text-xs text-[#A69B8D]">{p.summary}</p>
                        <div className="font-mono text-[11px] text-[#8C8175] tabular-nums">
                          {p.track.replace(/_/g, ' ')} · {p.level} · {p.sourceName} · {p.steps.length} steps · ~{p.estimatedHours}h · {p.freeOnly ? 'Free' : 'Mixed'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/learn/${p.slug}`)}
                          className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                        >
                          <span>View steps</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={startingSession}
                          onClick={() => void handleStartPathSession(p.slug)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-3.5 py-2 text-xs font-semibold text-[#EDE3D2]"
                        >
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Practice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
              Curated external platforms &amp; docs ({resources.length})
            </h2>
            {resources.length === 0 ? (
              <p className="py-8 text-xs text-[#A69B8D]">
                No resources matched your active filters. Try clearing one language or track filter.
              </p>
            ) : (
              <div className="divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
                {resources.map((res) => (
                  <div
                    key={res.slug}
                    className="py-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-semibold text-[#EDE3D2]">
                          {res.title}
                        </span>
                        <span className="font-mono text-[11px] text-[#E12D1C]">
                          {formatPricingLabel(res.pricingTier)}
                        </span>
                        {res.progress && (
                          <span className="font-mono text-[11px] text-[#A69B8D] capitalize">
                            · {res.progress.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-[#A69B8D]">{res.summary}</p>
                      <div className="font-mono text-[11px] text-[#8C8175] tabular-nums">
                        {res.provider} · {res.format} · {res.level} · Languages: {res.contentLanguages.join(', ')}
                        {res.estimatedMinutes ? ` · ~${res.estimatedMinutes}m` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void launcher.launchResource(res)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-3.5 py-2 text-xs font-semibold text-[#EDE3D2]"
                      >
                        <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Launch</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => launcher.openInspector(res, 'split')}
                        className="cadence-keycap rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                      >
                        Notes &amp; split pane
                      </button>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${res.title} directly in a new tab`}
                        className="cadence-keycap inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#A69B8D] hover:text-[#EDE3D2]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <ResourceLauncherDrawer
        resource={launcher.activeResource}
        open={launcher.drawerOpen}
        mode={launcher.drawerMode}
        blockedWarning={launcher.blockedWarning}
        onClose={launcher.closeDrawer}
        onModeChange={launcher.setDrawerMode}
        onClearBlocked={launcher.clearBlocked}
        onProgressUpdated={handleProgressUpdated}
      />
    </LayoutShell>
  );
};
