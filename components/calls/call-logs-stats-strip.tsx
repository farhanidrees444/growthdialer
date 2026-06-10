'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { PhoneIncoming, PhoneOutgoing, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CallLogsStats {
  todayTotal: number;
  inboundToday: number;
  outboundToday: number;
  connectRate: number;
  missedToday: number;
}

interface CallLogsStatsStripProps {
  stats: CallLogsStats;
  className?: string;
}

const TILES = [
  { key: 'todayTotal', label: 'Today', icon: Clock, accent: 'sky' as const },
  { key: 'inboundToday', label: 'Inbound', icon: PhoneIncoming, accent: 'cyan' as const },
  { key: 'outboundToday', label: 'Outbound', icon: PhoneOutgoing, accent: 'sky' as const },
  { key: 'connectRate', label: 'Connect rate', icon: TrendingUp, accent: 'emerald' as const },
];

const ACCENT_RING: Record<string, string> = {
  sky: 'from-sky-500/18 to-transparent',
  cyan: 'from-cyan-500/18 to-transparent',
  emerald: 'from-emerald-500/18 to-transparent',
};

const ACCENT_ICON: Record<string, string> = {
  sky: 'text-sky-400',
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
};

export function CallLogsStatsStrip({ stats, className }: CallLogsStatsStripProps) {
  const reduce = useReducedMotion();

  const values: Record<string, string | number> = {
    todayTotal: stats.todayTotal,
    inboundToday: stats.inboundToday,
    outboundToday: stats.outboundToday,
    connectRate: `${stats.connectRate}%`,
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3', className)}
    >
      {TILES.map(({ key, label, icon: Icon, accent }, i) => (
        <motion.div
          key={key}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          whileHover={reduce ? undefined : { y: -2 }}
          className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3 py-3 backdrop-blur-sm"
        >
          <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-b', ACCENT_RING[accent])} aria-hidden />
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
              <Icon className={cn('h-3.5 w-3.5', ACCENT_ICON[accent])} />
            </div>
            <div className="min-w-0">
              <motion.p
                key={String(values[key])}
                initial={reduce ? false : { scale: 0.92, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  'text-lg font-bold tabular-nums leading-none',
                  key === 'connectRate' && stats.connectRate >= 20 ? 'text-emerald-300' : 'text-white',
                )}
              >
                {values[key]}
              </motion.p>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-zinc-500">
                {label}
                {key === 'connectRate' && stats.missedToday > 0 ? ` · ${stats.missedToday} missed` : ''}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
