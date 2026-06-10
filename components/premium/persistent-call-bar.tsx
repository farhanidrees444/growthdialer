'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Maximize2 } from 'lucide-react';
import { CallWaveform } from '@/components/premium/call-waveform';
import { SentimentAmbient } from '@/components/premium/sentiment-ambient';
import { SPRING } from '@/lib/ui/premium-motion';
import { cn } from '@/lib/utils';

interface PersistentCallBarProps {
  name: string;
  elapsed: number;
  callStatus: string;
  sentiment?: string | null;
  isMuted: boolean;
  isMobile: boolean;
  onExpand: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  layoutId?: string;
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PersistentCallBar({
  name,
  elapsed,
  callStatus,
  sentiment,
  isMuted,
  isMobile,
  onExpand,
  onHangup,
  onToggleMute,
  layoutId = 'gd-call-bar',
}: PersistentCallBarProps) {
  const reduce = useReducedMotion();
  const isLive = callStatus === 'active' || callStatus === 'held';
  const timeLabel =
    callStatus === 'connecting' ? 'Dialing…'
    : callStatus === 'ringing' ? 'Ringing…'
    : fmtTime(elapsed);

  const inner = (
    <>
      <div className="relative flex h-2 w-2 shrink-0">
        {isLive && !reduce && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span className={cn(
          'relative inline-flex h-2 w-2 rounded-full',
          isLive ? 'bg-emerald-500' : callStatus === 'held' ? 'bg-amber-500' : 'bg-slate-500',
        )} />
      </div>

      <CallWaveform active={isLive} barCount={isMobile ? 14 : 18} className="hidden sm:flex shrink-0 w-16" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-white sm:text-xs">{name}</p>
        <p className="text-[10px] text-slate-500 tabular-nums">{timeLabel}</p>
      </div>

      <button
        type="button"
        onClick={onToggleMute}
        disabled={!isLive}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:text-white disabled:opacity-40"
      >
        {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      </button>

      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand call"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 transition hover:text-white"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onHangup}
        aria-label="End call"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-900/40 transition hover:bg-red-400 active:scale-95"
      >
        <PhoneOff className="h-3.5 w-3.5" />
      </button>
    </>
  );

  return (
    <SentimentAmbient
      sentiment={sentiment}
      className={cn('fixed', isMobile ? 'z-[var(--z-call-bar)]' : 'gd-call-dock')}
    >
      <motion.div
        layoutId={layoutId}
        layout={!reduce}
        transition={SPRING}
        className={cn(
          'flex items-center gap-2.5 border border-white/[0.10] bg-[oklch(0.09_0.006_285)]/96 px-3.5 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-xl',
          isMobile ? 'z-[var(--z-call-bar)] left-0 right-0 border-t border-b-0 rounded-none' : 'rounded-2xl',
        )}
        style={
          isMobile
            ? { bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))' }
            : { minWidth: 280, maxWidth: 'min(92vw, 380px)' }
        }
      >
        {inner}
      </motion.div>
    </SentimentAmbient>
  );
}
