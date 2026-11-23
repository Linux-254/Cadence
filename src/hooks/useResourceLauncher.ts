import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { LaunchableResource } from '../components/ResourceLauncher';
import type { ResourceOpenMode, ResourceProgressRecord } from '../types/cadence';
import { launchPopoutResourceWindow } from '../utils/resourceWindow';
import { playTactileClick } from '../utils/audioAlarm';

export function useResourceLauncher(options?: {
  sessionId?: string | null;
  onProgressUpdated?: (slug: string, progress: ResourceProgressRecord) => void;
}) {
  const { user, activeSession, apiFetch } = useAuth();
  const [activeResource, setActiveResource] = useState<LaunchableResource | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<ResourceOpenMode>(
    user?.profile?.resourceOpenMode || 'popout'
  );
  const [blockedWarning, setBlockedWarning] = useState(false);

  const recordLaunchTelemetry = useCallback(
    async (resource: LaunchableResource) => {
      const targetSessionId = options?.sessionId || activeSession?.id || null;
      if (resource.isCatalogResource !== false) {
        try {
          const nextStatus =
            resource.progress?.status === 'completed' ? 'completed' : 'in_progress';
          const res = await apiFetch<{ progress: ResourceProgressRecord }>(
            `/api/resources/${encodeURIComponent(resource.slug)}/progress`,
            {
              method: 'POST',
              body: JSON.stringify({
                status: nextStatus,
                linkedSessionId: targetSessionId,
                lastOpenedAt: new Date().toISOString(),
              }),
            }
          );
          if (options?.onProgressUpdated) {
            options.onProgressUpdated(resource.slug, res.progress);
          }
        } catch {
          // Non-fatal or non-catalog slug
        }
      }

      if (targetSessionId && (!activeSession || activeSession.status === 'active')) {
        try {
          await apiFetch('/api/activity', {
            method: 'POST',
            body: JSON.stringify({
              sessionId: targetSessionId,
              source: 'manual',
              toolSlug: resource.slug,
              language: user?.profile?.programmingLanguages?.[0] || 'typescript',
              gitCommitMessage: `Opened ${resource.title}`,
            }),
          });
        } catch {
          // Ignore if session paused or closed
        }
      }
    },
    [activeSession, apiFetch, options, user?.profile?.programmingLanguages]
  );

  const launchResource = useCallback(
    async (resource: LaunchableResource, modeOverride?: ResourceOpenMode) => {
      playTactileClick('confirm');
      const preferredMode: ResourceOpenMode =
        modeOverride || user?.profile?.resourceOpenMode || 'popout';

      setActiveResource(resource);
      setBlockedWarning(false);
      void recordLaunchTelemetry(resource);

      if (preferredMode === 'tab') {
        const win = window.open(resource.url, '_blank', 'noopener,noreferrer');
        if (!win) {
          setDrawerMode('split');
          setBlockedWarning(true);
          setDrawerOpen(true);
        } else {
          setDrawerMode('tab');
        }
        return;
      }

      if (preferredMode === 'popout') {
        const pref = user?.profile?.resourceWindowPrefs?.[resource.slug] || {
          width: 960,
          height: 860,
        };
        const result = await launchPopoutResourceWindow({
          slug: resource.slug,
          url: resource.url,
          pref,
        });
        if (result.blocked) {
          setBlockedWarning(true);
          setDrawerMode('split');
          setDrawerOpen(true);
        } else {
          setDrawerMode('popout');
        }
        return;
      }

      // split or embed
      setDrawerMode(preferredMode);
      setDrawerOpen(true);
    },
    [recordLaunchTelemetry, user?.profile?.resourceOpenMode, user?.profile?.resourceWindowPrefs]
  );

  const openInspector = useCallback(
    (resource: LaunchableResource, modeOverride?: ResourceOpenMode) => {
      setActiveResource(resource);
      setBlockedWarning(false);
      setDrawerMode(modeOverride || user?.profile?.resourceOpenMode || 'split');
      setDrawerOpen(true);
    },
    [user?.profile?.resourceOpenMode]
  );

  return {
    activeResource,
    drawerOpen,
    drawerMode,
    blockedWarning,
    launchResource,
    openInspector,
    closeDrawer: () => setDrawerOpen(false),
    setDrawerMode,
    clearBlocked: () => setBlockedWarning(false),
  };
}
