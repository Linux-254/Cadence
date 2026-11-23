import React, { useEffect, useRef, useState } from 'react';
import { Check, Play, Plus, Search, Trash2 } from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { useAuth } from '../context/AuthContext';
import { playTactileTick } from '../utils/audioAlarm';
import type {
  ProjectRecord,
  ProjectType,
  SearchDiscoveryResult,
  TaxonomyPayload,
  ToolCategory,
  ToolRecord,
} from '../types/cadence';

interface DraftCheckpoint {
  id: string;
  category: ToolCategory;
  title: string;
  toolSlugs: string[];
  plannedMinutes: number;
}

const DEFAULT_CATEGORIES: { id: ToolCategory; label: string }[] = [
  { id: 'research', label: 'Research' },
  { id: 'design', label: 'Design' },
  { id: 'dev', label: 'Dev' },
  { id: 'review', label: 'Review' },
  { id: 'testing', label: 'Testing' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'clientele', label: 'Clientele' },
  { id: 'learning', label: 'Learning' },
  { id: 'security', label: 'Security' },
  { id: 'data', label: 'Data & SQL' },
  { id: 'ai', label: 'AI & ML' },
  { id: 'cloud', label: 'Cloud & Infra' },
  { id: 'mobile', label: 'Mobile' },
];

const DURATION_PRESETS = [
  { label: '45m Block', minutes: 45 },
  { label: '90m Sprint', minutes: 90 },
  { label: '12 Hours', minutes: 720 },
  { label: '1 Day (24h)', minutes: 1440 },
  { label: '48 Hours', minutes: 2880 },
  { label: '1 Week (7d)', minutes: 10080 },
  { label: '1 Month (30d)', minutes: 43200 },
];

export const SessionPlannerPage: React.FC = () => {
  const { apiFetch, navigate, searchParams, activeSession, setActiveSession, user } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [categories, setCategories] = useState<{ id: ToolCategory; label: string }[]>(DEFAULT_CATEGORIES);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '');
  const [mode, setMode] = useState<ProjectType>('personal');
  const [totalBudgetMinutes, setTotalBudgetMinutes] = useState(90);
  const [selectedCategories, setSelectedCategories] = useState<ToolCategory[]>(['design', 'dev', 'testing']);
  const [selectedToolSlugs, setSelectedToolSlugs] = useState<string[]>(
    user?.defaultToolSlugs?.length ? user.defaultToolSlugs : ['vscode', 'google-ai-studio']
  );
  const [checkpoints, setCheckpoints] = useState<DraftCheckpoint[]>([
    { id: '1', category: 'design', title: 'UI layout and component plan', toolSlugs: ['google-ai-studio'], plannedMinutes: 25 },
    { id: '2', category: 'dev', title: 'Core implementation', toolSlugs: ['vscode'], plannedMinutes: 45 },
    { id: '3', category: 'testing', title: 'Verification and edge cases', toolSlugs: ['vscode'], plannedMinutes: 20 },
  ]);

  const appliedProfileDefaultsRef = useRef(false);
  const [quickProjectName, setQuickProjectName] = useState('');
  const [quickProjectIndustry, setQuickProjectIndustry] = useState('SaaS');
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResult, setAdvisorResult] = useState<SearchDiscoveryResult | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const preset = searchParams.get('preset');
    if (preset === 'vibe_mvp') {
      appliedProfileDefaultsRef.current = true;
      setMode('personal');
      setTotalBudgetMinutes(120);
      setSelectedCategories(['research', 'design', 'dev', 'testing']);
      setCheckpoints([
        { id: 'p1', category: 'research', title: 'Scope and prompt plan', toolSlugs: ['claude'], plannedMinutes: 20 },
        { id: 'p2', category: 'design', title: 'UI flow and styling', toolSlugs: ['stitch'], plannedMinutes: 30 },
        { id: 'p3', category: 'dev', title: 'Build core features', toolSlugs: ['cursor', 'lovable'], plannedMinutes: 50 },
        { id: 'p4', category: 'testing', title: 'Smoke test and deploy check', toolSlugs: ['vercel'], plannedMinutes: 20 },
      ]);
    } else if (preset === 'beginner_learn') {
      appliedProfileDefaultsRef.current = true;
      setMode('learning');
      setTotalBudgetMinutes(90);
      setSelectedCategories(['research', 'dev', 'review']);
      setCheckpoints([
        { id: 'b1', category: 'research', title: 'Read docs and understand pattern', toolSlugs: ['google-ai-studio'], plannedMinutes: 30 },
        { id: 'b2', category: 'dev', title: 'Hands-on coding practice', toolSlugs: ['vscode'], plannedMinutes: 45 },
        { id: 'b3', category: 'review', title: 'Debug and write learning notes', toolSlugs: ['vscode'], plannedMinutes: 15 },
      ]);
    } else if (preset === 'client_12h') {
      appliedProfileDefaultsRef.current = true;
      setMode('business');
      setTotalBudgetMinutes(720);
      setSelectedCategories(['clientele', 'dev', 'testing', 'deployment']);
      setCheckpoints([
        { id: 'c1', category: 'clientele', title: 'Client scope and deliverables alignment', toolSlugs: ['linear'], plannedMinutes: 60 },
        { id: 'c2', category: 'dev', title: 'Feature implementation', toolSlugs: ['cursor'], plannedMinutes: 420 },
        { id: 'c3', category: 'testing', title: 'QA and regression suite', toolSlugs: ['playwright'], plannedMinutes: 120 },
        { id: 'c4', category: 'deployment', title: 'Staging and production release', toolSlugs: ['vercel'], plannedMinutes: 120 },
      ]);
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const [projRes, toolRes, taxRes] = await Promise.all([
          apiFetch<{ projects: ProjectRecord[] }>('/api/projects'),
          apiFetch<{ tools: ToolRecord[] }>('/api/tools'),
          apiFetch<TaxonomyPayload>('/api/taxonomy'),
        ]);
        setProjects(projRes.projects);
        setTools(toolRes.tools);
        if (taxRes?.categories?.length) {
          setCategories(taxRes.categories);
        }

        if (!selectedProjectId && projRes.projects.length > 0) {
          const first = projRes.projects[0];
          setSelectedProjectId(first.id);
          setMode(first.type);
        }

        // Apply level.sessionDefaults + track preset defaultCheckpoints when no URL preset was selected
        if (!appliedProfileDefaultsRef.current && user?.profile && taxRes) {
          appliedProfileDefaultsRef.current = true;
          const levelDef = taxRes.levels.find((l) => l.id === user.profile.level) || taxRes.levels[0];
          const primaryTrack = user.profile.tracks?.[0] || 'fullstack';
          const trackPreset = taxRes.presets[primaryTrack];
          const blockMins = levelDef?.sessionDefaults?.blockMinutes || 90;

          setTotalBudgetMinutes(blockMins);
          const sourceMix =
            trackPreset?.defaultCheckpoints?.length
              ? trackPreset.defaultCheckpoints
              : (levelDef?.sessionDefaults?.checkpointMix || []).map((m) => ({
                  category: m.category,
                  title: `${m.category} checkpoint`,
                  ratio: m.ratio,
                }));

          if (sourceMix.length > 0) {
            const toolsToBind = (user.defaultToolSlugs || trackPreset?.tools || ['vscode']).slice(0, 3);
            setCheckpoints(
              sourceMix.map((c, idx) => ({
                id: `def_${idx}_${Date.now()}`,
                category: c.category,
                title: c.title,
                toolSlugs: toolsToBind,
                plannedMinutes: Math.max(5, Math.round(blockMins * c.ratio)),
              }))
            );
            setSelectedCategories(Array.from(new Set(sourceMix.map((c) => c.category))));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects and tools.');
      }
    })();
  }, []);

  const handleProjectChange = (pid: string) => {
    setSelectedProjectId(pid);
    const proj = projects.find((p) => p.id === pid);
    if (proj) setMode(proj.type);
  };

  const toggleCategory = (cat: ToolCategory) => {
    playTactileTick(740);
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleTool = (slug: string) => {
    playTactileTick(800);
    setSelectedToolSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const autoDistributeBudget = (targetMinutes: number) => {
    playTactileTick(700);
    setTotalBudgetMinutes(targetMinutes);
    if (checkpoints.length === 0) return;
    const perCp = Math.max(10, Math.round(targetMinutes / checkpoints.length));
    setCheckpoints((prev) => prev.map((c) => ({ ...c, plannedMinutes: perCp })));
  };

  const handleAdvisorSearch = async () => {
    if (!advisorQuery.trim()) return;
    setAdvisorLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ result: SearchDiscoveryResult }>('/api/ai/discover-stack', {
        method: 'POST',
        body: JSON.stringify({ query: advisorQuery, mode }),
      });
      setAdvisorResult(res.result);
      if (res.result.suggestedCheckpoints.length > 0) {
        const mapped: DraftCheckpoint[] = res.result.suggestedCheckpoints.map((c, idx) => ({
          id: `adv_${idx}_${Date.now()}`,
          category: c.category,
          title: c.title,
          toolSlugs: selectedToolSlugs.slice(0, 2),
          plannedMinutes: c.plannedMinutes,
        }));
        setCheckpoints(mapped);
        setTotalBudgetMinutes(mapped.reduce((s, c) => s + c.plannedMinutes, 0));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Advisor search failed.');
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStarting(true);
    try {
      let projectIdToUse = selectedProjectId;
      if (!projectIdToUse) {
        if (!quickProjectName.trim()) {
          setError('Select an existing project or enter a new project name.');
          setStarting(false);
          return;
        }
        const created = await apiFetch<{ project: ProjectRecord }>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: quickProjectName.trim(),
            type: mode,
            industry: quickProjectIndustry,
            languages: user?.profile?.programmingLanguages?.slice(0, 3) || ['TypeScript'],
            stack: ['React', 'Tailwind CSS'],
          }),
        });
        projectIdToUse = created.project.id;
      }

      const res = await apiFetch<{ session: typeof activeSession }>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          projectId: projectIdToUse,
          mode,
          plannedMinutes: checkpoints.reduce((s, c) => s + c.plannedMinutes, 0),
          checkpoints: checkpoints.map((c) => ({
            category: c.category,
            title: c.title,
            toolSlugs: c.toolSlugs.length > 0 ? c.toolSlugs : selectedToolSlugs.slice(0, 3),
            plannedMinutes: c.plannedMinutes,
          })),
        }),
      });
      setActiveSession(res.session);
      if (res.session) {
        navigate(`/session/${res.session.id}/focus`, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session.');
    } finally {
      setStarting(false);
    }
  };

  const visibleTools = tools.filter((t) =>
    selectedCategories.length === 0 ? true : t.categories.some((c) => selectedCategories.includes(c))
  );
  const totalAllocated = checkpoints.reduce((s, c) => s + c.plannedMinutes, 0);

  if (activeSession && (activeSession.status === 'active' || activeSession.status === 'paused')) {
    return (
      <LayoutShell breadcrumb="Sessions / Active Lock">
        <div className="mx-auto max-w-lg py-12 text-center space-y-5">
          <h1 className="font-display text-2xl font-bold text-[#EDE3D2]">Session already in progress</h1>
          <p className="text-sm text-[#A69B8D]">
            Cadence permits one active session at a time to protect focus accuracy. Resume or finish your current session first.
          </p>
          <button
            type="button"
            onClick={() =>
              navigate(
                activeSession.status === 'paused'
                  ? `/session/${activeSession.id}/pause`
                  : `/session/${activeSession.id}/focus`
              )
            }
            className="rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2]"
          >
            Go to live session
          </button>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell breadcrumb="Workspace / Session Planner">
      <form onSubmit={handleStartSession} className="space-y-10 kinetic-enter">
        <section className="relative overflow-hidden py-8 editorial-band-ember hairline-bottom">
          <img
            src="/assets/aistudio/image_e5f2758f.png"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="mask-fade-right absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0908] via-[#0A0908]/88 to-transparent" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="cadence-seam">
              <h1 className="font-display text-3xl font-bold text-[#EDE3D2]">Plan accountability session</h1>
              <p className="mt-1 text-xs text-[#A69B8D]">
                Bind your project mode, filter tool categories, and allocate timed checkpoints ({totalAllocated}m budget).
              </p>
            </div>
            <button
              type="submit"
              disabled={starting}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{starting ? 'Starting...' : 'Start timed session'}</span>
            </button>
          </div>
        </section>

        {/* Visual Checkpoint Allocation Timeline Bar */}
        {checkpoints.length > 0 && (
          <div className="pb-6 hairline-bottom space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-xs text-[#A69B8D]">
                Checkpoint split preview
              </span>
              <span className="font-mono text-[#E12D1C] tabular-nums">
                {totalAllocated}m across {checkpoints.length} blocks
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#1C1815] gap-0.5">
              {checkpoints.map((cp, i) => {
                const pct = Math.max(4, Math.round((cp.plannedMinutes / Math.max(1, totalAllocated)) * 100));
                const colors = ['bg-[#E12D1C]', 'bg-[#EDE3D2]', 'bg-[#A69B8D]', 'bg-[#8F1F15]', 'bg-[#5E564B]'];
                return (
                  <div
                    key={cp.id}
                    title={`${cp.category}: ${cp.title} (${cp.plannedMinutes}m)`}
                    className={`${colors[i % colors.length]} h-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="cadence-seam bg-[#E12D1C]/12 px-4 py-3 text-xs text-[#EDE3D2]">
            {error}
          </div>
        )}

        {/* Step 1 & 2 */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:divide-x lg:divide-[#EDE3D2]/[0.08] pb-8 hairline-bottom">
          <div className="lg:pr-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">01. Project and intent mode</h2>
            {projects.length > 0 ? (
              <div>
                <label htmlFor="sp-proj" className="block font-mono text-[11px] text-[#A69B8D]">
                  Target project
                </label>
                <select
                  id="sp-proj"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="cadence-field mt-1.5 text-sm bg-[#12100E]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                  <option value="">+ Create new quick project</option>
                </select>
              </div>
            ) : null}

            {!selectedProjectId && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[11px] text-[#A69B8D]">New project name</label>
                  <input
                    type="text"
                    required={!selectedProjectId}
                    value={quickProjectName}
                    onChange={(e) => setQuickProjectName(e.target.value)}
                    placeholder="My Build Project"
                    className="cadence-field mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-[#A69B8D]">Industry</label>
                  <input
                    type="text"
                    value={quickProjectIndustry}
                    onChange={(e) => setQuickProjectIndustry(e.target.value)}
                    className="cadence-field mt-1 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 font-mono text-[11px] text-[#A69B8D]">Session mode</div>
              <div className="grid grid-cols-3 gap-2.5">
                {(['personal', 'business', 'learning'] as ProjectType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-active={mode === m}
                    onClick={() => setMode(m)}
                    className="cadence-keycap rounded-lg px-3 py-2 text-xs font-semibold capitalize text-[#EDE3D2]"
                  >
                    {m}
                  </button>
                ))}
              </div>
              {mode === 'learning' && (
                <p className="mt-2 text-[11px] text-[#A69B8D]">
                  Learning mode captures a &quot;What I Learned&quot; takeaway at wrap-up and boosts practice streaks.
                </p>
              )}
            </div>
          </div>

          <div className="lg:pl-8 space-y-5">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">02. Commitment window</h2>
            <p className="text-xs text-[#A69B8D]">
              Auto-defaulted to your level&apos;s block length ({totalBudgetMinutes}m) or adjust to any multi-day window.
            </p>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  data-active={totalBudgetMinutes === preset.minutes}
                  onClick={() => autoDistributeBudget(preset.minutes)}
                  className="cadence-keycap rounded-md px-3 py-1.5 text-xs font-medium text-[#EDE3D2]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="custom-mins" className="font-mono text-[11px] text-[#A69B8D]">
                Custom minutes:
              </label>
              <input
                id="custom-mins"
                type="number"
                min={15}
                max={43200}
                value={totalBudgetMinutes}
                onChange={(e) => autoDistributeBudget(Math.max(15, Number(e.target.value) || 45))}
                className="cadence-field w-28 font-mono text-xs tabular-nums"
              />
            </div>

            <div className="pt-4 hairline-top">
              <div className="text-xs font-semibold text-[#EDE3D2]">Need checkpoint ideas? Ask Google Search Advisor</div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={advisorQuery}
                  onChange={(e) => setAdvisorQuery(e.target.value)}
                  placeholder="e.g., Build Stripe checkout + webhook test"
                  className="cadence-field flex-1 text-xs"
                />
                <button
                  type="button"
                  disabled={advisorLoading}
                  onClick={() => void handleAdvisorSearch()}
                  className="cadence-keycap inline-flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-medium text-[#EDE3D2]"
                >
                  <Search className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                  <span>{advisorLoading ? 'Searching...' : 'Suggest'}</span>
                </button>
              </div>
              {advisorResult?.sources && advisorResult.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#E12D1C]">
                  {advisorResult.sources.slice(0, 3).map((s, idx) => (
                    <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="underline">
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 3: Categories & LED Keycap Tools */}
        <section className="pb-8 hairline-bottom space-y-5">
          <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">03. Filter categories and bind tool keys</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-active={active}
                  onClick={() => toggleCategory(cat.id)}
                  className="cadence-keycap rounded-md px-3.5 py-1.5 text-xs font-medium text-[#EDE3D2]"
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2.5">
            {visibleTools.map((tool) => {
              const picked = selectedToolSlugs.includes(tool.slug);
              return (
                <button
                  key={tool.slug}
                  type="button"
                  data-active={picked}
                  onClick={() => toggleTool(tool.slug)}
                  className="cadence-keycap rounded-xl px-4 py-2.5 text-left text-xs min-w-[148px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-[#EDE3D2]">{tool.name}</span>
                    {picked && <Check className="h-3 w-3 shrink-0 text-[#E12D1C]" />}
                  </div>
                  <div className="text-[10px] text-[#6E655B] truncate">{tool.categories.join(', ')}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 4: Checkpoints */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">04. Timed checkpoints</h2>
              <p className="text-xs text-[#A69B8D] font-mono tabular-nums">
                Total allocated: {totalAllocated}m
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setCheckpoints((prev) => [
                  ...prev,
                  {
                    id: `cp_${Date.now()}`,
                    category: selectedCategories[0] || 'dev',
                    title: 'New checkpoint',
                    toolSlugs: selectedToolSlugs.slice(0, 2),
                    plannedMinutes: 30,
                  },
                ])
              }
              className="cadence-keycap inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
            >
              <Plus className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
              <span>Add checkpoint</span>
            </button>
          </div>

          <div className="divide-y divide-[#EDE3D2]/[0.07] hairline-top hairline-bottom">
            {checkpoints.map((cp, idx) => (
              <div key={cp.id} className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-3">
                  <select
                    value={cp.category}
                    onChange={(e) =>
                      setCheckpoints((prev) =>
                        prev.map((x) => (x.id === cp.id ? { ...x, category: e.target.value as ToolCategory } : x))
                      )
                    }
                    className="cadence-field bg-[#14110F] text-xs capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    value={cp.title}
                    onChange={(e) =>
                      setCheckpoints((prev) =>
                        prev.map((x) => (x.id === cp.id ? { ...x, title: e.target.value } : x))
                      )
                    }
                    placeholder={`Checkpoint ${idx + 1} goal`}
                    className="cadence-field text-xs"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <input
                    type="number"
                    min={5}
                    max={20000}
                    value={cp.plannedMinutes}
                    onChange={(e) =>
                      setCheckpoints((prev) =>
                        prev.map((x) =>
                          x.id === cp.id ? { ...x, plannedMinutes: Math.max(5, Number(e.target.value) || 15) } : x
                        )
                      )
                    }
                    className="cadence-field font-mono text-xs tabular-nums"
                  />
                  <span className="text-xs text-[#A69B8D]">m</span>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  {checkpoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCheckpoints((prev) => prev.filter((x) => x.id !== cp.id))}
                      aria-label="Remove checkpoint"
                      className="rounded p-1.5 text-[#A69B8D] hover:text-[#E12D1C]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </form>
    </LayoutShell>
  );
};
