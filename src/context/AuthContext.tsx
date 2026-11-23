import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { DeviceKind, SessionRecord, UserProfile } from '../types/cadence';

export type ViewportTier = 'mobile' | 'tablet' | 'desktop';

const HEARTBEAT_INTERVAL_MS = 30_000;

interface AuthContextValue {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loading: boolean;
  activeSession: SessionRecord | null;
  serverOffsetMs: number;
  currentPath: string;
  searchParams: URLSearchParams;
  deviceMode: DeviceKind;
  viewportTier: ViewportTier;
  demoBanner: boolean;
  storageEngine: 'mongodb' | 'sqlite_preview' | null;
  navigate: (to: string, replace?: boolean) => void;
  apiFetch: <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    skillLevel: string;
    primaryRole?: string;
  }) => Promise<UserProfile>;
  demoLogin: (intent: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshActiveSession: () => Promise<SessionRecord | null>;
  setActiveSession: React.Dispatch<React.SetStateAction<SessionRecord | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function detectViewportTier(): ViewportTier {
  if (typeof window === 'undefined') return 'desktop';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<SessionRecord | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [viewportTier, setViewportTier] = useState<ViewportTier>(detectViewportTier);
  const [demoBanner, setDemoBanner] = useState(false);
  const [storageEngine, setStorageEngine] = useState<'mongodb' | 'sqlite_preview' | null>(null);

  const [locationUrl, setLocationUrl] = useState(() =>
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/'
  );

  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const onResize = () => setViewportTier(detectViewportTier());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setLocationUrl(`${window.location.pathname}${window.location.search}`);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('/api/health', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { demoMode?: boolean; database?: 'mongodb' | 'sqlite_preview' } | null) => {
        if (!mounted || !data) return;
        setDemoBanner(Boolean(data.demoMode));
        setStorageEngine(data.database ?? null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const deviceMode: DeviceKind = viewportTier === 'mobile' ? 'mobile_pwa' : 'web';

  const navigate = useCallback((to: string, replace = false) => {
    if (typeof window === 'undefined') return;
    const normalized = to.startsWith('/') ? to : `/${to}`;
    if (replace) {
      window.history.replaceState(null, '', normalized);
    } else {
      window.history.pushState(null, '', normalized);
    }
    setLocationUrl(normalized);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const apiFetch = useCallback(
    async <T = unknown>(url: string, init: RequestInit = {}): Promise<T> => {
      const headers = new Headers(init.headers || {});
      if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json');
      }
      headers.set('X-Requested-With', 'XMLHttpRequest');
      headers.set('X-Cadence-Device', deviceMode);
      if (accessTokenRef.current) {
        headers.set('Authorization', `Bearer ${accessTokenRef.current}`);
      }

      let res = await fetch(url, { ...init, headers, credentials: 'include' });

      if (res.status === 401 && url !== '/api/auth/refresh' && url !== '/api/auth/login' && url !== '/api/auth/register' && url !== '/api/auth/demo-login') {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const data = (await refreshRes.json()) as { accessToken: string; user: UserProfile };
          accessTokenRef.current = data.accessToken;
          setUser(data.user);
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          res = await fetch(url, { ...init, headers, credentials: 'include' });
        }
      }

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `Request failed (${res.status})`);
      }
      return (await res.json()) as T;
    },
    [deviceMode]
  );

  const refreshActiveSession = useCallback(async (): Promise<SessionRecord | null> => {
    if (!accessTokenRef.current && !user) return null;
    try {
      const data = await apiFetch<{ session: SessionRecord | null; serverNow?: number }>('/api/sessions/active');
      if (data.serverNow) {
        setServerOffsetMs(data.serverNow - Date.now());
      }
      setActiveSession(data.session);
      return data.session;
    } catch {
      return null;
    }
  }, [apiFetch, user]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: UserProfile }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, [apiFetch]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'include',
        });
        if (res.ok && mounted) {
          const data = (await res.json()) as { accessToken: string; user: UserProfile };
          accessTokenRef.current = data.accessToken;
          setUser(data.user);
        }
      } catch {
        // Guest session
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      void refreshActiveSession();
    } else {
      setActiveSession(null);
    }
  }, [user, refreshActiveSession]);

  // 30s Heartbeat while a session is active or paused (matches server HEARTBEAT_WEB_S)
  useEffect(() => {
    if (!user || !activeSession || (activeSession.status !== 'active' && activeSession.status !== 'paused')) {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch<{ session: SessionRecord; serverNow: number }>(
          `/api/sessions/${activeSession.id}/heartbeat`,
          { method: 'POST' }
        );
        setServerOffsetMs(data.serverNow - Date.now());
        setActiveSession(data.session);
      } catch {
        // Transient network drops handled by server lapse grace window
      }
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, activeSession?.id, activeSession?.status, apiFetch]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ accessToken: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    accessTokenRef.current = data.accessToken;
    setUser(data.user);
    return data.user;
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    skillLevel: string;
    primaryRole?: string;
  }) => {
    const data = await apiFetch<{ accessToken: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    accessTokenRef.current = data.accessToken;
    setUser(data.user);
    return data.user;
  };

  const demoLogin = async (intent: string) => {
    const data = await apiFetch<{ accessToken: string; user: UserProfile }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ intent }),
    });
    accessTokenRef.current = data.accessToken;
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear local state regardless
    }
    accessTokenRef.current = null;
    setUser(null);
    setActiveSession(null);
    navigate('/signed-out');
  };

  const [pathnamePart, searchPart = ''] = locationUrl.split('?');
  const searchParams = new URLSearchParams(searchPart);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        activeSession,
        serverOffsetMs,
        currentPath: pathnamePart || '/',
        searchParams,
        deviceMode,
        viewportTier,
        demoBanner,
        storageEngine,
        navigate,
        apiFetch,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        refreshActiveSession,
        setActiveSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
