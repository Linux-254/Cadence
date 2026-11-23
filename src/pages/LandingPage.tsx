import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  FileText,
  Globe,
  Layers,
  Monitor,
  Play,
  Radar,
  ShieldCheck,
  Smartphone,
  Tablet,
  Zap,
} from 'lucide-react';
import { ChronographStage2D, type ChronometerCueId } from '../components/ChronographStage2D';
import { DevWorkstationPreview } from '../components/DevWorkstationPreview';
import { EmberOrbCta, ParallaxLayer, ScrollRevealBand } from '../components/ScrollChoreography';
import { useAuth } from '../context/AuthContext';
import { playTactileTick } from '../utils/audioAlarm';
import { downloadSpecPdf } from '../utils/pdfDownload';

interface StoryBeat {
  id: ChronometerCueId;
  index: string;
  eyebrow: string;
  leadTitle: string;
  boldTitle: string;
  description: string;
  align: 'left' | 'right';
}

const STORY_BEATS: StoryBeat[] = [
  {
    id: 'hero',
    index: '01',
    eyebrow: 'STEP BY STEP · SERVER-AUTHORITATIVE CLOCK',
    leadTitle: 'Accountability engineered',
    boldTitle: 'for builders who ship.',
    description:
      'Choose Personal, Business/Client, or Learning mode. Filter tools across 7 categories, split sprints from 90 minutes to 30 days into timed checkpoints, and rank on estimate accuracy.',
    align: 'left',
  },
  {
    id: 'closeup',
    index: '02',
    eyebrow: 'CALIBRE PRECISION · ZERO FAKE HOURS',
    leadTitle: 'Twelve checkpoints.',
    boldTitle: 'One honest clock.',
    description:
      'Raw stopwatches reward leaving tabs idle. Cadence measures planned versus actual deltas across Dev, Design, Research, Testing, Deployment, and Clientele.',
    align: 'right',
  },
  {
    id: 'apart',
    index: '03',
    eyebrow: 'EXPLODED LAYERS · MANDATORY PAUSE GATE',
    leadTitle: 'Take it apart.',
    boldTitle: 'Guard every break.',
    description:
      'Stepping away locks your session behind a required break reason and countdown watchdog. Close the browser mid-sprint and server cron seals exact logs at your last heartbeat.',
    align: 'left',
  },
  {
    id: 'around',
    index: '04',
    eyebrow: 'WORKSTATION RIG · SCREENS TO LED KEYBOARD',
    leadTitle: 'One workflow across',
    boldTitle: 'every surface you touch.',
    description:
      'Start coding at your ultrawide display and mechanical keyboard, dock a tablet companion beside your setup, or manage breaks cleanly on mobile with automatic cross-device audit logs.',
    align: 'right',
  },
  {
    id: 'rebuild',
    index: '05',
    eyebrow: 'LOCKED TELEMETRY · PORTFOLIO & VIVA READY',
    leadTitle: 'Verified proof that',
    boldTitle: 'syncs straight to production.',
    description:
      'Publish verified build hours, tech stack metadata, and completed milestones to your personal portfolio or client business site via signed HMAC webhooks and live JSON feeds.',
    align: 'left',
  },
];

const OVERVIEW_SLIDES = [
  {
    id: 'slide-1',
    kicker: 'MOTION GRAPHICS & SCROLL CHOREOGRAPHY',
    title: 'Precision Chronograph Engine',
    desc: 'Server-authoritative timers with mandatory break gates, 30-second heartbeats, and synthesized Web Audio ticks.',
    tag: 'CORE ENGINE',
    stat: '30s Heartbeat',
    image: '/assets/aistudio/image_e5f2758f.png',
  },
  {
    id: 'slide-2',
    kicker: 'UNIFIED IN-PLATFORM SANDBOX',
    title: 'Multi-Tool & Platform Matrix',
    desc: 'Launch VS Code, Antigravity, Figma, and custom URLs directly inside the platform secure window sandbox.',
    tag: 'WORKSPACE',
    stat: '100% In-Platform',
    image: '/src/assets/images/ember_dev_workstation_1795423374812.jpg',
  },
  {
    id: 'slide-3',
    kicker: 'JARVIS-GRADE HUD ANALYTICS',
    title: 'Holographic Telemetry & Deltas',
    desc: 'Live neural waveforms, estimate accuracy calibration, and instant CSV session log exports.',
    tag: 'HUD METRICS',
    stat: 'Real-Time Sync',
    image: '/assets/aistudio/image_a501a49c.png',
  },
];

const BREAKPOINT_MODES = [
  {
    id: 'desktop',
    num: '01',
    range: '1024px+',
    label: 'Desktop Studio',
    headline: 'Full Workstation Layout',
    detail:
      'Dedicated 252px sidebar, asymmetric KPI telemetry strip, proportional checkpoint timeline builder, IDE deep-link launchers, and side-by-side AI Reference Cards.',
    icon: Monitor,
  },
  {
    id: 'tablet',
    num: '02',
    range: '768px – 1023px',
    label: 'Tablet Rail',
    headline: 'Companion Monitor Mode',
    detail:
      'Compact 72px icon rail frees horizontal width for balanced multi-plane layouts—ideal for docking a tablet beside your laptop as an always-visible focus timer.',
    icon: Tablet,
  },
  {
    id: 'mobile',
    num: '03',
    range: '< 768px',
    label: 'Mobile Touch',
    headline: 'Pocket Accountability',
    detail:
      'Thumb-reachable 4-tab bottom bar, slide-out drawer for all workspace tools, Web Audio break alarms, and automatic server handoff logging on active sessions.',
    icon: Smartphone,
  },
] as const;

const CAPABILITY_INDEX = [
  {
    num: '01',
    kicker: 'Metadata Only Telemetry',
    title: '3-Layer Privacy-Safe Telemetry',
    body: 'Unified VS Code API extension, domain-allowlist Chrome MV3 extension, and manual switches log only tool slugs and language IDs—never source code or file contents.',
  },
  {
    num: '02',
    kicker: 'Heartbeat Protected',
    title: 'Server-Authoritative Timers',
    body: 'Elapsed durations derive from MongoDB timestamps and 30-second heartbeats. Closing the browser mid-sprint triggers graceful server lapse without losing IDE work.',
  },
  {
    num: '03',
    kicker: 'Signed Delivery',
    title: 'Portfolio & Reference Sync',
    body: 'Upload PRDs for instant Gemini summary cards pinned in Focus View and publish verified personal or client project records via signed HMAC webhooks.',
  },
];

export const LandingPage: React.FC = () => {
  const { navigate, user, demoLogin } = useAuth();
  const [activeCue, setActiveCue] = useState<ChronometerCueId>('hero');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBreakpoint, setActiveBreakpoint] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);
  const [pdfNotice, setPdfNotice] = useState('');
  const beatRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(1, Math.max(0, window.scrollY / docHeight));
      setScrollProgress(pct);

      const viewportMid = window.innerHeight * 0.45;
      let closestId: ChronometerCueId = 'hero';
      let closestDist = Number.POSITIVE_INFINITY;
      for (const beat of STORY_BEATS) {
        const el = beatRefs.current[beat.id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportMid);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = beat.id;
        }
      }
      setActiveCue(closestId);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBeat = (id: ChronometerCueId) => {
    playTactileTick(740);
    setActiveCue(id);
    const el = beatRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNextSlide = () => {
    playTactileTick(780);
    setCurrentSlide((prev) => (prev + 1) % OVERVIEW_SLIDES.length);
  };

  const handlePrevSlide = () => {
    playTactileTick(780);
    setCurrentSlide((prev) => (prev - 1 + OVERVIEW_SLIDES.length) % OVERVIEW_SLIDES.length);
  };

  const handleInstantDemo = async (intent: string) => {
    setDemoLoggingIn(true);
    try {
      await demoLogin(intent);
      navigate('/dashboard', true);
    } catch {
      navigate('/login');
    } finally {
      setDemoLoggingIn(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfNotice('');
    await downloadSpecPdf((msg) => setPdfNotice(msg));
  };

  const selectedDeviceSpec =
    BREAKPOINT_MODES.find((b) => b.id === activeBreakpoint) || BREAKPOINT_MODES[0];
  const slide = OVERVIEW_SLIDES[currentSlide];

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#0A0908] text-[#EDE3D2]">
      {/* Fixed 2D Scroll-Choreographed Chronograph Stage */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <div className="absolute inset-0 studio-radial-bg pointer-events-none" />
        <ChronographStage2D
          activeCue={activeCue}
          scrollProgress={scrollProgress}
          onSelectCue={scrollToBeat}
        />
      </div>

      {/* Left Edge Continuous Scroll Horizon Progress Line */}
      <div aria-hidden="true" className="fixed left-0 top-0 bottom-0 z-30 w-[2px] bg-[#1C1815]">
        <div
          className="w-full bg-gradient-to-b from-[#EDE3D2] via-[#E12D1C] to-[#E12D1C] transition-all duration-150"
          style={{ height: `${Math.round(scrollProgress * 100)}%` }}
        />
      </div>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#0A0908]/92 hairline-bottom">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-8">
          <button
            type="button"
            onClick={() => scrollToBeat('hero')}
            className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-[#EDE3D2] whitespace-nowrap shrink-0"
          >
            <img src="/favicon.svg" alt="" className="h-6 w-6 rounded-md" />
            <span>Cadence</span>
          </button>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-xs font-medium text-[#A69B8D]">
            <a href="#slideshow-section" className="nav-link-underline hover:text-[#EDE3D2] transition-colors whitespace-nowrap shrink-0">
              Motion Slideshow
            </a>
            <a href="#workstation-rig" className="nav-link-underline hover:text-[#EDE3D2] transition-colors whitespace-nowrap shrink-0">
              Workstation
            </a>
            <a href="#responsive-devices" className="nav-link-underline hover:text-[#EDE3D2] transition-colors whitespace-nowrap shrink-0">
              Devices
            </a>
            <button
              type="button"
              onClick={() => navigate('/docs')}
              className="nav-link-underline hover:text-[#EDE3D2] transition-colors whitespace-nowrap shrink-0"
            >
              Docs &amp; PDF
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="nav-link-underline hover:text-[#EDE3D2] transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-semibold text-[#EDE3D2] shadow-[0_8px_24px_-6px_rgba(225,45,28,0.55)] hover:brightness-110 transition-all whitespace-nowrap shrink-0"
            >
              <span>{user ? 'Open Workspace' : 'Start Session'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Scrolling Editorial Layer Over 2D Chronograph */}
      <div className="relative z-10 pointer-events-none">
        {/* Right-edge Story Beat Indicator */}
        <aside
          aria-label="Chronograph story beat indicator"
          className="pointer-events-auto fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 xl:flex flex-col gap-2.5"
        >
          {STORY_BEATS.map((beat) => {
            const active = activeCue === beat.id;
            return (
              <button
                key={beat.id}
                type="button"
                onClick={() => scrollToBeat(beat.id)}
                title={beat.eyebrow}
                className={`group flex items-center justify-end gap-2.5 text-right transition-all ${
                  active ? 'text-[#EDE3D2]' : 'text-[#6E655B] hover:text-[#A69B8D]'
                }`}
              >
                <span className="font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                  {beat.index}
                </span>
                <span
                  className={`block h-1.5 rounded-full transition-all ${
                    active ? 'w-7 bg-[#E12D1C]' : 'w-2 bg-[#2C2621] group-hover:bg-[#5E564B]'
                  }`}
                />
              </button>
            );
          })}
        </aside>

        {/* Beats 01-05: Unboxed Open Editorial Typography */}
        {STORY_BEATS.map((beat, idx) => (
          <section
            key={beat.id}
            data-cue={beat.id}
            ref={(el) => {
              beatRefs.current[beat.id] = el;
            }}
            className="mx-auto flex min-h-[76vh] max-w-7xl items-center px-4 py-16 sm:px-8"
          >
            <ScrollRevealBand
              className={`pointer-events-auto relative w-full max-w-xl py-6 ${
                beat.align === 'right' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[#0A0908]/65 blur-2xl"
              />

              <ParallaxLayer speed={24} scaleRange={[0.96, 1.04]} className="mb-2">
                <span className="font-mono text-xs tracking-[0.26em] uppercase text-[#E12D1C]">
                  * {beat.index} · {beat.eyebrow}
                </span>
              </ParallaxLayer>

              <div className="cadence-seam">
                {idx === 0 ? (
                  <h1 className="mt-2 font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl [text-wrap:balance]">
                    <span className="block text-[#EDE3D2]">{beat.leadTitle}</span>
                    <span className="block text-[#E12D1C]">{beat.boldTitle}</span>
                  </h1>
                ) : (
                  <h2 className="mt-2 font-display text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl [text-wrap:balance]">
                    <span className="block text-[#EDE3D2]">{beat.leadTitle}</span>
                    <span className="block text-[#E12D1C]">{beat.boldTitle}</span>
                  </h2>
                )}
              </div>

              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#A69B8D]">{beat.description}</p>

              {idx === 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-8">
                  <EmberOrbCta
                    label={user ? 'GO TO DASHBOARD' : 'START YOUR CADENCE'}
                    eyebrow="Free Workspace"
                    size="md"
                    onClick={() => navigate(user ? '/dashboard' : '/register')}
                  />
                  <button
                    type="button"
                    onClick={() => scrollToBeat('apart')}
                    className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[#A69B8D] hover:text-[#EDE3D2] transition-colors"
                  >
                    <span>Explode Layers</span>
                    <ChevronRight className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
                  </button>
                </div>
              )}
            </ScrollRevealBand>
          </section>
        ))}

        {/* Interactive Motion Graphics & Scroll Slideshow Section */}
        <section id="slideshow-section" className="pointer-events-auto bg-gradient-to-b from-[#0A0908] via-[#120F0D] to-[#0A0908] py-24 hairline-top">
          <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="cadence-seam max-w-2xl">
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#E12D1C]">
                  IMMERSE &amp; EXPLORE · MOTION GRAPHICS SLIDESHOW
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#EDE3D2] sm:text-4xl">
                  Scroll Slideshow &amp; Core Platform Engines
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="cadence-keycap rounded-xl p-3 text-[#EDE3D2] hover:border-[#E12D1C]"
                  title="Previous Slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="cadence-keycap rounded-xl p-3 text-[#EDE3D2] hover:border-[#E12D1C]"
                  title="Next Slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Slideshow Card Container */}
            <div className="relative overflow-hidden rounded-3xl bg-[#13100E] border border-[#EDE3D2]/15 shadow-2xl p-8 sm:p-12 kinetic-enter">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(225,45,28,0.12),transparent_50%)] pointer-events-none" />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-center relative z-10">
                <div className="lg:col-span-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#E12D1C] bg-[#E12D1C]/10 px-3 py-1 rounded-full">
                      {slide.tag}
                    </span>
                    <span className="font-mono text-xs text-[#A69B8D]">{slide.stat}</span>
                  </div>
                  <div className="font-mono text-xs tracking-wider uppercase text-[#A69B8D]">{slide.kicker}</div>
                  <h3 className="font-display text-3xl sm:text-4xl font-bold text-[#EDE3D2] tracking-tight">
                    {slide.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#A69B8D]">{slide.desc}</p>
                  <div className="pt-4 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => navigate(user ? '/dashboard' : '/register')}
                      className="rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-6 py-3 text-xs font-semibold text-[#EDE3D2] shadow-lg hover:brightness-110"
                    >
                      {user ? 'Open Workspace' : 'Get Started Now'}
                    </button>
                    <div className="flex items-center gap-2">
                      {OVERVIEW_SLIDES.map((s, i) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            playTactileTick(700);
                            setCurrentSlide(i);
                          }}
                          className={`h-2 rounded-full transition-all ${
                            currentSlide === i ? 'w-8 bg-[#E12D1C]' : 'w-2 bg-[#EDE3D2]/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 overflow-hidden rounded-2xl border border-[#EDE3D2]/10 bg-[#0A0908]">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="h-72 sm:h-96 w-full object-cover opacity-85 transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Instant Demo Account Access Bar on Overview */}
            <div className="rounded-2xl bg-[#13100E] border border-[#EDE3D2]/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs uppercase tracking-wider text-[#EDE3D2] flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#E12D1C]" />
                  <span>Instant 1-Click Demo Accounts (All Areas Filled)</span>
                </div>
                <span className="font-mono text-[10px] text-[#A69B8D]">EXPLORE ANY PERSONA INSTANTLY</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  { id: 'learner', label: 'Learner (Beginner)' },
                  { id: 'student', label: 'Student (CS)' },
                  { id: 'job_seeker', label: 'Job Seeker' },
                  { id: 'freelancer', label: 'Freelancer' },
                  { id: 'employed', label: 'Employed (Senior)' },
                  { id: 'founder', label: 'Founder (CTO)' },
                ].map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    disabled={demoLoggingIn}
                    onClick={() => void handleInstantDemo(demo.id)}
                    className="cadence-keycap rounded-xl p-3 text-left hover:border-[#E12D1C] transition-all disabled:opacity-50"
                  >
                    <div className="text-xs font-semibold text-[#EDE3D2] truncate">{demo.label}</div>
                    <div className="mt-1 font-mono text-[10px] text-[#E12D1C]">Launch →</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Four Synchronized Runtime Layers */}
        <section className="pointer-events-auto bg-gradient-to-b from-[#0A0908]/95 via-[#0E0C0B] to-[#0A0908] py-24 studio-grid-hairline hairline-top">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-28">
                <div className="cadence-seam">
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#E12D1C]">
                    WHAT YOU ARE RUNNING · 04 LAYERS
                  </div>
                  <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl [text-wrap:balance]">
                    <span className="text-[#EDE3D2]">Four layers.</span>{' '}
                    <span className="text-[#E12D1C]">Zero guesswork.</span>
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-[#A69B8D]">
                  Passive timers count dead browser tabs. Cadence coordinates four synchronized runtime layers on MongoDB and Express so every sprint produces verifiable engineering proof.
                </p>
              </div>

              <div className="lg:col-span-7 divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
                {[
                  {
                    num: '04',
                    title: 'PORTFOLIO & VIVA SYNC',
                    desc: 'Signed HMAC webhooks and public JSON feeds export shipped milestones straight to your live portfolio.',
                  },
                  {
                    num: '03',
                    title: 'PAUSE & HEARTBEAT WATCHDOG',
                    desc: '30-second heartbeats, mandatory break reasons, and synthesized Web Audio overrun alarms guard focus.',
                  },
                  {
                    num: '02',
                    title: '7-CATEGORY TOOL MATRIX',
                    desc: 'IDEs, AI studios, testing suites, and client portals bound cleanly per checkpoint.',
                  },
                  {
                    num: '01',
                    title: 'SERVER CHRONOLOGY ENGINE',
                    desc: 'MongoDB authoritative timestamps remain immune to browser refresh or client clock drift.',
                  },
                ].map((layer, i) => (
                  <ScrollRevealBand
                    key={layer.num}
                    delay={i * 0.04}
                    className="group grid grid-cols-1 gap-4 py-7 sm:grid-cols-12 sm:items-baseline transition-colors hover:bg-[#161311]/35 px-2"
                  >
                    <div className="sm:col-span-3 font-display text-4xl font-bold tracking-tight text-[#E12D1C]/85 tabular-nums transition-transform duration-300 group-hover:translate-x-1">
                      {layer.num}
                    </div>
                    <div className="sm:col-span-9">
                      <div className="font-mono text-xs tracking-[0.18em] uppercase text-[#EDE3D2]">
                        {layer.title}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#A69B8D]">{layer.desc}</p>
                    </div>
                  </ScrollRevealBand>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Dev Setup Showcase */}
        <section id="workstation-rig" className="pointer-events-auto bg-gradient-to-b from-[#0A0908] via-[#100D0B] to-[#0A0908] py-24 hairline-top">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <ScrollRevealBand className="lg:col-span-5 space-y-6">
                <div className="cadence-seam">
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#E12D1C]">
                    DEVELOPER WORKSPACE ARCHITECTURE
                  </div>
                  <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl [text-wrap:balance]">
                    <span className="text-[#EDE3D2]">From ultrawide screens</span>{' '}
                    <span className="text-[#E12D1C]">to backlit LED keys.</span>
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-[#A69B8D]">
                  Every surface at your desk participates in one continuous sprint loop: deep-link IDE launch keys trigger active tracking, while dual-monitor checkpoint timelines and tablet break gates keep distraction visible.
                </p>
                <ParallaxLayer speed={22} scaleRange={[0.98, 1.03]}>
                  <img
                    src="/src/assets/images/ember_dev_workstation_1795423374812.jpg"
                    alt="Minimalist obsidian developer setup with glowing amber-crimson mechanical keyboard"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="mask-fade-radial h-52 w-full object-cover"
                  />
                </ParallaxLayer>
              </ScrollRevealBand>

              <div className="lg:col-span-7 hairline-top pt-6 lg:pt-0 lg:shadow-none">
                <DevWorkstationPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Focus Selector 1 Fixed: Responsive Devices */}
        <section id="responsive-devices" className="pointer-events-auto bg-[#0A0908] py-24 hairline-top">
          <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-5 space-y-4">
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#E12D1C]">
                  ADAPTIVE SCREEN ARCHITECTURE
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-[#EDE3D2] sm:text-4xl [text-wrap:balance]">
                  Engineered for Desktop, Tablet Companion &amp; Mobile.
                </h2>
                <p className="text-sm leading-relaxed text-[#A69B8D]">
                  Cadence responds organically to every screen size without manual switches. Plan checkpoints on desktop, dock a tablet beside your keyboard, or take timed breaks on your phone.
                </p>
              </div>

              <div className="lg:col-span-7">
                <ParallaxLayer speed={32} scaleRange={[0.97, 1.03]}>
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src="/src/assets/images/ember_device_trio_1795423374533.jpg"
                      alt="Obsidian laptop, vertical tablet stand, and smartphone on dark stone studio desk"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="mask-fade-edges h-full w-full object-cover"
                    />
                  </div>
                </ParallaxLayer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 hairline-top pt-10">
              <div className="lg:col-span-7 divide-y divide-[#EDE3D2]/[0.08]">
                {BREAKPOINT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const active = activeBreakpoint === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        playTactileTick(740);
                        setActiveBreakpoint(mode.id);
                      }}
                      className={`group flex w-full items-center justify-between gap-4 py-5 px-2 text-left transition-all ${
                        active ? 'cadence-seam opacity-100' : 'opacity-65 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <span className={`font-display text-2xl font-bold tabular-nums ${active ? 'text-[#E12D1C]' : 'text-[#6E655B]'}`}>
                          {mode.num}
                        </span>
                        <div>
                          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#A69B8D]">
                            {mode.range} · {mode.label}
                          </div>
                          <div className="mt-0.5 font-display text-xl font-semibold text-[#EDE3D2]">
                            {mode.headline}
                          </div>
                        </div>
                      </div>
                      <Icon
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          active ? 'text-[#E12D1C]' : 'text-[#6E655B] group-hover:text-[#EDE3D2]'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center lg:pl-8 cadence-seam">
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#E12D1C]">
                  Active Viewport Telemetry · {selectedDeviceSpec.range}
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-[#EDE3D2]">
                  {selectedDeviceSpec.label}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#A69B8D]">
                  {selectedDeviceSpec.detail}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Focus Selector 2 Fixed: Workflow Pillars */}
        <section id="workflow-pillars" className="pointer-events-auto relative overflow-hidden bg-[#0A0908] py-24 hairline-top">
          <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-20">
            <div className="space-y-4">
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#E12D1C]">
                CORE INFRASTRUCTURE GUARANTEES
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#EDE3D2] sm:text-5xl [text-wrap:balance]">
                Honest telemetry. Zero illusions.
              </h2>
            </div>

            <div className="divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
              {CAPABILITY_INDEX.map((item, idx) => (
                <ScrollRevealBand
                  key={item.num}
                  delay={idx * 0.05}
                  className="grid grid-cols-1 gap-6 py-9 md:grid-cols-12 md:items-baseline"
                >
                  <div className="md:col-span-2 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold text-[#E12D1C] tabular-nums">
                      {item.num}
                    </span>
                    <span className="font-mono text-xs text-[#6E655B]">—</span>
                  </div>
                  <div className="md:col-span-4">
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#A69B8D]">
                      {item.kicker}
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-bold text-[#EDE3D2]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="md:col-span-6 text-sm leading-relaxed text-[#A69B8D]">
                    {item.body}
                  </p>
                </ScrollRevealBand>
              ))}
            </div>

            <div className="relative py-10">
              <div
                aria-hidden="true"
                className="ember-orb-glow pointer-events-none absolute left-1/4 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full opacity-55"
              />
              <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                <div className="cadence-seam max-w-2xl">
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#E12D1C]">
                    Full MERN + SQLite Fallback · Ready to Demo
                  </div>
                  <h3 className="mt-2 font-display text-3xl font-bold text-[#EDE3D2] sm:text-4xl [text-wrap:balance]">
                    Plan your first calibrated session in under 60 seconds.
                  </h3>
                  <p className="mt-2 text-sm text-[#A69B8D]">
                    Includes Google Search stack discovery, AI document Reference Cards, and downloadable 15-chapter PDF blueprint.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 shrink-0">
                  <EmberOrbCta
                    label={user ? 'OPEN DASHBOARD' : 'CREATE ACCOUNT'}
                    size="lg"
                    onClick={() => navigate(user ? '/dashboard' : '/register')}
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/docs')}
                    className="cadence-keycap inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium text-[#EDE3D2]"
                  >
                    <Layers className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Read Viva &amp; Docs</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quiet Obsidian Studio Footer */}
        <footer className="pointer-events-auto bg-[#080706] py-8 hairline-top">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 text-xs text-[#6E655B] sm:flex-row sm:items-center sm:px-8">
            <div>Cadence · Developer Accountability, Tool Telemetry &amp; Progression</div>
            <div className="flex flex-wrap items-center gap-5">
              {pdfNotice && <span className="text-[#E12D1C]">{pdfNotice}</span>}
              <button type="button" onClick={() => navigate('/docs')} className="hover:text-[#EDE3D2]">
                Engineering Docs
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                className="hover:text-[#EDE3D2]"
              >
                Spec PDF
              </button>
              <button type="button" onClick={() => navigate('/privacy')} className="hover:text-[#EDE3D2]">
                Privacy Policy
              </button>
              <button type="button" onClick={() => navigate('/terms')} className="hover:text-[#EDE3D2]">
                Terms of Service
              </button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};
