'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AmbientShellProps {
  className?: string;
}

/** Resend-style ambient depth — soft orbs + vignette, no layout impact */
export function AmbientShell({ className }: AmbientShellProps) {
  const reduce = useReducedMotion();

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(139,92,246,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(6,182,212,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(139,92,246,0.05),transparent_45%)]" />

      {!reduce && (
        <>
          <motion.div
            className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-violet-600/10 blur-[100px]"
            animate={{ x: [0, 40, 0], y: [0, -20, 0], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-cyan-500/8 blur-[90px]"
            animate={{ x: [0, -30, 0], y: [0, 25, 0], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}
    </div>
  );
}
