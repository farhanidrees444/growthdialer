'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Square, Pause, Play, ChevronDown } from 'lucide-react';
import type { PowerDialerState, PowerSession } from '@/hooks/use-power-dialer';

interface PowerBannerProps {
  state: PowerDialerState;
  session: PowerSession | null;
  countdown: number;
  queueRemaining: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function useElapsed(startedAt?: string, isPaused?: boolean): string {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval>>(undefined);
  const pausedAtRef = useRef<number | null>(null);
  const totalPausedRef = useRef(0);

  useEffect(() => {
    if (!startedAt) return;

    if (isPaused) {
      clearInterval(ref.current);
      // Record when we entered pause so we can add the gap on resume
      if (pausedAtRef.current === null) pausedAtRef.current = Date.now();
      return;
    }

    // Resuming from pause — accumulate the paused gap
    if (pausedAtRef.current !== null) {
      totalPausedRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    const base = new Date(startedAt).getTime();
    const tick = () => setSecs(Math.floor((Date.now() - base - totalPausedRef.current) / 1000));
    tick();
    ref.current = setInterval(tick, 1000);
    return () => clearInterval(ref.current);
  }, [startedAt, isPaused]);

  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PowerBanner({
  state,
  session,
  countdown,
  queueRemaining,
  onPause,
  onResume,
  onStop,
}: PowerBannerProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const isPaused = state === 'paused';
  const elapsed = useElapsed(session?.started_at, isPaused);

  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes pd-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .pd-shimmer {
          background: linear-gradient(
            90deg,
            rgba(124,58,237,0.10) 0%,
            rgba(6,182,212,0.16)  50%,
            rgba(124,58,237,0.10) 100%
          );
          background-size: 200% 100%;
          animation: pd-shimmer 8s linear infinite;
        }
      `}</style>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="flex-shrink-0 overflow-hidden border-b border-purple-500/20"
      >
        {/* ── Desktop banner (≥1024px) ── */}
        <div className="pd-shimmer hidden lg:flex items-center gap-4 px-4 h-12">
          {/* Mode pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-purple-400"
              animate={isPaused ? {} : { opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <Zap className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-widest">
              {isPaused ? 'Paused' : 'Power Mode'}
            </span>
          </div>

          <span className="text-white/20">|</span>

          {/* Session timer */}
          <span className="text-sm font-mono text-white/50 tabular-nums shrink-0">{elapsed}</span>

          <span className="text-white/20">|</span>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm">
            <StatCell label="Calls" value={session?.total_calls ?? 0} />
            <StatCell label="Connects" value={session?.connected_calls ?? 0} color="cyan" />
            <StatCell label="Meetings" value={session?.meetings_booked ?? 0} color="green" />
          </div>

          {/* Remaining */}
          {queueRemaining > 0 && (
            <span className="text-xs text-white/30 ml-1">{queueRemaining} left</span>
          )}

          {/* Countdown badge */}
          <AnimatePresence>
            {countdown > 0 && (
              <motion.span
                key={countdown}
                initial={{ scale: 1.15, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="ml-auto mr-2 text-xs font-mono text-purple-300"
              >
                Next call in {countdown}s
              </motion.span>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={isPaused ? onResume : onPause}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.07] transition-colors"
              aria-label={isPaused ? 'Resume session' : 'Pause session'}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <StopButton onClick={onStop} size="sm" />
          </div>
        </div>

        {/* ── Mobile banner (<1024px) ── */}
        <div className="pd-shimmer lg:hidden">
          <div className="flex items-center gap-2 px-3 h-11">
            {/* Power pill + timer */}
            <button
              onClick={() => setMobileExpanded((p) => !p)}
              className="flex items-center gap-1.5 flex-1"
              aria-label="Expand session stats"
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"
                animate={isPaused ? {} : { opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-purple-300">
                {isPaused ? 'Paused' : 'Power'}
              </span>
              <span className="text-xs font-mono text-white/50 tabular-nums ml-1">{elapsed}</span>
              <ChevronDown
                className={`w-3 h-3 text-white/30 ml-0.5 transition-transform ${mobileExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Controls */}
            <button
              onClick={isPaused ? onResume : onPause}
              className="p-1.5 rounded-lg text-white/50 hover:text-white bg-white/[0.05] border border-white/[0.07]"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <StopButton onClick={onStop} size="mobile" />
          </div>

          {/* Expandable stats */}
          <AnimatePresence>
            {mobileExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-4 px-3 py-2 border-t border-white/[0.05]">
                  <StatCell label="Calls" value={session?.total_calls ?? 0} />
                  <StatCell label="Connects" value={session?.connected_calls ?? 0} color="cyan" />
                  <StatCell label="Meetings" value={session?.meetings_booked ?? 0} color="green" />
                  {queueRemaining > 0 && (
                    <span className="text-xs text-white/30 ml-auto">{queueRemaining} left</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

function StatCell({
  label,
  value,
  color = 'white',
}: {
  label: string;
  value: number;
  color?: 'white' | 'cyan' | 'green';
}) {
  const textColor =
    color === 'cyan' ? 'text-cyan-400' : color === 'green' ? 'text-emerald-400' : 'text-white';

  return (
    <div className="flex items-baseline gap-1">
      <motion.span
        key={value}
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`text-sm font-semibold tabular-nums ${textColor}`}
      >
        {value}
      </motion.span>
      <span className="text-xs text-white/30">{label}</span>
    </div>
  );
}

function StopButton({ onClick, size }: { onClick: () => void; size: 'sm' | 'mobile' }) {
  if (size === 'mobile') {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ boxShadow: '0 0 16px rgba(239,68,68,0.6)' }}
        whileTap={{ scale: 0.92 }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        aria-label="Stop power dial session"
      >
        <Square className="w-3 h-3 fill-current" />
        STOP
      </motion.button>
    );
  }
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ boxShadow: '0 0 20px rgba(239,68,68,0.55)' }}
      whileTap={{ scale: 0.93 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      aria-label="Stop power dial session"
    >
      <Square className="w-3 h-3 fill-current" />
      STOP
    </motion.button>
  );
}
