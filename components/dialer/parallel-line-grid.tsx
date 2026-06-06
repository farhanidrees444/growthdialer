'use client';

import { motion } from 'framer-motion';
import { Phone, PhoneOff, PhoneCall, Voicemail, AlertCircle, Loader2 } from 'lucide-react';
import type { ParallelDialLeg } from '@/lib/parallel-dial/types';
import { cn } from '@/lib/utils';
import { DialerSurface } from './dialer-surface';
import { Badge } from '@/components/ui/badge';

const STATUS_META: Record<
  string,
  { label: string; color: string; ring: string; Icon: typeof Phone }
> = {
  dialing: { label: 'Dialing', color: 'text-zinc-400', ring: 'ring-zinc-500/20', Icon: Loader2 },
  ringing: { label: 'Ringing', color: 'text-cyan-400', ring: 'ring-cyan-500/30', Icon: PhoneCall },
  answered: { label: 'Answered', color: 'text-amber-400', ring: 'ring-amber-500/30', Icon: PhoneCall },
  connected: { label: 'Connected', color: 'text-emerald-400', ring: 'ring-emerald-500/40', Icon: Phone },
  no_answer: { label: 'No answer', color: 'text-zinc-500', ring: 'ring-zinc-500/10', Icon: PhoneOff },
  busy: { label: 'Busy', color: 'text-orange-400', ring: 'ring-orange-500/20', Icon: PhoneOff },
  failed: { label: 'Failed', color: 'text-red-400', ring: 'ring-red-500/25', Icon: AlertCircle },
  canceled: { label: 'Canceled', color: 'text-zinc-600', ring: 'ring-zinc-500/10', Icon: PhoneOff },
  voicemail: { label: 'Voicemail', color: 'text-violet-400', ring: 'ring-violet-500/25', Icon: Voicemail },
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
      <DialerSurface className="min-h-[108px] flex items-center justify-center border-dashed opacity-60">
        <span className="text-xs text-muted-foreground">Line {index + 1} · idle</span>
      </DialerSurface>
    );
  }

  const meta = STATUS_META[leg.status] ?? STATUS_META.dialing;
  const Icon = meta.Icon;
  const isWinner = leg.is_winner;
  const isLive = ['dialing', 'ringing', 'answered', 'connected'].includes(leg.status);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <DialerSurface
        variant={isWinner ? 'success' : isLive ? 'live' : 'default'}
        glow={isWinner || isLive}
        className={cn(
          'min-h-[108px] p-4 ring-1',
          meta.ring,
          isWinner && 'shadow-emerald-500/15',
        )}
      >
        {isLive && !isWinner && (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/8 to-violet-500/5"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
        )}
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {leg.lead_name ?? 'Unknown'}
            </p>
            <p className="truncate text-xs text-muted-foreground tabular-nums">{leg.phone}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 gap-1 border-0 bg-white/[0.06] text-[10px] font-bold uppercase tracking-wider',
              meta.color,
            )}
          >
            <Icon className={cn('h-3 w-3', leg.status === 'dialing' && 'animate-spin')} />
            {isWinner ? 'Live' : meta.label}
          </Badge>
        </div>
        {isWinner && (
          <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full bg-emerald-400"
              animate={{ width: ['15%', '100%', '15%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}
      </DialerSurface>
    </motion.div>
  );
}
