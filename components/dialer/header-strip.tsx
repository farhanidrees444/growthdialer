'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, HelpCircle, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { useWebPhone, type PhoneStatus } from '@/contexts/webphone-context';

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
  const { phoneStatus, reconnect, micPermission, requestMicPermission, lastError } = useWebPhone();
  const isLive = callStatus === 'active' || callStatus === 'connecting' || callStatus === 'ringing';

  // Phone status indicator component
  const PhoneStatusIndicator = () => {
    if (phoneStatus === 'ready') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
          </span>
          Ready
        </div>
      );
    }
    if (phoneStatus === 'initializing') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting...
        </div>
      );
    }
    if (phoneStatus === 'error') {
      return (
        <button
          onClick={reconnect}
          title={lastError || undefined}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
        >
          <WifiOff className="h-3 w-3" />
          {lastError ? 'Error' : 'Offline'}
          <RefreshCw className="h-2.5 w-2.5 ml-1" />
        </button>
      );
    }
    // idle
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 text-xs font-medium">
        <Wifi className="h-3 w-3" />
        Idle
      </div>
    );
  };

  // Mic permission warning
  const MicWarning = () => {
    if (micPermission !== 'denied') return null;
    return (
      <button
        onClick={requestMicPermission}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors"
      >
        Mic blocked
      </button>
    );
  };

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

      {/* Center: Session stats - clean display instead of bubbles */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        {todayCalls.length > 0 ? (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="text-white/20">|</span>
            <span>{todayCalls.length} calls today</span>
          </div>
        ) : (
          <span className="text-[11px] text-white/20">Ready to dial</span>
        )}
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mic warning */}
        <MicWarning />

        {/* Status pill - shows live call or phone connection status */}
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
            {callTimer ? `${callTimer}` : callStatus === 'connecting' ? 'Connecting...' : callStatus === 'ringing' ? 'Ringing...' : 'On Call'}
            {activeLeadName && <span className="text-red-300/70 hidden lg:inline"> · {activeLeadName}</span>}
          </motion.div>
        ) : (
          <PhoneStatusIndicator />
        )}

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          aria-label="Dialer preferences"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenShortcuts}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
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
