import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Globe } from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { useAuth } from '../context/AuthContext';
import type { SessionRecord } from '../types/cadence';

export const SessionEndPage: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const { apiFetch, navigate, setActiveSession, refreshUser } = useAuth();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [whatILearned, setWhatILearned] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ session: SessionRecord }>(`/api/sessions/${sessionId}`);
        if (res.session.status === 'completed' || res.session.status === 'lapsed') {
          navigate(`/session/${sessionId}/summary`, true);
          return;
        }
        setSession(res.session);
      } catch {
        navigate('/dashboard', true);
      }
    })();
  }, [sessionId]);

  const handleEndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setError('');
    setSubmitting(true);
    try {
      await apiFetch(`/api/sessions/${session.id}/end`, {
        method: 'PATCH',
        body: JSON.stringify({ title, summary, whatILearned }),
      });
      setActiveSession(null);
      await refreshUser();
      navigate(`/session/${session.id}/summary`, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <LayoutShell breadcrumb="Session / Wrap-Up">
        <div className="hairline-top hairline-bottom py-12 text-center text-sm text-[#A69B8D]">
          Loading session log form...
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell breadcrumb="Session / End & Log">
      <form onSubmit={handleEndSubmit} className="mx-auto max-w-2xl editorial-band-ember py-6 space-y-7 kinetic-enter">
        <div className="cadence-seam hairline-bottom pb-5">
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#E12D1C]">
            Final Telemetry Capture · {session.activeMinutes}m Active
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold text-[#EDE3D2]">Log &amp; Complete Session</h1>
          <p className="mt-1 text-xs text-[#A69B8D]">
            Record what you shipped or practiced to lock your accuracy XP and improvement takeaways.
          </p>
        </div>

        {error && (
          <div role="alert" className="cadence-seam py-2.5 text-xs text-[#EDE3D2]">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="end-title" className="block font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">
            Brief Session Title
          </label>
          <input
            id="end-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Built auth middleware & checkpoint timer UI"
            className="cadence-field mt-1 text-sm"
          />
        </div>

        <div>
          <label htmlFor="end-summary" className="block font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">
            What You Covered (One-Line Summary)
          </label>
          <textarea
            id="end-summary"
            rows={3}
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summarize milestones finished, blockers resolved, or tests verified..."
            className="cadence-field mt-1 text-sm"
          />
        </div>

        {session.mode === 'learning' && (
          <div>
            <label htmlFor="end-learn" className="block font-mono text-[10px] tracking-[0.14em] uppercase text-[#E12D1C]">
              What I Learned (Required in Learning Mode)
            </label>
            <textarea
              id="end-learn"
              rows={2}
              required
              value={whatILearned}
              onChange={(e) => setWhatILearned(e.target.value)}
              placeholder="Key concept, debugging insight, or takeaway from this practice session..."
              className="cadence-field mt-1 text-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-5 hairline-top">
          <button
            type="button"
            onClick={() => navigate(`/session/${session.id}/focus`)}
            className="cadence-keycap rounded-lg px-4 py-2 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
          >
            Back to Focus
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_8px_24px_-6px_rgba(225,45,28,0.55)]"
          >
            {submitting ? 'Finalizing...' : 'Complete & Calculate XP'}
          </button>
        </div>
      </form>
    </LayoutShell>
  );
};

export const SessionSummaryPage: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const { apiFetch, navigate } = useAuth();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [publishedMsg, setPublishedMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ session: SessionRecord }>(`/api/sessions/${sessionId}`);
        setSession(res.session);
      } catch {
        navigate('/dashboard', true);
      }
    })();
  }, [sessionId]);

  if (!session) {
    return (
      <LayoutShell breadcrumb="Session / Summary">
        <div className="hairline-top hairline-bottom py-12 text-center text-sm text-[#A69B8D]">
          Loading session breakdown...
        </div>
      </LayoutShell>
    );
  }

  const handlePublishProject = async () => {
    const res = await apiFetch<{ publicFeedUrl: string }>(`/api/portfolio/publish/${session.projectId}`, {
      method: 'POST',
    });
    setPublishedMsg(`Synced to Portfolio Feed: ${res.publicFeedUrl}`);
  };

  return (
    <LayoutShell breadcrumb="Session / Summary">
      <div className="mx-auto max-w-3xl space-y-10 kinetic-enter">
        <section className="relative overflow-hidden editorial-band-ember py-8">
          <img
            src="/assets/aistudio/image_a501a49c.png"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="mask-fade-edges pointer-events-none absolute right-0 top-0 h-full w-full lg:w-2/3 object-cover opacity-20"
          />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A69B8D]">
              <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] font-semibold text-[#E12D1C]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {session.status}
              </span>
              <span className="font-mono tabular-nums">
                {new Date(session.startedAt).toLocaleString()} →{' '}
                {session.endedAt ? new Date(session.endedAt).toLocaleTimeString() : 'Now'}
              </span>
            </div>

            <h1 className="mt-3 font-display text-3xl font-bold text-[#EDE3D2]">
              {session.title || 'Session Summary'}
            </h1>
            <p className="mt-1.5 text-sm text-[#A69B8D]">{session.summary}</p>
            {session.whatILearned && (
              <div className="mt-5 cadence-seam py-2 text-xs text-[#EDE3D2]">
                <span className="font-semibold text-[#E12D1C]">Learning Takeaway: </span>
                {session.whatILearned}
              </div>
            )}

            {/* Open hairline-divided 4-column telemetry readout bar */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
              <div className="py-4 sm:pr-4">
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">Active Duration</div>
                <div className="mt-1.5 font-mono text-2xl font-bold text-[#EDE3D2] tabular-nums">
                  {session.activeMinutes}m
                </div>
              </div>
              <div className="py-4 sm:px-4">
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">Estimate Accuracy</div>
                <div className="mt-1.5 font-mono text-2xl font-bold text-[#EDE3D2] tabular-nums">
                  {Math.round(session.estimateAccuracy * 100)}%
                </div>
              </div>
              <div className="py-4 sm:px-4">
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">Focus Ratio</div>
                <div className="mt-1.5 font-mono text-2xl font-bold text-[#EDE3D2] tabular-nums">
                  {Math.round(session.focusRatio * 100)}%
                </div>
              </div>
              <div className="py-4 sm:pl-4 bg-gradient-to-br from-[#E12D1C]/15 to-transparent">
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#EDE3D2]">XP Earned</div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-2xl font-bold text-[#E12D1C] tabular-nums">
                  <Award className="h-4 w-4" aria-hidden="true" />+{session.xpAwarded}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#EDE3D2]">Areas to Improve</h2>
          <ul className="hairline-divide">
            {session.improvementAreas.map((area, i) => (
              <li key={i} className="cadence-seam py-3 text-xs text-[#EDE3D2]">
                {area}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 hairline-top">
          <button
            type="button"
            onClick={() => void handlePublishProject()}
            className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-[#EDE3D2]"
          >
            <Globe className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
            <span>Push Project to Portfolio</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2 text-xs font-semibold text-[#EDE3D2]"
          >
            Return to Dashboard
          </button>
        </div>

        {publishedMsg && (
          <div className="cadence-seam py-2.5 text-xs text-[#EDE3D2]">
            {publishedMsg}
          </div>
        )}
      </div>
    </LayoutShell>
  );
};
