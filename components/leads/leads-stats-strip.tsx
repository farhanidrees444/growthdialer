'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Users, Phone, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadsStats {
  total: number;
  contacted: number;
  connected: number;
  rate: number;
}

interface LeadsStatsStripProps {
  stats: LeadsStats;
  className?: string;
}

const TILES = [
  { key: 'total', label: 'Total leads', icon: Users, accent: 'emerald' as const },
  { key: 'contacted', label: 'Contacted', icon: Phone, accent: 'amber' as const },
  { key: 'connected', label: 'Connected', icon: Target, accent: 'teal' as const },
  { key: 'rate', label: 'Connect rate', icon: TrendingUp, accent: 'emerald' as const },
];

const ACCENT_RING: Record<string, string> = {
  emerald: 'from-emerald-500/18 to-transparent',
  amber: 'from-amber-500/18 to-transparent',
  teal: 'from-teal-500/18 to-transparent',
};

const ACCENT_ICON: Record<string, string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  teal: 'text-teal-400',
};

export function LeadsStatsStrip({ stats, className }: LeadsStatsStripProps) {
  const reduce = useReducedMotion();

  const values: Record<string, string | number> = {
    total: stats.total,
    contacted: stats.contacted,
    connected: stats.connected,
    rate: `${stats.rate}%`,
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
                  key === 'rate' && stats.rate >= 20 ? 'text-emerald-300' : 'text-white',
                )}
              >
                {values[key]}
              </motion.p>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
