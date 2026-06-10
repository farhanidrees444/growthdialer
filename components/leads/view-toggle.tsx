'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'table';

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-0.5">
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
              ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.12)]'
              : 'text-slate-600 hover:text-slate-300',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
