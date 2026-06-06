'use client';

import { motion } from 'framer-motion';
import { Grid3x3, Radio } from 'lucide-react';
import { ParallelLineGrid } from './parallel-line-grid';
import type { ParallelDialLeg, ParallelDialSession } from '@/lib/parallel-dial/types';
import type { ParallelDialerState } from '@/hooks/use-parallel-dialer';

interface ParallelDialStageProps {
  session: ParallelDialSession;
  legs: ParallelDialLeg[];
  state: ParallelDialerState;
}

export function ParallelDialStage({ session, legs, state }: ParallelDialStageProps) {
  const batchLegs = legs.filter((l) => l.batch_number === session.total_batches);
  const liveCount = batchLegs.filter((l) =>
    ['dialing', 'ringing', 'answered'].includes(l.status),
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="flex-shrink-0 border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <Grid3x3 className="h-5 w-5" />
            {state === 'dialing' && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
              </span>
            )}
          </span>
          <div>
            <h2 className="text-base font-semibold text-white">
              {state === 'dialing' ? 'Dialing in parallel…' : state === 'connected' ? 'Live connect' : 'Parallel session'}
            </h2>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-cyan-400" />
              Batch {session.total_batches} · {liveCount} lines active
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        <ParallelLineGrid legs={batchLegs} linesCount={session.lines_count} />
      </div>
    </motion.div>
  );
}
