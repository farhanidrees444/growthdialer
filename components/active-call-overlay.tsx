'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  PhoneOff, Mic, MicOff, Pause, Play, Hash, FileText,
  Minimize2, Maximize2, X, Wifi, WifiOff,
} from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gd-call-overlay-pos';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function loadSavedPos(): { x: number; y: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function savePos(x: number, y: number) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y })); } catch { /* ignore */ }
}

// ─── Animated Waveform ────────────────────────────────────────────────────────

function CallWaveform({ active }: { active: boolean }) {
  const BAR_COUNT = 28;
  return (
    <div className="flex items-center justify-center gap-[2px]" style={{ height: 28 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: `linear-gradient(to top, oklch(0.72 0.22 200), oklch(0.65 0.22 290))`,
            originY: 1,
          }}
          animate={active ? {
            scaleY: [0.15, 0.4 + Math.sin(i * 0.7) * 0.3, 0.9, 0.25, 0.6 + Math.cos(i * 0.5) * 0.2, 0.15],
          } : {
            scaleY: 0.12,
          }}
          transition={active ? {
            duration: 1.1 + (i % 7) * 0.12,
            repeat: Infinity,
            delay: i * 0.04,
            ease: 'easeInOut',
          } : {
            duration: 0.4,
          }}
          initial={{ scaleY: 0.12, height: 28 }}
        />
      ))}
    </div>
  );
}

// ─── Quality Indicator ────────────────────────────────────────────────────────

function QualityDot({ level }: { level: 'good' | 'fair' | 'poor' }) {
  const colors = { good: 'bg-emerald-400', fair: 'bg-amber-400', poor: 'bg-red-400' };
  const labels = { good: 'Good signal', fair: 'Fair signal', poor: 'Poor signal' };
  return (
    <div className="group relative flex items-center gap-1.5 cursor-default">
      <Wifi className={`h-3 w-3 ${level === 'poor' ? 'text-red-400' : level === 'fair' ? 'text-amber-400' : 'text-emerald-400'}`} />
      <div className={`h-1.5 w-1.5 rounded-full ${colors[level]}`} />
      <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
        {labels[level]}
      </div>
    </div>
  );
}

// ─── Pulse rings ─────────────────────────────────────────────────────────────

function PulseRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 0.5, 1].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-emerald-500/20"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.9 + i * 0.3, opacity: 0 }}
          transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%' }}
        />
      ))}
    </div>
  );
}

// ─── DTMF Pad ─────────────────────────────────────────────────────────────────

const DTMF_ROWS = [['1','2','3'],['4','5','6'],['7','8','9'],['*','0','#']];

function DtmfPad({ onDigit, onClose }: { onDigit: (d: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)] p-3 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-between gap-8">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Keypad</span>
        <button type="button" onClick={onClose} className="text-slate-600 hover:text-slate-400 transition">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {DTMF_ROWS.flat().map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onDigit(k)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-bold text-white transition hover:bg-white/[0.08] active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Minimized Pill ───────────────────────────────────────────────────────────

function MinimizedPill({
  name,
  elapsed,
  callStatus,
  onExpand,
  onHangup,
}: {
  name: string;
  elapsed: number;
  callStatus: string;
  onExpand: () => void;
  onHangup: () => void;
}) {
  return (
    <motion.div
      key="pill"
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)]/96 px-3.5 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
      style={{ minWidth: 180 }}
    >
      {/* Live dot */}
      <div className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-white" style={{ maxWidth: 90 }}>{name}</p>
        <p className="text-[10px] text-slate-500 tabular-nums">
          {callStatus === 'connecting' ? 'Dialing…' : callStatus === 'ringing' ? 'Ringing…' : fmtTime(elapsed)}
        </p>
      </div>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand call overlay"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 transition hover:text-white"
      >
        <Maximize2 className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onHangup}
        aria-label="End call"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-900/40 transition hover:bg-red-400 active:scale-95"
      >
        <PhoneOff className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────

export default function ActiveCallOverlay() {
  const pathname = usePathname();
  const { callStatus, isMuted, isOnHold, toggleMute, toggleHold, sendDTMF, hangup } = useWebPhone();
  const { activeLead, activePhone, callAnsweredAt } = useCallContext();

  const [minimized, setMinimized] = useState(false);
  const [showDTMF, setShowDTMF] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [quality] = useState<'good' | 'fair' | 'poor'>('good');
  const [isMobile, setIsMobile] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveNotesRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag position
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Set initial drag position from localStorage or center
  useEffect(() => {
    const saved = loadSavedPos();
    if (saved) {
      dragX.set(saved.x);
      dragY.set(saved.y);
    } else {
      // Default: center of screen
      dragX.set(Math.max(0, window.innerWidth / 2 - 240));
      dragY.set(Math.max(0, window.innerHeight / 2 - 280));
    }
  }, [dragX, dragY]);

  // Timer
  useEffect(() => {
    if (callStatus === 'active' && callAnsweredAt) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - callAnsweredAt.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callStatus !== 'active' && callStatus !== 'held') setElapsed(0);
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

  // Document title update
  useEffect(() => {
    const isActive = callStatus === 'active' || callStatus === 'held';
    if (!isActive) {
      document.title = 'GrowthDialer';
      return;
    }
    const name = activeLead?.name || activePhone || 'Call';
    const interval = setInterval(() => {
      document.title = document.title.startsWith('🔴')
        ? `  ${fmtTime(elapsed)} · ${name} — GrowthDialer`
        : `🔴 ${fmtTime(elapsed)} · ${name} — GrowthDialer`;
    }, 1000);
    return () => {
      clearInterval(interval);
      document.title = 'GrowthDialer';
    };
  }, [callStatus, activeLead, activePhone, elapsed]);

  // Keyboard shortcuts
  useEffect(() => {
    const isVisible = ['connecting', 'ringing', 'active', 'held'].includes(callStatus);
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setMinimized((v) => !v);
          break;
        case 'm': case 'M':
          if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleMute(); }
          break;
        case 'h': case 'H':
          if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleHold(); }
          break;
        case 'n': case 'N':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setShowNotes((v) => !v);
            setTimeout(() => notesRef.current?.focus(), 50);
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callStatus, toggleMute, toggleHold]);

  // Auto-save notes
  const handleNotesChange = useCallback((v: string) => {
    setNotes(v);
    if (saveNotesRef.current) clearTimeout(saveNotesRef.current);
    saveNotesRef.current = setTimeout(() => {
      // Would POST to /api/calls/[activeCallId]/notes in a real impl
    }, 800);
  }, []);

  const handleDragEnd = useCallback(() => {
    savePos(dragX.get(), dragY.get());
  }, [dragX, dragY]);

  const isVisible = ['connecting', 'ringing', 'active', 'held'].includes(callStatus);

  // Hide on dialer page — redundant there
  if (pathname?.startsWith('/dialer')) return null;
  if (!isVisible) return null;

  const displayName = activeLead?.name || 'Unknown Contact';
  const displayCompany = activeLead?.company || '';
  const displayPhone = activePhone || activeLead?.phone || '';
  const isCallActive = callStatus === 'active' || callStatus === 'held';

  const statusLabel =
    callStatus === 'connecting' ? 'Dialing…'
    : callStatus === 'ringing' ? 'Ringing…'
    : callStatus === 'held' ? 'On Hold'
    : displayName;

  return (
    <AnimatePresence mode="wait">
      {minimized ? (
        <MinimizedPill
          name={displayName}
          elapsed={elapsed}
          callStatus={callStatus}
          onExpand={() => setMinimized(false)}
          onHangup={hangup}
        />
      ) : (
        // Full overlay — fixed within viewport container, draggable on desktop
        <motion.div
          key="overlay"
          drag={!isMobile}
          dragMomentum={false}
          dragElastic={0}
          style={isMobile ? undefined : { x: dragX, y: dragY, position: 'fixed', top: 0, left: 0 }}
          onDragEnd={handleDragEnd}
          dragConstraints={{
            left: 8,
            top: 8,
            right: typeof window !== 'undefined' ? window.innerWidth - 488 : 800,
            bottom: typeof window !== 'undefined' ? window.innerHeight - 580 : 400,
          }}
          initial={{ opacity: 0, scale: 0.94, y: isMobile ? 40 : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: isMobile ? 40 : 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className={[
            'z-50 w-full max-w-[480px] rounded-3xl border border-white/[0.12]',
            'bg-[oklch(0.085_0.02_282)]/98 shadow-2xl shadow-black/70 backdrop-blur-2xl overflow-hidden',
            isMobile
              ? 'fixed bottom-4 left-4 right-4 mx-auto'
              : 'cursor-default select-none',
          ].join(' ')}
          aria-label="Active call overlay"
          aria-live="polite"
        >
          {/* ── Drag handle / Header ───────────────────────────── */}
          <div
            className={`flex items-center justify-between px-4 pt-4 pb-2 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            <div className="flex items-center gap-2">
              {/* Live indicator */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex h-2 w-2">
                  {callStatus === 'active' && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  )}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${
                    callStatus === 'active' ? 'bg-emerald-500'
                    : callStatus === 'held' ? 'bg-amber-500'
                    : 'bg-slate-500'
                  }`} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {callStatus === 'active' ? 'Live' : callStatus === 'held' ? 'Held' : 'Connecting'}
                </span>
              </div>
              {isCallActive && <QualityDot level={quality} />}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMinimized(true)}
                aria-label="Minimize call overlay"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-slate-600 transition hover:border-white/[0.12] hover:text-slate-300"
              >
                <Minimize2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ── Avatar + lead info ──────────────────────────────── */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="relative shrink-0">
              {(callStatus === 'ringing' || callStatus === 'connecting') && <PulseRings />}
              {callStatus === 'held' && (
                <motion.div
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 -m-2 rounded-full bg-amber-500/20"
                />
              )}
              <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-lg font-bold text-white shadow-lg ${
                callStatus === 'active' ? 'shadow-emerald-900/40' : ''
              }`}>
                {getInitials(displayName)}
                {callStatus === 'active' && !isOnHold && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[oklch(0.085_0.02_282)] bg-emerald-400" />
                )}
                {isMuted && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                    <MicOff className="h-5 w-5 text-red-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-white leading-tight">{statusLabel}</p>
              {displayCompany && callStatus === 'active' && (
                <p className="mt-0.5 truncate text-xs text-slate-500">{displayCompany}</p>
              )}
              <p className="mt-0.5 text-[11px] text-slate-600 font-mono">{displayPhone}</p>
            </div>

            {/* Timer */}
            <div className={`shrink-0 text-xl font-mono font-bold tabular-nums ${
              callStatus === 'held' ? 'text-amber-400' : 'text-white'
            }`}>
              {isCallActive ? fmtTime(elapsed) : (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-slate-500"
                >
                  {callStatus === 'ringing' ? '···' : '···'}
                </motion.span>
              )}
            </div>
          </div>

          {/* ── Waveform ────────────────────────────────────────── */}
          {isCallActive && (
            <div className="px-5 pb-3">
              <CallWaveform active={callStatus === 'active' && !isOnHold} />
            </div>
          )}

          {/* ── Controls ───────────────────────────────────────── */}
          <div className="relative px-4 pb-4">
            <div className="mb-3 grid grid-cols-4 gap-2">
              {[
                {
                  icon: isMuted ? MicOff : Mic,
                  label: isMuted ? 'Unmute' : 'Mute',
                  active: isMuted,
                  activeClass: 'border-red-500/30 bg-red-500/15 text-red-400',
                  onClick: toggleMute,
                  disabled: !isCallActive,
                  shortcut: 'M',
                },
                {
                  icon: isOnHold ? Play : Pause,
                  label: isOnHold ? 'Resume' : 'Hold',
                  active: isOnHold,
                  activeClass: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
                  onClick: toggleHold,
                  disabled: !isCallActive,
                  shortcut: 'H',
                },
                {
                  icon: FileText,
                  label: 'Notes',
                  active: showNotes,
                  activeClass: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
                  onClick: () => {
                    setShowNotes((v) => !v);
                    setShowDTMF(false);
                    setTimeout(() => notesRef.current?.focus(), 50);
                  },
                  disabled: false,
                  shortcut: 'N',
                },
                {
                  icon: Hash,
                  label: 'Keypad',
                  active: showDTMF,
                  activeClass: 'border-violet-500/30 bg-violet-500/15 text-violet-400',
                  onClick: () => { setShowDTMF((v) => !v); setShowNotes(false); },
                  disabled: callStatus !== 'active',
                  shortcut: '',
                },
              ].map(({ icon: Icon, label, active, activeClass, onClick, disabled, shortcut }) => (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={onClick}
                  aria-label={label}
                  aria-pressed={active}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[10px] font-semibold transition-all disabled:opacity-30 ${
                    active
                      ? activeClass
                      : 'border-white/[0.07] bg-white/[0.03] text-slate-500 hover:border-white/10 hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {shortcut && (
                    <span className="absolute top-1 right-1 text-[8px] text-slate-700 font-mono">{shortcut}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Panels */}
            <AnimatePresence>
              {showDTMF && (
                <DtmfPad key="dtmf" onDigit={sendDTMF} onClose={() => setShowDTMF(false)} />
              )}
            </AnimatePresence>

            {/* Inline notes */}
            <AnimatePresence>
              {showNotes && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <textarea
                    ref={notesRef}
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Quick note for this call…"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25 transition"
                    aria-label="Call notes"
                  />
                  <p className="mt-1 text-[10px] text-slate-700">Auto-saves to call notes</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* End call */}
            <button
              type="button"
              onClick={hangup}
              aria-label="End call"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/25 transition hover:from-red-500 hover:to-rose-500 active:scale-[0.98]"
            >
              <PhoneOff className="h-4 w-4" />
              End Call
            </button>

            {/* Shortcuts hint */}
            <p className="mt-2.5 text-center text-[10px] text-slate-700">
              <kbd className="font-mono">M</kbd> mute ·{' '}
              <kbd className="font-mono">H</kbd> hold ·{' '}
              <kbd className="font-mono">N</kbd> notes ·{' '}
              <kbd className="font-mono">Esc</kbd> minimize
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
