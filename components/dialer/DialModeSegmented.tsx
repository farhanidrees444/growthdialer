'use client';

import { motion } from 'framer-motion';
import { Phone, Zap, Grid3x3 } from 'lucide-react';
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
}[] = [
  { id: 'manual', label: 'Manual', Icon: Phone },
  { id: 'power', label: 'Power', Icon: Zap },
  { id: 'parallel', label: 'Parallel', Icon: Grid3x3 },
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
    <div
      className={cn(
        'inline-flex w-full max-w-md rounded-lg border border-zinc-800/50 bg-zinc-900/80 p-1 backdrop-blur-sm',
        className,
      )}
      role="tablist"
      aria-label="Dial mode"
    >
      {SEGMENTS.map(({ id, label, Icon }) => {
        const isActive =
          mode === id || (id === 'power' && powerActive) || (id === 'parallel' && parallelActive);
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => handleClick(id)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
              disabled && 'cursor-not-allowed opacity-50',
              !disabled && !isActive && 'cursor-pointer text-zinc-500 hover:text-zinc-200 hover:shadow-enterprise-hover',
              isActive && 'text-zinc-100',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="dial-mode-pill-enterprise"
                className="absolute inset-0 rounded-md nav-active-glass"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
            <span className="relative z-10 truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
