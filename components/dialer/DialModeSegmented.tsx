'use client';

import { motion } from 'framer-motion';
import { Phone, Sparkles, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DialMode = 'manual' | 'power' | 'parallel';

interface DialModeSegmentedProps {
  mode: DialMode;
  onModeChange?: (mode: DialMode) => void;
  onStartPowerDial: () => void;
  onStartParallelDial?: () => void;
  disabled?: boolean;
  parallelActive?: boolean;
  powerActive?: boolean;
  className?: string;
}

const SEGMENTS: {
  id: DialMode;
  label: string;
  Icon: typeof Phone;
  badge?: string;
}[] = [
  { id: 'manual', label: 'Manual', Icon: Phone },
  { id: 'power', label: 'Power', Icon: Sparkles },
  { id: 'parallel', label: 'Parallel', Icon: Grid3x3, badge: '10 lines' },
];

export default function DialModeSegmented({
  mode,
  onModeChange,
  onStartPowerDial,
  onStartParallelDial,
  disabled = false,
  parallelActive = false,
  powerActive = false,
  className,
}: DialModeSegmentedProps) {
  const handleClick = (id: DialMode) => {
    if (disabled) return;
    onModeChange?.(id);
    if (id === 'power' && !powerActive) onStartPowerDial();
    if (id === 'parallel' && !parallelActive) onStartParallelDial?.();
  };

  return (
    <div className={cn('relative flex rounded-xl border border-white/[0.08] bg-black/20 p-1', className)}>
      {SEGMENTS.map(({ id, label, Icon, badge }) => {
        const isActive = mode === id || (id === 'power' && powerActive) || (id === 'parallel' && parallelActive);
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(id)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors min-h-10',
              disabled && 'cursor-not-allowed opacity-50',
              !disabled && !isActive && 'cursor-pointer text-slate-500 hover:text-slate-300',
              isActive && 'text-white',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="dial-mode-pill"
                className={cn(
                  'absolute inset-0 rounded-lg',
                  id === 'parallel' ? 'bg-violet-500/25' : 'bg-white/[0.09]',
                )}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
            <span className="relative z-10 truncate">{label}</span>
            {badge && id === 'parallel' && (
              <span className="relative z-10 hidden rounded bg-violet-500/20 px-1 py-0.5 text-[9px] font-bold text-violet-300 sm:inline">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
