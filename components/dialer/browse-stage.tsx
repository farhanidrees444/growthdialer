'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap, Grid3x3, TrendingUp, Users, PhoneCall, Upload } from 'lucide-react';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { WorkflowIllustration } from '@/components/ui/workflow-illustration';
import { useLeads } from '@/contexts/leads-context';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';

interface BrowseStageProps {
  queueCount: number;
  hotCount: number;
  callbackCount: number;
  onStartPowerDial: () => void;
  onStartParallelDial?: () => void;
  onOpenManualDial?: () => void;
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
  onOpenManualDial,
}: BrowseStageProps) {
  const subtitle = useMemo(() => getContextualSubtitle(), []);
  const { setImportOpen } = useLeads();
  const { isDark } = useSiteTheme();
  const reduce = useReducedMotion();

  if (queueCount === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <PremiumEmptyState
          icon={Upload}
          scene="dialer"
          title="No leads in queue"
          description="Import leads to build a calling queue, or place a one-off manual call. Claim a caller ID first if outbound calling is not ready."
          primaryAction={{ label: 'Import leads', onClick: () => setImportOpen(true) }}
          secondaryAction={onOpenManualDial ? { label: 'Manual dial', onClick: onOpenManualDial } : undefined}
          tertiaryAction={{ label: 'Claim caller ID', href: '/numbers' }}
          features={[
            { icon: PhoneCall, label: 'Manual calls' },
            { icon: Zap, label: 'Power sessions' },
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
          <h2
            className={cn(
              'text-xl font-semibold tracking-tight sm:text-2xl',
              isDark
                ? 'bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent'
                : 'text-zinc-950',
            )}
          >
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
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-medium backdrop-blur-sm transition-colors',
                isDark
                  ? 'border-white/[0.08] bg-zinc-900/80 text-zinc-200 hover:border-cyan-500/25 hover:bg-zinc-800/80'
                  : 'border-zinc-950/10 bg-white text-zinc-700 shadow-sm hover:border-cyan-600/30 hover:bg-cyan-500/[0.06]',
              )}
            >
              <Grid3x3 className={cn('h-4 w-4', isDark ? 'text-cyan-400/80' : 'text-cyan-600')} />
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
  const { isDark } = useSiteTheme();
  const ring =
    accent === 'violet'
      ? 'from-violet-500/20 to-transparent'
      : accent === 'amber'
        ? 'from-amber-500/20 to-transparent'
        : 'from-cyan-500/20 to-transparent';
  const iconColor =
    accent === 'violet'
      ? isDark ? 'text-violet-400' : 'text-violet-600'
      : accent === 'amber'
        ? isDark ? 'text-amber-400' : 'text-amber-600'
        : isDark ? 'text-cyan-400' : 'text-cyan-600';

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      className={cn(
        'relative overflow-hidden rounded-xl border px-3 py-3.5 text-center backdrop-blur-sm',
        isDark
          ? 'border-white/[0.06] bg-zinc-900/60'
          : 'border-zinc-950/[0.07] bg-white/80 shadow-[0_2px_10px_rgba(9,9,11,0.05)]',
      )}
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-b', ring)} aria-hidden />
      <Icon className={cn('relative mx-auto mb-1.5 h-4 w-4', iconColor)} />
      <motion.p
        key={value}
        initial={reduce ? false : { scale: 0.9, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn('relative text-2xl font-semibold tabular-nums', isDark ? 'text-zinc-50' : 'text-zinc-950')}
      >
        {value}
      </motion.p>
      <p className="relative text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
    </motion.div>
  );
}
