import React, { useEffect, useState } from 'react';
import { ArrowRight, FileText, Globe, Plus, Trash2, Upload } from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { ScrollRevealBand } from '../components/ScrollChoreography';
import { useAuth } from '../context/AuthContext';
import type { ProjectDocumentRecord, ProjectRecord, ProjectType, SessionRecord } from '../types/cadence';
import { playTactileClick } from '../utils/audioAlarm';

interface EnrichedProject extends ProjectRecord {
  sessionsCount?: number;
  totalMinutes?: number;
}

export const ProjectsPage: React.FC<{ projectId?: string; initialNew?: boolean }> = ({
  projectId,
  initialNew = false,
}) => {
  const { apiFetch, navigate } = useAuth();
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | ProjectType>('all');
  const [showForm, setShowForm] = useState(initialNew);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('personal');
  const [clientName, setClientName] = useState('');
  const [industry, setIndustry] = useState('SaaS / AI');
  const [languagesInput, setLanguagesInput] = useState('TypeScript, SQL');
  const [stackInput, setStackInput] = useState('React, Express, Tailwind CSS');
  const [repoUrl, setRepoUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [portfolioUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [detailProject, setDetailProject] = useState<ProjectRecord | null>(null);
  const [documents, setDocuments] = useState<ProjectDocumentRecord[]>([]);
  const [projectSessions, setProjectSessions] = useState<SessionRecord[]>([]);
  const [docFileName, setDocFileName] = useState('project-prd.md');
  const [docText, setDocText] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [publishNotice, setPublishNotice] = useState('');
  const [error, setError] = useState('');

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ projects: EnrichedProject[] }>('/api/projects');
      setProjects(res.projects);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        project: ProjectRecord;
        documents: ProjectDocumentRecord[];
        sessions: SessionRecord[];
      }>(`/api/projects/${id}`);
      setDetailProject(res.project);
      setDocuments(res.documents);
      setProjectSessions(res.sessions);
    } catch {
      navigate('/projects', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      void loadDetail(projectId);
    } else {
      setDetailProject(null);
      void loadList();
    }
  }, [projectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const created = await apiFetch<{ project: ProjectRecord }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          clientName,
          industry,
          languages: languagesInput.split(',').map((s) => s.trim()).filter(Boolean),
          stack: stackInput.split(',').map((s) => s.trim()).filter(Boolean),
          links: { repo: repoUrl, live: liveUrl, portfolio: portfolioUrl },
          isPublicPortfolio: false,
        }),
      });
      setName('');
      setShowForm(false);
      playTactileClick('confirm');
      navigate(`/projects/${created.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFileName(file.name);
    const text = await file.text();
    setDocText(text.slice(0, 18000));
  };

  const handleSummarizeDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailProject || !docText.trim()) return;
    setDocLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ document: ProjectDocumentRecord }>(
        `/api/projects/${detailProject.id}/documents`,
        {
          method: 'POST',
          body: JSON.stringify({ fileName: docFileName, rawText: docText }),
        }
      );
      setDocuments((prev) => [res.document, ...prev]);
      setDocText('');
      playTactileClick('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document summarization failed.');
    } finally {
      setDocLoading(false);
    }
  };

  const handlePublishPortfolio = async () => {
    if (!detailProject) return;
    setPublishNotice('');
    try {
      const res = await apiFetch<{ publicFeedUrl: string; publishedAt: string }>(
        `/api/portfolio/publish/${detailProject.id}`,
        { method: 'POST' }
      );
      setDetailProject({ ...detailProject, isPublicPortfolio: true, portfolioPublishedAt: res.publishedAt });
      setPublishNotice(`Published to live Portfolio JSON feed: ${res.publicFeedUrl}`);
      playTactileClick('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
    navigate('/projects');
  };

  if (projectId && detailProject) {
    return (
      <LayoutShell breadcrumb={`Projects / ${detailProject.name}`}>
        <div className="space-y-10">
          {/* Open Project Header Strip */}
          <section className="relative overflow-hidden py-8 editorial-band-ember hairline-bottom">
            <img
              src="/src/assets/images/ember_dev_workstation_1795423374812.jpg"
              alt=""
              aria-hidden="true"
              className="mask-fade-right pointer-events-none absolute right-0 top-0 h-full w-1/2 object-cover opacity-20"
            />
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
              <div className="cadence-seam">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#A69B8D]">
                  <span className="uppercase tracking-wider text-[#E12D1C]">{detailProject.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{detailProject.industry}</span>
                  {detailProject.clientName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Client: {detailProject.clientName}</span>
                    </>
                  )}
                </div>
                <h1 className="mt-1 font-display text-3xl font-bold text-[#EDE3D2]">{detailProject.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#A69B8D]">
                  <span>Languages: {detailProject.languages.join(', ') || 'None specified'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Stack: {detailProject.stack.join(', ') || 'None specified'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void handlePublishPortfolio()}
                  className="cadence-keycap inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                >
                  <Globe className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                  <span>{detailProject.isPublicPortfolio ? 'Re-Sync Portfolio' : 'Publish to Portfolio'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/sessions/new?projectId=${detailProject.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.65)] hover:brightness-110"
                >
                  <span>Start Session</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteProject(detailProject.id)}
                  aria-label="Delete project"
                  className="cadence-keycap inline-flex items-center justify-center rounded-xl p-2 text-[#A69B8D] hover:text-[#E12D1C]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {publishNotice && (
            <div className="cadence-seam py-2 text-xs text-[#EDE3D2]">
              {publishNotice}
            </div>
          )}

          {error && (
            <div role="alert" className="cadence-seam bg-[#E12D1C]/10 px-4 py-3 text-xs text-[#EDE3D2]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:divide-x lg:divide-[#EDE3D2]/[0.08] pb-8 hairline-bottom">
            <form onSubmit={handleSummarizeDocument} className="space-y-5 lg:pr-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#E12D1C]">
                  Spec Distillation
                </div>
                <h2 className="mt-1 font-display text-lg font-semibold text-[#EDE3D2]">
                  Add Spec / Brief for Focus Reference Card
                </h2>
                <p className="mt-1 text-xs text-[#A69B8D]">
                  Upload a Markdown or text brief, or paste notes below. Gemini distills deliverables, constraints, and suggested checkpoints to pin inside your Focus View.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="cadence-keycap inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-[#EDE3D2]">
                  <Upload className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                  <span>Load .md / .txt File</span>
                  <input type="file" accept=".txt,.md,.json,.csv" onChange={handleFileUpload} className="sr-only" />
                </label>
                <input
                  type="text"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="cadence-field flex-1 text-xs"
                  placeholder="Document title"
                />
              </div>

              <textarea
                rows={5}
                required
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste PRD, client requirements, or study curriculum notes here..."
                className="cadence-field text-xs leading-relaxed"
              />

              <button
                type="submit"
                disabled={docLoading}
                className="rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.6)] hover:brightness-110 disabled:opacity-60"
              >
                {docLoading ? 'Generating Summary Card...' : 'Generate Summary Card'}
              </button>
            </form>

            <div className="lg:pl-8 space-y-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A69B8D]">
                  Pinned Briefs
                </div>
                <h2 className="mt-1 font-display text-lg font-semibold text-[#EDE3D2]">
                  Reference Summary Cards ({documents.length})
                </h2>
              </div>
              {documents.length === 0 ? (
                <p className="cadence-seam py-3 text-xs text-[#6E655B]">
                  No documents summarized yet. Add a spec on the left to pin deliverables during sessions.
                </p>
              ) : (
                <div className="divide-y divide-[#EDE3D2]/[0.07]">
                  {documents.map((doc) => (
                    <div key={doc.id} className="cadence-seam py-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#EDE3D2]">
                          <FileText className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                          {doc.fileName}
                        </span>
                        <span className="font-mono text-[11px] text-[#6E655B]">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#EDE3D2]">{doc.summaryCard.headline}</p>
                      {doc.summaryCard.deliverables.length > 0 && (
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">Deliverables</div>
                          <ul className="mt-1 space-y-1 text-xs text-[#A69B8D]">
                            {doc.summaryCard.deliverables.map((d, idx) => (
                              <li key={idx}>· {d}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {doc.summaryCard.suggestedCheckpoints.length > 0 && (
                        <div className="pt-1">
                          <div className="font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                            Suggested Checkpoints
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[11px] text-[#E12D1C]">
                            {doc.summaryCard.suggestedCheckpoints.map((c, idx) => (
                              <span key={idx}>
                                {c.category}: {c.title} ({c.plannedMinutes}m)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
              Project Sessions ({projectSessions.length})
            </h2>
            {projectSessions.length === 0 ? (
              <p className="text-xs text-[#A69B8D]">No sessions run on this project yet.</p>
            ) : (
              <div className="divide-y divide-[#EDE3D2]/[0.07] hairline-top">
                {projectSessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => navigate(`/session/${s.id}/summary`)}
                    className="flex w-full items-center justify-between py-3.5 px-2 text-left text-xs transition-colors hover:bg-[#1C1815]/40"
                  >
                    <div>
                      <div className="font-semibold text-[#EDE3D2]">{s.title || 'Session'}</div>
                      <div className="text-[#A69B8D]">{s.summary || 'No summary'}</div>
                    </div>
                    <div className="font-mono text-[#E12D1C] tabular-nums">
                      {s.activeMinutes}m · {s.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </LayoutShell>
    );
  }

  const filtered = typeFilter === 'all' ? projects : projects.filter((p) => p.type === typeFilter);

  return (
    <LayoutShell breadcrumb="Workspace / Projects">
      <div className="space-y-8">
        <section className="relative overflow-hidden py-8 editorial-band-ember hairline-bottom">
          <img
            src="/src/assets/images/ember_dev_workstation_1795423374812.jpg"
            alt=""
            aria-hidden="true"
            className="mask-fade-right pointer-events-none absolute right-0 top-0 h-full w-3/5 object-cover opacity-28"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="cadence-seam">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#E12D1C]">
                Repository &amp; Spec Registry
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold text-[#EDE3D2]">Projects</h1>
              <p className="mt-1.5 max-w-xl text-xs text-[#A69B8D]">
                Organize Personal builds, Business &amp; Client deliverables, and Learning tracks with stack metadata and AI reference cards.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playTactileClick('tick');
                setShowForm((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.65)] hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showForm ? 'Close Form' : 'Create Project'}</span>
            </button>
          </div>
        </section>

        {showForm && (
          <form onSubmit={handleCreateProject} className="pb-8 hairline-bottom space-y-6 kinetic-enter">
            <div className="cadence-seam">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#E12D1C]">Initialize Workspace</div>
              <h2 className="mt-0.5 font-display text-lg font-semibold text-[#EDE3D2]">New Project Setup</h2>
            </div>

            {error && (
              <div role="alert" className="cadence-seam bg-[#E12D1C]/10 px-3 py-2 text-xs text-[#EDE3D2]">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">Project Mode</div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {(
                  [
                    { id: 'personal', label: 'Personal Project' },
                    { id: 'business', label: 'Business / Clientele' },
                    { id: 'learning', label: 'Learning / Practice' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    data-active={type === m.id ? 'true' : 'false'}
                    onClick={() => {
                      playTactileClick('tick');
                      setType(m.id);
                    }}
                    className="cadence-keycap rounded-xl px-4 py-2.5 text-left text-xs font-medium text-[#EDE3D2]"
                  >
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-[#A69B8D]">Mode</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., FinLedger Client Portal"
                  className="cadence-field mt-1 text-sm"
                />
              </div>

              {type === 'business' && (
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Acme Corp"
                    className="cadence-field mt-1 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                  Tech Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="FinTech, EdTech, SaaS, E-Commerce..."
                  className="cadence-field mt-1 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                  Languages (comma-separated)
                </label>
                <input
                  type="text"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  className="cadence-field mt-1 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                  Stack / Frameworks
                </label>
                <input
                  type="text"
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  className="cadence-field mt-1 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                  Repository URL (optional)
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="cadence-field mt-1 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                  Live / Portfolio URL (optional)
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://..."
                  className="cadence-field mt-1 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-6 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.65)] hover:brightness-110"
            >
              {submitting ? 'Saving...' : 'Save Project'}
            </button>
          </form>
        )}

        {/* Filter Keycaps */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'personal', 'business', 'learning'] as const).map((t) => (
            <button
              key={t}
              type="button"
              data-active={typeFilter === t ? 'true' : 'false'}
              onClick={() => {
                playTactileClick('tick');
                setTypeFilter(t);
              }}
              className="cadence-keycap rounded-xl px-4 py-2 text-xs font-medium capitalize text-[#EDE3D2]"
            >
              {t === 'all' ? 'All Projects' : t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-16 bg-[#1C1815]/40" />
            <div className="h-16 bg-[#1C1815]/40" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="cadence-seam py-8">
            <p className="text-sm font-semibold text-[#EDE3D2]">No projects in this category yet</p>
            <p className="mt-1 text-xs text-[#A69B8D]">
              Create a personal, client, or learning project to organize sessions and specs.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
            {filtered.map((proj, idx) => (
              <ScrollRevealBand
                key={proj.id}
                delay={idx * 0.03}
                className="group cursor-pointer grid grid-cols-1 gap-4 py-6 sm:grid-cols-12 sm:items-center transition-colors hover:bg-[#161311]/40 px-2"
              >
                <div onClick={() => navigate(`/projects/${proj.id}`)} className="sm:col-span-1 font-display text-2xl font-bold text-[#E12D1C] tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div onClick={() => navigate(`/projects/${proj.id}`)} className="sm:col-span-6">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#A69B8D]">
                    <span className="text-[#E12D1C]">{proj.type}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.industry}</span>
                  </div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-[#EDE3D2] group-hover:text-[#E12D1C] transition-colors">
                    {proj.name}
                  </h3>
                </div>
                <div onClick={() => navigate(`/projects/${proj.id}`)} className="sm:col-span-3 text-xs text-[#A69B8D] truncate">
                  {proj.stack.join(' · ') || 'No stack specified'}
                </div>
                <div onClick={() => navigate(`/projects/${proj.id}`)} className="sm:col-span-2 flex items-center justify-end gap-3 text-xs font-mono tabular-nums">
                  <span className="text-[#A69B8D]">{proj.sessionsCount ?? 0}s</span>
                  <span className="text-[#E12D1C]">{proj.totalMinutes ?? 0}m</span>
                  <ArrowRight className="h-4 w-4 text-[#E12D1C] transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </ScrollRevealBand>
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
};
