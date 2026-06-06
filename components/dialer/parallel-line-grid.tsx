'use client';

import { motion } from 'framer-motion';
import { Phone, PhoneOff, PhoneCall, Voicemail, AlertCircle, Loader2 } from 'lucide-react';
import type { ParallelDialLeg } from '@/lib/parallel-dial/types';
import { cn } from '@/lib/utils';

const STATUS_META: Record<
  string,
  { label: string; color: string; Icon: typeof Phone }
> = {
  dialing: { label: 'Dialing', color: 'text-zinc-400', Icon: Loader2 },
  ringing: { label: 'Ringing', color: 'text-cyan-400', Icon: PhoneCall },
  answered: { label: 'Answered', color: 'text-amber-400', Icon: PhoneCall },
  connected: { label: 'Connected', color: 'text-emerald-400', Icon: Phone },
  no_answer: { label: 'No answer', color: 'text-zinc-500', Icon: PhoneOff },
  busy: { label: 'Busy', color: 'text-orange-400', Icon: PhoneOff },
  failed: { label: 'Failed', color: 'text-red-400', Icon: AlertCircle },
  canceled: { label: 'Canceled', color: 'text-zinc-600', Icon: PhoneOff },
  voicemail: { label: 'Voicemail', color: 'text-violet-400', Icon: Voicemail },
};

interface ParallelLineGridProps {
  legs: ParallelDialLeg[];
  linesCount: number;
}

export function ParallelLineGrid({ legs, linesCount }: ParallelLineGridProps) {
  const slots = Math.max(linesCount, legs.length, 2);
  const display = Array.from({ length: slots }, (_, i) => legs[i] ?? null);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {display.map((leg, i) => (
        <LineCard key={leg?.id ?? `slot-${i}`} leg={leg} index={i} />
      ))}
    </div>
  );
}

function LineCard({ leg, index }: { leg: ParallelDialLeg | null; index: number }) {
  if (!leg) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] p-4 min-h-[100px] flex items-center justify-center">
        <span className="text-xs text-zinc-600">Line {index + 1} · idle</span>
      </div>
    );
  }

  const meta = STATUS_META[leg.status] ?? STATUS_META.dialing;
  const Icon = meta.Icon;
  const isWinner = leg.is_winner;
  const isLive = ['dialing', 'ringing', 'answered', 'connected'].includes(leg.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 min-h-[100px] transition-colors',
        isWinner
          ? 'border-emerald-500/40 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/10'
          : 'border-white/[0.08] bg-white/[0.03]',
        isLive && !isWinner && 'border-cyan-500/20',
      )}
    >
      {isLive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {leg.lead_name ?? 'Unknown'}
          </p>
          <p className="truncate text-xs text-zinc-500 tabular-nums">{leg.phone}</p>
        </div>
        <span className={cn('flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider', meta.color)}>
          <Icon className={cn('h-3.5 w-3.5', leg.status === 'dialing' && 'animate-spin')} />
          {isWinner ? 'Live' : meta.label}
        </span>
      </div>
      {isWinner && (
        <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full bg-emerald-400"
            animate={{ width: ['20%', '100%', '20%'] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </div>
      )}
    </motion.div>
  );
}
