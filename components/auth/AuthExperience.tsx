'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  Mail,
  Lock,
  User,
  Building2,
  Shield,
  PhoneCall,
  Sparkles,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LiveWaveform, MiniWave } from '@/components/marketing/live-floor/LiveWaveform';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'signup';

const APP_ORIGIN = 'https://app.growthdialer.com';
function authCallbackUrl(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return `${window.location.origin}/auth/callback`;
  }
  return `${APP_ORIGIN}/auth/callback`;
}

const GoogleIcon = () => (
  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

function getPasswordStrength(password: string) {
  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    return { level: 3, label: 'Strong', color: '#10b981' };
  }
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { level: 2, label: 'Good', color: '#f59e0b' };
  }
  if (password.length >= 8) return { level: 1, label: 'Fair', color: '#f97316' };
  return { level: 0, label: 'Weak', color: '#ef4444' };
}

const inputClass =
  'w-full rounded-xl border border-white/[0.08] bg-black/20 py-3.5 pl-11 pr-4 text-sm text-[#F5F5F7] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-zinc-600 outline-none transition focus:border-[#8B5CF6]/45 focus:bg-black/30 focus:ring-2 focus:ring-[#8B5CF6]/15';

function AuthLogo({ className }: { className?: string }) {
  return (
    <Link href="https://growthdialer.com" className={cn('group inline-flex items-center gap-3', className)}>
      <span className="relative flex h-11 w-11 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/50 via-[#06B6D4]/30 to-[#10B981]/20 opacity-70 blur-md transition-opacity group-hover:opacity-100"
        />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-[#0a0a0c]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <MiniWave className="scale-100" />
        </span>
      </span>
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-[#F5F5F7]">
        Growth
        <span className="bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
          Dialer
        </span>
      </span>
    </Link>
  );
}

function AuthMesh() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.18),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(6,182,212,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_0%_80%,rgba(16,185,129,0.08),transparent)]" />
      <div className="absolute -left-[15%] top-[8%] h-[520px] w-[520px] rounded-full bg-[#7C3AED]/[0.14] blur-[100px]" />
      <div className="absolute -right-[10%] bottom-[5%] h-[440px] w-[440px] rounded-full bg-[#06B6D4]/[0.10] blur-[90px]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        }}
      />
    </div>
  );
}

const BENTO = [
  { icon: PhoneCall, label: 'Power dial', desc: 'Queue, parallel & local presence', color: '#06B6D4' },
  { icon: Sparkles, label: 'AI intelligence', desc: 'Summaries & sentiment after every call', color: '#A78BFA' },
  { icon: Users, label: 'Team workspaces', desc: 'Shared numbers, coaching & analytics', color: '#34D399' },
] as const;

export function AuthExperience({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const isSignup = mode === 'signup';
  const strength = getPasswordStrength(password);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', next === 'login' ? '/login' : '/signup');
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authCallbackUrl() },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isSignup && !agree) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      if (!isSignup) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else router.push('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, company },
            emailRedirectTo: authCallbackUrl(),
          },
        });
        if (error) {
          setError(error.message);
        } else if (data.session) {
          router.push('/dashboard');
        } else {
          setCheckEmail(true);
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050507] px-5 text-[#F5F5F7]">
        <AuthMesh />
        <Grain />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="relative z-10 w-full max-w-[420px] rounded-3xl border border-white/[0.09] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-10 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_100px_-24px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
        >
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#06B6D4]/25 bg-gradient-to-br from-[#06B6D4]/20 to-[#8B5CF6]/10 text-[#06B6D4] shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            <Check className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Check your email</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            We sent a confirmation link to{' '}
            <span className="font-medium text-[#F5F5F7]">{email}</span>. Click it to finish setting up
            your account.
          </p>
          <button
            type="button"
            onClick={() => {
              setCheckEmail(false);
              setMode('login');
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050507] text-[#F5F5F7]">
      <AuthMesh />
      <Grain />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* ── Brand panel ── */}
        <div className="relative hidden flex-col justify-between border-r border-white/[0.06] p-10 xl:p-14 lg:flex">
          <AuthLogo />

          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            >
              <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-2 pr-4 text-[12px] text-zinc-400 backdrop-blur-xl">
                <span className="flex items-center gap-1.5 rounded-full bg-[#06B6D4]/10 px-2 py-0.5 font-medium text-[#06B6D4]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06B6D4] opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#06B6D4]" />
                  </span>
                  Live platform
                </span>
                Built for outbound sales teams
              </span>

              <h1 className="font-display text-[clamp(2.25rem,3.8vw,3.35rem)] font-light leading-[1.04] tracking-tight">
                Close more deals
                <br />
                with{' '}
                <span className="bg-gradient-to-r from-[#C4B5FD] via-[#8B5CF6] to-[#06B6D4] bg-clip-text font-medium text-transparent">
                  every conversation
                </span>
                .
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-500">
                Record, transcribe, and analyze calls automatically — so your reps dial more and
                admin less.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {BENTO.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: EASE_OUT }}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-xl"
                  >
                    <span
                      className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06]"
                      style={{ background: `${item.color}14`, color: item.color }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <p className="text-[13px] font-semibold text-zinc-200">{item.label}</p>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-500">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.55, ease: EASE_OUT }}
              className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-5 backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#06B6D4]">
                  <span className="h-2 w-2 rounded-full bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]" />
                  Call in progress
                </span>
                <span className="rounded-md border border-white/[0.06] bg-black/20 px-2 py-0.5 font-mono text-[11px] tabular-nums text-zinc-500">
                  01:42
                </span>
              </div>
              <LiveWaveform bars={56} height={52} barWidth={2.5} gap={2.5} />
              <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-4">
                <div className="flex -space-x-2">
                  {['AR', 'JK', 'MS'].map((initials, idx) => (
                    <span
                      key={initials}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#050507] text-[9px] font-bold text-white"
                      style={{
                        background: ['#8B5CF6', '#06B6D4', '#10B981'][idx],
                      }}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <p className="text-[12px] text-zinc-500">
                  Sales teams use GrowthDialer to run their floor
                </p>
              </div>
            </motion.div>
          </div>

          <p className="text-[12px] text-zinc-600">© {new Date().getFullYear()} GrowthDialer</p>
        </div>

        {/* ── Form panel ── */}
        <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            className="w-full max-w-[420px]"
          >
            <AuthLogo className="mb-8 lg:hidden" />

            <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-white/[0.015] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_100px_-24px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />

              {/* Mode tabs */}
              <div className="mb-7 flex rounded-xl border border-white/[0.07] bg-black/25 p-1">
                {(['login', 'signup'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchMode(tab)}
                    className={cn(
                      'relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300',
                      mode === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    )}
                  >
                    {mode === tab && (
                      <motion.span
                        layoutId="auth-tab"
                        className="absolute inset-0 rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.1] to-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{tab === 'login' ? 'Sign in' : 'Sign up'}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                >
                  <h2 className="font-display text-[1.65rem] font-semibold tracking-tight">
                    {isSignup ? 'Create your account' : 'Welcome back'}
                  </h2>
                  <p className="mt-1.5 text-sm text-zinc-500">
                    {isSignup
                      ? 'Start free — no credit card required.'
                      : 'Sign in to open your workspace.'}
                  </p>
                </motion.div>
              </AnimatePresence>

              <button
                type="button"
                onClick={handleGoogle}
                className="group mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white py-3.5 text-sm font-semibold text-[#1f1f1f] shadow-[0_1px_2px_rgba(0,0,0,0.12),0_8px_24px_-8px_rgba(0,0,0,0.35)] transition hover:bg-zinc-50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_12px_32px_-8px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/[0.07]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0c0c0f] px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                    or email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence initial={false}>
                  {isSignup && (
                    <motion.div
                      key="signup-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: EASE_OUT }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <label htmlFor="name" className="mb-2 block text-xs font-medium text-zinc-400">
                          Full name
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                          <input
                            id="name"
                            type="text"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={isSignup}
                            className={inputClass}
                            placeholder="Alex Rivera"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="company" className="mb-2 block text-xs font-medium text-zinc-400">
                          Company <span className="text-zinc-600">(optional)</span>
                        </label>
                        <div className="relative">
                          <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                          <input
                            id="company"
                            type="text"
                            autoComplete="organization"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className={inputClass}
                            placeholder="Acme Corp"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-medium text-zinc-400">
                    Work email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-xs font-medium text-zinc-400">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={isSignup ? 8 : undefined}
                      className={cn(inputClass, 'pr-11')}
                      placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-500 transition-colors hover:text-zinc-300"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <AnimatePresence initial={false}>
                    {isSignup && password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2.5 flex gap-1">
                          {[0, 1, 2, 3].map((lvl) => (
                            <div
                              key={lvl}
                              className="h-1 flex-1 rounded-full transition-colors"
                              style={{
                                background: lvl <= strength.level ? strength.color : 'rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                        </div>
                        <p className="mt-1.5 text-[11px] text-zinc-500">
                          Password strength: {strength.label}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence initial={false}>
                  {isSignup && (
                    <motion.label
                      htmlFor="terms"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className="flex items-start gap-2.5 overflow-hidden text-[13px] leading-relaxed text-zinc-400"
                    >
                      <input
                        id="terms"
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/30 accent-[#8B5CF6]"
                      />
                      <span>
                        I agree to the{' '}
                        <Link
                          href="https://growthdialer.com/terms"
                          className="text-zinc-200 underline-offset-2 hover:underline"
                        >
                          Terms
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="https://growthdialer.com/privacy"
                          className="text-zinc-200 underline-offset-2 hover:underline"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </motion.label>
                  )}
                </AnimatePresence>

                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] py-3.5 text-sm font-semibold text-white shadow-[0_8px_32px_-8px_rgba(139,92,246,0.55),inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:shadow-[0_12px_40px_-8px_rgba(139,92,246,0.65)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c] disabled:opacity-60"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  {loading ? (
                    <Loader2 className="relative h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span className="relative">{isSignup ? 'Create account' : 'Sign in'}</span>
                      <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-500">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => switchMode(isSignup ? 'login' : 'signup')}
                  className="font-semibold text-[#A78BFA] transition-colors hover:text-[#C4B5FD]"
                >
                  {isSignup ? 'Sign in' : 'Start free'}
                </button>
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-600">
              <Shield className="h-3.5 w-3.5 text-zinc-500" />
              <span>Encrypted in transit · Workspace-isolated data</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
