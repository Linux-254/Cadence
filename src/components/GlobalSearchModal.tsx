import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Code2, Compass, FolderKanban, Search, Timer, Wrench, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { GlobalSearchResultPayload } from '../types/cadence';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onClose }) => {
  const { apiFetch, navigate } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResultPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 20);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
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
    }, 180);

    return () => window.clearTimeout(handle);
  }, [apiFetch, open, query]);

  if (!open) return null;

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const totalCount = results
    ? results.learningPaths.length +
      results.resources.length +
      results.practiceDrills.length +
      results.tools.length +
      results.projects.length +
      results.sessions.length
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Workspace global search"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-16 sm:pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#110F0D] shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden"
        style={{ border: '1px solid rgba(237, 227, 210, 0.14)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-5 py-4 hairline-bottom bg-[#151210]">
          <Search className="h-4 w-4 text-[#E12D1C] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search learning paths, resources, practice drills, tools, your projects or sessions..."
            className="w-full bg-transparent text-sm text-[#EDE3D2] placeholder-[#6E655B] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search dialog"
            className="cadence-keycap inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#A69B8D] hover:text-[#EDE3D2]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto px-5 py-4 space-y-5">
          {query.trim().length < 2 ? (
            <div className="space-y-3 py-2">
              <p className="text-xs text-[#A69B8D]">
                Type at least 2 characters to search across your workspace and curated libraries.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Browse Learning Hub', path: '/learn' },
                  { label: 'Guided Practice Drills', path: '/practice' },
                  { label: 'Session Planner', path: '/sessions/new' },
                  { label: 'Tools & AI Discovery', path: '/tools' },
                  { label: 'Projects', path: '/projects' },
                ].map((qLink) => (
                  <button
                    key={qLink.path}
                    type="button"
                    onClick={() => goTo(qLink.path)}
                    className="cadence-keycap rounded px-3 py-1.5 text-xs font-medium text-[#EDE3D2]"
                  >
                    {qLink.label}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="py-6 font-mono text-xs text-[#A69B8D]">Searching workspace...</div>
          ) : errorMsg ? (
            <div className="py-4 text-xs text-[#E12D1C]">{errorMsg}</div>
          ) : results && totalCount === 0 ? (
            <div className="py-6 text-xs text-[#A69B8D]">
              No matches for "{results.query}" in paths, resources, practice drills, tools, your projects, or sessions.
            </div>
          ) : results ? (
            <div className="space-y-5">
              {results.learningPaths.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C8175]">
                    <Compass className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Learning paths</span>
                  </div>
                  <div className="divide-y divide-[rgba(237,227,210,0.06)]">
                    {results.learningPaths.map((lp) => (
                      <button
                        key={lp.id}
                        type="button"
                        onClick={() => goTo(`/learn/${encodeURIComponent(lp.slug)}`)}
                        className="w-full py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#191512] px-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#EDE3D2] truncate">{lp.title}</div>
                          <div className="font-mono text-[11px] text-[#A69B8D] truncate">
                            {lp.track.replace(/_/g, ' ')} · {lp.level} · {lp.sourceName}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8C8175] shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.practiceDrills.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C8175]">
                    <Code2 className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Guided practice</span>
                  </div>
                  <div className="divide-y divide-[rgba(237,227,210,0.06)]">
                    {results.practiceDrills.map((dr) => (
                      <button
                        key={dr.id}
                        type="button"
                        onClick={() => goTo(`/practice/${encodeURIComponent(dr.slug)}`)}
                        className="w-full py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#191512] px-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#EDE3D2] truncate">{dr.title}</div>
                          <div className="font-mono text-[11px] text-[#A69B8D] truncate">
                            {dr.track.replace(/_/g, ' ')} · {dr.mode.replace(/_/g, ' ')} · {dr.estimatedMinutes}m
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8C8175] shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.resources.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C8175]">
                    <BookOpen className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Curated resources</span>
                  </div>
                  <div className="divide-y divide-[rgba(237,227,210,0.06)]">
                    {results.resources.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => goTo(`/learn?q=${encodeURIComponent(res.title)}`)}
                        className="w-full py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#191512] px-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#EDE3D2] truncate">{res.title}</div>
                          <div className="font-mono text-[11px] text-[#A69B8D] truncate">
                            {res.provider} · {res.format}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8C8175] shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.projects.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C8175]">
                    <FolderKanban className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Your projects</span>
                  </div>
                  <div className="divide-y divide-[rgba(237,227,210,0.06)]">
                    {results.projects.map((proj) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => goTo(`/projects/${encodeURIComponent(proj.id)}`)}
                        className="w-full py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#191512] px-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#EDE3D2] truncate">{proj.name}</div>
                          <div className="font-mono text-[11px] text-[#A69B8D] truncate">
                            {proj.type} · {proj.industry}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8C8175] shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.sessions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C8175]">
                    <Timer className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Session history</span>
                  </div>
                  <div className="divide-y divide-[rgba(237,227,210,0.06)]">
                    {results.sessions.map((sess) => (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() =>
                          goTo(
                            sess.status === 'active'
                              ? `/session/${sess.id}/focus`
                              : sess.status === 'paused'
                                ? `/session/${sess.id}/pause`
                                : `/session/${sess.id}/summary`
                          )
                        }
                        className="w-full py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#191512] px-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#EDE3D2] truncate">
                            {sess.title || sess.projectName || 'Focus session'}
                          </div>
                          <div className="font-mono text-[11px] text-[#A69B8D] truncate tabular-nums">
                            {sess.status} · {sess.activeMinutes}m active · {sess.xpAwarded} XP
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8C8175] shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.tools.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C8175]">
                    <Wrench className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Tools catalog</span>
                  </div>
                  <div className="divide-y divide-[rgba(237,227,210,0.06)]">
                    {results.tools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => goTo('/tools')}
                        className="w-full py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#191512] px-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#EDE3D2] truncate">{tool.name}</div>
                          <div className="font-mono text-[11px] text-[#A69B8D] truncate">
                            {tool.categories.join(', ')}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8C8175] shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 hairline-top bg-[#14110F] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8C8175]">
          <span className="font-mono">Esc to close · Scoped strictly to your account</span>
          <button
            type="button"
            onClick={() => goTo(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search')}
            className="font-mono text-[#E12D1C] hover:text-[#EDE3D2]"
          >
            Open full search view →
          </button>
        </div>
      </div>
    </div>
  );
};
