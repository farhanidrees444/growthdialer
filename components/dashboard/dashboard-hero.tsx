'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Phone, Sparkles, Upload, Zap } from 'lucide-react';
import { useLeads } from '@/contexts/leads-context';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';

interface DashboardHeroProps {
  greeting: string;
  firstName: string;
  dateStr: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const MINI_CARDS = [
  { icon: Sparkles, label: 'AI summaries', value: 'Auto after calls', accent: 'violet', live: false },
  { icon: Zap, label: 'Power dialer', value: 'Queue ready', accent: 'cyan', live: false },
  { icon: Phone, label: 'Inbound', value: 'Browser ringing', accent: 'emerald', live: true },
] as const;

const ACCENT_TILE: Record<string, string> = {
  violet: 'bg-violet-600/10 text-violet-600',
  cyan: 'bg-cyan-600/10 text-cyan-600',
  emerald: 'bg-emerald-600/10 text-emerald-600',
};

const ACCENT_TILE_DARK: Record<string, string> = {
  violet: 'bg-violet-400/10 text-violet-300',
  cyan: 'bg-cyan-400/10 text-cyan-300',
  emerald: 'bg-emerald-400/10 text-emerald-300',
};

export function DashboardHero({ greeting, firstName, dateStr }: DashboardHeroProps) {
  const reduce = useReducedMotion();
  const { setImportOpen } = useLeads();
  const { isDark } = useSiteTheme();

  return (
    <motion.div
      variants={container}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className="relative px-4 pb-4 pt-5 lg:px-6 lg:pb-5 lg:pt-6"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-[1.75rem] border p-5 backdrop-blur-xl lg:p-6',
          isDark
            ? 'border-white/[0.08] bg-[linear-gradient(135deg,rgba(24,24,27,0.88),rgba(9,9,11,0.72)_48%,rgba(88,28,135,0.16))] shadow-[0_24px_90px_rgba(0,0,0,0.42)]'
            : 'border-zinc-950/[0.07] bg-[linear-gradient(135deg,#ffffff_0%,#fafaff_42%,#f3f0ff_78%,#eefbff_100%)] shadow-[0_24px_70px_rgba(76,29,149,0.12),0_2px_8px_rgba(9,9,11,0.05)]',
        )}
      >
        {/* fine grid */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 bg-[size:auto,auto,72px_72px,72px_72px]',
            isDark
              ? 'bg-[radial-gradient(circle_at_12%_12%,rgba(139,92,246,0.28),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(6,182,212,0.16),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]'
              : 'bg-[radial-gradient(circle_at_10%_8%,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_90%_6%,rgba(6,182,212,0.14),transparent_36%),radial-gradient(circle_at_50%_110%,rgba(16,185,129,0.08),transparent_40%),linear-gradient(90deg,rgba(9,9,11,0.045)_1px,transparent_1px),linear-gradient(rgba(9,9,11,0.035)_1px,transparent_1px)]',
          )}
        />
        {/* drifting ambient orbs — same motion on desktop + mobile */}
        <div
          aria-hidden
          className={cn(
            'hero-orb-a pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full blur-3xl',
            isDark ? 'bg-violet-500/20' : 'bg-violet-400/25',
          )}
        />
        <div
          aria-hidden
          className={cn(
            'hero-orb-b pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full blur-3xl',
            isDark ? 'bg-cyan-400/10' : 'bg-cyan-300/20',
          )}
        />
        {/* animated shine sweep across the top hairline */}
        <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px overflow-hidden">
          <div
            className={cn(
              'h-full w-1/3 bg-gradient-to-r from-transparent to-transparent',
              isDark ? 'via-violet-300/50' : 'via-violet-500/40',
              'hero-shine',
            )}
          />
        </div>
        <div
          className={cn(
            'pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent to-transparent',
            isDark ? 'via-cyan-300/40' : 'via-violet-400/50',
          )}
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <motion.div
              variants={item}
              className={cn(
                'mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]',
                isDark
                  ? 'border-white/[0.08] bg-white/[0.045] text-zinc-400'
                  : 'border-violet-500/20 bg-white/70 text-violet-700 shadow-[0_1px_2px_rgba(9,9,11,0.05)] backdrop-blur',
              )}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
              </span>
              Revenue command center
            </motion.div>
            <motion.h1
              variants={item}
              className={cn(
                'text-[clamp(2rem,4vw,3.75rem)] font-light leading-[0.98] tracking-[-0.055em]',
                isDark ? 'text-white' : 'text-zinc-950',
              )}
            >
              {greeting}
              {firstName ? ', ' : ''}
              <span
                className={cn(
                  'hero-name-pan bg-gradient-to-r bg-clip-text font-semibold text-transparent',
                  isDark
                    ? 'from-white via-violet-100 to-cyan-200'
                    : 'from-violet-700 via-fuchsia-600 to-cyan-600',
                )}
              >
                {firstName}
              </span>
            </motion.h1>
            <motion.p
              variants={item}
              className={cn(
                'mt-3 max-w-2xl text-sm leading-relaxed sm:text-[15px]',
                isDark ? 'text-slate-400' : 'text-zinc-500',
              )}
            >
              {dateStr}. Your calls, leads, recordings, number health, and next actions are ready in one premium control room.
            </motion.p>
            {!reduce && (
              <motion.div
                aria-hidden
                variants={item}
                className={cn(
                  'mt-5 h-px max-w-[260px] bg-gradient-to-r to-transparent',
                  isDark ? 'from-violet-400/70 via-cyan-300/40' : 'from-violet-500/60 via-cyan-500/40',
                )}
                style={{ transformOrigin: 'left' }}
              />
            )}
          </div>

          <motion.div variants={item} className="flex flex-wrap gap-2 lg:justify-end">
            <Link
              href="/dialer"
              className={
                isDark
                  ? 'group inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-zinc-950 shadow-[0_0_30px_rgba(255,255,255,0.12)] transition hover:bg-zinc-100'
                  : 'group inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#09090b] px-3.5 py-2 text-xs font-bold text-white shadow-[0_10px_30px_rgba(9,9,11,0.25)] transition hover:bg-[#27272a] hover:shadow-[0_14px_36px_rgba(9,9,11,0.3)]'
              }
            >
              <Phone className="h-4 w-4" />
              Start dialing
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition',
                isDark
                  ? 'border-white/[0.10] bg-white/[0.05] text-zinc-200 hover:border-violet-400/35 hover:bg-white/[0.08]'
                  : 'border-zinc-950/10 bg-white/80 text-zinc-700 shadow-[0_1px_2px_rgba(9,9,11,0.05)] backdrop-blur hover:border-violet-500/30 hover:bg-violet-50/60',
              )}
            >
              <Upload className={cn('h-4 w-4', isDark ? 'text-violet-300' : 'text-violet-600')} />
              Import leads
            </button>
          </motion.div>
        </div>

        <div className="relative mt-6 grid gap-2.5 sm:grid-cols-3">
          {MINI_CARDS.map(({ icon: Icon, label, value, accent, live }) => (
            <motion.div
              key={label}
              variants={item}
              whileHover={reduce ? undefined : { y: -3 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'group rounded-2xl border p-4 backdrop-blur-md transition-shadow',
                isDark
                  ? 'border-white/[0.07] bg-black/20 hover:border-white/[0.12] hover:shadow-[0_18px_50px_rgba(0,0,0,0.45)]'
                  : 'border-zinc-950/[0.06] bg-white/75 shadow-[0_8px_24px_-12px_rgba(9,9,11,0.12)] hover:border-violet-500/20 hover:shadow-[0_16px_40px_-12px_rgba(76,29,149,0.22)]',
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl',
                    isDark ? ACCENT_TILE_DARK[accent] : ACCENT_TILE[accent],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className={cn('text-[11px] font-semibold uppercase tracking-[0.13em]', isDark ? 'text-zinc-400' : 'text-zinc-500')}>
                  {label}
                </p>
                {live && (
                  <span className="relative ml-auto flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
              </div>
              <p className={cn('mt-2.5 text-sm font-semibold', isDark ? 'text-zinc-100' : 'text-zinc-900')}>
                {value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
