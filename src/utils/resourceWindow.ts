import type { WindowPref } from '../types/cadence';

export interface WindowSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const RESOURCE_WINDOW_PRESETS: WindowSizePreset[] = [
  { id: 'compact', label: '720 × 780', width: 720, height: 780 },
  { id: 'balanced', label: '960 × 860', width: 960, height: 860 },
  { id: 'wide', label: '1200 × 900', width: 1200, height: 900 },
];

export interface PopoutLaunchResult {
  opened: boolean;
  blocked: boolean;
  windowRef: Window | null;
}

export async function resolveScreenOrigin(screenIndex?: number): Promise<{ left: number; top: number }> {
  const baseLeft = typeof window !== 'undefined' && typeof (window.screen as any)?.availLeft === 'number'
    ? Number((window.screen as any).availLeft)
    : 0;
  const baseTop = typeof window !== 'undefined' && typeof (window.screen as any)?.availTop === 'number'
    ? Number((window.screen as any).availTop)
    : 0;

  if (typeof window !== 'undefined' && typeof (window as any).getScreenDetails === 'function' && screenIndex !== undefined) {
    try {
      const details = await (window as any).getScreenDetails();
      const target = Array.isArray(details?.screens) ? details.screens[screenIndex] : null;
      if (target) {
        return {
          left: Math.round(target.availLeft + 40),
          top: Math.round(target.availTop + 40),
        };
      }
    } catch {
      // Multi-screen permission denied or unavailable; fall back cleanly
    }
  }

  return {
    left: Math.round(baseLeft + Math.max(40, (window.screen?.availWidth || 1280) - 1020)),
    top: Math.round(baseTop + 48),
  };
}

export async function launchPopoutResourceWindow(params: {
  slug: string;
  url: string;
  pref?: WindowPref;
}): Promise<PopoutLaunchResult> {
  const width = Math.max(360, Math.min(2400, params.pref?.width || 960));
  const height = Math.max(360, Math.min(1800, params.pref?.height || 860));
  const origin = await resolveScreenOrigin(params.pref?.screenIndex);
  const windowName = `cadence_resource_${params.slug.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const features = `popup=yes,width=${width},height=${height},left=${origin.left},top=${origin.top},resizable=yes,scrollbars=yes`;

  try {
    const win = window.open(params.url, windowName, features);
    if (!win || win.closed) {
      return { opened: false, blocked: true, windowRef: null };
    }
    try {
      win.focus();
    } catch {
      // Cross-origin focus may be ignored
    }
    return { opened: true, blocked: false, windowRef: win };
  } catch {
    return { opened: false, blocked: true, windowRef: null };
  }
}
