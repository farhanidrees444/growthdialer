'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { AiOrb } from './ai-orb';

interface BrowseStageProps {
  queueCount: number;
  hotCount: number;
  callbackCount: number;
  onStartPowerDial: () => void;
}

function getContextualSubtitle(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Your queue is ready';
  if (hour < 17) return 'Keep the momentum going';
  return 'Final push for today';
}

export function BrowseStage({ queueCount, hotCount, callbackCount, onStartPowerDial }: BrowseStageProps) {
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

      {/* Power Dial CTA */}
      <motion.button
        onClick={onStartPowerDial}
        disabled={queueCount === 0}
        whileHover={queueCount > 0 ? { scale: 1.03, boxShadow: '0 0 30px rgba(124,58,237,0.4)' } : {}}
        whileTap={queueCount > 0 ? { scale: 0.97 } : {}}
        className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(186,100%,42%))' }}
        aria-label="Start AI Power Dial"
      >
        <Zap className="w-4 h-4" />
        Start AI Power Dial
      </motion.button>
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
