'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Phone, Zap, Square, SkipForward, Pause, Play } from 'lucide-react';
import type { LeadRecord } from '@/lib/dialer/state-machine';

interface PowerCountdownStageProps {
  lead: LeadRecord;
  countdown: number;
  delaySeconds: number;
  isPaused?: boolean;
  onSkip: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop: () => void;
}

export function PowerCountdownStage({
  lead,
  countdown,
  delaySeconds,
  isPaused = false,
  onSkip,
  onPause,
  onResume,
  onStop,
}: PowerCountdownStageProps) {
  const circumference = 2 * Math.PI * 45;
  const safeDelay = Math.max(delaySeconds, 1);
  const progress = countdown / safeDelay;
  const dashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="flex flex-col items-center justify-center h-full gap-8 p-8 relative"
    >
      {/* Background pulse — stops when paused */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: isPaused
            ? 'radial-gradient(ellipse 40% 30% at 50% 50%, rgba(250,204,21,0.05), transparent)'
            : 'radial-gradient(ellipse 40% 30% at 50% 50%, rgba(124,58,237,0.07), transparent)',
        }}
        animate={isPaused ? { opacity: 0.5 } : { opacity: [0.6, 1, 0.6] }}
        transition={isPaused ? {} : { duration: 2, repeat: Infinity }}
      />

      {/* Lead name + company */}
      <motion.div
        className="text-center space-y-1.5 z-10"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-light text-white">{lead.name}</h2>
        {(lead.title || lead.company) && (
          <p className="text-sm text-white/40 flex items-center justify-center gap-1.5">
            {lead.company && <Building2 className="w-3.5 h-3.5" />}
            {[lead.title, lead.company].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-sm text-white/30 flex items-center justify-center gap-1.5 font-mono">
          <Phone className="w-3 h-3" />
          {lead.phone}
        </p>
      </motion.div>

      {/* Progress ring + countdown number */}
      <div className="relative z-10" style={{ width: 180, height: 180 }}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="pd-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isPaused ? '#EAB308' : hsl(280, 85%, 65%)} />
              <stop offset="100%" stopColor={isPaused ? '#F59E0B' : hsl(186, 100%, 42%)} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx="50" cy="50" r="45"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="5"
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx="50" cy="50" r="45"
            stroke="url(#pd-ring-gradient)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: isPaused ? 'none' : 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>

        {/* Countdown number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {isPaused ? (
              <motion.div
                key="paused-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <Pause className="w-10 h-10 text-yellow-400" />
              </motion.div>
            ) : (
              <motion.span
                key={countdown}
                initial={{ scale: 1.1, opacity: 0.7 }}
                animate={{ scale: 1.0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="text-6xl font-thin text-white tabular-nums select-none"
              >
                {countdown}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Glow behind ring */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: isPaused
              ? 'radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          }}
          animate={isPaused ? { opacity: 0.7 } : { opacity: [0.6, 1, 0.6] }}
          transition={isPaused ? {} : { duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Label */}
      <motion.p
        className={`text-sm z-10 tracking-wide ${isPaused ? 'text-yellow-400/70' : 'text-white/35'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isPaused
          ? 'Paused — press Resume to continue'
          : `Connecting in ${countdown} second${countdown !== 1 ? 's' : ''}…`}
      </motion.p>

      {/* Action buttons */}
      <motion.div
        className="flex items-center gap-3 z-10"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {isPaused ? (
          <motion.button
            onClick={onResume}
            whileHover={{ boxShadow: '0 0 22px rgba(234,179,8,0.45)' }}
            whileTap={{ scale: 0.93 }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-black bg-yellow-400 hover:bg-yellow-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Resume
          </motion.button>
        ) : (
          <>
            <button
              onClick={onSkip}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Call now
            </button>

            {onPause && (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.07] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            )}
          </>
        )}

        <motion.button
          onClick={onStop}
          whileHover={{ boxShadow: '0 0 22px rgba(239,68,68,0.55)' }}
          whileTap={{ scale: 0.93 }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label="Stop power dial session"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          Stop
        </motion.button>
      </motion.div>

      {/* Mode badge */}
      <motion.div
        className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium z-10"
        style={
          isPaused
            ? { background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }
            : { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }
        }
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {isPaused ? (
          <>
            <Pause className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-300">Paused</span>
          </>
        ) : (
          <>
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-purple-300">Auto-dialing</span>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
