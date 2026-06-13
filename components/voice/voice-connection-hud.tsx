'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { cn } from '@/lib/utils';

const QUALITY_STYLES = {
  excellent: 'from-emerald-500/20 to-cyan-500/10 border-emerald-500/30 text-emerald-200',
  good: 'from-cyan-500/15 to-blue-500/10 border-cyan-500/25 text-cyan-100',
  degraded: 'from-amber-500/20 to-orange-500/10 border-amber-500/35 text-amber-100',
  disconnected: 'from-red-500/20 to-rose-500/10 border-red-500/35 text-red-200',
  unknown: 'from-white/5 to-white/[0.02] border-white/10 text-white/50',
} as const;

export function VoiceConnectionHud() {
  const {
    callStatus,
    voiceQuality,
    isReconnecting,
    audioDeviceLabel,
    iceConnectionState,
    phoneStatus,
  } = useWebPhone();

  const visible =
    callStatus === 'active'
    || callStatus === 'held'
    || callStatus === 'connecting'
    || callStatus === 'ringing'
    || isReconnecting;

  const label = isReconnecting
    ? 'Reconnecting voice link…'
    : voiceQuality === 'degraded'
      ? 'Network unstable — audio may clip'
      : voiceQuality === 'disconnected'
        ? 'Voice disconnected'
        : callStatus === 'active'
          ? 'HD voice active'
          : 'Connecting…';

  const Icon = isReconnecting
    ? Loader2
    : voiceQuality === 'disconnected'
      ? WifiOff
      : Wifi;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="pointer-events-none fixed bottom-[calc(var(--bottom-nav-height,0px)+1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[65] w-[min(92vw,22rem)] -translate-x-1/2 lg:bottom-6"
        >
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border bg-gradient-to-r px-4 py-2.5 shadow-lg backdrop-blur-md',
              QUALITY_STYLES[voiceQuality],
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isReconnecting && 'animate-spin')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{label}</p>
              <p className="truncate text-[10px] opacity-70">
                {phoneStatus !== 'ready' ? 'Warming up…' : iceConnectionState ?? 'ICE pending'}
                {audioDeviceLabel ? ` · ${audioDeviceLabel}` : ''}
              </p>
            </div>
            <Mic className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
