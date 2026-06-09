'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Check, ChevronRight, Upload, Phone, Hash, ClipboardCheck, X, Sparkles,
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
    id: 'import_leads',
    title: 'Import your leads',
    description: 'Upload a CSV or add contacts — your queue lives here.',
    href: '/leads',
    icon: Upload,
    actionLabel: 'Import CSV',
    onAction: 'import',
  },
  {
    id: 'phone_number',
    title: 'Claim a caller ID',
    description: 'Buy or assign a number so prospects see a local line.',
    href: '/numbers',
    icon: Hash,
    actionLabel: 'Get a number',
  },
  {
    id: 'first_call',
    title: 'Make your first call',
    description: 'Pick a lead from the queue and dial in one click.',
    href: '/dialer',
    icon: Phone,
    actionLabel: 'Open dialer',
  },
  {
    id: 'first_disposition',
    title: 'Log a disposition',
    description: 'Mark the outcome — we update lead status and analytics automatically.',
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
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 shadow-xl shadow-black/25 backdrop-blur-md">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/[0.1] via-transparent to-cyan-500/[0.06]"
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
                <h2 className="text-sm font-bold text-white sm:text-base">Get started in minutes</h2>
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
                        isNext && 'bg-white/[0.04] ring-1 ring-violet-500/15',
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
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
