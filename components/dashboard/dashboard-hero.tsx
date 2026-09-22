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

export function DashboardHero({ greeting, firstName, dateStr }: DashboardHeroProps) {
  const reduce = useReducedMotion();
  const { setImportOpen } = useLeads();
  const { isDark } = useSiteTheme();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative px-4 pb-4 pt-5 lg:px-6 lg:pb-5 lg:pt-6"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-[1.75rem] border p-5 backdrop-blur-xl lg:p-6',
          isDark
            ? 'border-white/[0.08] bg-[linear-gradient(135deg,rgba(24,24,27,0.88),rgba(9,9,11,0.72)_48%,rgba(88,28,135,0.16))] shadow-[0_24px_90px_rgba(0,0,0,0.42)]'
            : 'border-zinc-950/[0.07] bg-[linear-gradient(135deg,#ffffff_0%,#fbfbff_48%,#f4f1ff_100%)] shadow-[0_24px_70px_rgba(76,29,149,0.10),0_2px_8px_rgba(9,9,11,0.05)]',
        )}
      >
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 bg-[size:auto,auto,72px_72px,72px_72px]',
            isDark
              ? 'bg-[radial-gradient(circle_at_12%_12%,rgba(139,92,246,0.28),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(6,182,212,0.16),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]'
              : 'bg-[radial-gradient(circle_at_12%_12%,rgba(139,92,246,0.13),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(6,182,212,0.11),transparent_34%),linear-gradient(90deg,rgba(9,9,11,0.045)_1px,transparent_1px),linear-gradient(rgba(9,9,11,0.035)_1px,transparent_1px)]',
          )}
        />
        <div
          className={cn(
            'pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full blur-3xl',
            isDark ? 'bg-violet-500/20' : 'bg-violet-400/25',
          )}
          aria-hidden
        />
        <div
          className={cn(
            'pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent to-transparent',
            isDark ? 'via-cyan-300/40' : 'via-violet-400/50',
          )}
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div
              className={cn(
                'mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]',
                isDark
                  ? 'border-white/[0.08] bg-white/[0.045] text-zinc-400'
                  : 'border-violet-500/20 bg-violet-500/[0.07] text-violet-700',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
              Revenue command center
            </div>
            <h1
              className={cn(
                'text-[clamp(2rem,4vw,3.75rem)] font-light leading-[0.98] tracking-[-0.055em]',
                isDark ? 'text-white' : 'text-zinc-950',
              )}
            >
              {greeting}
              {firstName ? ', ' : ''}
              <span
                className={cn(
                  'bg-gradient-to-r bg-clip-text font-semibold text-transparent',
                  isDark
                    ? 'from-white via-violet-100 to-cyan-200'
                    : 'from-violet-700 via-violet-600 to-cyan-600',
                )}
              >
                {firstName}
              </span>
            </h1>
            <p
              className={cn(
                'mt-3 max-w-2xl text-sm leading-relaxed sm:text-[15px]',
                isDark ? 'text-slate-400' : 'text-zinc-500',
              )}
            >
              {dateStr}. Your calls, leads, recordings, number health, and next actions are ready in one premium control room.
            </p>
            {!reduce && (
              <motion.div
                aria-hidden
                className={cn(
                  'mt-5 h-px max-w-[260px] bg-gradient-to-r to-transparent',
                  isDark ? 'from-violet-400/70 via-cyan-300/40' : 'from-violet-500/60 via-cyan-500/40',
                )}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'left' }}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link
              href="/dialer"
              className={
                isDark
                  ? 'group inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-zinc-950 shadow-[0_0_30px_rgba(255,255,255,0.12)] transition hover:bg-zinc-100'
                  : 'group inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#09090b] px-3.5 py-2 text-xs font-bold text-white shadow-[0_10px_30px_rgba(9,9,11,0.25)] transition hover:bg-[#27272a]'
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
                  : 'border-zinc-950/10 bg-white text-zinc-700 shadow-[0_1px_2px_rgba(9,9,11,0.05)] hover:border-violet-500/30 hover:bg-violet-50/60',
              )}
            >
              <Upload className={cn('h-4 w-4', isDark ? 'text-violet-300' : 'text-violet-600')} />
              Import leads
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid gap-2 sm:grid-cols-3">
          {[
            { icon: Sparkles, label: 'AI summaries', value: 'Auto after calls' },
            { icon: Zap, label: 'Power dialer', value: 'Queue ready' },
            { icon: Phone, label: 'Inbound', value: 'Browser ringing' },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className={cn(
                'rounded-2xl border px-4 py-3',
                isDark
                  ? 'border-white/[0.07] bg-black/20'
                  : 'border-zinc-950/[0.06] bg-white/70 shadow-[0_1px_2px_rgba(9,9,11,0.04)]',
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('h-3.5 w-3.5', isDark ? 'text-violet-300' : 'text-violet-600')} />
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
                  {label}
                </p>
              </div>
              <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-zinc-100' : 'text-zinc-900')}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
