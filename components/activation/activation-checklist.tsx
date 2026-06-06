'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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

export function ActivationChecklist() {
  const { loading, steps, completedCount, totalSteps } = useActivationProgress();
  const { setImportOpen } = useLeads();
  const [dismissed, setDismissed] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

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
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mx-4 mb-4 lg:mx-6"
      >
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-600/[0.08] via-white/[0.02] to-emerald-600/[0.06] shadow-xl shadow-black/20 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white sm:text-base">Get started in minutes</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                {completedCount} of {totalSteps} complete · {nextStep ? `Next: ${nextStep.title.toLowerCase()}` : 'Almost there'}
              </p>
            </div>
            <div className="flex items-center gap-1">
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

          <div className="px-5 py-3 sm:px-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {!collapsed && (
            <ul className="divide-y divide-white/[0.05] px-2 pb-2 sm:px-3">
              {STEPS.map((step, index) => {
                const done = steps[step.id];
                const Icon = step.icon;
                const isNext = !done && STEPS.slice(0, index).every((s) => steps[s.id]);

                return (
                  <li key={step.id}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors sm:gap-4 sm:px-4',
                        isNext && 'bg-white/[0.04]',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                          done
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                            : isNext
                              ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                              : 'border-white/[0.08] bg-white/[0.02] text-slate-500',
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-semibold', done ? 'text-slate-500 line-through' : 'text-white')}>
                          {step.title}
                        </p>
                        <p className="text-xs text-slate-500">{step.description}</p>
                      </div>

                      {!done && (
                        step.onAction === 'import' ? (
                          <button
                            type="button"
                            onClick={() => setImportOpen(true)}
                            className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                          >
                            {step.actionLabel}
                          </button>
                        ) : (
                          <Link
                            href={step.href}
                            className={cn(
                              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                              isNext
                                ? 'bg-gradient-to-r from-emerald-600 to-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]',
                            )}
                          >
                            {step.actionLabel}
                          </Link>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
