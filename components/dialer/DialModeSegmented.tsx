'use client';

import { motion } from 'framer-motion';
import { Phone, Zap, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  desc: string;
  Icon: typeof Phone;
  badge?: string;
  accent: string;
}[] = [
  {
    id: 'manual',
    label: 'Manual',
    desc: 'Preview each lead',
    Icon: Phone,
    accent: 'from-white/10 to-white/5',
  },
  {
    id: 'power',
    label: 'Power',
    desc: 'Auto-advance queue',
    Icon: Zap,
    badge: 'AI',
    accent: 'from-primary/25 to-cyan-500/10',
  },
  {
    id: 'parallel',
    label: 'Parallel',
    desc: 'Up to 10 lines',
    Icon: Grid3x3,
    badge: '10×',
    accent: 'from-violet-500/30 to-fuchsia-500/10',
  },
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
        'grid grid-cols-3 gap-1.5 rounded-2xl border border-white/[0.08] bg-black/30 p-1.5 backdrop-blur-xl',
        className,
      )}
    >
      {SEGMENTS.map(({ id, label, desc, Icon, badge, accent }) => {
        const isActive =
          mode === id
          || (id === 'power' && powerActive)
          || (id === 'parallel' && parallelActive);
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(id)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 min-h-[52px] transition-all',
              disabled && 'cursor-not-allowed opacity-50',
              !disabled && !isActive && 'cursor-pointer text-muted-foreground hover:text-white hover:bg-white/[0.04]',
              isActive && 'text-white',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="dial-mode-pill-v2"
                className={cn('absolute inset-0 rounded-xl bg-gradient-to-br border border-white/[0.08]', accent)}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-1">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold tracking-tight">{label}</span>
              {badge && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[9px] font-bold bg-white/10 text-white/80 border-0"
                >
                  {badge}
                </Badge>
              )}
            </div>
            <span className="relative z-10 text-[10px] text-white/45 hidden sm:block">{desc}</span>
          </button>
        );
      })}
    </div>
  );
}
