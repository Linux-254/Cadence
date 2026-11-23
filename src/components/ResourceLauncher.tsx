import React, { useEffect, useState } from 'react';
import {
  Check,
  Columns2,
  ExternalLink,
  Maximize2,
  Monitor,
  PanelRightClose,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type {
  EmbeddableStatus,
  ResourceOpenMode,
  ResourcePricingTier,
  ResourceProgressRecord,
  ResourceStatus,
  WindowPref,
} from '../types/cadence';
import { launchPopoutResourceWindow, RESOURCE_WINDOW_PRESETS } from '../utils/resourceWindow';
import { playTactileClick } from '../utils/audioAlarm';

export interface LaunchableResource {
  slug: string;
  title: string;
  provider?: string;
  url: string;
  embeddable?: EmbeddableStatus;
  format?: string;
  pricingTier?: ResourcePricingTier;
  summary?: string;
  progress?: ResourceProgressRecord | null;
  isCatalogResource?: boolean;
}

interface ResourceLauncherDrawerProps {
  resource: LaunchableResource | null;
  open: boolean;
  mode: ResourceOpenMode;
  blockedWarning: boolean;
  sessionId?: string | null;
  onClose: () => void;
  onModeChange: (nextMode: ResourceOpenMode) => void;
  onClearBlocked: () => void;
  onProgressUpdated?: (slug: string, progress: ResourceProgressRecord) => void;
}

export const formatPricingLabel = (tier: ResourcePricingTier | undefined): string => {
  if (tier === 'free') return 'Free';
  if (tier === 'freemium') return 'Free tier / Freemium';
  if (tier === 'student_free') return 'Free for students';
  if (tier === 'paid') return 'Paid';
  return 'unverified';
};

export const ResourceLauncherDrawer: React.FC<ResourceLauncherDrawerProps> = ({
  resource,
  open,
  mode,
  blockedWarning,
  sessionId,
  onClose,
  onModeChange,
  onClearBlocked,
  onProgressUpdated,
}) => {
  const { user, setUser, apiFetch } = useAuth();
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ResourceStatus>('in_progress');
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [frameKey, setFrameKey] = useState(0);

  useEffect(() => {
    if (!resource) return;
    setNotes(resource.progress?.notes || '');
    setStatus(resource.progress?.status || 'in_progress');
    setStatusMsg('');
  }, [resource?.slug, resource?.progress?.notes, resource?.progress?.status]);

  if (!open || !resource) return null;

  const savedPref: WindowPref = user?.profile?.resourceWindowPrefs?.[resource.slug] || {
    width: 960,
    height: 860,
  };

  const handleSavePreset = async (width: number, height: number) => {
    playTactileClick('tick');
    try {
      const nextPrefs = {
        ...(user?.profile?.resourceWindowPrefs || {}),
        [resource.slug]: { ...savedPref, width, height },
      };
      const res = await apiFetch<{ user: typeof user }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ resourceWindowPrefs: nextPrefs }),
      });
      if (res.user) setUser(res.user);
      setStatusMsg(`Saved ${width} × ${height} window size.`);
      setTimeout(() => setStatusMsg(''), 2200);
    } catch {
      // Non-fatal
    }
  };

  const handleSwitchMode = async (nextMode: ResourceOpenMode) => {
    playTactileClick('tick');
    onClearBlocked();
    onModeChange(nextMode);
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ resourceOpenMode: nextMode }),
      });
      if (res.user) setUser(res.user);
    } catch {
      // Non-fatal
    }
    if (nextMode === 'popout') {
      const launched = await launchPopoutResourceWindow({
        slug: resource.slug,
        url: resource.url,
        pref: savedPref,
      });
      if (launched.blocked) {
        onModeChange('split');
      }
    }
  };

  const handleTriggerPopoutNow = async () => {
    playTactileClick('confirm');
    onClearBlocked();
    const launched = await launchPopoutResourceWindow({
      slug: resource.slug,
      url: resource.url,
      pref: savedPref,
    });
    if (launched.opened) {
      setStatusMsg('Pop-out window launched.');
      setTimeout(() => setStatusMsg(''), 2200);
    }
  };

  const handleSaveProgress = async (nextStatus?: ResourceStatus) => {
    if (resource.isCatalogResource === false) return;
    const resolvedStatus = nextStatus || status;
    setStatus(resolvedStatus);
    setSavingNotes(true);
    try {
      const res = await apiFetch<{ progress: ResourceProgressRecord }>(
        `/api/resources/${encodeURIComponent(resource.slug)}/progress`,
        {
          method: 'POST',
          body: JSON.stringify({
            status: resolvedStatus,
            notes,
            linkedSessionId: sessionId || null,
            lastOpenedAt: new Date().toISOString(),
          }),
        }
      );
      if (onProgressUpdated) onProgressUpdated(resource.slug, res.progress);
      setStatusMsg('Progress saved.');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch {
      // Ignore if slug is not a catalog resource
    } finally {
      setSavingNotes(false);
    }
  };

  const showIframe = (mode === 'split' || mode === 'embed') && resource.embeddable !== 'no';

  return (
    <aside
      aria-label={`Companion resource launcher: ${resource.title}`}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col bg-[#0D0C0A] shadow-[-8px_0_32px_rgba(0,0,0,0.65)]"
      style={{ borderLeft: '1px solid rgba(237, 227, 210, 0.12)' }}
    >
      {/* Top Bar */}
      <div className="px-5 py-4 hairline-bottom flex items-start justify-between gap-3 bg-[#12100E]">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-[#EDE3D2] truncate">{resource.title}</h2>
          <p className="mt-0.5 font-mono text-[11px] text-[#A69B8D] truncate">
            {resource.provider || 'External'} · {formatPricingLabel(resource.pricingTier)}
            {resource.format ? ` · ${resource.format}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close companion launcher"
          className="cadence-keycap inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#A69B8D] hover:text-[#EDE3D2]"
        >
          <PanelRightClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Mode & Window Size Controls */}
      <div className="px-5 py-3 space-y-2.5 hairline-bottom bg-[#100E0C]">
        {blockedWarning && (
          <div role="status" className="cadence-seam bg-[#E12D1C]/12 px-3 py-2 text-xs text-[#EDE3D2] space-y-1.5">
            <div className="font-semibold">Pop-up was blocked by your browser.</div>
            <p className="text-[11px] text-[#A69B8D]">
              Allow pop-ups for this site in your browser bar, or continue right here in Split Pane or a New Tab.
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => void handleSwitchMode('split')}
                className="cadence-keycap rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2]"
              >
                Use Split Pane
              </button>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClearBlocked()}
                className="inline-flex items-center gap-1 rounded bg-[#E12D1C] px-2.5 py-1 text-[11px] font-semibold text-[#EDE3D2]"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'popout', label: 'Pop-out', icon: Maximize2 },
                { id: 'split', label: 'Split pane', icon: Columns2 },
                { id: 'embed', label: 'Embed', icon: Monitor },
                { id: 'tab', label: 'New tab', icon: ExternalLink },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-active={active}
                  onClick={() => void handleSwitchMode(opt.id)}
                  className="cadence-keycap inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2]"
                >
                  <Icon className="h-3 w-3 text-[#E12D1C]" aria-hidden="true" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void handleTriggerPopoutNow()}
            className="inline-flex items-center gap-1 rounded bg-[#E12D1C] px-3 py-1 text-[11px] font-semibold text-[#EDE3D2] hover:brightness-110"
          >
            <Maximize2 className="h-3 w-3" aria-hidden="true" />
            <span>Pop out now</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-mono text-[#8C8175]">Window preset:</span>
          <div className="flex flex-wrap gap-1.5">
            {RESOURCE_WINDOW_PRESETS.map((preset) => {
              const active = savedPref.width === preset.width && savedPref.height === preset.height;
              return (
                <button
                  key={preset.id}
                  type="button"
                  data-active={active}
                  onClick={() => void handleSavePreset(preset.width, preset.height)}
                  className="cadence-keycap rounded px-2 py-0.5 font-mono text-[10px] text-[#EDE3D2]"
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area: Split/Embed Iframe or Honest Fallback Panel */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {showIframe ? (
          <div className="flex-1 flex flex-col min-h-[280px]">
            <div className="px-5 py-2 bg-[#14110F] hairline-bottom flex items-center justify-between gap-2 text-[11px] text-[#A69B8D]">
              <span>If this external site refuses inline framing, use New Tab or Pop-out.</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFrameKey((k) => k + 1)}
                  aria-label="Reload resource frame"
                  className="cadence-keycap inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-[#EDE3D2]"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  <span>Reload</span>
                </button>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#E12D1C] hover:underline inline-flex items-center gap-1"
                >
                  <span>Direct link</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
            <iframe
              key={`${resource.slug}-${frameKey}`}
              src={resource.url}
              title={resource.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="w-full flex-1 bg-[#14110F]"
              style={{ border: 0 }}
            />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {resource.summary && (
              <p className="text-xs leading-relaxed text-[#EDE3D2]">{resource.summary}</p>
            )}
            <div className="cadence-seam bg-[#151210] p-4 space-y-2.5 text-xs text-[#A69B8D]">
              <div className="font-semibold text-[#EDE3D2]">
                {resource.embeddable === 'no'
                  ? 'External framing disabled by provider'
                  : 'Launch beside Cadence'}
              </div>
              <p className="leading-relaxed">
                {resource.embeddable === 'no'
                  ? `${resource.provider || 'This provider'} blocks inside-page iframes via browser security headers (X-Frame-Options / CSP). Open it cleanly in a sized companion window or separate tab while your Cadence timer stays active.`
                  : 'Open this resource in a sized companion window alongside your IDE or in a new browser tab.'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleTriggerPopoutNow()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-4 py-2 text-xs font-semibold text-[#EDE3D2]"
                >
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Launch companion window ({savedPref.width}×{savedPref.height})</span>
                </button>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-[#EDE3D2]"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resource Progress & Notes Footer */}
      {resource.isCatalogResource !== false && (
        <div className="px-5 py-4 hairline-top bg-[#12100E] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-[#A69B8D]">Study status</span>
            <div className="flex gap-1.5">
              {(['saved', 'in_progress', 'completed'] as const).map((st) => {
                const active = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    data-active={active}
                    onClick={() => void handleSaveProgress(st)}
                    className="cadence-keycap inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium text-[#EDE3D2] capitalize"
                  >
                    {active && <Check className="h-3 w-3 text-[#E12D1C]" aria-hidden="true" />}
                    <span>{st.replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Takeaways or bookmark chapter note..."
              className="cadence-field flex-1 text-xs"
            />
            <button
              type="button"
              disabled={savingNotes}
              onClick={() => void handleSaveProgress()}
              className="cadence-keycap rounded-lg px-3 py-1.5 text-xs font-medium text-[#EDE3D2] disabled:opacity-50"
            >
              {savingNotes ? 'Saving...' : 'Save note'}
            </button>
          </div>
          {statusMsg && <div className="font-mono text-[11px] text-[#EDE3D2]">{statusMsg}</div>}
        </div>
      )}
    </aside>
  );
};
