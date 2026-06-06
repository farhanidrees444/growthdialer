'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface FeatureChip {
  icon: LucideIcon;
  label: string;
}

interface PremiumEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  features?: FeatureChip[];
  compact?: boolean;
  className?: string;
  accent?: 'emerald' | 'violet' | 'cyan';
}

const ACCENT = {
  emerald: {
    glow: 'bg-emerald-500/20',
    ring: 'border-emerald-500/25',
    icon: 'text-emerald-400',
    primary: 'border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-300 hover:from-emerald-600/30',
  },
  violet: {
    glow: 'bg-violet-500/20',
    ring: 'border-violet-500/25',
    icon: 'text-violet-400',
    primary: 'border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-violet-200 hover:from-violet-600/30',
  },
  cyan: {
    glow: 'bg-cyan-500/20',
    ring: 'border-cyan-500/25',
    icon: 'text-cyan-400',
    primary: 'border-cyan-500/30 bg-gradient-to-r from-cyan-600/20 to-blue-600/10 text-cyan-200 hover:from-cyan-600/30',
  },
};

function ActionButton({ action, accentClass }: { action: Action; accentClass: string }) {
  const className = cn(
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition',
    action.variant === 'secondary'
      ? 'border border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
      : cn('border', accentClass),
  );

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export function PremiumEmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  features,
  compact = false,
  className,
  accent = 'emerald',
}: PremiumEmptyStateProps) {
  const a = ACCENT[accent];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-4' : 'py-16 px-6',
        className,
      )}
    >
      <div className={cn('relative', compact ? 'mb-4' : 'mb-8')}>
        {!compact && (
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.22, 0.1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className={cn('absolute inset-0 -m-5 rounded-full blur-xl', a.glow)}
          />
        )}
        <div
          className={cn(
            'relative flex items-center justify-center rounded-2xl border bg-white/[0.03]',
            a.ring,
            compact ? 'h-12 w-12' : 'h-20 w-20 rounded-full',
          )}
        >
          <Icon className={cn(a.icon, compact ? 'h-5 w-5' : 'h-9 w-9')} />
        </div>
      </div>

      <h2 className={cn('font-bold text-white', compact ? 'text-sm' : 'text-xl')}>{title}</h2>
      <p className={cn('mt-2 max-w-sm leading-relaxed text-slate-500', compact ? 'text-xs' : 'text-sm')}>
        {description}
      </p>

      {features && features.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {features.map(({ icon: FIcon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400"
            >
              <FIcon className={cn('h-3 w-3', a.icon)} />
              {label}
            </span>
          ))}
        </div>
      )}

      {(primaryAction || secondaryAction) && (
        <div className={cn('flex flex-wrap items-center justify-center gap-3', compact ? 'mt-4' : 'mt-8')}>
          {primaryAction && <ActionButton action={primaryAction} accentClass={a.primary} />}
          {secondaryAction && <ActionButton action={{ ...secondaryAction, variant: 'secondary' }} accentClass={a.primary} />}
        </div>
      )}
    </div>
  );
}
