'use client';

import { LayoutGrid, List } from 'lucide-react';

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
          className={[
            'flex h-7 w-7 items-center justify-center rounded-lg transition',
            value === mode
              ? 'bg-white/[0.08] text-white'
              : 'text-slate-600 hover:text-slate-300',
          ].join(' ')}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
