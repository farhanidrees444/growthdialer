'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashErrorStateProps {
  title?: string;
  description?: string;
  /** Retry handler — button renders only when provided. */
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Branded error state for failed data loads — pairs with PremiumEmptyState
 * so error / empty / loading all share one visual language.
 */
export function DashErrorState({
  title = 'Something went wrong',
  description = 'We couldn\u2019t load this data. Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  retrying = false,
  compact = false,
  className,
}: DashErrorStateProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      role="alert"
      className={cn(
        'relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl text-center',
        'border border-rose-500/[0.12] bg-rose-500/[0.03] backdrop-blur-md',
        compact ? 'max-w-md px-6 py-10' : 'max-w-xl px-6 py-14 sm:py-16',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(244,63,94,0.1),transparent_65%)]"
        aria-hidden
      />
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10',
          compact ? 'mb-4 h-11 w-11' : 'mb-6 h-14 w-14',
        )}
      >
        <AlertTriangle className={cn('text-rose-400', compact ? 'h-5 w-5' : 'h-6 w-6')} aria-hidden />
      </div>
      <h2
        className={cn(
          'relative font-semibold tracking-tight text-zinc-100',
          compact ? 'text-sm' : 'text-lg sm:text-xl',
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'relative mt-2 max-w-sm leading-relaxed text-zinc-500',
          compact ? 'text-xs' : 'text-sm',
        )}
      >
        {description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className={cn(
            'dash-btn-ghost relative mt-6 gap-2 px-5 py-2.5 text-sm',
            retrying && 'opacity-60',
          )}
        >
          <RefreshCw className={cn('h-4 w-4', retrying && 'animate-spin')} aria-hidden />
          {retrying ? 'Retrying…' : retryLabel}
        </button>
      )}
    </motion.div>
  );
}
