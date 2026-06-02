'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff, Check, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LiveWaveform, MiniWave } from '@/components/marketing/live-floor/LiveWaveform';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

type Mode = 'login' | 'signup';

// OAuth/email callbacks must always land on the app subdomain so the code
// exchange and session cookies happen there (never on the marketing apex).
// Localhost is preserved for local development.
const APP_ORIGIN = 'https://app.growthdialer.com';
function authCallbackUrl(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return `${window.location.origin}/auth/callback`;
  }
  return `${APP_ORIGIN}/auth/callback`;
}

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 11.7S6.9 21 12 21c5.3 0 8.8-3.7 8.8-9 0-.6-.06-1-.15-1.5H12z" />
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
  'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-[hsl(200,7%,96%)] placeholder:text-zinc-600 outline-none transition focus:border-[hsl(258,90%,66%)]/50 focus:ring-2 focus:ring-[hsl(258,90%,66%)]/20';

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

  function toggleMode() {
    const next: Mode = isSignup ? 'login' : 'signup';
    setMode(next);
    setError(null);
    // Reflect the route in the address bar without a reload (keeps the morph smooth)
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
          // Email confirmation disabled — session is live, go straight in
          router.push('/dashboard');
        } else {
          // Email confirmation required — show the check-email screen
          setCheckEmail(true);
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  // ── Check-email success state ───────────────────────────────────────────
  if (checkEmail) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(200,50%,3%)] px-5 text-[hsl(200,7%,96%)']">
        <Grain />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(186,100%,42%)]/10 text-[hsl(186,100%,42%)']">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="font-display text-2xl font-medium tracking-tight">Check your email</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            We sent a confirmation link to{' '}
            <span className="text-[hsl(200,7%,96%)']">{email}</span>. Click it to finish setting up your
            account.
          </p>
          <button
            type="button"
            onClick={() => { setCheckEmail(false); setMode('login'); }}
            className="mt-7 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-[hsl(200,7%,96%)']"
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main split experience ───────────────────────────────────────────────
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[hsl(200,50%,3%)] text-[hsl(200,7%,96%)'] lg:grid-cols-2">
      <Grain />

      {/* ── Left: brand + living waveform (lg+) ── */}
      <div className="relative hidden overflow-hidden border-r border-white/[0.06] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[480px] w-[480px] -translate-x-1/3 -translate-y-1/3 rounded-full opacity-[0.10] blur-[120px]"
          style={{ background: 'radial-gradient(circle, hsl(258,90%,66%) 0%, transparent 70%)' }}
        />
        <Link href="https://growthdialer.com" className="relative z-10 inline-flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
            <MiniWave className="scale-90" />
          </span>
          <span className="text-[15px] font-medium tracking-tight">GrowthDialer</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1 pl-2 pr-3 text-[12px] text-zinc-400 backdrop-blur-xl">
            <span className="flex items-center gap-1.5 text-[hsl(186,100%,42%)']">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(186,100%,42%)'] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(186,100%,42%)']" />
              </span>
              Live
            </span>
            AI Sales Dialer
          </span>
          <h1 className="font-display text-[clamp(2rem,3.4vw,3rem)] font-light leading-[1.02] tracking-tight">
            Every call,
            <br />
            <span className="font-medium">understood</span> the
            <br />
            moment it ends.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-zinc-400">
            Record, transcribe and analyze every conversation — summaries, sentiment and next
            steps, automatically.
          </p>
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-[hsl(186,100%,42%)']">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(186,100%,42%)']" /> On call
              </span>
              <span className="font-mono text-xs tabular-nums text-zinc-600">01:42</span>
            </div>
            <LiveWaveform bars={56} height={56} barWidth={2.5} gap={2.5} />
          </div>
        </div>

        <p className="relative z-10 text-[12px] text-zinc-600">
          © {new Date().getFullYear()} GrowthDialer
        </p>
      </div>

      {/* ── Right: floating form (no card box) ── */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <Link href="https://growthdialer.com" className="mb-10 inline-flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
              <MiniWave className="scale-90" />
            </span>
            <span className="text-[15px] font-medium tracking-tight">GrowthDialer</span>
          </Link>

          {/* Morphing header */}
          <div className="mb-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                <h2 className="font-display text-2xl font-medium tracking-tight">
                  {isSignup ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {isSignup
                    ? 'Start free — no credit card required.'
                    : 'Sign in to your GrowthDialer account.'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(258,90%,66%)']/40"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[hsl(200,50%,3%)'] px-3 text-[11px] uppercase tracking-widest text-zinc-600">
                or
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name slides in for sign-up */}
            <AnimatePresence initial={false}>
              {isSignup && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Full name
                    </label>
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
                  <div>
                    <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Company <span className="text-zinc-600">(optional)</span>
                    </label>
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
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Work email
              </label>
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

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isSignup ? 8 : undefined}
                  className={`${inputClass} pr-11`}
                  placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength meter — sign-up only */}
              <AnimatePresence initial={false}>
                {isSignup && password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex gap-1">
                      {[0, 1, 2, 3].map((lvl) => (
                        <div
                          key={lvl}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{ background: lvl <= strength.level ? strength.color : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-zinc-500">Password strength: {strength.label}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Terms — sign-up only */}
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
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.03] accent-[hsl(258,90%,66%)']"
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="https://growthdialer.com/terms" className="text-zinc-200 underline-offset-2 hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link href="https://growthdialer.com/privacy" className="text-zinc-200 underline-offset-2 hover:underline">Privacy Policy</Link>.
                  </span>
                </motion.label>
              )}
            </AnimatePresence>

            {error && (
              <p className="text-sm text-red-400" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white transition-all hover:bg-violet-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(258,90%,66%)']/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isSignup ? 'Create account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Morphing toggle */}
          <p className="mt-7 text-center text-sm text-zinc-500">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium text-[hsl(258,90%,66%)'] transition-colors hover:text-[#A78BFA]"
            >
              {isSignup ? 'Sign in' : 'Start free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
