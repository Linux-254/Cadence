import React, { useEffect, useState } from 'react';
import { ExternalLink, Plus, Search } from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { ResourceLauncherDrawer } from '../components/ResourceLauncher';
import { WorkstationStudioModal } from '../components/WorkstationStudioModal';
import { ScrollRevealBand } from '../components/ScrollChoreography';
import { useAuth } from '../context/AuthContext';
import { useResourceLauncher } from '../hooks/useResourceLauncher';
import type { ProjectType, SearchDiscoveryResult, ToolCategory, ToolRecord } from '../types/cadence';
import { playTactileClick } from '../utils/audioAlarm';

const CATEGORIES: { id: 'all' | ToolCategory; label: string }[] = [
  { id: 'all', label: 'All Tools' },
  { id: 'dev', label: 'Dev' },
  { id: 'design', label: 'Design' },
  { id: 'research', label: 'Research' },
  { id: 'review', label: 'Review' },
  { id: 'testing', label: 'Testing' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'clientele', label: 'Clientele' },
];

export const ToolsPage: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const launcher = useResourceLauncher();
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [catFilter, setCatFilter] = useState<'all' | ToolCategory>('all');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customCats, setCustomCats] = useState<ToolCategory[]>(['dev']);
  const [customProtocol, setCustomProtocol] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<ProjectType>('personal');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchDiscoveryResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [addedSlugs, setAddedSlugs] = useState<string[]>([]);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioToolName, setStudioToolName] = useState('Cadence Dev Workstation');

  const loadTools = async () => {
    const res = await apiFetch<{ tools: ToolRecord[] }>('/api/tools');
    setTools(res.tools);
  };

  useEffect(() => {
    void loadTools();
  }, []);

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch<{ tool: ToolRecord }>('/api/tools', {
      method: 'POST',
      body: JSON.stringify({
        name: customName,
        categories: customCats,
        launchProtocol: customProtocol,
        domainPattern: customDomain,
        description: customDesc,
      }),
    });
    setTools((prev) => [...prev, res.tool]);
    setCustomName('');
    setCustomProtocol('');
    setCustomDomain('');
    setCustomDesc('');
    setShowCustomForm(false);
    playTactileClick('confirm');
  };

  const handleRunSearchDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await apiFetch<{ result: SearchDiscoveryResult }>('/api/ai/discover-stack', {
        method: 'POST',
        body: JSON.stringify({ query: searchQuery, mode: searchMode }),
      });
      setSearchResult(res.result);
      playTactileClick('confirm');
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Google Search stack discovery failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleImportTool = async (t: SearchDiscoveryResult['recommendedTools'][0]) => {
    const res = await apiFetch<{ tool: ToolRecord }>('/api/tools', {
      method: 'POST',
      body: JSON.stringify({
        name: t.name,
        categories: t.categories.length > 0 ? t.categories : ['dev'],
        launchProtocol: t.docsUrl,
        domainPattern: t.domainPattern,
        docsUrl: t.docsUrl,
        description: t.description,
      }),
    });
    setTools((prev) => [...prev, res.tool]);
    setAddedSlugs((prev) => [...prev, t.slug]);
    playTactileClick('confirm');
  };

  const filteredTools =
    catFilter === 'all' ? tools : tools.filter((t) => t.categories.includes(catFilter));

  return (
    <LayoutShell breadcrumb="Workspace / Tools & Stack Discovery">
      <div className="space-y-10">
        {/* Google Search Grounded Stack Discovery */}
        <section className="relative overflow-hidden py-8 editorial-band-ember hairline-bottom">
          <img
            src="/assets/aistudio/image_a501a49c.png"
            alt=""
            aria-hidden="true"
            className="mask-fade-right pointer-events-none absolute right-0 top-0 h-full w-1/2 object-cover opacity-22"
          />

          <div className="relative z-10">
            <div className="cadence-seam">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#E12D1C]">
                Google Search Grounding · {user?.skillLevel.replace('_', ' ')}
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold text-[#EDE3D2]">
                Discover Tools, Stacks &amp; Checkpoints with Live Web Search
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#A69B8D]">
                Whether you are learning your first framework, shipping an AI prototype, or architecting enterprise services, query Google Search to populate real-world tools, documentation links, and realistic sprint splits.
              </p>
            </div>

            <form onSubmit={handleRunSearchDiscovery} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 bottom-3 h-4 w-4 text-[#A69B8D]" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Best AI + Express + React stack for SaaS MVP, or Python data pipeline"
                  className="cadence-field pl-9 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(['personal', 'business', 'learning'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-active={searchMode === m ? 'true' : 'false'}
                    onClick={() => {
                      playTactileClick('tick');
                      setSearchMode(m);
                    }}
                    className="cadence-keycap rounded-xl px-3 py-2 text-[11px] font-medium capitalize text-[#EDE3D2]"
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={searching}
                className="rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.65)] hover:brightness-110 disabled:opacity-60 whitespace-nowrap"
              >
                {searching ? 'Searching Web...' : 'Search & Populate'}
              </button>
            </form>

            {searchError && (
              <div role="alert" className="cadence-seam mt-4 bg-[#E12D1C]/10 px-3.5 py-2.5 text-xs text-[#EDE3D2]">
                {searchError}
              </div>
            )}

            {searchResult && (
              <div className="mt-6 space-y-6 pt-5 hairline-top">
                <p className="text-sm leading-relaxed text-[#EDE3D2]">{searchResult.summary}</p>

                {searchResult.recommendedTools.length > 0 && (
                  <div>
                    <h2 className="font-mono text-[11px] uppercase tracking-wider text-[#A69B8D]">
                      Recommended Tools Found
                    </h2>
                    <div className="mt-3 divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
                      {searchResult.recommendedTools.map((t) => {
                        const already =
                          addedSlugs.includes(t.slug) ||
                          tools.some((existing) => existing.name.toLowerCase() === t.name.toLowerCase());
                        return (
                          <div key={t.slug} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-12 sm:items-center">
                            <div className="sm:col-span-3">
                              <div className="text-sm font-semibold text-[#EDE3D2]">{t.name}</div>
                              <div className="font-mono text-[10px] uppercase tracking-wider text-[#E12D1C]">
                                {t.categories.join(', ')}
                              </div>
                            </div>
                            <p className="sm:col-span-6 text-xs text-[#A69B8D]">{t.description}</p>
                            <div className="sm:col-span-3 flex items-center justify-end gap-4">
                              {t.docsUrl && (
                                <a
                                  href={t.docsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#E12D1C] hover:underline"
                                >
                                  <span>Docs</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <button
                                type="button"
                                disabled={already}
                                onClick={() => void handleImportTool(t)}
                                className="cadence-keycap rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#EDE3D2] disabled:opacity-45"
                              >
                                {already ? 'In Catalog' : 'Add to Catalog'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchResult.beginnerTips.length > 0 && (
                  <div>
                    <h2 className="font-mono text-[11px] uppercase tracking-wider text-[#A69B8D]">
                      Key Execution Guardrails
                    </h2>
                    <ul className="mt-2 space-y-1 text-xs text-[#A69B8D]">
                      {searchResult.beginnerTips.map((tip, i) => (
                        <li key={i}>· {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {searchResult.sources.length > 0 && (
                  <div className="pt-3 hairline-top">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#6E655B]">
                      Google Search Grounding Sources
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      {searchResult.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#E12D1C] hover:underline"
                        >
                          <span>{src.title}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Tool Catalog */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="cadence-seam">
              <h2 className="font-display text-2xl font-bold text-[#EDE3D2]">Tool Catalog &amp; IDE Deep Links</h2>
              <p className="text-xs text-[#A69B8D]">
                Filter across Dev, Design, Research, Review, Testing, Deployment, and Clientele.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playTactileClick('tick');
                setShowCustomForm((v) => !v);
              }}
              className="cadence-keycap inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-[#EDE3D2]"
            >
              <Plus className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
              <span>{showCustomForm ? 'Close' : 'Add Custom Tool'}</span>
            </button>
          </div>

          {showCustomForm && (
            <form onSubmit={handleAddCustom} className="pb-6 hairline-bottom space-y-5 kinetic-enter">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Tool name (e.g. Drizzle Studio)"
                  className="cadence-field text-xs"
                />
                <input
                  type="text"
                  value={customProtocol}
                  onChange={(e) => setCustomProtocol(e.target.value)}
                  placeholder="Launch URI / URL (https://...)"
                  className="cadence-field text-xs"
                />
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="Domain pattern (optional)"
                  className="cadence-field text-xs"
                />
              </div>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Brief description of what you use it for..."
                className="cadence-field text-xs"
              />
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => {
                  const catId = c.id as ToolCategory;
                  const active = customCats.includes(catId);
                  return (
                    <button
                      key={catId}
                      type="button"
                      data-active={active ? 'true' : 'false'}
                      onClick={() => {
                        playTactileClick('tick');
                        setCustomCats((prev) =>
                          prev.includes(catId) ? prev.filter((x) => x !== catId) : [...prev, catId]
                        );
                      }}
                      className="cadence-keycap rounded-lg px-3 py-1.5 text-xs font-medium text-[#EDE3D2]"
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.65)] hover:brightness-110"
              >
                Save Custom Tool
              </button>
            </form>
          )}

          {/* Enhanced Category Filter Cards with Graphics & Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {CATEGORIES.map((c) => {
              const active = catFilter === c.id;
              const count = c.id === 'all' ? tools.length : tools.filter((t) => t.categories.includes(c.id as ToolCategory)).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  data-active={active ? 'true' : 'false'}
                  onClick={() => {
                    playTactileClick('tick');
                    setCatFilter(c.id);
                  }}
                  className={`cadence-keycap rounded-xl p-3 text-left transition-all ${
                    active ? 'border-[#E12D1C] bg-[#E12D1C]/10 text-[#EDE3D2]' : 'text-[#A69B8D] hover:text-[#EDE3D2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#E12D1C]">
                      {c.id === 'all' ? 'ALL' : c.id.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-[#EDE3D2]/70 bg-[#EDE3D2]/10 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs font-semibold text-[#EDE3D2] truncate">{c.label}</div>
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
            {filteredTools.map((tool, idx) => (
              <ScrollRevealBand
                key={tool.id}
                delay={Math.min(idx * 0.02, 0.16)}
                className="grid grid-cols-1 gap-3 py-5 sm:grid-cols-12 sm:items-center px-2 hover:bg-[#161311]/35 transition-colors"
              >
                <div className="sm:col-span-3">
                  <div className="font-display text-base font-semibold text-[#EDE3D2]">{tool.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                    {tool.categories.join(' · ')}
                  </div>
                </div>
                <p className="sm:col-span-5 text-xs leading-relaxed text-[#A69B8D]">{tool.description}</p>
                <div className="sm:col-span-2 font-mono text-[10px] uppercase tracking-wider text-[#E12D1C]">
                  {tool.trackingLayer === 'ide_ext'
                    ? 'IDE Ext'
                    : tool.trackingLayer === 'chrome_ext'
                      ? 'Chrome Ext'
                      : 'Manual'}
                </div>
                <div className="sm:col-span-2 flex items-center justify-end gap-3 text-[11px]">
                  <span className="font-mono text-[#6E655B] truncate max-w-[110px]">
                    {tool.launchProtocol || tool.domainPattern || 'Web / Local'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStudioToolName(tool.name);
                      setStudioOpen(true);
                    }}
                    className="cadence-keycap rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#EDE3D2] hover:border-[#E12D1C]"
                  >
                    Open Studio
                  </button>
                  {tool.docsUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        void launcher.launchResource({
                          slug: tool.slug,
                          title: `${tool.name} Docs`,
                          provider: tool.name,
                          url: tool.docsUrl,
                          embeddable: 'unknown',
                          pricingTier: tool.pricingTier || null,
                          summary: tool.description,
                          isCatalogResource: false,
                        })
                      }
                      className="inline-flex items-center gap-1 font-medium text-[#E12D1C] hover:underline shrink-0"
                    >
                      <span>Docs</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </ScrollRevealBand>
            ))}
          </div>
        </section>
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
      <WorkstationStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        toolName={studioToolName}
      />
    </LayoutShell>
  );
};
