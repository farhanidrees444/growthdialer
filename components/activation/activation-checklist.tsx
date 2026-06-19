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
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(39,39,42,0.7),rgba(9,9,11,0.72)_56%,rgba(6,182,212,0.08))] shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(6,182,212,0.12),transparent_32%)]"
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

          <div className="relative flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="hidden shrink-0 sm:block">
              <WorkflowIllustration scene="dialer" accent="violet" compact />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white sm:text-base">Activation path</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                {completedCount} of {totalSteps} complete ·{' '}
                {nextStep ? `Next: ${nextStep.title.toLowerCase()}` : 'Almost there'}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
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
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-300"
                aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
              >
                <ChevronRight className={cn('h-4 w-4 transition-transform', !collapsed && 'rotate-90')} />
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-300"
                aria-label="Dismiss checklist"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!collapsed && (
            <motion.ul
              className="relative divide-y divide-white/[0.05] px-2 pb-2 sm:px-3"
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
                        isNext && 'bg-white/[0.055] ring-1 ring-violet-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                      )}
                    >
                      <motion.div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                          done
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                            : isNext
                              ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                              : 'border-white/[0.08] bg-white/[0.02] text-slate-500',
                        )}
                        animate={isNext && !reduce ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                        transition={{ duration: 2.5, repeat: isNext ? Infinity : 0, ease: 'easeInOut' }}
                      >
                        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-semibold', done ? 'text-slate-500 line-through' : 'text-white')}>
                          {step.title}
                        </p>
                        <p className="text-xs text-slate-500">{step.description}</p>
                      </div>

                      {!done &&
                        (step.onAction === 'import' ? (
                          <button
                            type="button"
                            onClick={() => setImportOpen(true)}
                            className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                          >
                            {step.actionLabel}
                          </button>
                        ) : (
                          <Link
                            href={step.href}
                            className={cn(
                              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                              isNext
                                ? 'bg-zinc-100 text-zinc-950 shadow-sm hover:bg-white'
                                : 'border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]',
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
            <div className="relative grid gap-2 border-t border-white/[0.05] p-3 sm:grid-cols-2">
              <Link
                href="/recordings"
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-emerald-500/25 hover:bg-emerald-500/[0.04]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    <Mic2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Check recordings after real calls</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Playback, transcripts, and AI analysis appear for calls over 30 seconds.
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/incoming"
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-cyan-500/25 hover:bg-cyan-500/[0.04]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                    <Radio className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Keep inbound ready</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
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
