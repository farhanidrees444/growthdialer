'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteTheme } from '@/components/theme/site-theme';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  children,
  className,
}: PageHeaderProps) {
  const reduce = useReducedMotion();
  const { isDark } = useSiteTheme();

  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0 relative">
        <h1 className={cn('font-display text-xl font-semibold tracking-tight flex items-center gap-2 flex-wrap', isDark ? 'text-white' : 'text-zinc-950')}>
          {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" />}
          <span className={cn(
            'bg-clip-text text-transparent bg-gradient-to-r',
            isDark
              ? 'from-white via-zinc-100 to-zinc-400'
              : 'from-zinc-950 via-zinc-700 to-violet-700',
          )}>
            {title}
          </span>
          {badge && (
            <Badge variant="secondary" className="text-[10px] font-bold bg-primary/15 text-primary border-0">
              {badge}
            </Badge>
          )}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-xl leading-relaxed">{description}</p>
        )}
        {!reduce && (
          <motion.div
            aria-hidden
            className="mt-3 h-px max-w-[120px] bg-gradient-to-r from-violet-500/60 via-cyan-500/30 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'left' }}
          />
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

interface PeriodToggleProps {
  value: number;
  onChange: (days: number) => void;
  periods: readonly { days: number; label: string }[];
  className?: string;
}

export function PeriodToggle({ value, onChange, periods, className }: PeriodToggleProps) {
  const { isDark } = useSiteTheme();
  return (
    <div
      className={cn(
        'inline-flex gap-1 rounded-xl border p-1 backdrop-blur-xl',
        isDark
          ? 'border-white/[0.08] bg-black/20'
          : 'border-zinc-950/[0.08] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.05)]',
        className,
      )}
    >
      {periods.map((p) => (
        <button
          key={p.days}
          type="button"
          onClick={() => onChange(p.days)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
            value === p.days
              ? isDark
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'bg-violet-600/10 text-violet-700 shadow-sm'
              : isDark
                ? 'text-muted-foreground hover:text-white hover:bg-white/[0.04]'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-950/[0.04]',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
