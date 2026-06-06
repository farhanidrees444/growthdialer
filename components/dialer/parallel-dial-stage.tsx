'use client';

import { motion } from 'framer-motion';
import { Grid3x3, Radio, Trophy } from 'lucide-react';
import { ParallelLineGrid } from './parallel-line-grid';
import type { ParallelDialLeg, ParallelDialSession } from '@/lib/parallel-dial/types';
import type { ParallelDialerState } from '@/hooks/use-parallel-dialer';
import { Badge } from '@/components/ui/badge';
import { DialerSurface } from './dialer-surface';

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
  const winner = batchLegs.find((l) => l.is_winner);
  const connected = batchLegs.filter((l) => l.status === 'connected').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="flex-shrink-0 border-b border-white/[0.06] px-5 py-4">
        <DialerSurface variant="violet" glow className="p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/25">
              <Grid3x3 className="h-5 w-5" />
              {state === 'dialing' && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-white">
                {state === 'dialing'
                  ? 'Dialing in parallel…'
                  : state === 'connected'
                    ? 'Live connect'
                    : 'Parallel session'}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Radio className="h-3 w-3 text-cyan-400" />
                Batch {session.total_batches} · {liveCount} ringing · {connected} connected
              </p>
            </div>
            {winner && (
              <Badge className="gap-1 bg-emerald-500/15 text-emerald-300 border-emerald-500/25 shrink-0">
                <Trophy className="h-3 w-3" />
                {winner.lead_name?.split(' ')[0] ?? 'Winner'}
              </Badge>
            )}
          </div>
        </DialerSurface>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        <ParallelLineGrid legs={batchLegs} linesCount={session.lines_count} />
      </div>
    </motion.div>
  );
}
