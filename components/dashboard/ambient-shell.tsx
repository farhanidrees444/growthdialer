'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RouteAccentId } from '@/lib/ui/route-accents';

interface AmbientShellProps {
  className?: string;
  accent?: RouteAccentId;
}

const AMBIENT_STYLES: Record<
  RouteAccentId,
  { top: string; right: string; left: string; orbA: string; orbB: string }
> = {
  dashboard: {
    top: 'rgba(139,92,246,0.12)',
    right: 'rgba(6,182,212,0.06)',
    left: 'rgba(139,92,246,0.05)',
    orbA: 'bg-violet-600/10',
    orbB: 'bg-cyan-500/8',
  },
  dialer: {
    top: 'rgba(139,92,246,0.14)',
    right: 'rgba(217,70,239,0.06)',
    left: 'rgba(139,92,246,0.06)',
    orbA: 'bg-violet-600/12',
    orbB: 'bg-fuchsia-500/8',
  },
  sequences: {
    top: 'rgba(34,211,238,0.1)',
    right: 'rgba(139,92,246,0.06)',
    left: 'rgba(34,211,238,0.05)',
    orbA: 'bg-cyan-500/10',
    orbB: 'bg-violet-500/7',
  },
  leads: {
    top: 'rgba(52,211,153,0.1)',
    right: 'rgba(34,211,238,0.05)',
    left: 'rgba(52,211,153,0.05)',
    orbA: 'bg-emerald-500/10',
    orbB: 'bg-teal-500/7',
  },
  calls: {
    top: 'rgba(56,189,248,0.1)',
    right: 'rgba(34,211,238,0.06)',
    left: 'rgba(99,102,241,0.04)',
    orbA: 'bg-sky-500/10',
    orbB: 'bg-cyan-500/8',
  },
  recordings: {
    top: 'rgba(52,211,153,0.12)',
    right: 'rgba(16,185,129,0.06)',
    left: 'rgba(52,211,153,0.05)',
    orbA: 'bg-emerald-500/11',
    orbB: 'bg-green-500/7',
  },
  analytics: {
    top: 'rgba(99,102,241,0.11)',
    right: 'rgba(139,92,246,0.06)',
    left: 'rgba(56,189,248,0.04)',
    orbA: 'bg-indigo-500/10',
    orbB: 'bg-violet-500/8',
  },
  leaderboard: {
    top: 'rgba(245,158,11,0.1)',
    right: 'rgba(251,191,36,0.06)',
    left: 'rgba(245,158,11,0.04)',
    orbA: 'bg-amber-500/10',
    orbB: 'bg-orange-500/7',
  },
  coaching: {
    top: 'rgba(244,63,94,0.09)',
    right: 'rgba(139,92,246,0.06)',
    left: 'rgba(244,63,94,0.04)',
    orbA: 'bg-rose-500/9',
    orbB: 'bg-violet-500/7',
  },
  numbers: {
    top: 'rgba(139,92,246,0.11)',
    right: 'rgba(34,211,238,0.06)',
    left: 'rgba(139,92,246,0.05)',
    orbA: 'bg-violet-600/10',
    orbB: 'bg-cyan-500/8',
  },
  integrations: {
    top: 'rgba(34,211,238,0.09)',
    right: 'rgba(52,211,153,0.05)',
    left: 'rgba(34,211,238,0.04)',
    orbA: 'bg-cyan-500/9',
    orbB: 'bg-emerald-500/7',
  },
  settings: {
    top: 'rgba(161,161,170,0.06)',
    right: 'rgba(139,92,246,0.04)',
    left: 'rgba(161,161,170,0.03)',
    orbA: 'bg-zinc-500/8',
    orbB: 'bg-violet-500/5',
  },
  team: {
    top: 'rgba(52,211,153,0.09)',
    right: 'rgba(34,211,238,0.05)',
    left: 'rgba(52,211,153,0.04)',
    orbA: 'bg-emerald-500/9',
    orbB: 'bg-cyan-500/7',
  },
  default: {
    top: 'rgba(139,92,246,0.12)',
    right: 'rgba(6,182,212,0.06)',
    left: 'rgba(139,92,246,0.05)',
    orbA: 'bg-violet-600/10',
    orbB: 'bg-cyan-500/8',
  },
};

/** Resend-style ambient depth — shifts tint per route */
export function AmbientShell({ className, accent = 'dashboard' }: AmbientShellProps) {
  const reduce = useReducedMotion();
  const style = AMBIENT_STYLES[accent] ?? AMBIENT_STYLES.dashboard;

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% -20%, ${style.top}, transparent 55%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 100% 50%, ${style.right}, transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 0% 80%, ${style.left}, transparent 45%)`,
        }}
      />

      {!reduce && (
        <>
          <motion.div
            className={cn('absolute -left-24 top-1/4 h-72 w-72 rounded-full blur-[100px]', style.orbA)}
            animate={{ x: [0, 40, 0], y: [0, -20, 0], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={cn('absolute -right-16 bottom-1/4 h-64 w-64 rounded-full blur-[90px]', style.orbB)}
            animate={{ x: [0, -30, 0], y: [0, 25, 0], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}
    </div>
  );
}
