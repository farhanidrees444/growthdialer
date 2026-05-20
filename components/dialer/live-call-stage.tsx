'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Wifi } from 'lucide-react';
import { getAvatarGradient, getInitials } from '@/lib/dialer/avatar-color';
import { CallerWaveform } from './caller-waveform';
import { ActionDock } from './action-dock';
import type { LeadRecord } from '@/lib/dialer/state-machine';

interface LiveCallStageProps {
  lead: LeadRecord;
  callStatus: string;
  isMuted: boolean;
  isOnHold: boolean;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onDropVoicemail: () => void;
  onOpenKeypad: () => void;
  onEndCall: () => void;
  callDbId?: string | null;
}

function useCallTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (active) {
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return { formatted: `${m}:${s}`, seconds };
}

export function LiveCallStage({
  lead, callStatus, isMuted, isOnHold, onToggleMute, onToggleHold,
  onDropVoicemail, onOpenKeypad, onEndCall, callDbId,
}: LiveCallStageProps) {
  const isConnected = callStatus === 'active';
  const { formatted } = useCallTimer(isConnected);
  const gradient = getAvatarGradient(lead.id);
  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-save notes
  useEffect(() => {
    if (!callDbId || !notes.trim()) return;
    clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/calls/${callDbId}/notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });
        setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch { /* silent */ }
    }, 800);
    return () => clearTimeout(saveDebounceRef.current);
  }, [notes, callDbId]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="flex flex-col items-center h-full pt-8 pb-6 px-6 gap-5"
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-semibold text-white"
          style={{ background: gradient.css }}
          animate={isConnected ? { boxShadow: ['0 0 0 0 rgba(6,182,212,0)', '0 0 0 12px rgba(6,182,212,0.12)', '0 0 0 0 rgba(6,182,212,0)'] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {getInitials(lead.name)}
        </motion.div>
        {/* Connection quality */}
        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-zinc-950 flex items-center justify-center">
          <Wifi className="w-2 h-2 text-white" />
        </div>
      </div>

      {/* Name & status */}
      <div className="text-center space-y-1">
        <h1 className="text-4xl font-light text-white">{lead.name}</h1>
        <p className="text-base text-white/50">{[lead.title, lead.company].filter(Boolean).join(' · ')}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`text-sm ${isOnHold ? 'text-yellow-400' : isConnected ? 'text-green-400' : 'text-white/40'}`}>
            {isOnHold ? '⏸ On Hold' : isConnected ? '● Connected' : callStatus === 'connecting' ? 'Connecting...' : 'Ringing...'}
          </span>
        </div>
      </div>

      {/* Waveform */}
      <div className="w-full max-w-sm">
        <CallerWaveform active={isConnected && !isOnHold} />
      </div>

      {/* Timer */}
      <div className="text-2xl font-mono tabular-nums text-white/80" aria-live="polite" aria-label={`Call duration ${formatted}`}>
        {formatted}
      </div>

      {/* Notes panel */}
      <AnimatePresence>
        {noteOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full max-w-sm overflow-hidden"
          >
            <div className="relative">
              <textarea
                autoFocus
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes... (auto-saved)"
                rows={4}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              {savedAt && (
                <span className="absolute bottom-3 right-3 text-[10px] text-white/25">Saved {savedAt}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action dock */}
      <ActionDock
        isMuted={isMuted}
        isOnHold={isOnHold}
        onToggleMute={onToggleMute}
        onToggleHold={onToggleHold}
        onOpenNotes={() => setNoteOpen((p) => !p)}
        onDropVoicemail={onDropVoicemail}
        onOpenKeypad={onOpenKeypad}
      />

      {/* End call */}
      <motion.button
        onClick={onEndCall}
        whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(239,68,68,0.4)' }}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-sm h-14 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
        aria-label="End call"
      >
        <PhoneOff className="w-5 h-5" />
        End Call
        <kbd className="ml-1 text-red-200/50 text-xs font-mono font-normal">Space</kbd>
      </motion.button>
    </motion.div>
  );
}
