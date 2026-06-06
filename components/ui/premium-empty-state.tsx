'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
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
  accent?: 'emerald' | 'violet' | 'cyan' | 'neutral';
}

function ActionButton({ action, primary }: { action: Action; primary?: boolean }) {
  const className = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200',
    primary
      ? 'border border-violet-500/30 bg-violet-600/90 text-white hover:bg-violet-600 hover:shadow-brand-hover'
      : 'border border-zinc-800/50 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:shadow-enterprise-hover',
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
}: PremiumEmptyStateProps) {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-lg flex-col items-center justify-center rounded-lg border border-zinc-800/50 bg-zinc-900/60 px-6 text-center backdrop-blur-sm',
        compact ? 'py-10' : 'py-14',
        className,
      )}
    >
      <div
        className={cn(
          'mb-5 flex items-center justify-center rounded-lg border border-zinc-800/50 bg-zinc-950/80 text-zinc-400',
          compact ? 'h-11 w-11' : 'h-14 w-14',
        )}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
      </div>

      <h2 className={cn('font-medium text-zinc-100', compact ? 'text-sm' : 'text-lg')}>{title}</h2>
      <p className={cn('mt-2 max-w-sm leading-relaxed text-zinc-500', compact ? 'text-xs' : 'text-sm')}>
        {description}
      </p>

      {features && features.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {features.map(({ icon: FIcon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-md border border-zinc-800/50 bg-zinc-950/50 px-2.5 py-1 text-xs text-zinc-500"
            >
              <FIcon className="h-3 w-3 text-zinc-400" />
              {label}
            </span>
          ))}
        </div>
      )}

      {(primaryAction || secondaryAction) && (
        <div className={cn('flex flex-wrap items-center justify-center gap-3', compact ? 'mt-4' : 'mt-7')}>
          {primaryAction && (
            <ActionButton action={primaryAction} primary />
          )}
          {secondaryAction && (
            <ActionButton action={{ ...secondaryAction, variant: 'secondary' }} />
          )}
        </div>
      )}

      {!reduce && !compact && (
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10 rounded-lg opacity-0"
          aria-hidden
        />
      )}
    </div>
  );
}
