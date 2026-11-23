import React, { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { useAuth } from '../context/AuthContext';
import type { GlobalSearchResultPayload } from '../types/cadence';

type SearchTab = 'all' | 'paths' | 'practice' | 'resources' | 'projects' | 'sessions' | 'tools';

export const WorkspaceSearchPage: React.FC = () => {
  const { apiFetch, navigate } = useAuth();
  const initialQ =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : '';

  const [query, setQuery] = useState(initialQ);
  const [tab, setTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<GlobalSearchResultPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setErrorMsg('');
      return;
    }

    const handle = window.setTimeout(async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await apiFetch<GlobalSearchResultPayload>(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        setResults(res);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(handle);
  }, [apiFetch, query]);

  const counts = results
    ? {
        all:
          results.learningPaths.length +
          results.practiceDrills.length +
          results.resources.length +
          results.projects.length +
          results.sessions.length +
          results.tools.length,
        paths: results.learningPaths.length,
        practice: results.practiceDrills.length,
        resources: results.resources.length,
        projects: results.projects.length,
        sessions: results.sessions.length,
        tools: results.tools.length,
      }
    : null;

  return (
    <LayoutShell breadcrumb="Workspace / Search">
      <div className="space-y-8 kinetic-enter">
        <div className="cadence-seam pb-6 hairline-bottom space-y-2">
          <h1 className="font-display text-3xl font-bold text-[#EDE3D2]">Search workspace</h1>
          <p className="text-xs sm:text-sm text-[#A69B8D]">
            Search across curated learning paths, guided practice drills, external resources, developer tools, and your own projects and session logs.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-[#E12D1C] shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a track, language, project name, tool, or session keyword..."
              className="cadence-field flex-1 text-base"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: 'All matches' },
                { id: 'paths', label: 'Paths' },
                { id: 'practice', label: 'Practice' },
                { id: 'resources', label: 'Resources' },
                { id: 'projects', label: 'Projects' },
                { id: 'sessions', label: 'Sessions' },
                { id: 'tools', label: 'Tools' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                data-active={tab === t.id}
                onClick={() => setTab(t.id)}
                className="cadence-keycap rounded px-3 py-1.5 text-xs font-medium text-[#EDE3D2] tabular-nums"
              >
                {t.label}
                {counts ? ` (${counts[t.id]})` : ''}
              </button>
            ))}
          </div>
        </div>

        {query.trim().length < 2 ? (
          <div className="cadence-seam py-6 text-xs text-[#A69B8D]">
            Enter at least 2 characters (for example: security, sql, react, express, or a project name).
          </div>
        ) : loading ? (
          <div className="font-mono text-xs text-[#A69B8D]">Searching workspace records...</div>
        ) : errorMsg ? (
          <div role="alert" className="cadence-seam bg-[#E12D1C]/12 p-4 text-xs text-[#EDE3D2]">
            {errorMsg}
          </div>
        ) : results && counts && counts.all === 0 ? (
          <div className="cadence-seam py-8 text-sm text-[#EDE3D2]">
            No matching paths, drills, resources, projects, sessions, or tools for "{results.query}".
          </div>
        ) : results ? (
          <div className="space-y-8">
            {(tab === 'all' || tab === 'paths') && results.learningPaths.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Learning paths</h2>
                <div className="divide-y divide-[rgba(237,227,210,0.08)]">
                  {results.learningPaths.map((lp) => (
                    <div key={lp.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#EDE3D2]">{lp.title}</div>
                        <div className="text-xs text-[#A69B8D] mt-0.5">{lp.summary}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/learn/${encodeURIComponent(lp.slug)}`)}
                        className="cadence-keycap inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-[#EDE3D2] shrink-0"
                      >
                        <span>Open</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(tab === 'all' || tab === 'practice') && results.practiceDrills.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Guided practice</h2>
                <div className="divide-y divide-[rgba(237,227,210,0.08)]">
                  {results.practiceDrills.map((dr) => (
                    <div key={dr.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#EDE3D2]">{dr.title}</div>
                        <div className="text-xs text-[#A69B8D] mt-0.5">{dr.summary}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/practice/${encodeURIComponent(dr.slug)}`)}
                        className="cadence-keycap inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-[#EDE3D2] shrink-0"
                      >
                        <span>Open drill</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(tab === 'all' || tab === 'resources') && results.resources.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Curated resources</h2>
                <div className="divide-y divide-[rgba(237,227,210,0.08)]">
                  {results.resources.map((res) => (
                    <div key={res.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#EDE3D2]">{res.title}</div>
                        <div className="text-xs text-[#A69B8D] mt-0.5">
                          {res.provider} · {res.summary}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/learn')}
                        className="cadence-keycap inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-[#EDE3D2] shrink-0"
                      >
                        <span>View in hub</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(tab === 'all' || tab === 'projects') && results.projects.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Your projects</h2>
                <div className="divide-y divide-[rgba(237,227,210,0.08)]">
                  {results.projects.map((proj) => (
                    <div key={proj.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#EDE3D2]">{proj.name}</div>
                        <div className="font-mono text-xs text-[#A69B8D] mt-0.5">
                          {proj.type} · {proj.industry} · {proj.stack.join(', ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${encodeURIComponent(proj.id)}`)}
                        className="cadence-keycap inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-[#EDE3D2] shrink-0"
                      >
                        <span>Open project</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(tab === 'all' || tab === 'sessions') && results.sessions.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Session history</h2>
                <div className="divide-y divide-[rgba(237,227,210,0.08)]">
                  {results.sessions.map((sess) => (
                    <div key={sess.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#EDE3D2]">
                          {sess.title || sess.projectName || 'Focus session'}
                        </div>
                        <div className="text-xs text-[#A69B8D] mt-0.5 tabular-nums">
                          {sess.status} · {sess.activeMinutes}m active · {sess.xpAwarded} XP
                          {sess.summary ? ` · ${sess.summary}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            sess.status === 'active'
                              ? `/session/${sess.id}/focus`
                              : sess.status === 'paused'
                                ? `/session/${sess.id}/pause`
                                : `/session/${sess.id}/summary`
                          )
                        }
                        className="cadence-keycap inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-[#EDE3D2] shrink-0"
                      >
                        <span>Open log</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(tab === 'all' || tab === 'tools') && results.tools.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold text-[#EDE3D2]">Tools catalog</h2>
                <div className="divide-y divide-[rgba(237,227,210,0.08)]">
                  {results.tools.map((tool) => (
                    <div key={tool.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#EDE3D2]">{tool.name}</div>
                        <div className="text-xs text-[#A69B8D] mt-0.5">{tool.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/tools')}
                        className="cadence-keycap inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-[#EDE3D2] shrink-0"
                      >
                        <span>Catalog</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </LayoutShell>
  );
};
