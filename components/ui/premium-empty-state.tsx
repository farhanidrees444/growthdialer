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
  scene?: WorkflowScene;
}

function ActionButton({ action, primary }: { action: Action; primary?: boolean }) {
  const className = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200',
    primary
      ? 'bg-zinc-100 text-zinc-950 shadow-[0_1px_0_rgba(255,255,255,0.2)] hover:bg-white hover:shadow-lg hover:shadow-violet-500/15 hover:-translate-y-px'
      : 'border border-zinc-700/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200',
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
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl',
        'border border-white/[0.06] bg-zinc-900/50 px-6 text-center backdrop-blur-md',
        compact ? 'max-w-md py-10' : 'max-w-2xl py-16 sm:py-20',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(139,92,246,0.14),transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_100%,rgba(34,211,238,0.06),transparent_50%)]"
        aria-hidden
      />

      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <WorkflowIllustration
        scene={scene}
        accent={accent}
        icon={Icon}
        compact={compact}
        className={compact ? 'mb-5' : 'mb-8'}
      />

      <h2
        className={cn(
          'relative font-semibold tracking-tight text-zinc-50',
          compact ? 'text-sm' : 'text-xl sm:text-2xl',
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'relative mt-2.5 max-w-md leading-relaxed text-zinc-500',
          compact ? 'text-xs' : 'text-sm sm:text-[15px]',
        )}
      >
        {description}
      </p>

      {features && features.length > 0 && (
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
          {features.map(({ icon: FIcon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-black/30 px-3 py-1.5 text-xs text-zinc-500"
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
            compact ? 'mt-5' : 'mt-9',
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
