'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type AmbientVariant = 'idle' | 'live' | 'power';

interface DialerStageAmbientProps {
  variant?: AmbientVariant;
  className?: string;
}

const VARIANT_GLOW: Record<AmbientVariant, string> = {
  idle: 'from-violet-600/12 via-transparent to-cyan-500/8',
  live: 'from-red-500/10 via-transparent to-cyan-500/6',
  power: 'from-violet-600/14 via-fuchsia-500/6 to-cyan-500/10',
};

export function DialerStageAmbient({ variant = 'idle', className }: DialerStageAmbientProps) {
  const reduce = useReducedMotion();

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          VARIANT_GLOW[variant],
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(139,92,246,0.1),transparent_60%)]" />

      {!reduce && (
        <>
          <motion.div
            className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]"
            animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-1/4 bottom-1/4 h-56 w-56 rounded-full bg-cyan-500/8 blur-[90px]"
            animate={{ x: [0, -25, 0], y: [0, 15, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}
    </div>
  );
}
