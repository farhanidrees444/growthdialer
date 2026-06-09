'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Grid3x3, TrendingUp, Users, PhoneCall, Upload } from 'lucide-react';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { useLeads } from '@/contexts/leads-context';

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

export function BrowseStage({
  queueCount,
  hotCount,
  callbackCount,
  onStartPowerDial,
  onStartParallelDial,
}: BrowseStageProps) {
  const subtitle = useMemo(() => getContextualSubtitle(), []);
  const { setImportOpen } = useLeads();

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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full w-full flex-col items-center justify-center px-4 py-8 sm:px-6"
    >
      <div className="w-full max-w-lg space-y-6 text-center">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-zinc-100 sm:text-xl">Ready to dial</h2>
          <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile icon={Users} label="In queue" value={queueCount} />
          <StatTile icon={TrendingUp} label="Hot" value={hotCount} />
          <StatTile icon={PhoneCall} label="Callbacks" value={callbackCount} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onStartPowerDial}
            className="hover-brand-glow inline-flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-600/90 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-600"
          >
            <Zap className="h-4 w-4" />
            Start power dial
          </button>
          {onStartParallelDial && (
            <button
              type="button"
              onClick={onStartParallelDial}
              className="hover-enterprise inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800/80"
            >
              <Grid3x3 className="h-4 w-4 text-zinc-400" />
              Parallel dial
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/80 px-3 py-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-zinc-500" />
      <p className="text-xl font-medium tabular-nums text-zinc-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
    </div>
  );
}
