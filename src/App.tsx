import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, OnboardingPage, RegisterPage, SignedOutPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ToolsPage } from './pages/ToolsPage';
import { SessionPlannerPage } from './pages/SessionPlannerPage';
import { SessionFocusPage } from './pages/SessionFocusPage';
import { SessionPausePage } from './pages/SessionPausePage';
import { SessionEndPage, SessionSummaryPage } from './pages/SessionEndSummaryPage';
import { AnalyticsPage, LeaderboardPage } from './pages/AnalyticsLeaderboardPages';
import {
  NotFoundPage,
  PortfolioSyncPage,
  PrivacyPage,
  SettingsPage,
  TermsPage,
} from './pages/PortfolioSettingsPages';
import { DocsPortalPage } from './pages/DocsPortalPage';
import { LearningHubPage } from './pages/LearningHubPage';
import { PracticeHubPage } from './pages/PracticeHubPage';
import { WorkspaceSearchPage } from './pages/WorkspaceSearchPage';

const AppRouter: React.FC = () => {
  const { user, loading, currentPath, navigate } = useAuth();

  // Per-route SEO & workspace page titles
  useEffect(() => {
    const titleMap: Record<string, string> = {
      '/': 'Cadence — Developer Accountability & Progression Platform',
      '/docs': 'Cadence — Complete Engineering & Product Specification',
      '/login': 'Sign In — Cadence',
      '/register': 'Create Account — Cadence',
      '/signed-out': 'Signed Out — Cadence',
      '/onboarding': 'Workspace Setup — Cadence',
      '/dashboard': 'Dashboard — Cadence',
      '/learn': 'Learning Paths — Cadence',
      '/practice': 'Guided Practice — Cadence',
      '/search': 'Search Workspace — Cadence',
      '/projects': 'Projects & Reference Cards — Cadence',
      '/projects/new': 'New Project — Cadence',
      '/tools': 'Tool Catalog & Search Discovery — Cadence',
      '/sessions/new': 'Session Planner — Cadence',
      '/analytics': 'Analytics & Improvement Insights — Cadence',
      '/leaderboard': 'Rankings & Consistency Streaks — Cadence',
      '/portfolio-sync': 'Portfolio & Business Site Sync — Cadence',
      '/settings': 'Settings & Extension Pairing — Cadence',
      '/privacy': 'Privacy Policy — Cadence',
      '/terms': 'Terms of Service — Cadence',
    };
    if (titleMap[currentPath]) {
      document.title = titleMap[currentPath];
    } else if (currentPath.startsWith('/learn/')) {
      document.title = 'Learning Path Detail — Cadence';
    } else if (currentPath.startsWith('/practice/')) {
      document.title = 'Practice Drill — Cadence';
    } else if (currentPath.startsWith('/session/')) {
      document.title = 'Live Focus Session — Cadence';
    } else if (currentPath.startsWith('/projects/')) {
      document.title = 'Project Workspace — Cadence';
    } else {
      document.title = 'Page Not Found — Cadence';
    }
  }, [currentPath]);

  // Route Guard & Redirect Pipeline
  useEffect(() => {
    if (loading) return;

    const isPublicRoute =
      currentPath === '/' ||
      currentPath === '/login' ||
      currentPath === '/register' ||
      currentPath === '/signed-out' ||
      currentPath === '/docs' ||
      currentPath === '/privacy' ||
      currentPath === '/terms';

    if (!user && !isPublicRoute) {
      const encoded = encodeURIComponent(`${currentPath}${window.location.search}`);
      navigate(`/login?redirect=${encoded}`, true);
      return;
    }

    if (user) {
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/register' || currentPath === '/signed-out') {
        navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding', true);
        return;
      }
      if (!user.onboardingCompleted && currentPath !== '/onboarding' && currentPath !== '/docs' && currentPath !== '/privacy' && currentPath !== '/terms') {
        navigate('/onboarding', true);
        return;
      }
      if (user.onboardingCompleted && currentPath === '/onboarding') {
        navigate('/dashboard', true);
      }
    }
  }, [loading, user, currentPath, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0908] flex items-center justify-center">
        <div className="font-mono text-xs text-[#A69B8D]">
          Calibrating Cadence studio...
        </div>
      </div>
    );
  }

  // Public routes
  if (currentPath === '/') return <LandingPage />;
  if (currentPath === '/register') return <RegisterPage />;
  if (currentPath === '/login') return <LoginPage />;
  if (currentPath === '/signed-out') return <SignedOutPage />;
  if (currentPath === '/docs') return <DocsPortalPage />;
  if (currentPath === '/privacy') return <PrivacyPage />;
  if (currentPath === '/terms') return <TermsPage />;

  if (!user) return <LoginPage />;
  if (currentPath === '/onboarding') return <OnboardingPage />;
  if (!user.onboardingCompleted) return <OnboardingPage />;

  // Workspace routes
  if (currentPath === '/dashboard') return <DashboardPage />;
  if (currentPath === '/learn') return <LearningHubPage />;
  const learnMatch = currentPath.match(/^\/learn\/([^/]+)$/);
  if (learnMatch) return <LearningHubPage pathSlug={decodeURIComponent(learnMatch[1])} />;
  if (currentPath === '/practice') return <PracticeHubPage />;
  const practiceMatch = currentPath.match(/^\/practice\/([^/]+)$/);
  if (practiceMatch) return <PracticeHubPage drillSlug={decodeURIComponent(practiceMatch[1])} />;
  if (currentPath === '/search') return <WorkspaceSearchPage />;
  if (currentPath === '/projects') return <ProjectsPage />;
  if (currentPath === '/projects/new') return <ProjectsPage initialNew />;
  const projectMatch = currentPath.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) return <ProjectsPage projectId={projectMatch[1]} />;

  if (currentPath === '/tools') return <ToolsPage />;
  if (currentPath === '/sessions/new') return <SessionPlannerPage />;

  const focusMatch = currentPath.match(/^\/session\/([^/]+)\/focus$/);
  if (focusMatch) return <SessionFocusPage sessionId={focusMatch[1]} />;

  const pauseMatch = currentPath.match(/^\/session\/([^/]+)\/pause$/);
  if (pauseMatch) return <SessionPausePage sessionId={pauseMatch[1]} />;

  const endMatch = currentPath.match(/^\/session\/([^/]+)\/end$/);
  if (endMatch) return <SessionEndPage sessionId={endMatch[1]} />;

  const summaryMatch = currentPath.match(/^\/session\/([^/]+)\/summary$/);
  if (summaryMatch) return <SessionSummaryPage sessionId={summaryMatch[1]} />;

  if (currentPath === '/analytics') return <AnalyticsPage />;
  if (currentPath === '/leaderboard') return <LeaderboardPage />;
  if (currentPath === '/portfolio-sync') return <PortfolioSyncPage />;
  if (currentPath === '/settings' || currentPath.startsWith('/settings/')) return <SettingsPage />;

  return <NotFoundPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
