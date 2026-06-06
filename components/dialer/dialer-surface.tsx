'use client';

import { cn } from '@/lib/utils';

interface DialerSurfaceProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'violet' | 'live' | 'success';
  glow?: boolean;
}

const VARIANT_BORDER: Record<NonNullable<DialerSurfaceProps['variant']>, string> = {
  default: 'border-white/[0.08] bg-white/[0.03]',
  violet: 'border-violet-500/25 bg-violet-500/[0.06]',
  live: 'border-cyan-500/30 bg-cyan-500/[0.05]',
  success: 'border-emerald-500/35 bg-emerald-500/[0.08]',
};

export function DialerSurface({
  children,
  className,
  variant = 'default',
  glow = false,
}: DialerSurfaceProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-xl',
        VARIANT_BORDER[variant],
        glow && 'shadow-lg shadow-primary/10',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}
