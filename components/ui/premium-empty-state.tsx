'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowIllustration } from '@/components/ui/workflow-illustration';
import type { WorkflowScene, SceneAccent } from '@/lib/ui/workflow-scenes';

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
  accent?: SceneAccent;
  /** Workflow-specific Lottie scene — Resend-style contextual animation */
  scene?: WorkflowScene;
}

function ActionButton({ action, primary }: { action: Action; primary?: boolean }) {
  const className = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200',
    primary
      ? 'bg-zinc-100 text-zinc-950 shadow-[0_1px_0_rgba(255,255,255,0.15)] hover:bg-white hover:shadow-lg hover:shadow-violet-500/10'
      : 'border border-zinc-700/60 bg-transparent text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-200',
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
  accent = 'violet',
  scene,
}: PremiumEmptyStateProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-800/60',
        'bg-zinc-900/35 px-6 text-center backdrop-blur-sm',
        compact ? 'max-w-md py-10' : 'max-w-2xl py-16 sm:py-20',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(139,92,246,0.08),transparent_70%)]"
        aria-hidden
      />

      <WorkflowIllustration
        scene={scene}
        accent={accent}
        icon={Icon}
        compact={compact}
        className={compact ? 'mb-4' : 'mb-7'}
      />

      <h2
        className={cn(
          'relative font-semibold tracking-tight text-zinc-50',
          compact ? 'text-sm' : 'text-lg sm:text-xl',
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'relative mt-2 max-w-md leading-relaxed text-zinc-500',
          compact ? 'text-xs' : 'text-sm',
        )}
      >
        {description}
      </p>

      {features && features.length > 0 && (
        <div className="relative mt-5 flex flex-wrap items-center justify-center gap-2">
          {features.map(({ icon: FIcon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-zinc-800/60 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-500"
            >
              <FIcon className="h-3 w-3 text-zinc-400" />
              {label}
            </span>
          ))}
        </div>
      )}

      {(primaryAction || secondaryAction) && (
        <div
          className={cn(
            'relative flex flex-wrap items-center justify-center gap-3',
            compact ? 'mt-4' : 'mt-8',
          )}
        >
          {primaryAction && <ActionButton action={primaryAction} primary />}
          {secondaryAction && (
            <ActionButton action={{ ...secondaryAction, variant: 'secondary' }} />
          )}
        </div>
      )}
    </motion.div>
  );
}
