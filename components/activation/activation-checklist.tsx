'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Check, ChevronRight, Upload, Phone, Hash, ClipboardCheck, X, Sparkles,
  Mic2, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  dismissActivationChecklist,
  isActivationDismissed,
  useActivationProgress,
  type ActivationStepId,
} from '@/hooks/use-activation-progress';
import { useLeads } from '@/contexts/leads-context';
import { WorkflowIllustration } from '@/components/ui/workflow-illustration';
import { useSiteTheme } from '@/components/theme/site-theme';

const STEPS: {
  id: ActivationStepId;
  title: string;
  description: string;
  href: string;
  icon: typeof Upload;
  actionLabel: string;
  onAction?: 'import';
}[] = [
  {
    id: 'phone_number',
    title: 'Claim a caller ID',
    description: 'Add an active line so outbound and inbound calls route correctly.',
    href: '/numbers',
    icon: Hash,
    actionLabel: 'Get a number',
  },
  {
    id: 'import_leads',
    title: 'Import your leads',
    description: 'Upload a CSV with name and phone columns, or add leads by hand.',
    href: '/leads',
    icon: Upload,
    actionLabel: 'Import CSV',
    onAction: 'import',
  },
  {
    id: 'first_call',
    title: 'Make your first call',
    description: 'Open the dialer, choose a lead, or place a manual call.',
    href: '/dialer',
    icon: Phone,
    actionLabel: 'Open dialer',
  },
  {
    id: 'first_disposition',
    title: 'Verify the outcome',
    description: 'Save a disposition; recordings and AI appear after eligible 30s+ calls.',
    href: '/dialer',
    icon: ClipboardCheck,
    actionLabel: 'Continue dialing',
  },
];

const LIST_STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const LIST_ITEM = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

export function ActivationChecklist() {
  const { loading, steps, completedCount, totalSteps } = useActivationProgress();
  const { setImportOpen } = useLeads();
  const { isDark } = useSiteTheme();
  const [dismissed, setDismissed] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setDismissed(isActivationDismissed());
  }, []);

  const allDone = completedCount === totalSteps;
  const visible = !dismissed && !allDone && !loading;

  if (!visible) return null;

  const pct = Math.round((completedCount / totalSteps) * 100);
  const nextStep = STEPS.find((s) => !steps[s.id]);

  function handleDismiss() {
    dismissActivationChecklist();
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-4 mb-4 lg:mx-6"
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-[1.5rem] border backdrop-blur-xl',
            isDark
              ? 'border-white/[0.08] bg-[linear-gradient(135deg,rgba(39,39,42,0.7),rgba(9,9,11,0.72)_56%,rgba(6,182,212,0.08))] shadow-[0_24px_90px_rgba(0,0,0,0.36)]'
              : 'border-zinc-950/[0.07] bg-[linear-gradient(135deg,#ffffff_0%,#fbfbff_55%,#f0fafb_100%)] shadow-[0_24px_70px_rgba(8,145,178,0.09),0_2px_8px_rgba(9,9,11,0.05)]',
          )}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-0',
              isDark
                ? 'bg-[radial-gradient(circle_at_10%_0%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(6,182,212,0.12),transparent_32%)]'
                : 'bg-[radial-gradient(circle_at_10%_0%,rgba(139,92,246,0.10),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(6,182,212,0.10),transparent_32%)]',
            )}
            aria-hidden
          />
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
              animate={{ opacity: [0.3, 0.75, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <div
            className={cn(
              'relative flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:px-6',
              isDark ? 'border-white/[0.06]' : 'border-zinc-950/[0.06]',
            )}
          >
            <div className="hidden shrink-0 sm:block">
              <WorkflowIllustration scene="dialer" accent="violet" compact />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className={cn('h-4 w-4', isDark ? 'text-violet-400' : 'text-violet-600')} />
                <h2 className={cn('text-sm font-bold sm:text-base', isDark ? 'text-white' : 'text-zinc-950')}>
                  Activation path
                </h2>
              </div>
              <p className={cn('mt-1 text-xs sm:text-sm', isDark ? 'text-slate-400' : 'text-zinc-500')}>
                {completedCount} of {totalSteps} complete ·{' '}
                {nextStep ? `Next: ${nextStep.title.toLowerCase()}` : 'Almost there'}
              </p>
              <div className={cn('mt-3 h-1.5 overflow-hidden rounded-full', isDark ? 'bg-white/[0.06]' : 'bg-zinc-950/[0.07]')}>
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-violet-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className={cn(
                  'rounded-lg p-1.5 transition',
                  isDark
                    ? 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'
                    : 'text-zinc-400 hover:bg-zinc-950/[0.05] hover:text-zinc-600',
                )}
                aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
              >
                <ChevronRight className={cn('h-4 w-4 transition-transform', !collapsed && 'rotate-90')} />
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className={cn(
                  'rounded-lg p-1.5 transition',
                  isDark
                    ? 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'
                    : 'text-zinc-400 hover:bg-zinc-950/[0.05] hover:text-zinc-600',
                )}
                aria-label="Dismiss checklist"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!collapsed && (
            <motion.ul
              className={cn('relative px-2 pb-2 sm:px-3', isDark ? 'divide-y divide-white/[0.05]' : 'divide-y divide-zinc-950/[0.05]')}
              variants={reduce ? undefined : LIST_STAGGER}
              initial={reduce ? false : 'hidden'}
              animate="show"
            >
              {STEPS.map((step, index) => {
                const done = steps[step.id];
                const Icon = step.icon;
                const isNext = !done && STEPS.slice(0, index).every((s) => steps[s.id]);

                return (
                  <motion.li key={step.id} variants={reduce ? undefined : LIST_ITEM}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors sm:gap-4 sm:px-4',
                        isNext &&
                          (isDark
                            ? 'bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-violet-500/20'
                            : 'bg-violet-500/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-violet-500/25'),
                      )}
                    >
                      <motion.div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                          done
                            ? isDark
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                              : 'border-emerald-600/25 bg-emerald-500/10 text-emerald-600'
                            : isNext
                              ? isDark
                                ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                                : 'border-violet-500/25 bg-violet-500/[0.08] text-violet-600'
                              : isDark
                                ? 'border-white/[0.08] bg-white/[0.02] text-slate-500'
                                : 'border-zinc-950/[0.08] bg-zinc-950/[0.02] text-zinc-400',
                        )}
                        animate={isNext && !reduce ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                        transition={{ duration: 2.5, repeat: isNext ? Infinity : 0, ease: 'easeInOut' }}
                      >
                        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            done
                              ? isDark
                                ? 'text-slate-500 line-through'
                                : 'text-zinc-400 line-through'
                              : isDark
                                ? 'text-white'
                                : 'text-zinc-900',
                          )}
                        >
                          {step.title}
                        </p>
                        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-zinc-500')}>
                          {step.description}
                        </p>
                      </div>

                      {!done &&
                        (step.onAction === 'import' ? (
                          <button
                            type="button"
                            onClick={() => setImportOpen(true)}
                            className={cn(
                              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                              isDark
                                ? 'border-white/[0.08] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                                : 'border-zinc-950/10 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50',
                            )}
                          >
                            {step.actionLabel}
                          </button>
                        ) : (
                          <Link
                            href={step.href}
                            className={cn(
                              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                              isNext
                                ? isDark
                                  ? 'bg-zinc-100 text-zinc-950 shadow-sm hover:bg-white'
                                  : 'bg-zinc-950 text-white shadow-sm hover:bg-zinc-800'
                                : isDark
                                  ? 'border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                                  : 'border border-zinc-950/10 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50',
                            )}
                          >
                            {step.actionLabel}
                          </Link>
                        ))}
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}

          {!collapsed && (
            <div
              className={cn(
                'relative grid gap-2 border-t p-3 sm:grid-cols-2',
                isDark ? 'border-white/[0.05]' : 'border-zinc-950/[0.05]',
              )}
            >
              <Link
                href="/recordings"
                className={cn(
                  'group rounded-2xl border p-3 transition',
                  isDark
                    ? 'border-white/[0.06] bg-white/[0.025] hover:border-emerald-500/25 hover:bg-emerald-500/[0.04]'
                    : 'border-zinc-950/[0.06] bg-zinc-950/[0.015] hover:border-emerald-600/25 hover:bg-emerald-500/[0.05]',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                      isDark
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-emerald-600/20 bg-emerald-500/[0.08] text-emerald-600',
                    )}
                  >
                    <Mic2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-zinc-900')}>
                      Check recordings after real calls
                    </p>
                    <p className={cn('mt-1 text-xs leading-relaxed', isDark ? 'text-slate-500' : 'text-zinc-500')}>
                      Playback, transcripts, and AI analysis appear for calls over 30 seconds.
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/incoming"
                className={cn(
                  'group rounded-2xl border p-3 transition',
                  isDark
                    ? 'border-white/[0.06] bg-white/[0.025] hover:border-cyan-500/25 hover:bg-cyan-500/[0.04]'
                    : 'border-zinc-950/[0.06] bg-zinc-950/[0.015] hover:border-cyan-600/25 hover:bg-cyan-500/[0.05]',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                      isDark
                        ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
                        : 'border-cyan-600/20 bg-cyan-500/[0.08] text-cyan-600',
                    )}
                  >
                    <Radio className="h-4 w-4" />
                  </span>
                  <div>
                    <p className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-zinc-900')}>
                      Keep inbound ready
                    </p>
                    <p className={cn('mt-1 text-xs leading-relaxed', isDark ? 'text-slate-500' : 'text-zinc-500')}>
                      Leave browser voice ready and confirm your line routing before receiving calls.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
