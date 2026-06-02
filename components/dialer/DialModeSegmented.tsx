'use client';

import { motion } from 'framer-motion';
import { Phone, Sparkles, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialMode = 'manual' | 'power' | 'parallel';

interface DialModeSegmentedProps {
  mode: DialMode;
  onStartPowerDial: () => void;
  disabled?: boolean;
  className?: string;
}

const SEGMENTS: { id: DialMode; label: string; Icon: typeof Phone; unavailable?: boolean }[] = [
  { id: 'manual', label: 'Manual', Icon: Phone },
  { id: 'power', label: 'Power', Icon: Sparkles },
  { id: 'parallel', label: 'Parallel', Icon: Grid3x3, unavailable: true },
];

export default function DialModeSegmented({
  mode,
  onStartPowerDial,
  disabled = false,
  className,
}: DialModeSegmentedProps) {
  const handleClick = (id: DialMode, unavailable?: boolean) => {
    if (disabled || unavailable) return;
    if (id === 'power' && mode !== 'power') onStartPowerDial();
  };

  return (
    <div className={cn('relative flex rounded-xl border border-white/[0.08] bg-black/20 p-1', className)}>
      {SEGMENTS.map(({ id, label, Icon, unavailable }) => {
        const isActive = mode === id;
        const isDisabled = unavailable || disabled;
        return (
          <button
            key={id}
            type="button"
            disabled={isDisabled}
            onClick={() => handleClick(id, unavailable)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors',
              isDisabled && 'cursor-default opacity-40',
              !isDisabled && !isActive && 'cursor-pointer text-slate-500 hover:text-slate-300',
              isActive && 'text-white',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="dial-mode-pill"
                className="absolute inset-0 rounded-lg bg-white/[0.09]"
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
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
