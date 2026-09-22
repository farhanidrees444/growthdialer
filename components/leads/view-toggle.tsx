'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'table';

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  const { isDark } = useSiteTheme();
  return (
    <div className={cn(
      'flex items-center gap-0.5 rounded-xl border p-0.5',
      isDark
        ? 'border-white/[0.07] bg-white/[0.02]'
        : 'border-zinc-950/[0.08] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.05)]',
    )}>
      {([
        { mode: 'grid' as const, Icon: LayoutGrid, label: 'Grid' },
        { mode: 'table' as const, Icon: List, label: 'Table' },
      ] as const).map(({ mode, Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-label={`${label} view`}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200',
            value === mode
              ? isDark
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.12)]'
                : 'border border-emerald-600/25 bg-emerald-500/10 text-emerald-700'
              : isDark
                ? 'text-slate-600 hover:text-slate-300'
                : 'text-zinc-400 hover:text-zinc-700',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
