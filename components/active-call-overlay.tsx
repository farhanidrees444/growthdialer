'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, Hash, FileText,
  Minimize2, Maximize2, X, HelpCircle,
} from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// ─── Quality indicator ────────────────────────────────────────────────────────

function QualityBars({ bars }: { bars: number }) {
  return (
    <div className="flex items-end gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{ height: `${6 + i * 2}px` }}
          className={`w-1.5 rounded-sm transition-colors ${i < bars ? 'bg-emerald-400' : 'bg-white/[0.12]'}`}
        />
      ))}
    </div>
  );
}

// ─── DTMF Pad ─────────────────────────────────────────────────────────────────

const DTMF_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

function DtmfPad({ onDigit, onClose }: { onDigit: (d: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.02_282)] p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400">DTMF</p>
        <button type="button" onClick={onClose} className="text-slate-600 hover:text-slate-400">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DTMF_KEYS.flat().map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onDigit(k)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-white transition hover:bg-white/[0.08] active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

function NotesPanel({ value, onChange, onClose }: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="absolute bottom-full mb-3 left-0 right-0 rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.02_282)] p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400">Quick Note</p>
        <button type="button" onClick={onClose} className="text-slate-600 hover:text-slate-400">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Note for this call…"
        rows={3}
        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none resize-none focus:border-emerald-500/25"
      />
      <p className="mt-1 text-[10px] text-slate-700">Auto-saved to call notes</p>
    </motion.div>
  );
}

// ─── Shortcuts panel ──────────────────────────────────────────────────────────

function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ['SPACE', 'Mute / Unmute'],
    ['H', 'Hang up'],
    ['N', 'Toggle notes'],
    ['M', 'Minimize'],
    ['ESC', 'Close (when ended)'],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute bottom-full right-0 mb-3 w-52 rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.02_282)] p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400">Shortcuts</p>
        <button type="button" onClick={onClose} className="text-slate-600 hover:text-slate-400">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1.5">
        {shortcuts.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <kbd className="rounded-md border border-white/[0.10] bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-slate-300">{key}</kbd>
            <span className="text-[11px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Pulse rings animation ────────────────────────────────────────────────────

function PulseRings({ speed }: { speed: 'slow' | 'fast' }) {
  const dur = speed === 'fast' ? 1.2 : 2.4;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 0.4, 0.8].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-emerald-500/20"
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
          transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%' }}
        />
      ))}
    </div>
  );
}

// ─── Mini widget (minimized state) ───────────────────────────────────────────

function MiniWidget({
  name,
  phone,
  elapsed,
  callStatus,
  onExpand,
  onHangup,
}: {
  name: string;
  phone: string;
  elapsed: number;
  callStatus: string;
  onExpand: () => void;
  onHangup: () => void;
}) {
  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-sm font-bold text-white">
        {getInitials(name)}
        {callStatus === 'active' && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[oklch(0.09_0.02_282)] bg-emerald-500" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white max-w-[120px]">{name || phone}</p>
        <p className="text-[11px] text-slate-500 tabular-nums">
          {callStatus === 'connecting' ? 'Dialing…' : callStatus === 'ringing' ? 'Ringing…' : fmtTime(elapsed)}
        </p>
      </div>
      <button type="button" onClick={onExpand} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 hover:text-white transition">
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onHangup} className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-900/40 transition hover:bg-red-400 active:scale-95">
        <PhoneOff className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export default function ActiveCallOverlay() {
  const { callStatus, isMuted, isOnHold, toggleMute, toggleHold, sendDTMF, hangup } = useWebPhone();
  const { activeLead, activePhone, callAnsweredAt, callInitiatedAt } = useCallContext();

  const [minimized, setMinimized] = useState(false);
  const [showDTMF, setShowDTMF] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [notes, setNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [quality, setQuality] = useState(4);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isVisible = callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'active' || callStatus === 'held';

  // Timer
  useEffect(() => {
    if (callStatus === 'active' && callAnsweredAt) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - callAnsweredAt.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callStatus !== 'active') setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callStatus, callAnsweredAt]);

  // Reset state when new call starts
  useEffect(() => {
    if (callStatus === 'connecting') {
      setNotes('');
      setMinimized(false);
      setShowDTMF(false);
      setShowNotes(false);
      setElapsed(0);
    }
  }, [callStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); toggleMute(); break;
        case 'KeyH': e.preventDefault(); hangup(); break;
        case 'KeyN': e.preventDefault(); setShowNotes((v) => !v); break;
        case 'KeyM': e.preventDefault(); setMinimized((v) => !v); break;
        case 'Escape': if (minimized) setMinimized(false); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isVisible, toggleMute, hangup, minimized]);

  const displayName = activeLead?.name || 'Unknown Contact';
  const displayCompany = activeLead?.company || '';
  const displayPhone = activePhone || activeLead?.phone || '';

  const statusLabel = callStatus === 'connecting' ? 'Dialing…'
    : callStatus === 'ringing' ? 'Ringing…'
    : callStatus === 'held' ? 'On Hold'
    : isMuted ? 'Muted'
    : callStatus === 'active' ? displayName
    : '';

  const avatarGlow = callStatus === 'active' && !isOnHold
    ? 'shadow-[0_0_30px_oklch(0.5_0.2_145_/_0.35)]'
    : callStatus === 'held'
    ? 'shadow-[0_0_30px_oklch(0.8_0.2_60_/_0.25)]'
    : '';

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      {minimized ? (
        <MiniWidget
          key="mini"
          name={displayName}
          phone={displayPhone}
          elapsed={elapsed}
          callStatus={callStatus}
          onExpand={() => setMinimized(false)}
          onHangup={hangup}
        />
      ) : (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-10 w-full max-w-sm rounded-3xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)]/98 shadow-2xl shadow-black/70 backdrop-blur-2xl overflow-hidden"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <div className="h-1 w-10 rounded-full bg-white/[0.10]" />
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setMinimized(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 hover:text-white transition">
                  <Minimize2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Avatar + status */}
            <div className="flex flex-col items-center px-6 py-6 text-center">
              <div className="relative mb-5">
                {(callStatus === 'ringing' || callStatus === 'connecting') && (
                  <PulseRings speed={callStatus === 'ringing' ? 'fast' : 'slow'} />
                )}
                {callStatus === 'held' && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 -m-2 rounded-full bg-amber-500/20"
                  />
                )}
                <div className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-3xl font-bold text-white transition-all duration-500 ${avatarGlow}`}>
                  {activeLead ? getInitials(displayName) : <Phone className="h-10 w-10" />}
                  {callStatus === 'active' && !isOnHold && (
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[oklch(0.09_0.02_282)] bg-emerald-400" />
                  )}
                  {isMuted && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <MicOff className="h-8 w-8 text-red-400" />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-lg font-bold text-white leading-tight">{statusLabel}</p>
              {displayCompany && callStatus === 'active' && (
                <p className="mt-0.5 text-sm text-slate-500">{displayCompany}</p>
              )}
              <p className="mt-0.5 text-xs text-slate-600 tabular-nums">{displayPhone}</p>

              {/* Timer */}
              <div className={`mt-3 text-2xl font-mono font-bold tabular-nums ${callStatus === 'held' ? 'text-amber-400' : 'text-white'}`}>
                {callStatus === 'active' || callStatus === 'held' ? fmtTime(elapsed) : (
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    {callStatus === 'connecting' ? '···' : '···'}
                  </motion.span>
                )}
              </div>

              {/* Quality (active only) */}
              {callStatus === 'active' && (
                <div className="mt-2 flex items-center gap-2">
                  <QualityBars bars={quality} />
                  <span className="text-[10px] text-slate-600">Good</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="relative px-6 pb-6">
              {/* Secondary buttons */}
              <div className="mb-4 grid grid-cols-4 gap-2">
                {[
                  {
                    icon: isMuted ? MicOff : Mic,
                    label: isMuted ? 'Unmute' : 'Mute',
                    active: isMuted,
                    activeClass: 'border-red-500/30 bg-red-500/15 text-red-400',
                    onClick: toggleMute,
                    disabled: callStatus !== 'active' && callStatus !== 'held',
                  },
                  {
                    icon: isOnHold ? Play : Pause,
                    label: isOnHold ? 'Resume' : 'Hold',
                    active: isOnHold,
                    activeClass: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
                    onClick: toggleHold,
                    disabled: callStatus !== 'active' && callStatus !== 'held',
                  },
                  {
                    icon: FileText,
                    label: 'Note',
                    active: showNotes,
                    activeClass: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
                    onClick: () => { setShowNotes((v) => !v); setShowDTMF(false); },
                    disabled: false,
                  },
                  {
                    icon: Hash,
                    label: 'DTMF',
                    active: showDTMF,
                    activeClass: 'border-violet-500/30 bg-violet-500/15 text-violet-400',
                    onClick: () => { setShowDTMF((v) => !v); setShowNotes(false); },
                    disabled: callStatus !== 'active',
                  },
                ].map(({ icon: Icon, label, active, activeClass, onClick, disabled }) => (
                  <button
                    key={label}
                    type="button"
                    disabled={disabled}
                    onClick={onClick}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-[10px] font-semibold transition-all disabled:opacity-30 ${
                      active
                        ? activeClass
                        : 'border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Panels (DTMF / Notes) */}
              <AnimatePresence>
                {showDTMF && <DtmfPad key="dtmf" onDigit={sendDTMF} onClose={() => setShowDTMF(false)} />}
                {showNotes && <NotesPanel key="notes" value={notes} onChange={setNotes} onClose={() => setShowNotes(false)} />}
                {showShortcuts && <ShortcutsPanel key="shortcuts" onClose={() => setShowShortcuts(false)} />}
              </AnimatePresence>

              {/* End call */}
              <button
                type="button"
                onClick={hangup}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-4 text-sm font-bold text-white shadow-lg shadow-red-900/30 transition hover:from-red-500 hover:to-rose-500 active:scale-[0.98]"
              >
                <PhoneOff className="h-4 w-4" />
                End Call
              </button>

              {/* Shortcuts hint */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-700">
                  SPACE mute · H hangup · N notes
                </span>
                <button type="button" onClick={() => setShowShortcuts((v) => !v)} className="text-slate-700 hover:text-slate-400 transition">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
