'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Grid3x3 } from 'lucide-react';
import { AiOrb } from './ai-orb';

interface BrowseStageProps {
  queueCount: number;
  hotCount: number;
  callbackCount: number;
  onStartPowerDial: () => void;
  onStartParallelDial?: () => void;
}

function getContextualSubtitle(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Your queue is ready';
  if (hour < 17) return 'Keep the momentum going';
  return 'Final push for today';
}

export function BrowseStage({ queueCount, hotCount, callbackCount, onStartPowerDial, onStartParallelDial }: BrowseStageProps) {
  const subtitle = useMemo(() => getContextualSubtitle(), []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="flex flex-col items-center justify-center h-full gap-8 p-8"
    >
      {/* AI Orb */}
      <AiOrb />

      {/* Headline */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white">Select a lead to begin</h2>
        <p className="text-sm text-white/40">{subtitle}</p>
      </div>

      {/* Stats pills */}
      <div className="flex gap-3 flex-wrap justify-center">
        <StatPill label="in queue" value={queueCount} />
        <StatPill label="hot" value={hotCount} color="yellow" />
        <StatPill label="callbacks due" value={callbackCount} color="cyan" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <motion.button
          onClick={onStartPowerDial}
          disabled={queueCount === 0}
          whileHover={queueCount > 0 ? { scale: 1.02 } : {}}
          whileTap={queueCount > 0 ? { scale: 0.98 } : {}}
          className="flex flex-1 items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed gradient-brand"
          aria-label="Start AI Power Dial"
        >
          <Zap className="w-4 h-4" />
          Power Dial
        </motion.button>
        {onStartParallelDial && (
          <motion.button
            onClick={onStartParallelDial}
            disabled={queueCount === 0}
            whileHover={queueCount > 0 ? { scale: 1.02 } : {}}
            whileTap={queueCount > 0 ? { scale: 0.98 } : {}}
            className="flex flex-1 items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20"
            aria-label="Start Parallel Dial"
          >
            <Grid3x3 className="w-4 h-4" />
            Parallel Dial
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function StatPill({
  label,
  value,
  color = 'default',
}: {
  label: string;
  value: number;
  color?: 'default' | 'yellow' | 'cyan';
}) {
  const colorClass =
    color === 'yellow'
      ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400'
      : color === 'cyan'
      ? 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400'
      : 'border-white/[0.08] bg-white/[0.04] text-white/60';

  return (
    <div className={`flex items-baseline gap-1.5 px-3 py-2 rounded-lg border ${colorClass}`}>
      <span className="text-lg font-semibold tabular-nums text-white">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
