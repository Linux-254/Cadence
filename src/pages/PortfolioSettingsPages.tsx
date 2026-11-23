import React, { useEffect, useState } from 'react';
import { Bell, Copy, Download, ExternalLink, KeyRound, Plus, Trash2 } from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { ScrollRevealBand } from '../components/ScrollChoreography';
import { useAuth } from '../context/AuthContext';
import { playPauseExpiredAlarm, playTactileClick } from '../utils/audioAlarm';
import { downloadSpecPdf } from '../utils/pdfDownload';
import type { PortfolioSiteRecord, ProjectRecord, SkillLevel } from '../types/cadence';

export const PortfolioSyncPage: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [sites, setSites] = useState<PortfolioSiteRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [siteType, setSiteType] = useState<'personal' | 'business'>('personal');
  const [label, setLabel] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const loadData = async () => {
    const [sRes, pRes] = await Promise.all([
      apiFetch<{ sites: PortfolioSiteRecord[] }>('/api/portfolio/sites'),
      apiFetch<{ projects: ProjectRecord[] }>('/api/projects'),
    ]);
    setSites(sRes.sites);
    setProjects(pRes.projects);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNewSecret('');
    try {
      const res = await apiFetch<{ webhookSecret: string }>('/api/portfolio/sites', {
        method: 'POST',
        body: JSON.stringify({ siteType, label, siteUrl, webhookUrl, autoPublishOnDeploy: true }),
      });
      setNewSecret(res.webhookSecret);
      setLabel('');
      setSiteUrl('');
      setWebhookUrl('');
      playTactileClick('confirm');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect site.');
    }
  };

  const handlePublishProject = async (projectId: string) => {
    const res = await apiFetch<{ publicFeedUrl: string }>(`/api/portfolio/publish/${projectId}`, {
      method: 'POST',
    });
    setStatusMsg(`Published to feed ${res.publicFeedUrl} and dispatched configured webhooks.`);
    playTactileClick('confirm');
    await loadData();
  };

  const publicFeedPath = `/api/public/portfolio/${user?.username || 'me'}`;

  return (
    <LayoutShell breadcrumb="Workspace / Portfolio & Business Site Sync">
      <div className="space-y-10">
        {/* Open Hero Band */}
        <section className="relative overflow-hidden py-8 editorial-band-ember hairline-bottom">
          <img
            src="/src/assets/images/ember_device_trio_1795423374533.jpg"
            alt=""
            aria-hidden="true"
            className="mask-fade-right pointer-events-none absolute right-0 top-0 h-full w-3/5 object-cover opacity-28"
          />
          <div className="relative z-10 cadence-seam">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#E12D1C]">
              HMAC Webhooks &amp; Public JSON Feeds
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold text-[#EDE3D2]">
              Portfolio &amp; Business Site Integration
            </h1>
            <p className="mt-1.5 max-w-xl text-xs text-[#A69B8D]">
              Connect your personal portfolio or business website so shipped projects and verified build hours sync automatically.
            </p>
          </div>
        </section>

        {/* Live Public Feed Hairline Band */}
        <ScrollRevealBand className="pb-6 hairline-bottom space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A69B8D]">
            Live Public Portfolio JSON Feed
          </div>
          <p className="text-xs text-[#A69B8D]">
            Fetch this read-only endpoint from your React, Astro, or custom portfolio site to render verified projects and hours:
          </p>
          <div className="cadence-seam flex flex-wrap items-center justify-between gap-3 py-2">
            <code className="text-xs text-[#E12D1C]">{publicFeedPath}</code>
            <a
              href={publicFeedPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#EDE3D2] hover:text-[#E12D1C]"
            >
              <span>Inspect JSON</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </ScrollRevealBand>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:divide-x lg:divide-[#EDE3D2]/[0.08]">
          <form onSubmit={handleAddSite} className="space-y-5 lg:pr-6">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">Connect Portfolio or Business Site</h2>
            {error && <div className="cadence-seam bg-[#E12D1C]/10 p-2.5 text-xs text-[#EDE3D2]">{error}</div>}
            {newSecret && (
              <div className="cadence-seam py-2.5 text-xs text-[#EDE3D2]">
                <div className="font-semibold text-[#E12D1C]">HMAC Webhook Secret (Save Once)</div>
                <code className="mt-1 block break-all font-mono">{newSecret}</code>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {(['personal', 'business'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  data-active={siteType === t ? 'true' : 'false'}
                  onClick={() => {
                    playTactileClick('tick');
                    setSiteType(t);
                  }}
                  className="cadence-keycap rounded-xl px-3 py-2.5 text-xs font-semibold capitalize text-[#EDE3D2]"
                >
                  {t} Site
                </button>
              ))}
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                Site Label
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="My Developer Portfolio"
                className="cadence-field mt-1 text-xs"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                Public Site URL
              </label>
              <input
                type="url"
                required
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://portfolio.example.com"
                className="cadence-field mt-1 text-xs"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                Webhook Endpoint URL (optional)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://portfolio.example.com/api/cadence-webhook"
                className="cadence-field mt-1 text-xs"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.65)] hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save Destination</span>
            </button>
          </form>

          <div className="space-y-8 lg:pl-8">
            <section className="space-y-3 pb-6 hairline-bottom">
              <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
                Connected Destinations ({sites.length})
              </h2>
              {sites.length === 0 ? (
                <p className="text-xs text-[#A69B8D]">No external sites connected yet.</p>
              ) : (
                <div className="divide-y divide-[#EDE3D2]/[0.07]">
                  {sites.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-3 text-xs">
                      <div className="cadence-seam">
                        <div className="font-semibold text-[#EDE3D2]">
                          {s.label} <span className="capitalize text-[#E12D1C]">({s.siteType})</span>
                        </div>
                        <div className="font-mono text-[11px] text-[#A69B8D]">{s.siteUrl}</div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/api/portfolio/sites/${s.id}`, { method: 'DELETE' });
                          await loadData();
                        }}
                        aria-label="Remove site"
                        className="rounded-lg p-1.5 text-[#A69B8D] hover:text-[#E12D1C]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">Publish Projects</h2>
              {statusMsg && (
                <div className="cadence-seam py-2 text-xs text-[#EDE3D2]">
                  {statusMsg}
                </div>
              )}
              <div className="divide-y divide-[#EDE3D2]/[0.07]">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <div className="font-semibold text-[#EDE3D2]">{p.name}</div>
                      <div className="text-[#A69B8D] capitalize">
                        {p.type} · {p.isPublicPortfolio ? 'Published' : 'Private'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handlePublishProject(p.id)}
                      className="cadence-keycap rounded-lg px-3 py-1.5 text-xs font-medium text-[#EDE3D2]"
                    >
                      {p.isPublicPortfolio ? 'Sync Update' : 'Publish'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
};

export const SettingsPage: React.FC = () => {
  const { user, apiFetch, refreshUser, navigate } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(user?.skillLevel || 'vibe_coder');
  const [primaryRole, setPrimaryRole] = useState(user?.primaryRole || '');
  const [primaryTrack, setPrimaryTrack] = useState(user?.profile?.tracks?.[0] || 'fullstack');
  const [levelV13, setLevelV13] = useState<'beginner' | 'intermediate' | 'advanced'>(
    user?.profile?.level || 'beginner'
  );
  const [freeOnly, setFreeOnly] = useState<boolean>(user?.profile?.freeOnly ?? true);
  const [lapseGraceMin, setLapseGraceMin] = useState<number>(user?.profile?.lapseGraceMin ?? 5);
  const [resourceOpenMode, setResourceOpenMode] = useState<'popout' | 'split' | 'embed' | 'tab'>(
    user?.profile?.resourceOpenMode || 'popout'
  );
  const [savedMsg, setSavedMsg] = useState('');
  const [pdfNotice, setPdfNotice] = useState('');

  const [pairCode, setPairCode] = useState('');
  const [pairSource, setPairSource] = useState<'ide' | 'chrome'>('ide');
  const [tokens, setTokens] = useState<
    Array<{ id: string; source: string; label: string; token_prefix: string; last_used_at: string | null }>
  >([]);

  const loadTokens = async () => {
    const res = await apiFetch<{ tokens: typeof tokens }>('/api/extensions/tokens');
    setTokens(res.tokens);
  };

  useEffect(() => {
    void loadTokens();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const existingSecondary = (user?.profile?.tracks || []).slice(1).filter((t) => t !== primaryTrack);
    await apiFetch('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        skillLevel,
        primaryRole,
        tracks: [primaryTrack, ...existingSecondary].slice(0, 3),
        level: levelV13,
        freeOnly,
        lapseGraceMin: Math.max(3, Math.min(30, Number(lapseGraceMin) || 5)),
        resourceOpenMode,
      }),
    });
    await refreshUser();
    setSavedMsg('Profile preferences updated.');
    playTactileClick('confirm');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const handleGeneratePairCode = async (source: 'ide' | 'chrome') => {
    setPairSource(source);
    const res = await apiFetch<{ code: string }>('/api/extensions/pair-code', {
      method: 'POST',
      body: JSON.stringify({ source }),
    });
    setPairCode(res.code);
    playTactileClick('confirm');
  };

  return (
    <LayoutShell breadcrumb="Workspace / Settings & Extensions">
      <div className="space-y-10">
        {/* Open Hero Band */}
        <section className="relative overflow-hidden py-8 editorial-band-ember hairline-bottom">
          <img
            src="/src/assets/images/ember_device_trio_1795423374533.jpg"
            alt=""
            aria-hidden="true"
            className="mask-fade-right pointer-events-none absolute right-0 top-0 h-full w-3/5 object-cover opacity-25"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="cadence-seam">
              <h1 className="font-display text-3xl font-bold text-[#EDE3D2]">
                Settings &amp; Extension Pairing
              </h1>
              <p className="mt-1.5 text-xs text-[#A69B8D]">
                Manage your track, level, lapse grace window, and IDE or Chrome companion pairing.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void downloadSpecPdf((msg) => setPdfNotice(msg))}
                className="cadence-keycap inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-[#EDE3D2] whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-[#E12D1C]" />
                <span>Download Complete Spec PDF</span>
              </button>
              {pdfNotice && <span className="text-[11px] text-[#E12D1C]">{pdfNotice}</span>}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:divide-x lg:divide-[#EDE3D2]/[0.08]">
          <form onSubmit={handleSaveProfile} className="space-y-6 lg:pr-6">
            <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">Developer Profile</h2>
            <div>
              <label className="block font-mono text-[11px] text-[#A69B8D]">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="cadence-field mt-1 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[11px] text-[#A69B8D]">Primary Track</label>
                <select
                  value={primaryTrack}
                  onChange={(e) => setPrimaryTrack(e.target.value as typeof primaryTrack)}
                  className="cadence-field mt-1 bg-[#14110F] text-xs"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="fullstack">Full-stack</option>
                  <option value="mobile">Mobile</option>
                  <option value="ai_engineering">AI engineering</option>
                  <option value="data_analytics">Data and analytics</option>
                  <option value="devops_cloud">DevOps and cloud</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="ui_ux_design">UI/UX design</option>
                  <option value="game_dev">Game development</option>
                  <option value="qa_testing">QA and testing</option>
                  <option value="product_management">Product management</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[#A69B8D]">Skill Level</label>
                <select
                  value={levelV13}
                  onChange={(e) => setLevelV13(e.target.value as typeof levelV13)}
                  className="cadence-field mt-1 bg-[#14110F] text-xs"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[11px] text-[#A69B8D]">
                  Lapse grace window (3–30 min)
                </label>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={lapseGraceMin}
                  onChange={(e) => setLapseGraceMin(Math.max(3, Math.min(30, Number(e.target.value) || 5)))}
                  className="cadence-field mt-1 font-mono text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[#A69B8D]">
                  Resource open mode
                </label>
                <select
                  value={resourceOpenMode}
                  onChange={(e) => setResourceOpenMode(e.target.value as typeof resourceOpenMode)}
                  className="cadence-field mt-1 bg-[#14110F] text-xs"
                >
                  <option value="popout">Pop-out window</option>
                  <option value="split">Split pane</option>
                  <option value="embed">Embedded view</option>
                  <option value="tab">New tab</option>
                </select>
              </div>
            </div>

            <label className="cadence-seam flex items-center justify-between gap-4 py-2 cursor-pointer text-xs">
              <span className="text-[#EDE3D2]">Show only free resources</span>
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-[#E12D1C]"
              />
            </label>

            <div>
              <label className="block font-mono text-[11px] text-[#A69B8D]">
                Legacy Experience Tag
              </label>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {(
                  [
                    { id: 'beginner', label: 'Beginner' },
                    { id: 'vibe_coder', label: 'AI Builder' },
                    { id: 'bootcamp', label: 'Bootcamp' },
                    { id: 'intermediate', label: 'Intermediate' },
                    { id: 'professional', label: 'Senior / Pro' },
                  ] as const
                ).map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    data-active={skillLevel === lvl.id ? 'true' : 'false'}
                    onClick={() => {
                      playTactileClick('tick');
                      setSkillLevel(lvl.id);
                    }}
                    className="cadence-keycap rounded-xl px-3.5 py-2 text-left text-xs font-medium text-[#EDE3D2]"
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] text-[#A69B8D]">
                Primary Role
              </label>
              <input
                type="text"
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
                className="cadence-field mt-1 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] hover:brightness-110"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => playPauseExpiredAlarm()}
                className="cadence-keycap inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
              >
                <Bell className="h-3.5 w-3.5 text-[#E12D1C]" />
                <span>Test Pause Alarm</span>
              </button>
            </div>
            {savedMsg && <div className="text-xs font-medium text-[#EDE3D2]">{savedMsg}</div>}
          </form>

          <div className="space-y-6 lg:pl-8">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">
                IDE &amp; Chrome Extension Pairing
              </h2>
              <p className="mt-1 text-xs text-[#A69B8D]">
                Generate a 6-digit one-time code to pair VS Code, Cursor, Windsurf, Antigravity, or the Chrome MV3 extension.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => void handleGeneratePairCode('ide')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-medium text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.6)] hover:brightness-110"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Pair IDE Extension</span>
              </button>
              <button
                type="button"
                onClick={() => void handleGeneratePairCode('chrome')}
                className="cadence-keycap inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-[#EDE3D2]"
              >
                <KeyRound className="h-3.5 w-3.5 text-[#E12D1C]" />
                <span>Pair Chrome Extension</span>
              </button>
            </div>

            {pairCode && (
              <div className="cadence-seam editorial-band-ember flex items-center justify-between py-4 pr-4">
                <div>
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#E12D1C]">
                    {pairSource === 'ide' ? 'IDE Pairing Code' : 'Chrome Extension Code'} (Expires in 10m)
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tracking-widest text-[#EDE3D2] tabular-nums">
                    {pairCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(pairCode)}
                  className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#EDE3D2]"
                >
                  <Copy className="h-3.5 w-3.5 text-[#E12D1C]" />
                  <span>Copy</span>
                </button>
              </div>
            )}

            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                Connected Extensions ({tokens.length})
              </div>
              {tokens.length === 0 ? (
                <p className="mt-1.5 text-xs text-[#6E655B]">No extension tokens issued yet.</p>
              ) : (
                <div className="mt-2 divide-y divide-[#EDE3D2]/[0.07]">
                  {tokens.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2.5 text-xs">
                      <div>
                        <div className="font-medium text-[#EDE3D2]">{t.label}</div>
                        <div className="font-mono text-[11px] text-[#6E655B]">{t.token_prefix}...</div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/api/extensions/tokens/${t.id}`, { method: 'DELETE' });
                          await loadTokens();
                        }}
                        className="text-xs text-[#E12D1C] hover:underline"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 hairline-top">
              <button
                type="button"
                onClick={() => navigate('/docs')}
                className="text-xs font-medium text-[#E12D1C] hover:underline"
              >
                View full IDE &amp; Chrome extension scaffold code in Blueprint Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
};

export const PrivacyPage: React.FC = () => {
  const { navigate } = useAuth();
  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <button type="button" onClick={() => navigate('/')} className="text-xs font-medium text-[#E12D1C] hover:underline">
          Back to Cadence
        </button>
        <div className="cadence-seam">
          <h1 className="font-display text-3xl font-bold text-[#EDE3D2]">Privacy Policy</h1>
        </div>
        <p className="text-sm leading-relaxed text-[#A69B8D]">
          Cadence collects only the account, project, session timing, and metadata-only activity telemetry you explicitly submit or pair via extension tokens. IDE and browser extensions transmit tool slugs, programming language identifiers, workspace names, and optional commit messages—never source code, file contents, or keystrokes.
        </p>
        <p className="text-sm leading-relaxed text-[#A69B8D]">
          Uploaded project documents are processed solely to generate your Reference Summary Cards. You may delete projects, revoke extension tokens, or export your session logs at any time.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const { navigate } = useAuth();
  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <button type="button" onClick={() => navigate('/')} className="text-xs font-medium text-[#E12D1C] hover:underline">
          Back to Cadence
        </button>
        <div className="cadence-seam">
          <h1 className="font-display text-3xl font-bold text-[#EDE3D2]">Terms of Service</h1>
        </div>
        <p className="text-sm leading-relaxed text-[#A69B8D]">
          Cadence provides session planning, checkpoint timing, and developer progression analytics as a productivity tool. You retain full ownership of your project metadata, session notes, and uploaded specifications.
        </p>
        <p className="text-sm leading-relaxed text-[#A69B8D]">
          Automated portfolio webhooks and public portfolio feeds publish only the projects you explicitly mark for public visibility.
        </p>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const { user, navigate } = useAuth();
  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-5">
        <div className="font-mono text-xs font-semibold text-[#E12D1C]">404 · Page Not Found</div>
        <h1 className="font-display text-3xl font-bold text-[#EDE3D2]">We couldn&apos;t find that route</h1>
        <p className="text-sm text-[#A69B8D]">
          The page or session ID you requested does not exist or may have moved.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.6)] hover:brightness-110"
          >
            {user ? 'Go to Dashboard' : 'Go to Home'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/docs')}
            className="cadence-keycap rounded-xl px-4 py-2 text-xs font-medium text-[#EDE3D2]"
          >
            View Docs
          </button>
        </div>
      </div>
    </div>
  );
};
