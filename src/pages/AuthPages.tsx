import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Chrome,
  ExternalLink,
  FileText,
  HelpCircle,
  KeyRound,
  LogIn,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  X,
} from 'lucide-react';
import { DevWorkstationPreview } from '../components/DevWorkstationPreview';
import { useAuth } from '../context/AuthContext';
import type {
  IntentId,
  LearningPathRecord,
  ResourceOpenMode,
  SkillLevel,
  SkillLevelV13,
  TaxonomyPayload,
  ToolCategory,
  ToolPricingTier,
  ToolRecord,
  TrackId,
  WindowPref,
} from '../types/cadence';
import { playTactileTick } from '../utils/audioAlarm';

const SKILL_LEVELS: { id: SkillLevel; code: string; label: string; desc: string }[] = [
  { id: 'beginner', code: 'LVL 01', label: 'Beginner', desc: 'Learning syntax and core workflows step by step' },
  { id: 'vibe_coder', code: 'LVL 02', label: 'AI Builder', desc: 'Shipping with AI Studio, Cursor, or terminal agents' },
  { id: 'bootcamp', code: 'LVL 03', label: 'Bootcamp Student', desc: 'Structured daily practice and portfolio milestones' },
  { id: 'intermediate', code: 'LVL 04', label: 'Intermediate Dev', desc: 'Full-stack apps, testing, and production deploys' },
  { id: 'professional', code: 'LVL 05', label: 'Senior / Freelancer', desc: 'Client deliverables, multi-repo sprints, and audits' },
];

export const RegisterPage: React.FC = () => {
  const { register, navigate } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [primaryRole, setPrimaryRole] = useState('Full-Stack Developer');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!name.trim() || !email.trim()) {
        setError('Please provide your display name and email address.');
        return;
      }
      playTactileTick(740);
      setStep(2);
    } else if (step === 2) {
      playTactileTick(820);
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreed) {
      setError('You must accept the Privacy Policy and Terms of Service to create an account.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password, skillLevel, primaryRole });
      navigate('/onboarding', true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    { num: '01', label: 'Identity' },
    { num: '02', label: 'Starting focus' },
    { num: '03', label: 'Security' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg lg:grid lg:grid-cols-12">
      <aside className="relative hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-b from-[#13100E] via-[#0C0B0A] to-[#0A0908] p-10 overflow-hidden shadow-[1px_0_0_rgba(237,227,210,0.06)]">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/src/assets/images/ember_dev_workstation_1795423374812.jpg"
            alt="Obsidian developer workstation with backlit mechanical keyboard"
            referrerPolicy="no-referrer"
            className="mask-fade-bottom h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0908]/88 via-[#0A0908]/65 to-[#0A0908]" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 text-sm font-bold text-[#EDE3D2]"
          >
            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-lg">Cadence</span>
          </button>
          <span className="font-mono text-xs text-[#E12D1C]">
            Step {step} of 3
          </span>
        </div>

        <div className="relative z-10 space-y-6 my-auto">
          <div className="cadence-seam">
            <h2 className="font-display text-3xl font-bold leading-tight text-[#EDE3D2] [text-wrap:balance]">
              Calibrate your build cadence from session one.
            </h2>
            <p className="mt-2.5 text-xs leading-relaxed text-[#A69B8D]">
              Connect IDE screens, backlit key macros, and multi-device break timers behind one server-authoritative clock.
            </p>
          </div>

          <DevWorkstationPreview
            compact
            developerName={name.trim() || 'New Builder'}
            roleLabel={`${SKILL_LEVELS.find((s) => s.id === skillLevel)?.label} · ${primaryRole || 'Builder'}`}
          />
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-[#A69B8D]">
          <span>Protected by scrypt and HttpOnly token rotation</span>
          <button type="button" onClick={() => navigate('/docs')} className="text-[#E12D1C] hover:text-[#EDE3D2]">
            View security spec →
          </button>
        </div>
      </aside>

      <main className="lg:col-span-7 flex flex-col justify-center px-4 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-lg space-y-8 kinetic-enter">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to overview</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-[#E12D1C] hover:text-[#EDE3D2]"
            >
              Already have an account? Sign in
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stepTitles.map((item, idx) => {
              const sNum = (idx + 1) as 1 | 2 | 3;
              const active = step === sNum;
              const done = step > sNum;
              return (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => {
                    if (sNum < step) setStep(sNum);
                  }}
                  data-active={active}
                  className={`cadence-keycap relative rounded-xl px-4 py-3 text-left ${
                    active ? 'text-[#EDE3D2]' : done ? 'text-[#EDE3D2]/85' : 'text-[#6E655B]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.12em]">
                    <span className={active ? 'text-[#E12D1C]' : ''}>{item.num}</span>
                    {done && <Check className="h-3 w-3 text-[#E12D1C]" />}
                  </div>
                  <div className="mt-1 text-xs font-semibold">{item.label}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="pt-4 hairline-top space-y-6">
            <div className="cadence-seam">
              <h1 className="font-display text-2xl font-bold text-[#EDE3D2]">
                {step === 1 && 'Create your Cadence account'}
                {step === 2 && 'Choose your starting focus'}
                {step === 3 && 'Set passphrase and launch setup'}
              </h1>
              <p className="mt-1 text-xs text-[#A69B8D]">
                {step === 1 && 'Your display name and email used for session ownership and portfolio attribution.'}
                {step === 2 && 'You can customize your full learning track and free resource filters right after registration.'}
                {step === 3 && 'Use at least 10 characters and review our metadata-only telemetry commitment.'}
              </p>
            </div>

            {error && (
              <div role="alert" className="cadence-seam bg-[#E12D1C]/12 px-4 py-3 text-xs text-[#EDE3D2]">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="reg-name" className="block font-mono text-[11px] text-[#A69B8D]">
                    Full name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="cadence-field mt-1.5 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block font-mono text-[11px] text-[#A69B8D]">
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ada@studio.dev"
                    className="cadence-field mt-1.5 text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] py-3 text-sm font-semibold text-[#EDE3D2] hover:brightness-110 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <div className="font-mono text-[11px] text-[#A69B8D]">Current stage</div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {SKILL_LEVELS.map((lvl) => {
                      const active = skillLevel === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          data-active={active}
                          onClick={() => {
                            playTactileTick(780);
                            setSkillLevel(lvl.id);
                          }}
                          className="cadence-keycap rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[#EDE3D2]">{lvl.label}</div>
                            <div className="mt-0.5 text-[11px] text-[#A69B8D]">{lvl.desc}</div>
                          </div>
                          <span className={`font-mono text-[10px] shrink-0 ${active ? 'text-[#E12D1C]' : 'text-[#6E655B]'}`}>
                            {lvl.code}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-role" className="block font-mono text-[11px] text-[#A69B8D]">
                    Role or learning title
                  </label>
                  <input
                    id="reg-role"
                    type="text"
                    value={primaryRole}
                    onChange={(e) => setPrimaryRole(e.target.value)}
                    placeholder="Full-Stack Developer, Security Student, Freelancer..."
                    className="cadence-field mt-1.5 text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="cadence-keycap rounded-lg px-4 py-2.5 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] py-3 text-sm font-semibold text-[#EDE3D2]"
                  >
                    <span>Continue to security</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="reg-pass" className="block font-mono text-[11px] text-[#A69B8D]">
                    Passphrase (minimum 10 characters)
                  </label>
                  <input
                    id="reg-pass"
                    type="password"
                    required
                    minLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    className="cadence-field mt-1.5 text-sm"
                  />
                </div>

                <label className="cadence-seam flex items-start gap-3 py-3 text-xs text-[#A69B8D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded accent-[#E12D1C]"
                  />
                  <span>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/privacy')}
                      className="text-[#E12D1C] underline"
                    >
                      Privacy Policy
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/terms')}
                      className="text-[#E12D1C] underline"
                    >
                      Terms of Service
                    </button>
                    . Cadence stores session timings and metadata-only tool telemetry.
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="cadence-keycap rounded-lg px-4 py-2.5 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] py-3 text-sm font-semibold text-[#EDE3D2] disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{submitting ? 'Creating account...' : 'Create account and calibrate'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { login, demoLogin, navigate, searchParams } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const rawRedirect = searchParams.get('redirect') || '';
      const safeRedirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';
      navigate(user.onboardingCompleted ? safeRedirect : '/onboarding', true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (intent: string) => {
    setError('');
    setSubmitting(true);
    try {
      await demoLogin(intent);
      navigate('/dashboard', true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg lg:grid lg:grid-cols-12">
      <aside className="relative hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-b from-[#13100E] to-[#0A0908] p-10 overflow-hidden shadow-[1px_0_0_rgba(237,227,210,0.06)]">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/src/assets/images/ember_chronograph_haze_1795423374897.jpg"
            alt="Double exposure mechanical chronograph watch gears in obsidian mist"
            referrerPolicy="no-referrer"
            className="mask-fade-bottom h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0908]/88 via-[#0A0908]/68 to-[#0A0908]" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 text-sm font-bold text-[#EDE3D2]"
          >
            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-lg">Cadence</span>
          </button>
          <span className="font-mono text-xs text-[#A69B8D]">
            JWT + HttpOnly Session
          </span>
        </div>

        <div className="relative z-10 space-y-6 my-auto">
          <div className="cadence-seam">
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#EDE3D2] [text-wrap:balance]">
              Resume your live checkpoint without losing a second.
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#A69B8D]">
            Active timers, pause alarms, and IDE heartbeats live on the server. Sign in from desktop, tablet, or mobile to restore your exact state.
          </p>
          <div className="cadence-seam py-2 text-xs text-[#A69B8D] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#EDE3D2]">
              <KeyRound className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
              <span>Redirect validation active</span>
            </div>
            <p>
              Deep links validate internal paths cleanly so post-login redirects never expose external destinations.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#A69B8D]">
          Need the architectural walkthrough?{' '}
          <button type="button" onClick={() => navigate('/docs')} className="text-[#E12D1C] hover:underline">
            Read blueprint docs
          </button>
        </div>
      </aside>

      <main className="lg:col-span-7 flex flex-col justify-center px-4 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md space-y-8 kinetic-enter">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to overview</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-xs font-semibold text-[#E12D1C] hover:text-[#EDE3D2]"
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="pt-5 hairline-top space-y-6">
            <div className="cadence-seam">
              <h1 className="font-display text-3xl font-bold text-[#EDE3D2]">Sign in to Cadence</h1>
              <p className="mt-1 text-xs text-[#A69B8D]">
                Unlock your workspace, tool telemetry, and active checkpoints.
              </p>
            </div>

            {error && (
              <div role="alert" className="cadence-seam bg-[#E12D1C]/12 px-4 py-2.5 text-xs text-[#EDE3D2]">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block font-mono text-[11px] text-[#A69B8D]">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.dev"
                className="cadence-field mt-1.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block font-mono text-[11px] text-[#A69B8D]">
                Passphrase
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="cadence-field mt-1.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] py-3 text-sm font-semibold text-[#EDE3D2] hover:brightness-110 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>

          <div className="pt-6 hairline-top space-y-3">
            <div className="font-mono text-[11px] text-[#A69B8D] uppercase tracking-wider">
              Instant Demo Accounts (All Areas Filled)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'learner', label: 'Learner (Beginner)' },
                { id: 'student', label: 'Student (CS)' },
                { id: 'job_seeker', label: 'Job Seeker' },
                { id: 'freelancer', label: 'Freelancer' },
                { id: 'employed', label: 'Employed (Senior)' },
                { id: 'founder', label: 'Founder (CTO)' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDemoLogin(d.id)}
                  disabled={submitting}
                  className="cadence-keycap rounded-xl p-2.5 text-left hover:border-[#E12D1C] transition-all disabled:opacity-50"
                >
                  <div className="text-xs font-semibold text-[#EDE3D2]">{d.label}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-[#E12D1C]">1-Click Demo →</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const SignedOutPage: React.FC = () => {
  const { navigate } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src="/assets/aistudio/image_a501a49c.png"
            alt="Smoked optical glass prisms and brushed anodized steel calibration plates"
            className="mask-fade-edges h-full w-full object-cover opacity-70"
          />
          <div className="absolute bottom-4 left-2 flex items-center gap-2 font-mono text-xs text-[#E12D1C]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Session cleared and refresh cookie revoked</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="cadence-seam">
            <h1 className="font-display text-3xl font-bold text-[#EDE3D2] sm:text-4xl">
              You have signed out cleanly.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#A69B8D]">
              Your in-memory Access JWT has been cleared and your refresh cookie was revoked on the server. All completed session logs and portfolio feeds remain preserved.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2]"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign back in</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cadence-keycap inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium text-[#EDE3D2]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
              <span>Explore overview</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/docs')}
              className="cadence-keycap inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium text-[#EDE3D2]"
            >
              <FileText className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
              <span>Docs and blueprint PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------- 5-Question Level Self-Check --------------------
interface LevelCheckAnswers {
  shippingWithoutTutorials: number; // 0..2
  debuggingErrors: number; // 0..2
  deployedProjectBefore: number; // 0..2
  readingDocs: number; // 0..2
  sessionComfort: number; // 0..2
}

function evaluateLevelSelfCheck(ans: LevelCheckAnswers): {
  suggested: SkillLevelV13;
  summary: string;
} {
  const score =
    ans.shippingWithoutTutorials +
    ans.debuggingErrors +
    ans.deployedProjectBefore +
    ans.readingDocs +
    ans.sessionComfort;
  if (score <= 3) {
    return {
      suggested: 'beginner',
      summary: 'Guided 45-minute blocks with extra research time and structured checkpoint scaffolding.',
    };
  }
  if (score <= 7) {
    return {
      suggested: 'intermediate',
      summary: '90-minute balanced sprints combining build time, testing, and review.',
    };
  }
  return {
    suggested: 'advanced',
    summary: '120-minute deep-work blocks focused on execution, shipping, and deployment verification.',
  };
}

function formatPricingLabel(tier?: ToolPricingTier): string | null {
  if (!tier) return null;
  if (tier === 'free') return 'Free';
  if (tier === 'freemium') return 'Freemium';
  if (tier === 'paid') return 'Paid';
  if (tier === 'student_free') return 'Free with student pack';
  return null;
}

const ONBOARDING_STEPS = [
  { num: 1, label: 'Identity' },
  { num: 2, label: 'Direction' },
  { num: 3, label: 'Languages & budget' },
  { num: 4, label: 'Toolkit' },
  { num: 5, label: 'Learning plan' },
  { num: 6, label: 'Connect' },
];

export const OnboardingPage: React.FC = () => {
  const { user, apiFetch, refreshUser, setUser, navigate } = useAuth();
  const initialProfile = user?.profile;

  const [step, setStep] = useState<number>(() => {
    const saved = initialProfile?.onboardingStep ?? 1;
    return Math.max(1, Math.min(6, saved));
  });

  const [taxonomy, setTaxonomy] = useState<TaxonomyPayload | null>(null);
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [paths, setPaths] = useState<LearningPathRecord[]>([]);
  const [pathsLoading, setPathsLoading] = useState(false);

  // Step 1: Identity
  const [name, setName] = useState(user?.name || '');
  const [country, setCountry] = useState(initialProfile?.country || '');
  const [timezone, setTimezone] = useState(
    () => user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [contentLanguages, setContentLanguages] = useState<string[]>(
    initialProfile?.contentLanguages?.length ? initialProfile.contentLanguages : ['en']
  );

  // Step 2: Direction
  const [primaryTrack, setPrimaryTrack] = useState<TrackId>(initialProfile?.tracks?.[0] || 'fullstack');
  const [secondaryTracks, setSecondaryTracks] = useState<TrackId[]>(
    (initialProfile?.tracks || []).slice(1, 3)
  );
  const [level, setLevel] = useState<SkillLevelV13>(initialProfile?.level || 'beginner');
  const [intent, setIntent] = useState<IntentId>(initialProfile?.intent || 'learner');
  const [buildsWithAI, setBuildsWithAI] = useState<boolean>(initialProfile?.buildsWithAI ?? true);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [levelCheck, setLevelCheck] = useState<LevelCheckAnswers>({
    shippingWithoutTutorials: 0,
    debuggingErrors: 0,
    deployedProjectBefore: 0,
    readingDocs: 0,
    sessionComfort: 0,
  });

  // Step 3: Languages & Budget
  const [programmingLanguages, setProgrammingLanguages] = useState<string[]>(
    initialProfile?.programmingLanguages?.length ? initialProfile.programmingLanguages : ['ts', 'js']
  );
  const [langSearch, setLangSearch] = useState('');
  const [freeOnly, setFreeOnly] = useState<boolean>(initialProfile?.freeOnly ?? true);
  const [hasStudentDiscount, setHasStudentDiscount] = useState<boolean>(
    initialProfile?.hasStudentDiscount ?? false
  );

  // Step 4: Toolkit
  const [selectedTools, setSelectedTools] = useState<string[]>(
    user?.defaultToolSlugs?.length ? user.defaultToolSlugs : ['vscode', 'github']
  );
  const [toolsUserEdited, setToolsUserEdited] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategoryFilter, setToolCategoryFilter] = useState<ToolCategory | 'all'>('all');
  const [showAddCustomTool, setShowAddCustomTool] = useState(false);
  const [customToolName, setCustomToolName] = useState('');
  const [customToolCategory, setCustomToolCategory] = useState<ToolCategory>('dev');
  const [customToolDocsUrl, setCustomToolDocsUrl] = useState('');
  const [customToolSaving, setCustomToolSaving] = useState(false);

  // Step 5: Learning Plan & Pop-out
  const [weeklyGoalDays, setWeeklyGoalDays] = useState<number>(initialProfile?.weeklyGoal?.days ?? 3);
  const [weeklyGoalMinutes, setWeeklyGoalMinutes] = useState<number>(
    initialProfile?.weeklyGoal?.minutes ?? 135
  );
  const [weeklyGoalEdited, setWeeklyGoalEdited] = useState(false);
  const [selectedPathSlug, setSelectedPathSlug] = useState<string | null>(
    initialProfile?.selectedPathSlug ?? null
  );
  const [resourceOpenMode, setResourceOpenMode] = useState<ResourceOpenMode>(
    initialProfile?.resourceOpenMode || 'popout'
  );
  const [windowPrefs, setWindowPrefs] = useState<Record<string, WindowPref>>(
    initialProfile?.resourceWindowPrefs || {}
  );
  const [popoutStatus, setPopoutStatus] = useState<{ state: 'idle' | 'ok' | 'blocked'; message: string }>({
    state: 'idle',
    message: '',
  });

  // Step 6: Connect
  const [idePairCode, setIdePairCode] = useState<string | null>(null);
  const [chromePairCode, setChromePairCode] = useState<string | null>(null);
  const [pairingBusy, setPairingBusy] = useState<'ide' | 'chrome' | null>(null);
  const [notifStatus, setNotifStatus] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load public taxonomy and seeded/user tools
  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<TaxonomyPayload>('/api/taxonomy'),
      apiFetch<{ tools: ToolRecord[] }>('/api/tools'),
    ])
      .then(([tax, toolRes]) => {
        if (!mounted) return;
        setTaxonomy(tax);
        setTools(toolRes.tools);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [apiFetch]);

  // Apply track preset tools unless user manually customized Step 4
  useEffect(() => {
    if (!taxonomy || toolsUserEdited) return;
    const preset = taxonomy.presets[primaryTrack];
    if (!preset) return;
    const next = [...preset.tools, ...(buildsWithAI ? preset.aiBonusTools : [])];
    setSelectedTools(Array.from(new Set(next)));
    if (!initialProfile?.programmingLanguages?.length) {
      setProgrammingLanguages(preset.languages);
    }
  }, [taxonomy, primaryTrack, buildsWithAI, toolsUserEdited, initialProfile?.programmingLanguages?.length]);

  // Apply level default weekly goal unless user edited it
  useEffect(() => {
    if (!taxonomy || weeklyGoalEdited) return;
    const lvl = taxonomy.levels.find((l) => l.id === level);
    if (lvl) {
      setWeeklyGoalDays(lvl.weeklyGoal.days);
      setWeeklyGoalMinutes(lvl.weeklyGoal.minutes);
    }
  }, [taxonomy, level, weeklyGoalEdited]);

  // Fetch top 3 recommended paths on Step 5 or when preferences change
  useEffect(() => {
    if (step !== 5 && !taxonomy) return;
    let mounted = true;
    setPathsLoading(true);
    const params = new URLSearchParams({
      track: primaryTrack,
      level,
      freeOnly: String(freeOnly),
      languages: programmingLanguages.join(','),
      limit: '3',
    });
    apiFetch<{ paths: LearningPathRecord[] }>(`/api/paths?${params.toString()}`)
      .then((res) => {
        if (!mounted) return;
        setPaths(res.paths);
        if (!selectedPathSlug && res.paths.length > 0) {
          setSelectedPathSlug(res.paths[0].slug);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setPathsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [step, taxonomy, primaryTrack, level, freeOnly, programmingLanguages, apiFetch]);

  const buildOnboardingPayload = useCallback(
    (targetStep: number, extra: Record<string, unknown> = {}) => {
      const tracks = [primaryTrack, ...secondaryTracks.filter((t) => t !== primaryTrack)].slice(0, 3);
      return {
        step: targetStep,
        name: name.trim() || user?.name || 'Builder',
        country: country.trim(),
        timezone: timezone.trim() || 'UTC',
        contentLanguages,
        tracks,
        level,
        intent,
        buildsWithAI,
        programmingLanguages,
        freeOnly,
        hasStudentDiscount,
        defaultToolSlugs: selectedTools,
        weeklyGoal: {
          days: Math.max(1, Math.min(7, Number(weeklyGoalDays) || 3)),
          minutes: Math.max(30, Math.min(4200, Number(weeklyGoalMinutes) || 135)),
        },
        selectedPathSlug,
        resourceOpenMode,
        resourceWindowPrefs: windowPrefs,
        ...extra,
      };
    },
    [
      primaryTrack,
      secondaryTracks,
      name,
      user?.name,
      country,
      timezone,
      contentLanguages,
      level,
      intent,
      buildsWithAI,
      programmingLanguages,
      freeOnly,
      hasStudentDiscount,
      selectedTools,
      weeklyGoalDays,
      weeklyGoalMinutes,
      selectedPathSlug,
      resourceOpenMode,
      windowPrefs,
    ]
  );

  const persistStep = async (nextStep: number, extra: Record<string, unknown> = {}) => {
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch<{ user: typeof user; startedSessionId?: string | null }>(
        '/api/users/onboarding',
        {
          method: 'PATCH',
          body: JSON.stringify(buildOnboardingPayload(nextStep, extra)),
        }
      );
      if (res.user) {
        setUser(res.user);
      }
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save onboarding progress.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleGoStep = async (targetStep: number) => {
    if (step === 1 && !name.trim()) {
      setError('Display name is required.');
      return;
    }
    playTactileTick(780);
    const saved = await persistStep(targetStep);
    if (saved) {
      setStep(targetStep);
    }
  };

  const handleFinish = async (action: 'first_session' | 'create_project') => {
    playTactileTick(860);
    const res = await persistStep(6, { complete: true, startAction: action });
    if (!res) return;
    await refreshUser();
    if (action === 'first_session') {
      if (res.startedSessionId) {
        navigate(`/session/${res.startedSessionId}/focus`, true);
      } else {
        navigate('/sessions/new', true);
      }
    } else {
      navigate('/projects/new', true);
    }
  };

  const handleToggleContentLanguage = (code: string) => {
    playTactileTick(740);
    setContentLanguages((prev) => {
      if (prev.includes(code)) {
        return prev.length > 1 ? prev.filter((c) => c !== code) : prev;
      }
      return [...prev, code];
    });
  };

  const handleSelectPrimaryTrack = (id: TrackId) => {
    playTactileTick(780);
    setPrimaryTrack(id);
    setSecondaryTracks((prev) => prev.filter((t) => t !== id));
  };

  const handleToggleSecondaryTrack = (id: TrackId) => {
    if (id === primaryTrack) return;
    playTactileTick(740);
    setSecondaryTracks((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleToggleProgrammingLanguage = (code: string) => {
    playTactileTick(740);
    setProgrammingLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleToggleTool = (slug: string) => {
    playTactileTick(760);
    setToolsUserEdited(true);
    setSelectedTools((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleAddCustomTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToolName.trim()) return;
    setCustomToolSaving(true);
    setError('');
    try {
      const res = await apiFetch<{ tool: ToolRecord }>('/api/tools', {
        method: 'POST',
        body: JSON.stringify({
          name: customToolName.trim(),
          categories: [customToolCategory],
          docsUrl: customToolDocsUrl.trim(),
          trackingLayer: 'manual',
        }),
      });
      setTools((prev) => [res.tool, ...prev]);
      setToolsUserEdited(true);
      setSelectedTools((prev) => Array.from(new Set([...prev, res.tool.slug])));
      setCustomToolName('');
      setCustomToolDocsUrl('');
      setShowAddCustomTool(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create custom tool.');
    } finally {
      setCustomToolSaving(false);
    }
  };

  const handleTestPopout = async () => {
    playTactileTick(820);
    const width = 920;
    const height = 680;
    const left = typeof window.screenX === 'number' ? window.screenX + 60 : 80;
    const top = typeof window.screenY === 'number' ? window.screenY + 60 : 80;
    const pop = window.open(
      '',
      'cadence_resource_test',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!pop) {
      setPopoutStatus({
        state: 'blocked',
        message:
          'Pop-up blocked by browser. Allow pop-ups for this site in your browser address bar icon, then press Test pop-out again — or choose Split pane or New tab below.',
      });
      return;
    }

    try {
      pop.document.title = 'Cadence Pop-out Resource Window';
      pop.document.body.style.background = '#0A0908';
      pop.document.body.style.color = '#EDE3D2';
      pop.document.body.style.fontFamily = 'Plus Jakarta Sans, system-ui, sans-serif';
      pop.document.body.style.padding = '32px';
      pop.document.body.innerHTML =
        '<h1 style="font-size:20px;margin:0 0 12px 0;color:#EDE3D2;">Cadence Pop-out Window Ready</h1>' +
        '<p style="color:#A69B8D;font-size:14px;line-height:1.5;max-width:460px;">Place this window alongside your IDE or browser split-screen. Your focus timer remains running in the main Cadence window.</p>' +
        '<button onclick="window.close()" style="margin-top:20px;background:#E12D1C;color:#EDE3D2;border:none;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer;">Close test window</button>';
    } catch {
      // Cross-origin or sandbox restriction fallback
    }

    let screenIndex = 0;
    try {
      const winWithScreens = window as unknown as {
        getScreenDetails?: () => Promise<{ screens?: unknown[] }>;
      };
      if (typeof winWithScreens.getScreenDetails === 'function') {
        const details = await winWithScreens.getScreenDetails();
        if (details?.screens && details.screens.length > 1) {
          screenIndex = 1;
        }
      }
    } catch {
      // Multi-screen permission optional
    }

    const updatedPrefs: Record<string, WindowPref> = {
      ...windowPrefs,
      default: { width, height, screenIndex },
    };
    setWindowPrefs(updatedPrefs);
    setPopoutStatus({
      state: 'ok',
      message: `Pop-out window opened (${width}x${height}) and saved to your preferences.`,
    });
    await persistStep(step, { resourceWindowPrefs: updatedPrefs });
  };

  const handleGeneratePairCode = async (source: 'ide' | 'chrome') => {
    setPairingBusy(source);
    setError('');
    try {
      const res = await apiFetch<{ code: string }>('/api/extensions/pair-code', {
        method: 'POST',
        body: JSON.stringify({ source }),
      });
      if (source === 'ide') setIdePairCode(res.code);
      else setChromePairCode(res.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate pairing code.');
    } finally {
      setPairingBusy(null);
    }
  };

  const handleRequestNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifStatus(perm);
    }
  };

  const sortedLanguages = useMemo(() => {
    if (!taxonomy) return [];
    const q = langSearch.trim().toLowerCase();
    const filtered = taxonomy.languageCodes.filter(
      (l) => !q || l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      const aRel = a.tracks.includes(primaryTrack) ? 0 : 1;
      const bRel = b.tracks.includes(primaryTrack) ? 0 : 1;
      return aRel - bRel;
    });
  }, [taxonomy, langSearch, primaryTrack]);

  const sortedTools = useMemo(() => {
    const presetSlugs = new Set<string>([
      ...(taxonomy?.presets[primaryTrack]?.tools || []),
      ...(taxonomy?.presets[primaryTrack]?.aiBonusTools || []),
    ]);
    const q = toolSearch.trim().toLowerCase();
    const filtered = tools.filter((t) => {
      const matchesCat = toolCategoryFilter === 'all' || t.categories.includes(toolCategoryFilter);
      const matchesQuery =
        !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
    return [...filtered].sort((a, b) => {
      const aRel = presetSlugs.has(a.slug) ? 0 : 1;
      const bRel = presetSlugs.has(b.slug) ? 0 : 1;
      return aRel - bRel;
    });
  }, [tools, taxonomy, primaryTrack, toolCategoryFilter, toolSearch]);

  const selfCheckResult = evaluateLevelSelfCheck(levelCheck);

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg py-8 px-4 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Clean Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 hairline-bottom">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-lg font-bold text-[#EDE3D2]">Cadence Setup</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#E12D1C]">Step {step} of 6</span>
            {saving && <span className="font-mono text-xs text-[#A69B8D]">Saving...</span>}
          </div>
        </div>

        {/* 6-Stage Tactile Keycap Progression Rail */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {ONBOARDING_STEPS.map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num !== step) void handleGoStep(s.num);
                }}
                data-active={active}
                className={`cadence-keycap rounded-xl px-3.5 py-2.5 text-left ${
                  active ? 'text-[#EDE3D2]' : done ? 'text-[#EDE3D2]/85' : 'text-[#A69B8D]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className={active ? 'text-[#E12D1C] font-semibold' : ''}>0{s.num}</span>
                  {done && <Check className="h-3 w-3 text-[#E12D1C]" aria-hidden="true" />}
                </div>
                <div className="mt-1 text-xs font-semibold truncate">{s.label}</div>
              </button>
            );
          })}
        </div>

        {error && (
          <div role="alert" className="cadence-seam bg-[#E12D1C]/12 px-4 py-3 text-xs text-[#EDE3D2]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:divide-x lg:divide-[#EDE3D2]/[0.08]">
          {/* Left Interactive Form Stage */}
          <div className="lg:col-span-7 lg:pr-8 space-y-6">
            {/* STEP 1: Identity */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="cadence-seam">
                  <h1 className="font-display text-2xl font-bold text-[#EDE3D2]">Your identity</h1>
                  <p className="mt-1 text-xs text-[#A69B8D]">
                    Confirm your display name, location for daily midnight streak boundaries, and preferred learning content languages.
                  </p>
                </div>

                <div>
                  <label htmlFor="ob-name" className="block font-mono text-[11px] text-[#A69B8D]">
                    Display name
                  </label>
                  <input
                    id="ob-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="cadence-field mt-1.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ob-country" className="block font-mono text-[11px] text-[#A69B8D]">
                      Country (optional)
                    </label>
                    <input
                      id="ob-country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Kenya, Germany, Canada"
                      className="cadence-field mt-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ob-tz" className="block font-mono text-[11px] text-[#A69B8D]">
                      Timezone
                    </label>
                    <input
                      id="ob-tz"
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="Africa/Nairobi"
                      className="cadence-field mt-1.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="font-mono text-[11px] text-[#A69B8D]">
                    Preferred content languages
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(taxonomy?.contentLanguages || [{ code: 'en', label: 'English', coverageNote: 'Full documentation, videos, and interactive labs.' }]).map((cl) => {
                      const active = contentLanguages.includes(cl.code);
                      return (
                        <button
                          key={cl.code}
                          type="button"
                          data-active={active}
                          onClick={() => handleToggleContentLanguage(cl.code)}
                          className="cadence-keycap rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                        >
                          {cl.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#A69B8D]">
                    {taxonomy?.contentLanguages.find((c) => c.code === contentLanguages[contentLanguages.length - 1])?.coverageNote ||
                      'Free documentation coverage varies by language; English links appear where localized guides are not available.'}
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Direction */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="cadence-seam">
                  <h1 className="font-display text-2xl font-bold text-[#EDE3D2]">Your direction</h1>
                  <p className="mt-1 text-xs text-[#A69B8D]">
                    Pick your primary track, optional secondary tracks, skill level, and what brings you to Cadence.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="font-mono text-[11px] text-[#A69B8D]">Primary track (1 required)</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(taxonomy?.tracks || []).map((tr) => {
                      const active = primaryTrack === tr.id;
                      return (
                        <button
                          key={tr.id}
                          type="button"
                          data-active={active}
                          onClick={() => handleSelectPrimaryTrack(tr.id)}
                          className="cadence-keycap rounded-xl px-3.5 py-2.5 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#EDE3D2]">{tr.label}</span>
                            {active && <Check className="h-3.5 w-3.5 text-[#E12D1C] shrink-0" />}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#A69B8D] line-clamp-1">{tr.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-mono text-[11px] text-[#A69B8D]">
                    Secondary tracks (optional, up to 2)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(taxonomy?.tracks || [])
                      .filter((tr) => tr.id !== primaryTrack)
                      .map((tr) => {
                        const picked = secondaryTracks.includes(tr.id);
                        return (
                          <button
                            key={tr.id}
                            type="button"
                            data-active={picked}
                            onClick={() => handleToggleSecondaryTrack(tr.id)}
                            className="cadence-keycap rounded-lg px-3 py-1.5 text-xs text-[#EDE3D2]"
                          >
                            {tr.label}
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 hairline-top">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#A69B8D]">Skill level</span>
                    <button
                      type="button"
                      onClick={() => setShowLevelModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E12D1C] hover:text-[#EDE3D2]"
                    >
                      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Not sure?</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(taxonomy?.levels || []).map((lvl) => {
                      const active = level === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          data-active={active}
                          onClick={() => {
                            playTactileTick(760);
                            setLevel(lvl.id);
                          }}
                          className="cadence-keycap rounded-xl p-3 text-left"
                        >
                          <div className="text-xs font-semibold text-[#EDE3D2]">{lvl.label}</div>
                          <div className="mt-1 text-[11px] text-[#A69B8D]">{lvl.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 hairline-top">
                  <div className="font-mono text-[11px] text-[#A69B8D]">
                    Primary goal right now (controls your default dashboard layout)
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(taxonomy?.intents || []).map((it) => {
                      const active = intent === it.id;
                      return (
                        <button
                          key={it.id}
                          type="button"
                          data-active={active}
                          onClick={() => {
                            playTactileTick(760);
                            setIntent(it.id);
                          }}
                          className="cadence-keycap rounded-xl px-3.5 py-2.5 text-left"
                        >
                          <div className="text-xs font-semibold text-[#EDE3D2]">{it.label}</div>
                          <div className="mt-0.5 text-[11px] text-[#A69B8D]">{it.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="cadence-seam flex items-center justify-between gap-4 py-2 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-[#EDE3D2]">
                      I use AI coding or prompt tools alongside hand coding
                    </div>
                    <div className="text-[11px] text-[#A69B8D]">
                      Adds AI studio and coding-assistant tools to your track preset.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={buildsWithAI}
                    onChange={(e) => setBuildsWithAI(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#E12D1C]"
                  />
                </label>
              </div>
            )}

            {/* STEP 3: Languages and budget */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="cadence-seam">
                  <h1 className="font-display text-2xl font-bold text-[#EDE3D2]">Languages and budget</h1>
                  <p className="mt-1 text-xs text-[#A69B8D]">
                    Pick the languages you write or want to learn. Relevant languages for your track appear first.
                  </p>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#A69B8D]" aria-hidden="true" />
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Filter languages (e.g. Python, TypeScript, Go, SQL)..."
                    className="cadence-field pl-9 text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {sortedLanguages.map((lang) => {
                    const active = programmingLanguages.includes(lang.code);
                    const relevant = lang.tracks.includes(primaryTrack);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        data-active={active}
                        onClick={() => handleToggleProgrammingLanguage(lang.code)}
                        className="cadence-keycap rounded-lg px-3.5 py-2 text-xs text-[#EDE3D2] inline-flex items-center gap-1.5"
                      >
                        <span>{lang.label}</span>
                        {relevant && !active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E12D1C]" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 hairline-top space-y-4">
                  <label className="cadence-seam flex items-center justify-between gap-4 py-2 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-[#EDE3D2]">Show only free resources</div>
                      <div className="text-[11px] text-[#A69B8D]">
                        On by default. Filters learning paths and recommendations to verified free options.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={freeOnly}
                      onChange={(e) => setFreeOnly(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#E12D1C]"
                    />
                  </label>

                  <label className="cadence-seam flex items-center justify-between gap-4 py-2 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-[#EDE3D2]">
                        I have student discounts (for example GitHub Student Pack)
                      </div>
                      <div className="text-[11px] text-[#A69B8D]">
                        Includes student-free tools and education credits alongside free tiers.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasStudentDiscount}
                      onChange={(e) => setHasStudentDiscount(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#E12D1C]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* STEP 4: Toolkit */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="cadence-seam">
                    <h1 className="font-display text-2xl font-bold text-[#EDE3D2]">Your toolkit</h1>
                    <p className="mt-1 text-xs text-[#A69B8D]">
                      Pre-selected for your track. Toggle tools you use or add your own custom tool.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomTool((v) => !v)}
                    className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                    <span>Add custom tool</span>
                  </button>
                </div>

                {showAddCustomTool && (
                  <div className="cadence-seam bg-[#14110F] p-4 space-y-3">
                    <div className="text-xs font-semibold text-[#EDE3D2]">Create custom tool</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={customToolName}
                        onChange={(e) => setCustomToolName(e.target.value)}
                        placeholder="Tool name (e.g. Neovim)"
                        className="cadence-field text-xs"
                      />
                      <select
                        value={customToolCategory}
                        onChange={(e) => setCustomToolCategory(e.target.value as ToolCategory)}
                        className="cadence-field bg-[#14110F] text-xs"
                      >
                        {(taxonomy?.categories || []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customToolDocsUrl}
                        onChange={(e) => setCustomToolDocsUrl(e.target.value)}
                        placeholder="Optional docs URL (https://...)"
                        className="cadence-field flex-1 text-xs"
                      />
                      <button
                        type="button"
                        disabled={customToolSaving || !customToolName.trim()}
                        onClick={(e) => void handleAddCustomTool(e)}
                        className="rounded-lg bg-[#E12D1C] px-4 py-2 text-xs font-semibold text-[#EDE3D2] disabled:opacity-50"
                      >
                        {customToolSaving ? 'Adding...' : 'Save tool'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#A69B8D]" aria-hidden="true" />
                    <input
                      type="text"
                      value={toolSearch}
                      onChange={(e) => setToolSearch(e.target.value)}
                      placeholder="Search tools..."
                      className="cadence-field pl-9 text-xs"
                    />
                  </div>
                  <select
                    value={toolCategoryFilter}
                    onChange={(e) => setToolCategoryFilter(e.target.value as ToolCategory | 'all')}
                    className="cadence-field bg-[#14110F] text-xs sm:w-44"
                  >
                    <option value="all">All categories</option>
                    {(taxonomy?.categories || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 max-h-[380px] overflow-y-auto pr-1">
                  {sortedTools.map((tool) => {
                    const selected = selectedTools.includes(tool.slug);
                    const pricing = formatPricingLabel(tool.pricingTier);
                    return (
                      <button
                        key={tool.slug}
                        type="button"
                        data-active={selected}
                        onClick={() => handleToggleTool(tool.slug)}
                        className="cadence-keycap rounded-xl px-3.5 py-2.5 text-left text-xs"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate font-semibold text-[#EDE3D2]">{tool.name}</span>
                          {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#E12D1C]" />}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-[#A69B8D]">
                          <span className="truncate">{tool.categories.join(', ')}</span>
                          {pricing && <span className="shrink-0 font-mono text-[#EDE3D2]/80">{pricing}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: Learning plan */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="cadence-seam">
                  <h1 className="font-display text-2xl font-bold text-[#EDE3D2]">Your learning plan</h1>
                  <p className="mt-1 text-xs text-[#A69B8D]">
                    Set your weekly rhythm, pick a starter path matched to your track and budget, and test how external lessons open.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ob-goal-days" className="block font-mono text-[11px] text-[#A69B8D]">
                      Target active days / week
                    </label>
                    <input
                      id="ob-goal-days"
                      type="number"
                      min={1}
                      max={7}
                      value={weeklyGoalDays}
                      onChange={(e) => {
                        setWeeklyGoalEdited(true);
                        setWeeklyGoalDays(Math.max(1, Math.min(7, Number(e.target.value) || 1)));
                      }}
                      className="cadence-field mt-1.5 font-mono text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="ob-goal-mins" className="block font-mono text-[11px] text-[#A69B8D]">
                      Weekly focus target (minutes)
                    </label>
                    <input
                      id="ob-goal-mins"
                      type="number"
                      min={30}
                      max={4200}
                      step={15}
                      value={weeklyGoalMinutes}
                      onChange={(e) => {
                        setWeeklyGoalEdited(true);
                        setWeeklyGoalMinutes(Math.max(30, Math.min(4200, Number(e.target.value) || 90)));
                      }}
                      className="cadence-field mt-1.5 font-mono text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 hairline-top">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#A69B8D]">
                      Recommended starter paths (top 3 matches)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPathSlug(null)}
                      className="text-[11px] text-[#A69B8D] hover:text-[#EDE3D2]"
                    >
                      Clear selection
                    </button>
                  </div>

                  {pathsLoading ? (
                    <div className="h-24 bg-[#171412]/70 rounded-lg" />
                  ) : paths.length === 0 ? (
                    <div className="cadence-seam py-2 text-xs text-[#A69B8D]">
                      No exact match for these strict filters. You can skip and browse all paths in Learn later.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {paths.map((p) => {
                        const active = selectedPathSlug === p.slug;
                        return (
                          <button
                            key={p.slug}
                            type="button"
                            data-active={active}
                            onClick={() => {
                              playTactileTick(780);
                              setSelectedPathSlug(p.slug);
                            }}
                            className="cadence-keycap w-full rounded-xl p-3.5 text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#EDE3D2]">{p.title}</span>
                              <span className="font-mono text-[11px] text-[#E12D1C]">
                                {p.freeOnly ? 'Free' : 'Mixed'} · ~{p.estimatedHours}h
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#A69B8D]">{p.summary}</p>
                            <div className="mt-1.5 font-mono text-[10px] text-[#8C8175]">
                              Source: {p.sourceName} · {p.steps.length} guided steps
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 hairline-top">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-[#A69B8D]">
                      How learning resources open
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleTestPopout()}
                      className="cadence-keycap inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#EDE3D2]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" />
                      <span>Test pop-out</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {(
                      [
                        { id: 'popout', label: 'Pop-out (recommended)' },
                        { id: 'split', label: 'Split pane' },
                        { id: 'embed', label: 'Embedded view' },
                        { id: 'tab', label: 'New browser tab' },
                      ] as { id: ResourceOpenMode; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        data-active={resourceOpenMode === m.id}
                        onClick={() => setResourceOpenMode(m.id)}
                        className="cadence-keycap rounded-lg px-3 py-2 text-xs text-[#EDE3D2]"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {popoutStatus.state !== 'idle' && (
                    <div
                      className={`cadence-seam py-2 text-xs ${
                        popoutStatus.state === 'blocked' ? 'text-[#E12D1C]' : 'text-[#EDE3D2]'
                      }`}
                    >
                      {popoutStatus.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: Connect */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="cadence-seam">
                  <h1 className="font-display text-2xl font-bold text-[#EDE3D2]">Connect tools and alerts</h1>
                  <p className="mt-1 text-xs text-[#A69B8D]">
                    Optional pairing step. You can connect extensions now or skip and pair anytime from Settings.
                  </p>
                </div>

                <div className="divide-y divide-[#EDE3D2]/[0.08] hairline-top hairline-bottom">
                  <div className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#EDE3D2]">
                        <Terminal className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
                        <span>IDE Extension (VS Code, Cursor, Windsurf, Antigravity)</span>
                      </div>
                      <p className="text-xs text-[#A69B8D]">
                        Generates a 6-digit pairing code to log language and workspace heartbeats while you code.
                      </p>
                      {idePairCode && (
                        <div className="pt-1 font-mono text-sm font-bold text-[#E12D1C] tracking-[0.2em]">
                          Code: {idePairCode}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={pairingBusy === 'ide'}
                      onClick={() => void handleGeneratePairCode('ide')}
                      className="cadence-keycap rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                    >
                      {pairingBusy === 'ide' ? 'Generating...' : idePairCode ? 'Regenerate code' : 'Generate IDE code'}
                    </button>
                  </div>

                  <div className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#EDE3D2]">
                        <Chrome className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
                        <span>Chrome Companion Extension</span>
                      </div>
                      <p className="text-xs text-[#A69B8D]">
                        Times learning sites and web sandboxes you open in Chrome without reading page contents.
                      </p>
                      {chromePairCode && (
                        <div className="pt-1 font-mono text-sm font-bold text-[#E12D1C] tracking-[0.2em]">
                          Code: {chromePairCode}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={pairingBusy === 'chrome'}
                      onClick={() => void handleGeneratePairCode('chrome')}
                      className="cadence-keycap rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                    >
                      {pairingBusy === 'chrome' ? 'Generating...' : chromePairCode ? 'Regenerate code' : 'Generate Chrome code'}
                    </button>
                  </div>

                  <div className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#EDE3D2]">
                        <Bell className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
                        <span>Break and pause expiry notifications</span>
                      </div>
                      <p className="text-xs text-[#A69B8D]">
                        Status: <span className="font-mono text-[#EDE3D2]">{notifStatus}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRequestNotifications()}
                      className="cadence-keycap rounded-lg px-3.5 py-2 text-xs font-medium text-[#EDE3D2]"
                    >
                      Enable notifications
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 hairline-top">
              {step > 1 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleGoStep(step - 1)}
                  className="cadence-keycap rounded-lg px-4 py-2 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
                >
                  Back
                </button>
              ) : (
                <span />
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                {step === 5 && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleGoStep(6)}
                    className="cadence-keycap rounded-lg px-4 py-2 text-xs font-medium text-[#A69B8D] hover:text-[#EDE3D2]"
                  >
                    Skip for now
                  </button>
                )}

                {step < 6 ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleGoStep(step + 1)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] disabled:opacity-60"
                  >
                    <span>Save and continue</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleFinish('create_project')}
                      className="cadence-keycap rounded-lg px-4 py-2.5 text-xs font-medium text-[#EDE3D2]"
                    >
                      Create a project instead
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleFinish('first_session')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] disabled:opacity-60"
                    >
                      <span>{saving ? 'Starting...' : 'Start my first session'}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Workstation & Profile Summary */}
          <aside className="lg:col-span-5 lg:pl-8 space-y-6">
            <DevWorkstationPreview
              compact
              activeTools={selectedTools}
              developerName={name.trim() || user?.name || 'Builder'}
              roleLabel={`${taxonomy?.tracks.find((t) => t.id === primaryTrack)?.label || primaryTrack} · ${level}`}
            />

            <div className="pt-4 hairline-top space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#EDE3D2]">
                <UserCheck className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
                <span>Calibration summary</span>
              </div>
              <div className="flex justify-between py-1 hairline-bottom">
                <span className="text-[#A69B8D]">Primary track</span>
                <span className="font-medium text-[#EDE3D2]">
                  {taxonomy?.tracks.find((t) => t.id === primaryTrack)?.label || primaryTrack}
                </span>
              </div>
              <div className="flex justify-between py-1 hairline-bottom">
                <span className="text-[#A69B8D]">Dashboard lens</span>
                <span className="font-medium text-[#EDE3D2]">
                  {taxonomy?.intents.find((i) => i.id === intent)?.label || intent}
                </span>
              </div>
              <div className="flex justify-between py-1 hairline-bottom">
                <span className="text-[#A69B8D]">Resource filter</span>
                <span className="font-mono text-[#EDE3D2]">
                  {freeOnly ? 'Free only' : 'All pricing tiers'}
                  {hasStudentDiscount ? ' + student pack' : ''}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#A69B8D]">Toolkit bound</span>
                <span className="font-mono text-[#E12D1C] tabular-nums">{selectedTools.length} tools</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* 5-Question Skill Level Self-Check Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-check-title"
            className="w-full max-w-xl bg-[#13110F] p-6 space-y-5 hairline-top hairline-bottom max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 hairline-bottom">
              <h2 id="level-check-title" className="font-display text-lg font-bold text-[#EDE3D2]">
                5-question level self-check
              </h2>
              <button
                type="button"
                onClick={() => setShowLevelModal(false)}
                aria-label="Close self-check"
                className="p-1 text-[#A69B8D] hover:text-[#EDE3D2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {(
                [
                  {
                    key: 'shippingWithoutTutorials',
                    q: '1. Building without step-by-step tutorials',
                    opts: ['I usually follow guides line by line', 'I adapt patterns with docs', 'I architect features independently'],
                  },
                  {
                    key: 'debuggingErrors',
                    q: '2. Reading errors and stack traces',
                    opts: ['Errors feel overwhelming', 'I trace common runtime bugs', 'I isolate root causes across client and server'],
                  },
                  {
                    key: 'deployedProjectBefore',
                    q: '3. Shipping projects',
                    opts: ['Haven’t deployed a live app yet', 'Shipped 1–2 small apps', 'Maintain live multi-file builds'],
                  },
                  {
                    key: 'readingDocs',
                    q: '4. Navigating official documentation',
                    opts: ['Prefer beginner walkthroughs', 'Mix video and official docs', 'Read API references and source directly'],
                  },
                  {
                    key: 'sessionComfort',
                    q: '5. Comfortable focused block length',
                    opts: ['30–45 minutes', '60–90 minutes', '90–120+ minutes'],
                  },
                ] as const
              ).map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="font-medium text-[#EDE3D2]">{item.q}</div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    {item.opts.map((optLabel, val) => (
                      <button
                        key={val}
                        type="button"
                        data-active={levelCheck[item.key] === val}
                        onClick={() => setLevelCheck((prev) => ({ ...prev, [item.key]: val }))}
                        className="cadence-keycap rounded-lg px-2.5 py-2 text-left text-[11px] text-[#EDE3D2]"
                      >
                        {optLabel}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 hairline-top flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 text-xs">
                <div className="font-semibold text-[#EDE3D2]">
                  Suggested level: <span className="text-[#E12D1C] capitalize">{selfCheckResult.suggested}</span>
                </div>
                <div className="text-[11px] text-[#A69B8D]">{selfCheckResult.summary}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLevel(selfCheckResult.suggested);
                  setShowLevelModal(false);
                }}
                className="rounded-lg bg-[#E12D1C] px-4 py-2 text-xs font-semibold text-[#EDE3D2]"
              >
                Use {selfCheckResult.suggested}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
