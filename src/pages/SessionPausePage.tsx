import React, { useEffect, useRef, useState } from 'react';
import { BellRing, Play, Square } from 'lucide-react';
import { LayoutShell } from '../components/LayoutShell';
import { useAuth } from '../context/AuthContext';
import { playPauseExpiredAlarm, triggerBrowserNotification } from '../utils/audioAlarm';
import type { PauseReason, SessionRecord } from '../types/cadence';

const PAUSE_REASONS: { id: PauseReason; label: string }[] = [
  { id: 'break', label: 'Short Break / Stretch' },
  { id: 'meal', label: 'Meal / Coffee' },
  { id: 'blocked', label: 'Blocked / Waiting on Build' },
  { id: 'client_call', label: 'Client Call / Meeting' },
  { id: 'distraction', label: 'Distraction / Context Switch' },
  { id: 'other', label: 'Other Reason' },
];

export const SessionPausePage: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const { apiFetch, navigate, serverOffsetMs, setActiveSession } = useAuth();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [reason, setReason] = useState<PauseReason>('break');
  const [plannedMinutes, setPlannedMinutes] = useState(10);
  const [note, setNote] = useState('');
  const [nowTick, setNowTick] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const alarmFiredRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ session: SessionRecord }>(`/api/sessions/${sessionId}`);
        if (res.session.status === 'completed' || res.session.status === 'lapsed' || res.session.status === 'abandoned') {
          navigate(`/session/${res.session.id}/summary`, true);
          return;
        }
        setSession(res.session);
        setActiveSession(res.session);
      } catch {
        navigate('/dashboard', true);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const activePause = session?.status === 'paused' ? session.pauses[session.pauses.length - 1] : null;
  const pauseEndMs = activePause
    ? new Date(activePause.startedAt).getTime() + activePause.plannedMinutes * 60_000
    : 0;
  const remainingSec = activePause ? Math.floor((pauseEndMs - (nowTick + serverOffsetMs)) / 1000) : 0;

  useEffect(() => {
    if (activePause && remainingSec <= 0 && !alarmFiredRef.current) {
      alarmFiredRef.current = true;
      playPauseExpiredAlarm();
      triggerBrowserNotification('Cadence Pause Timer Expired', 'Your planned break has ended. Return to focus or end your session.');
    }
  }, [activePause, remainingSec]);

  if (!session) {
    return (
      <LayoutShell breadcrumb="Session / Pause">
        <div className="hairline-top hairline-bottom py-12 text-center text-sm text-[#A69B8D]">
          Loading pause controls...
        </div>
      </LayoutShell>
    );
  }

  const handleStartPause = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    alarmFiredRef.current = false;
    try {
      const res = await apiFetch<{ session: SessionRecord }>(`/api/sessions/${session.id}/pause`, {
        method: 'PATCH',
        body: JSON.stringify({ reason, plannedMinutes, note }),
      });
      setSession(res.session);
      setActiveSession(res.session);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResume = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch<{ session: SessionRecord }>(`/api/sessions/${session.id}/resume`, {
        method: 'PATCH',
      });
      setActiveSession(res.session);
      navigate(`/session/${session.id}/focus`, true);
    } finally {
      setSubmitting(false);
    }
  };

  const formatSignedSeconds = (sec: number) => {
    const abs = Math.abs(sec);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${sec < 0 ? '+' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <LayoutShell breadcrumb="Session / Pause & Alarm">
      <div className="mx-auto max-w-2xl kinetic-enter">
        {session.status === 'active' ? (
          <form onSubmit={handleStartPause} className="editorial-band-ember py-6 space-y-8">
            <div className="cadence-seam hairline-bottom pb-5">
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#E12D1C]">
                Mandatory Accountability Gate
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold text-[#EDE3D2]">Pause Break Declaration</h1>
              <p className="mt-1 text-xs text-[#A69B8D]">
                Declare why you are stepping away and set a return timer. Overruns reduce your focus ratio.
              </p>
            </div>

            <div>
              <div className="mb-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">
                01 · Reason for Pause
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PAUSE_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    data-active={reason === r.id}
                    onClick={() => setReason(r.id)}
                    className="cadence-keycap rounded-lg px-3.5 py-2.5 text-left text-xs font-medium text-[#EDE3D2]"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">
                02 · Planned Pause Length (Alarm Trigger)
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {[5, 10, 15, 30, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-active={plannedMinutes === m}
                    onClick={() => setPlannedMinutes(m)}
                    className="cadence-keycap rounded-md px-3.5 py-1.5 font-mono text-xs tabular-nums text-[#EDE3D2]"
                  >
                    {m}m
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={plannedMinutes}
                  onChange={(e) => setPlannedMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 5)))}
                  className="cadence-field w-20 font-mono text-xs tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-[#A69B8D]">
                03 · Optional Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Quick context before stepping away..."
                className="cadence-field mt-1 text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-5 hairline-top">
              <button
                type="button"
                onClick={() => navigate(`/session/${session.id}/focus`)}
                className="cadence-keycap rounded-lg px-4 py-2 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_8px_24px_-6px_rgba(225,45,28,0.55)]"
              >
                {submitting ? 'Pausing...' : `Start ${plannedMinutes}m Pause Timer`}
              </button>
            </div>
          </form>
        ) : (
          <div className="relative overflow-hidden editorial-band-ember hairline-top hairline-bottom py-14 text-center space-y-6">
            <img
              src="/assets/aistudio/image_e5f2758f.png"
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="mask-fade-edges pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="relative z-10 space-y-6">
              <div className="font-mono text-xs font-semibold tracking-[0.16em] text-[#E12D1C] uppercase">
                Session Paused · {activePause?.reason.replace('_', ' ')}
              </div>

              <div
                className={`font-mono text-6xl font-bold tracking-tight tabular-nums ${
                  remainingSec < 0 ? 'text-[#E12D1C]' : 'text-[#EDE3D2]'
                }`}
              >
                {formatSignedSeconds(remainingSec)}
              </div>

              {remainingSec <= 0 ? (
                <div className="inline-flex items-center gap-2 cadence-seam bg-[#E12D1C]/15 px-4 py-2 text-xs font-semibold text-[#EDE3D2]">
                  <BellRing className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
                  <span>Pause time reached — overrun minutes are reducing your focus ratio.</span>
                </div>
              ) : (
                <p className="text-xs text-[#A69B8D]">
                  Alarm triggers automatically when countdown reaches 00:00.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleResume()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-6 py-2.5 text-xs font-semibold text-[#EDE3D2] shadow-[0_8px_24px_-6px_rgba(225,45,28,0.55)]"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span>Resume Focus</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/session/${session.id}/end`)}
                  className="cadence-keycap inline-flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium text-[#EDE3D2]"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>End Session Instead</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutShell>
  );
};
