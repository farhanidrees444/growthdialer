'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap, Grid3x3, TrendingUp, Users, PhoneCall, Upload } from 'lucide-react';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { WorkflowIllustration } from '@/components/ui/workflow-illustration';
import { useLeads } from '@/contexts/leads-context';
import { cn } from '@/lib/utils';

interface BrowseStageProps {
  queueCount: number;
  hotCount: number;
  callbackCount: number;
  onStartPowerDial: () => void;
  onStartParallelDial?: () => void;
}

function getContextualSubtitle(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Your queue is ready for the morning session.';
  if (hour < 17) return 'Keep momentum — connect rate improves after lunch.';
  return 'Prioritize callbacks and hot leads in the final block.';
}

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export function BrowseStage({
  queueCount,
  hotCount,
  callbackCount,
  onStartPowerDial,
  onStartParallelDial,
}: BrowseStageProps) {
  const subtitle = useMemo(() => getContextualSubtitle(), []);
  const { setImportOpen } = useLeads();
  const reduce = useReducedMotion();

  if (queueCount === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <PremiumEmptyState
          icon={Upload}
          scene="dialer"
          title="No leads in queue"
          description="Import a CSV or add leads to start dialing. Your AI dialer will pick up automatically once the queue has contacts."
          primaryAction={{ label: 'Import leads', onClick: () => setImportOpen(true) }}
          features={[
            { icon: Zap, label: 'Power dial' },
            { icon: Grid3x3, label: 'Parallel lines' },
          ]}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full w-full flex-col items-center justify-center px-4 py-8 sm:px-6"
    >
      <motion.div
        variants={reduce ? undefined : STAGGER}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="w-full max-w-lg space-y-7 text-center"
      >
        <motion.div variants={ITEM} className="flex flex-col items-center">
          <WorkflowIllustration scene="dialer" accent="violet" className="mb-5" />
          <h2 className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
            Ready to dial
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">{subtitle}</p>
        </motion.div>

        <motion.div variants={ITEM} className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile icon={Users} label="In queue" value={queueCount} accent="violet" />
          <StatTile icon={TrendingUp} label="Hot" value={hotCount} accent="amber" />
          <StatTile icon={PhoneCall} label="Callbacks" value={callbackCount} accent="cyan" />
        </motion.div>

        <motion.div variants={ITEM} className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <motion.button
            type="button"
            onClick={onStartPowerDial}
            whileHover={reduce ? undefined : { scale: 1.02, y: -1 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-shadow hover:shadow-violet-500/35"
          >
            <Zap className="h-4 w-4" />
            Start power dial
          </motion.button>
          {onStartParallelDial && (
            <motion.button
              type="button"
              onClick={onStartParallelDial}
              whileHover={reduce ? undefined : { scale: 1.02, y: -1 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-zinc-900/80 px-6 py-3 text-sm font-medium text-zinc-200 backdrop-blur-sm transition-colors hover:border-cyan-500/25 hover:bg-zinc-800/80"
            >
              <Grid3x3 className="h-4 w-4 text-cyan-400/80" />
              Parallel dial
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent: 'violet' | 'amber' | 'cyan';
}) {
  const reduce = useReducedMotion();
  const ring =
    accent === 'violet'
      ? 'from-violet-500/20 to-transparent'
      : accent === 'amber'
        ? 'from-amber-500/20 to-transparent'
        : 'from-cyan-500/20 to-transparent';
  const iconColor =
    accent === 'violet' ? 'text-violet-400' : accent === 'amber' ? 'text-amber-400' : 'text-cyan-400';

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/60 px-3 py-3.5 text-center backdrop-blur-sm"
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-b', ring)} aria-hidden />
      <Icon className={cn('relative mx-auto mb-1.5 h-4 w-4', iconColor)} />
      <motion.p
        key={value}
        initial={reduce ? false : { scale: 0.9, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative text-2xl font-semibold tabular-nums text-zinc-50"
      >
        {value}
      </motion.p>
      <p className="relative text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
    </motion.div>
  );
}
