'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="font-display text-xl font-semibold tracking-tight text-white flex items-center gap-2 flex-wrap">
          {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" />}
          {title}
          {badge && (
            <Badge variant="secondary" className="text-[10px] font-bold bg-primary/15 text-primary border-0">
              {badge}
            </Badge>
          )}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-xl leading-relaxed">{description}</p>
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
  return (
    <div
      className={cn(
        'inline-flex gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1 backdrop-blur-xl',
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
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-white hover:bg-white/[0.04]',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
