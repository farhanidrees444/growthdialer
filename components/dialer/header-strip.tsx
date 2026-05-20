'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, HelpCircle } from 'lucide-react';
import { SessionReplayMap } from './session-replay-map';

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

interface HeaderStripProps {
  stats: TodayStats;
  callStatus: string;
  callTimer?: string;
  activeLeadName?: string;
  todayCalls: CallDot[];
  onOpenShortcuts: () => void;
  onDotClick?: (callId: string) => void;
}

export function HeaderStrip({
  stats,
  callStatus,
  callTimer,
  activeLeadName,
  todayCalls,
  onOpenShortcuts,
  onDotClick,
}: HeaderStripProps) {
  const [statsExpanded, setStatsExpanded] = useState(false);
  const isLive = callStatus === 'active' || callStatus === 'connecting' || callStatus === 'ringing';

  return (
    <header
      className="flex-shrink-0 flex items-center gap-4 px-4 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl"
      style={{ height: 56 }}
      role="banner"
    >
      {/* Left group */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm text-white/60 font-medium tracking-wide">AI Dialer</span>
        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Streak */}
        <motion.div
          key={stats.streak}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-sm tabular-nums"
        >
          🔥 {stats.streak}
        </motion.div>

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Today stats */}
        <div
          className="hidden sm:flex items-center gap-3 text-sm tabular-nums cursor-default"
          title="Today's performance"
          onClick={() => setStatsExpanded((p) => !p)}
        >
          <span><span className="text-white font-medium">{stats.calls}</span><span className="text-white/40 ml-1">calls</span></span>
          <span className="text-white/20">·</span>
          <span><span className="text-white font-medium">{stats.connects}</span><span className="text-white/40 ml-1">connects</span></span>
          <span className="text-white/20">·</span>
          <span><span className="text-white font-medium">{stats.meetings}</span><span className="text-white/40 ml-1">meetings</span></span>
        </div>

        {/* Mobile compressed */}
        <div className="flex sm:hidden text-sm tabular-nums text-white/60">
          {stats.calls}·{stats.connects}·{stats.meetings}
        </div>
      </div>

      {/* Center: Session replay map */}
      <div className="flex-1 min-w-0 flex items-center justify-center overflow-hidden" style={{ height: 36 }}>
        <SessionReplayMap calls={todayCalls} onDotClick={onDotClick} />
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Status pill */}
        {isLive ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-red-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            {callTimer ? `${callTimer}` : 'On Call'}
            {activeLeadName && <span className="text-red-300/70 hidden lg:inline"> · {activeLeadName}</span>}
          </motion.div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Ready
          </div>
        )}

        <button
          className="p-1.5 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          aria-label="Dialer preferences"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
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
