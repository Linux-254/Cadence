import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Code2,
  Compass,
  FolderKanban,
  Globe,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Play,
  Search,
  Settings,
  Timer,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlobalSearchModal } from './GlobalSearchModal';

interface LayoutShellProps {
  breadcrumb: string;
  children: React.ReactNode;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({ breadcrumb, children }) => {
  const { user, activeSession, currentPath, demoBanner, navigate, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { path: '/learn', label: 'Learn', icon: Compass },
    { path: '/practice', label: 'Practice', icon: Code2 },
    { path: '/search', label: 'Search workspace', icon: Search },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/tools', label: 'Tools & Search', icon: Wrench },
    { path: '/sessions/new', label: 'Session Planner', icon: Timer },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/leaderboard', label: 'Rankings', icon: Trophy },
    { path: '/portfolio-sync', label: 'Portfolio Sync', icon: Globe },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/docs', label: 'Blueprint & PDF', icon: BookOpen },
  ];

  const isSessionScreen = currentPath.startsWith('/session/');

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg flex">
      {/* Desktop Obsidian Studio Sidebar (lg+ >= 1024px) */}
      <aside className="hidden lg:flex lg:w-[252px] lg:shrink-0 lg:flex-col lg:bg-gradient-to-b lg:from-[#12100E] lg:via-[#0D0C0A] lg:to-[#0A0908] lg:shadow-[1px_0_0_rgba(237,227,210,0.06)] lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-5 py-5">
          <button
            type="button"
            onClick={() => handleNav('/dashboard')}
            className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-[#EDE3D2] whitespace-nowrap shrink-0"
          >
            <img src="/favicon.svg" alt="" className="h-6 w-6 rounded-md" />
            <span>Cadence</span>
          </button>
          <span className="font-mono text-[11px] font-semibold text-[#E12D1C]">
            {user?.tier}
          </span>
        </div>

        <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              currentPath === item.path ||
              (item.path !== '/dashboard' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-[13px] font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-[#E12D1C]/18 via-[#1E1916] to-transparent text-[#EDE3D2]'
                    : 'text-[#A69B8D] hover:bg-[#161311] hover:text-[#EDE3D2]'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[#E12D1C]"
                  />
                )}
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#E12D1C]' : 'text-[#8C8175]'}`} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 space-y-3 bg-gradient-to-t from-[#080706] to-transparent">
          <div className="cadence-seam text-xs">
            <div className="font-semibold text-[#EDE3D2] truncate">{user?.name}</div>
            <div className="text-[#A69B8D] font-mono tabular-nums text-[11px] mt-0.5">
              {user?.xp ?? 0} XP · {user?.streakDays ?? 0}d streak
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="cadence-keycap flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Tablet Adaptive Compact Icon Rail (md: 768px - 1023px) */}
      <aside
        aria-label="Tablet navigation rail"
        className="hidden md:flex lg:hidden w-[72px] shrink-0 flex-col items-center bg-gradient-to-b from-[#12100E] to-[#0A0908] shadow-[1px_0_0_rgba(237,227,210,0.06)] sticky top-0 h-screen py-4 justify-between"
      >
        <div className="flex flex-col items-center gap-4 w-full px-2">
          <button
            type="button"
            onClick={() => handleNav('/dashboard')}
            title="Cadence Home"
            aria-label="Cadence Dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A1714] shadow-[inset_0_1px_0_rgba(237,227,210,0.08)]"
          >
            <img src="/favicon.svg" alt="Cadence" className="h-6 w-6 rounded" />
          </button>

          <nav className="flex flex-col items-center gap-1.5 w-full overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                currentPath === item.path ||
                (item.path !== '/dashboard' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  title={item.label}
                  aria-label={item.label}
                  className={`relative flex h-10 w-11 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    active
                      ? 'bg-[#E12D1C]/18 text-[#E12D1C]'
                      : 'text-[#8C8175] hover:bg-[#181412] hover:text-[#EDE3D2]'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          title="Sign out"
          aria-label="Sign out"
          className="cadence-keycap flex h-10 w-11 items-center justify-center rounded-lg text-[#A69B8D] hover:text-[#EDE3D2]"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </aside>

      {/* Mobile Slide-Out Full Drawer (< 768px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/75"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex h-full w-72 flex-col bg-gradient-to-b from-[#141210] to-[#0A0908] p-5">
            <div className="flex items-center justify-between pb-4 hairline-bottom">
              <div className="flex items-center gap-2 font-display text-lg font-bold text-[#EDE3D2]">
                <img src="/favicon.svg" alt="" className="h-6 w-6 rounded" />
                <span>Cadence</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1714] text-[#A69B8D]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="mt-3 flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  currentPath === item.path ||
                  (item.path !== '/dashboard' && currentPath.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
                      active
                        ? 'bg-[#E12D1C]/18 text-[#EDE3D2]'
                        : 'text-[#A69B8D] hover:bg-[#171411] hover:text-[#EDE3D2]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-[#E12D1C]' : ''}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 space-y-3 hairline-top">
              <div className="cadence-seam text-xs">
                <div className="font-semibold text-[#EDE3D2]">{user?.name}</div>
                <div className="font-mono text-[#A69B8D] tabular-nums">
                  {user?.tier} · {user?.xp ?? 0} XP
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void logout();
                }}
                className="cadence-keycap flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#EDE3D2]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Clean Contextual Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0A0908]/92 shadow-[0_1px_0_rgba(237,227,210,0.06)]">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open workspace menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#161311] text-[#EDE3D2] md:hidden shrink-0"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNav('/dashboard')}
                className="inline-flex items-center gap-2 font-display text-base font-bold text-[#EDE3D2] md:hidden whitespace-nowrap shrink-0"
              >
                <img src="/favicon.svg" alt="" className="h-5 w-5 rounded" />
                <span>Cadence</span>
              </button>
              <span className="hidden md:inline truncate font-mono text-[11px] tracking-[0.06em] text-[#A69B8D]">
                {breadcrumb}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search workspace (Cmd+K or Ctrl+K)"
                className="cadence-keycap inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2] whitespace-nowrap shrink-0"
              >
                <Search className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                <span className="hidden sm:inline">Search</span>
                <span className="hidden lg:inline font-mono text-[10px] text-[#6E655B]">⌘K</span>
              </button>

              {activeSession && !isSessionScreen ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      activeSession.status === 'paused'
                        ? `/session/${activeSession.id}/pause`
                        : `/session/${activeSession.id}/focus`
                    )
                  }
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-semibold text-[#EDE3D2] hover:brightness-110 whitespace-nowrap shrink-0"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{activeSession.status === 'paused' ? 'View Pause' : 'Resume Focus'}</span>
                </button>
              ) : !isSessionScreen ? (
                <button
                  type="button"
                  onClick={() => navigate('/sessions/new')}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-semibold text-[#EDE3D2] hover:brightness-110 whitespace-nowrap shrink-0"
                >
                  <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>New Session</span>
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {/* SQLite Preview / Local Demo Banner (K4) */}
        {demoBanner && (
          <div className="bg-[#151210] px-4 py-2 text-xs text-[#A69B8D] hairline-bottom sm:px-6">
            <div className="mx-auto max-w-[1280px]">
              SQLite preview active: demo data is stored locally and resets between serverless restarts.
            </div>
          </div>
        )}

        {/* Active Session Live Banner */}
        {activeSession && !isSessionScreen && (
          <div className="bg-gradient-to-r from-[#E12D1C]/18 via-[#191310] to-[#110F0D] px-4 py-2.5 sm:px-6 hairline-bottom">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-[#EDE3D2]">
                <span className="font-mono font-semibold text-[#E12D1C]">
                  {activeSession.status === 'paused' ? 'Paused' : 'Live clock'}
                </span>
                <span aria-hidden="true" className="text-[#6E655B]">·</span>
                <span className="font-medium text-[#EDE3D2]">{activeSession.projectName || 'Project'}</span>
                <span aria-hidden="true" className="text-[#6E655B]">·</span>
                <span className="font-mono tabular-nums text-[#A69B8D]">{activeSession.activeMinutes}m active</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    activeSession.status === 'paused'
                      ? `/session/${activeSession.id}/pause`
                      : `/session/${activeSession.id}/focus`
                  )
                }
                className="font-mono text-xs font-semibold text-[#E12D1C] hover:text-[#EDE3D2] whitespace-nowrap"
              >
                Open focus screen →
              </button>
            </div>
          </div>
        )}

        {/* Responsive Main Viewport */}
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-14 lg:px-8">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>

        {/* Mobile Bottom Thumb Bar (< 768px; exact 4 primary tabs) */}
        <nav
          aria-label="Mobile quick navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#0D0C0A]/95 shadow-[0_-1px_0_rgba(237,227,210,0.08)] md:hidden"
        >
          <div className="mx-auto grid max-w-[540px] grid-cols-4 h-14">
            {[
              { path: '/dashboard', label: 'Home', icon: Home },
              {
                path: activeSession
                  ? activeSession.status === 'paused'
                    ? `/session/${activeSession.id}/pause`
                    : `/session/${activeSession.id}/focus`
                  : '/sessions/new',
                label: 'Session',
                icon: Timer,
              },
              { path: '/learn', label: 'Learn', icon: Compass },
              { path: '/projects', label: 'Projects', icon: FolderKanban },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive =
                currentPath === tab.path ||
                (tab.label === 'Session' && currentPath.startsWith('/session')) ||
                (tab.path !== '/dashboard' && tab.label !== 'Session' && currentPath.startsWith(tab.path));
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => handleNav(tab.path)}
                  className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-[#E12D1C]' : 'text-[#A69B8D] hover:text-[#EDE3D2]'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
