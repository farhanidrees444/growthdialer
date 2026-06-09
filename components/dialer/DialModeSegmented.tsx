'use client';

import { motion, useReducedMotion } from 'framer-motion';
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
  activeGradient: string;
}[] = [
  { id: 'manual', label: 'Manual', Icon: Phone, activeGradient: 'from-zinc-700/80 to-zinc-800/80' },
  { id: 'power', label: 'Power', Icon: Zap, activeGradient: 'from-violet-600/90 to-violet-500/80' },
  { id: 'parallel', label: 'Parallel', Icon: Grid3x3, activeGradient: 'from-cyan-600/80 to-violet-600/70' },
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
  const reduce = useReducedMotion();

  const handleClick = (id: DialMode) => {
    if (disabled) return;
    onModeChange?.(id);
    if (id === 'power' && !powerActive) onStartPowerDial();
    if (id === 'parallel' && !parallelActive) onStartParallelDial?.();
  };

  return (
    <div
      className={cn(
        'relative inline-flex w-full max-w-md rounded-xl border border-white/[0.06] bg-zinc-900/70 p-1 backdrop-blur-md',
        className,
      )}
      role="tablist"
      aria-label="Dial mode"
    >
      {!reduce && (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(139,92,246,0.08),transparent_70%)]"
          aria-hidden
        />
      )}

      {SEGMENTS.map(({ id, label, Icon, activeGradient }) => {
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
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors',
              disabled && 'cursor-not-allowed opacity-50',
              !disabled && !isActive && 'cursor-pointer text-zinc-500 hover:text-zinc-200',
              isActive && 'text-white',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="dial-mode-pill-enterprise"
                className={cn('absolute inset-0 rounded-lg bg-gradient-to-r shadow-sm', activeGradient)}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            {isActive && !reduce && id !== 'manual' && (
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-lg opacity-50"
                style={{
                  background: id === 'power'
                    ? 'radial-gradient(circle at 50% 0%, rgba(167,139,250,0.4), transparent 70%)'
                    : 'radial-gradient(circle at 50% 0%, rgba(34,211,238,0.35), transparent 70%)',
                }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <motion.span
              className="relative z-10 flex items-center gap-1.5"
              animate={isActive && !reduce ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
