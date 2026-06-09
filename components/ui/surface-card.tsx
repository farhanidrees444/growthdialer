'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SurfaceCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'violet' | 'live' | 'success' | 'amber';
  glow?: boolean;
  as?: 'div' | 'section' | 'article';
}

const VARIANT: Record<NonNullable<SurfaceCardProps['variant']>, string> = {
  default: 'border-white/[0.08] bg-white/[0.03]',
  violet: 'border-violet-500/25 bg-violet-500/[0.06]',
  live: 'border-cyan-500/30 bg-cyan-500/[0.05]',
  success: 'border-emerald-500/35 bg-emerald-500/[0.08]',
  amber: 'border-amber-500/25 bg-amber-500/[0.06]',
};

export function SurfaceCard({
  children,
  className,
  variant = 'default',
  glow = false,
  as: Tag = 'div',
}: SurfaceCardProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion.create(Tag);

  return (
    <MotionTag
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-shadow duration-300',
        VARIANT[variant],
        glow && 'shadow-lg shadow-primary/10',
        !reduce && 'hover:shadow-xl hover:shadow-black/20',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-violet-500/[0.03]" />
      {!reduce && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
      <div className="relative">{children}</div>
    </MotionTag>
  );
}
