'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Check, Loader2, Sparkles, Users, BarChart3, Headphones,
  ArrowRight, Building2, Shield,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import type { Workspace } from '@/contexts/workspace-context';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { BrandLogo } from '@/components/ui/brand-logo';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';
import { cn } from '@/lib/utils';

const PLAN_OPTIONS = [
  {
    id: 'free' as const,
    label: 'Starter',
    price: '$0',
    period: 'forever',
    seats: '1 seat',
    tagline: 'Solo rep getting started',
    icon: Zap,
    accent: 'from-slate-500/30 to-slate-600/10',
    ring: 'ring-emerald-500/40',
    features: ['Power dialer', 'Call recordings', 'Lead import', 'Basic analytics'],
  },
  {
    id: 'pro' as const,
    label: 'Pro',
    price: '$49',
    period: '/mo',
    seats: 'Up to 3 seats',
    tagline: 'Small team closing deals',
    icon: Sparkles,
    accent: 'from-violet-600/35 to-indigo-600/15',
    ring: 'ring-violet-500/50',
    badge: 'Most popular',
    features: ['AI call briefs', 'Live coaching', 'Team analytics', 'Priority support'],
  },
  {
    id: 'team' as const,
    label: 'Team',
    price: '$99',
    period: '/mo',
    seats: 'Up to 10 seats',
    tagline: 'Scale outbound with managers',
    icon: Users,
    accent: 'from-emerald-600/30 to-teal-600/12',
    ring: 'ring-emerald-500/40',
    features: ['Full coaching suite', 'Workspace analytics', 'Role permissions', 'Custom integrations'],
  },
];

const STEPS = ['Name your workspace', 'Choose your plan', 'Launch'];

function friendlyError(message: string) {
  if (/infinite recursion/i.test(message)) {
    return 'Database policy conflict — our team has shipped a fix. Refresh and try again in 60 seconds.';
  }
  return message;
}

function previewSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base ? `${base}.growthdialer.com` : 'your-team.growthdialer.com';
}

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const { refreshWorkspaces, setCurrentWorkspace } = useWorkspace();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | 'team'>('pro');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const slugPreview = useMemo(() => previewSlug(name), [name]);
  const canAdvance = step === 0 ? name.trim().length >= 2 : true;

  async function handleCreate() {
    if (!name.trim()) {
      setError('Enter a workspace name (at least 2 characters)');
      setStep(0);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), plan }),
      });
      const data = await res.json() as { workspace?: Workspace; error?: string };
      if (!res.ok) {
        setError(friendlyError(data.error ?? 'Failed to create workspace'));
        return;
      }
      if (data.workspace) {
        await refreshWorkspaces();
        await setCurrentWorkspace(data.workspace);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : 'Unexpected error'));
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (step === 0 && !canAdvance) {
      setError('Enter a workspace name (at least 2 characters)');
      return;
    }
    setError('');
    if (step < 1) setStep(step + 1);
    else void handleCreate();
  }

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#050508] text-[#F5F5F7]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Grain />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-emerald-600/10 blur-[100px]" />
      </div>

      <header className="relative z-10 flex shrink-0 items-center justify-between px-5 py-4 sm:px-10 sm:py-5">
        <BrandLogo showText size="auth" />
        <div className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
          <Shield className="h-3.5 w-3.5" />
          SOC2-ready infrastructure
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col justify-start px-4 pb-12 pt-2 sm:justify-center sm:px-6 sm:pb-16 sm:pt-4">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-center gap-2 sm:mb-10 sm:gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 sm:gap-3">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 sm:h-8 sm:w-8',
                  i <= step
                    ? 'bg-gradient-to-br from-emerald-500 to-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'border border-white/10 bg-white/[0.03] text-zinc-500',
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('hidden text-xs font-medium sm:inline', i <= step ? 'text-zinc-300' : 'text-zinc-600')}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px w-5 sm:w-12', i < step ? 'bg-emerald-500/50' : 'bg-white/10')} />
              )}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="border-b border-white/[0.06] bg-gradient-to-r from-white/[0.04] to-transparent px-5 py-4 sm:px-8 sm:py-5">
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
              {step === 0 ? 'Name your workspace' : 'Pick the right plan'}
            </h1>
            <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
              {step === 0
                ? 'This is your team’s home base — leads, calls, recordings, and coaching live here.'
                : 'Start free or unlock AI coaching. Upgrade or downgrade anytime.'}
            </p>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div
                  key="step-name"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="ws-name" className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      Workspace name
                    </label>
                    <input
                      id="ws-name"
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      placeholder="Acme Sales Team"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-zinc-600 outline-none transition focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20"
                      onKeyDown={(e) => e.key === 'Enter' && canAdvance && next()}
                      autoFocus
                    />
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {slugPreview}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { icon: Headphones, label: 'Shared dialer', desc: 'One queue for your team' },
                      { icon: BarChart3, label: 'Live analytics', desc: 'Connect rate & pipeline' },
                      { icon: Users, label: 'Invite reps', desc: 'Roles & permissions' },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <Icon className="mb-2 h-4 w-4 text-violet-400" />
                        <p className="text-xs font-semibold text-zinc-200">{label}</p>
                        <p className="text-[11px] text-zinc-500">{desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step-plan"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-3 sm:grid-cols-3 sm:gap-4"
                >
                  {PLAN_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = plan === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPlan(opt.id)}
                        className={cn(
                          'relative rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5',
                          'hover:border-white/20 hover:bg-white/[0.04]',
                          selected
                            ? cn('border-transparent bg-gradient-to-br ring-2', opt.accent, opt.ring)
                            : 'border-white/[0.08] bg-white/[0.02]',
                        )}
                      >
                        {opt.badge && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            {opt.badge}
                          </span>
                        )}
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          {selected && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white">{opt.price}</span>
                          <span className="text-xs text-zinc-500">{opt.period}</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-white">{opt.label}</p>
                        <p className="text-[11px] text-zinc-500">{opt.tagline}</p>
                        <p className="mt-2 text-xs font-medium text-emerald-400/90">{opt.seats}</p>
                        <ul className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                          {opt.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-[11px] text-zinc-400">
                              <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] bg-black/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <button
              type="button"
              onClick={() => { setError(''); setStep(Math.max(0, step - 1)); }}
              disabled={step === 0 || busy}
              className="min-h-11 text-sm font-medium text-zinc-500 transition hover:text-zinc-300 disabled:invisible sm:min-h-0"
            >
              Back
            </button>
            <motion.button
              type="button"
              onClick={next}
              disabled={busy || (step === 0 && !canAdvance)}
              whileHover={!busy && canAdvance ? { scale: 1.01 } : {}}
              whileTap={!busy && canAdvance ? { scale: 0.99 } : {}}
              className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #7C3AED 100%)' }}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating workspace…
                </>
              ) : step === 1 ? (
                <>
                  Launch workspace
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          No credit card for Starter · Change plan or invite teammates anytime from Settings
        </p>
      </main>
    </div>
  );
}
