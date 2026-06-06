'use client';

import { motion } from 'framer-motion';
import { Pause, Play, Square, Grid3x3 } from 'lucide-react';
import type { ParallelDialSession } from '@/lib/parallel-dial/types';
import type { ParallelDialerState } from '@/hooks/use-parallel-dialer';

interface ParallelSessionBannerProps {
  session: ParallelDialSession;
  state: ParallelDialerState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function ParallelSessionBanner({
  session,
  state,
  onPause,
  onResume,
  onStop,
}: ParallelSessionBannerProps) {
  const connectRate = session.total_dialed > 0
    ? Math.round((session.total_connects / session.total_dialed) * 100)
    : 0;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="flex-shrink-0 border-b border-violet-500/20 overflow-hidden"
      style={{ background: 'rgba(124,58,237,0.08)' }}
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 text-violet-300">
          <Grid3x3 className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Parallel</span>
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
            {session.lines_count} lines
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs tabular-nums text-zinc-400">
          <span><span className="text-white font-medium">{session.total_batches}</span> batches</span>
          <span className="text-zinc-700">·</span>
          <span><span className="text-white font-medium">{session.total_connects}</span> connects</span>
          <span className="text-zinc-700">·</span>
          <span><span className="text-emerald-400 font-medium">{connectRate}%</span> rate</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {state === 'paused' ? (
            <button
              type="button"
              onClick={onResume}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-500"
            >
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 hover:bg-white/[0.08]"
            >
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          <button
            type="button"
            onClick={onStop}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-300 hover:bg-red-500/20"
          >
            <Square className="h-3.5 w-3.5" /> End
          </button>
        </div>
      </div>
    </motion.div>
  );
}
