'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Grid3x3, TrendingUp, Users, PhoneCall } from 'lucide-react';
import { LottieHero } from '@/components/ui/lottie-hero';
import { AiOrb } from './ai-orb';
import { Button } from '@/components/ui/button';
import { DialerSurface } from './dialer-surface';
import { cn } from '@/lib/utils';

interface BrowseStageProps {
  queueCount: number;
  hotCount: number;
  callbackCount: number;
  onStartPowerDial: () => void;
  onStartParallelDial?: () => void;
}

function getContextualSubtitle(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning floor — your queue is loaded';
  if (hour < 17) return 'Afternoon push — keep connect rate high';
  return 'Final hour — callbacks & hot leads first';
}

export function BrowseStage({
  queueCount,
  hotCount,
  callbackCount,
  onStartPowerDial,
  onStartParallelDial,
}: BrowseStageProps) {
  const subtitle = useMemo(() => getContextualSubtitle(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      className="flex h-full flex-col items-center justify-center gap-6 p-6 md:p-8"
    >
      <div className="relative h-40 w-40 md:h-48 md:w-48">
        <LottieHero className="h-full w-full" fallback={<AiOrb />} />
      </div>

      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          AI Dialer ready
        </h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-3 gap-3">
        <StatBento icon={Users} label="In queue" value={queueCount} />
        <StatBento icon={TrendingUp} label="Hot" value={hotCount} accent="amber" />
        <StatBento icon={PhoneCall} label="Callbacks" value={callbackCount} accent="cyan" />
      </div>

      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
        <DialerSurface variant="violet" glow className="p-4">
          <p className="text-xs font-semibold text-violet-200 mb-1">Power Dial</p>
          <p className="text-[11px] text-white/45 mb-3 leading-relaxed">
            Sequential auto-dial with AI brief & disposition flow.
          </p>
          <Button
            onClick={onStartPowerDial}
            disabled={queueCount === 0}
            className="w-full gap-2 gradient-brand text-white border-0"
          >
            <Zap className="h-4 w-4" />
            Launch power session
          </Button>
        </DialerSurface>

        {onStartParallelDial && (
          <DialerSurface variant="live" glow className="p-4">
            <p className="text-xs font-semibold text-cyan-200 mb-1">Parallel Dial</p>
            <p className="text-[11px] text-white/45 mb-3 leading-relaxed">
              2–10 lines · AMD skip · auto VM drop on losers.
            </p>
            <Button
              onClick={onStartParallelDial}
              disabled={queueCount === 0}
              variant="outline"
              className="w-full gap-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
            >
              <Grid3x3 className="h-4 w-4" />
              Launch parallel
            </Button>
          </DialerSurface>
        )}
      </div>
    </motion.div>
  );
}

function StatBento({
  icon: Icon,
  label,
  value,
  accent = 'default',
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent?: 'default' | 'amber' | 'cyan';
}) {
  const accentClass =
    accent === 'amber'
      ? 'border-amber-500/20 bg-amber-500/5'
      : accent === 'cyan'
        ? 'border-cyan-500/20 bg-cyan-500/5'
        : 'border-white/[0.08] bg-white/[0.03]';

  return (
    <DialerSurface className={cn('p-3 text-center', accentClass)}>
      <Icon className="mx-auto h-4 w-4 text-white/40 mb-1" />
      <p className="text-xl font-bold tabular-nums text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </DialerSurface>
  );
}
