'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, HelpCircle, Flame } from 'lucide-react';

interface CallDot {
  id: string;
  leadName: string;
  disposition: string | null;
  time: string;
}

interface TodayStats {
  calls: number;
  connects: number;
  meetings: number;
  streak: number;
}

type PhoneStatus = 'idle' | 'initializing' | 'ready' | 'error';

interface HeaderStripProps {
  stats: TodayStats;
  callStatus: string;
  phoneStatus?: PhoneStatus;
  voiceError?: string | null;
  /** Inbound PSTN ringing the browser — not an active outbound call. */
  inboundPreAnswer?: boolean;
  callTimer?: string;
  activeLeadName?: string;
  todayCalls: CallDot[];
  onOpenShortcuts: () => void;
  onReconnect?: () => void;
  onDotClick?: (callId: string) => void;
}

export function HeaderStrip({
  stats,
  callStatus,
  phoneStatus = 'idle',
  voiceError = null,
  inboundPreAnswer = false,
  callTimer,
  activeLeadName,
  todayCalls,
  onOpenShortcuts,
  onReconnect,
  onDotClick,
}: HeaderStripProps) {
  const [statsExpanded, setStatsExpanded] = useState(false);
  const isLive =
    !inboundPreAnswer
    && (callStatus === 'active' || callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'held');
  const isIncoming = inboundPreAnswer;
  const totalProgress = Math.max(todayCalls.length, 12);
  const progress = Math.min(100, (todayCalls.length / totalProgress) * 100);
  const statItems = [
    { label: 'calls', value: stats.calls },
    { label: 'connects', value: stats.connects },
    { label: 'meetings', value: stats.meetings },
  ];

  return (
    <header
      className="flex-shrink-0 flex items-center gap-4 px-4 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl"
      style={{ height: 56 }}
      role="banner"
    >
      {/* Left group */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-medium tracking-wide text-white/65">AI Dialer</span>
        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Streak */}
        <motion.div
          key={stats.streak}
          initial={{ scale: 1.16, opacity: 0.7 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="flex items-center gap-1.5 rounded-full border border-violet-400/15 bg-violet-500/10 px-2 py-1 text-sm tabular-nums text-violet-100"
        >
          <Flame className="h-3.5 w-3.5" /> {stats.streak}
        </motion.div>

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Today stats */}
        <div
          className="hidden cursor-default items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-sm tabular-nums backdrop-blur-xl sm:flex"
          title="Today's performance"
          onClick={() => setStatsExpanded((p) => !p)}
        >
          {statItems.map((item, index) => (
            <span key={item.label} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-white/16">·</span>}
              <motion.span
                key={`${item.label}-${item.value}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="font-semibold text-white"
              >
                {item.value}
              </motion.span>
              <span className="text-white/38">{item.label}</span>
            </span>
          ))}
        </div>

        {/* Mobile compressed */}
        <div className="flex sm:hidden text-sm tabular-nums text-white/60">
          {stats.calls}·{stats.connects}·{stats.meetings}
        </div>
      </div>

      {/* Center: Session progress */}
      <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden" style={{ height: 36 }}>
        <div className="relative w-full max-w-md px-2">
          <div className="relative h-2 rounded-full border border-white/[0.06] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_22px_rgba(6,182,212,0.28)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
            <div className="absolute inset-0 grid grid-cols-12">
              {Array.from({ length: 12 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => todayCalls[i]?.id && onDotClick?.(todayCalls[i].id)}
                  className="relative flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                  title={todayCalls[i] ? `${todayCalls[i].leadName} · ${todayCalls[i].time}` : `Slot ${i + 1}`}
                  aria-label={todayCalls[i] ? `Open call ${todayCalls[i].leadName}` : `Empty call slot ${i + 1}`}
                >
                  <span className={`h-3 w-px rounded-full ${todayCalls[i] ? 'bg-white/70' : 'bg-white/18'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Status pill */}
        {isIncoming ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-xs font-medium"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            Incoming call
          </motion.div>
        ) : isLive ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-400/25 text-violet-100 text-xs font-medium"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-violet-300"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            {callTimer ? `${callTimer}` : 'On Call'}
            {activeLeadName && <span className="text-violet-100/70 hidden lg:inline"> · {activeLeadName}</span>}
          </motion.div>
        ) : phoneStatus === 'error' ? (
          <button
            type="button"
            onClick={onReconnect}
            className="flex max-w-[min(18rem,40vw)] flex-col items-start gap-0.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-left text-violet-100 hover:bg-violet-500/15 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            title={voiceError ?? 'Reconnect voice service'}
          >
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-300 shrink-0" />
              Offline — tap to reconnect
            </span>
            {voiceError && (
              <span className="truncate text-[10px] leading-tight text-violet-100/70">{voiceError}</span>
            )}
          </button>
        ) : phoneStatus === 'initializing' || phoneStatus === 'idle' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-200 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            Connecting…
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-cyan-400/25 text-cyan-200 text-xs font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            Voice live
          </div>
        )}

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          aria-label="Dialer preferences"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenShortcuts}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          aria-label="Keyboard shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile expanded stats tooltip */}
      <AnimatePresence>
        {statsExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-14 left-4 z-50 bg-zinc-900 border border-white/10 rounded-lg p-3 shadow-2xl text-xs text-white/60 sm:hidden"
            onClick={() => setStatsExpanded(false)}
          >
            <div>{stats.calls} calls · {stats.connects} connects · {stats.meetings} meetings</div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
