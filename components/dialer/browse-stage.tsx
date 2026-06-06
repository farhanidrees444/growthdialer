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
      className="scrollbar-none flex h-full w-full flex-col items-center overflow-y-auto"
    >
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-6 sm:gap-5 sm:px-6 sm:py-8 md:gap-6 md:p-8">
        {/* Hero animation — sized down on smaller screens so CTAs stay visible */}
        <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-44 lg:w-44">
          <LottieHero className="h-full w-full" fallback={<AiOrb />} />
        </div>

        <div className="max-w-md space-y-1.5 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
            AI Dialer ready
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
        </div>

        <div className="grid w-full max-w-lg grid-cols-3 gap-2 sm:gap-3">
          <StatBento icon={Users} label="In queue" value={queueCount} />
          <StatBento icon={TrendingUp} label="Hot" value={hotCount} accent="amber" />
          <StatBento icon={PhoneCall} label="Callbacks" value={callbackCount} accent="cyan" />
        </div>

        <div className="grid w-full max-w-lg gap-2.5 sm:grid-cols-2 sm:gap-3">
          <DialerSurface variant="violet" glow className="p-3 sm:p-4">
            <p className="mb-1 text-xs font-semibold text-violet-200">Power Dial</p>
            <p className="mb-3 text-[11px] leading-relaxed text-white/45">
              Sequential auto-dial with AI brief &amp; disposition flow.
            </p>
            <Button
              onClick={onStartPowerDial}
              disabled={queueCount === 0}
              className="gradient-brand w-full gap-2 border-0 text-white"
            >
              <Zap className="h-4 w-4" />
              Launch power session
            </Button>
          </DialerSurface>

          {onStartParallelDial && (
            <DialerSurface variant="live" glow className="p-3 sm:p-4">
              <p className="mb-1 text-xs font-semibold text-cyan-200">Parallel Dial</p>
              <p className="mb-3 text-[11px] leading-relaxed text-white/45">
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
