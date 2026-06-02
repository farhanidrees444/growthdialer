'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  PhoneOff, Mic, MicOff, Pause, Play, Hash, FileText,
  Minimize2, Maximize2, X, Wifi, Voicemail, Headset, ExternalLink,
} from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { createClient } from '@/lib/supabase/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gd-call-overlay-pos';
const OVERLAY_W = 488;
const OVERLAY_H = 610;
const SNAP_MARGIN = 12;
const SNAP_THRESHOLD = 90;
const BAR_COUNT = 28;

// ─── Types ────────────────────────────────────────────────────────────────────

type OverlayMode = 'full' | 'minimized' | 'popout';

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
    if (raw) return JSON.parse(raw) as { x: number; y: number };
  } catch { /* ignore */ }
  return null;
}

function savePos(x: number, y: number) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y })); } catch { /* ignore */ }
}

// ─── Web Audio Live Waveform ──────────────────────────────────────────────────
// Taps real microphone audio via Web Audio API AnalyserNode.
// Directly mutates bar DOM elements via RAF — zero React re-renders.

function LiveWaveform({ active }: { active: boolean }) {
  const barsRef = useRef<HTMLDivElement[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    let mounted = true;
    let analyser: AnalyserNode | null = null;
    let synthT = 0;

    async function start() {
      // Try to tap the microphone that's already open for the call
      if (activeRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false },
            video: false,
          });
          if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;

          const audioCtx = new AudioContext();
          ctxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const an = audioCtx.createAnalyser();
          an.fftSize = 64;
          an.smoothingTimeConstant = 0.82;
          source.connect(an);
          analyser = an;
        } catch {
          // Mic access denied or unavailable — fall through to synthetic
        }
      }

      const data = new Uint8Array(analyser?.frequencyBinCount ?? 0);

      function draw() {
        if (!mounted) return;
        const bars = barsRef.current;

        if (analyser && activeRef.current) {
          // Real audio data
          analyser.getByteFrequencyData(data);
          bars.forEach((bar, i) => {
            const idx = Math.min(Math.floor((i / BAR_COUNT) * data.length), data.length - 1);
            const level = Math.max(0.06, (data[idx] ?? 0) / 255);
            bar.style.transform = `scaleY(${level.toFixed(3)})`;
          });
        } else if (activeRef.current) {
          // Synthetic fallback: smooth sine-based animation
          synthT += 0.042;
          bars.forEach((bar, i) => {
            const level = Math.max(0.08, 0.18 + 0.38 * Math.abs(Math.sin(synthT + i * 0.44)));
            bar.style.transform = `scaleY(${level.toFixed(3)})`;
          });
        } else {
          // Inactive — flat line
          bars.forEach((bar) => { bar.style.transform = 'scaleY(0.07)'; });
        }

        rafRef.current = requestAnimationFrame(draw);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    void start();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close();
    };
  }, [active]); // restart when active changes

  return (
    <div className="flex items-end justify-center gap-[3px]" style={{ height: 32 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { if (el) barsRef.current[i] = el; }}
          className="w-[3px] rounded-full"
          style={{
            height: 32,
            background: 'linear-gradient(to top, #22d3ee, #818cf8)',
            transform: 'scaleY(0.07)',
            transformOrigin: 'bottom',
            willChange: 'transform',
            transition: active ? 'none' : 'transform 0.4s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── Network Quality Hook ─────────────────────────────────────────────────────

type QualityLevel = 'good' | 'fair' | 'poor';

function useConnectionQuality(): QualityLevel {
  const [quality, setQuality] = useState<QualityLevel>('good');

  useEffect(() => {
    type NetConn = EventTarget & { effectiveType?: string; rtt?: number };
    const conn = (navigator as unknown as { connection?: NetConn }).connection;

    function check() {
      if (!conn) return;
      const { effectiveType, rtt } = conn;
      if ((effectiveType === '4g' || effectiveType === undefined) && (!rtt || rtt < 150)) {
        setQuality('good');
      } else if (effectiveType === '3g' || (rtt !== undefined && rtt >= 150 && rtt < 400)) {
        setQuality('fair');
      } else if (effectiveType === '2g' || effectiveType === 'slow-2g' || (rtt !== undefined && rtt >= 400)) {
        setQuality('poor');
      }
    }

    check();
    conn?.addEventListener('change', check);
    const id = setInterval(check, 4000);
    return () => {
      conn?.removeEventListener('change', check);
      clearInterval(id);
    };
  }, []);

  return quality;
}

// ─── Quality Indicator ────────────────────────────────────────────────────────

function QualityDot({ level }: { level: QualityLevel }) {
  const colors: Record<QualityLevel, string> = {
    good: 'text-emerald-400',
    fair: 'text-amber-400',
    poor: 'text-red-400',
  };
  const dotColors: Record<QualityLevel, string> = {
    good: 'bg-emerald-400',
    fair: 'bg-amber-400',
    poor: 'bg-red-400',
  };
  const labels: Record<QualityLevel, string> = {
    good: 'Good connection',
    fair: 'Fair connection',
    poor: 'Poor connection',
  };

  return (
    <div className="group relative flex items-center gap-1 cursor-default">
      <Wifi className={`h-3 w-3 ${colors[level]}`} />
      <div className={`h-1.5 w-1.5 rounded-full ${dotColors[level]}`} />
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
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

// ─── Minimized Pill (desktop) ─────────────────────────────────────────────────

function MinimizedPill({
  name, elapsed, callStatus, onExpand, onHangup,
}: {
  name: string; elapsed: number; callStatus: string;
  onExpand: () => void; onHangup: () => void;
}) {
  return (
    <motion.div
      key="pill"
      initial={{ x: 60, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 60, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)]/96 px-3.5 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
      style={{ minWidth: 188 }}
    >
      <div className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-white" style={{ maxWidth: 92 }}>{name}</p>
        <p className="text-[10px] text-slate-500 tabular-nums">
          {callStatus === 'connecting' ? 'Dialing…' : callStatus === 'ringing' ? 'Ringing…' : fmtTime(elapsed)}
        </p>
      </div>
      <button type="button" onClick={onExpand} aria-label="Expand"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 transition hover:text-white">
        <Maximize2 className="h-3 w-3" />
      </button>
      <button type="button" onClick={onHangup} aria-label="End call"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-900/40 transition hover:bg-red-400 active:scale-95">
        <PhoneOff className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ─── Minimized Bar (mobile) ───────────────────────────────────────────────────

function MobileMinimizedBar({
  name, elapsed, callStatus, onExpand, onHangup,
}: {
  name: string; elapsed: number; callStatus: string;
  onExpand: () => void; onHangup: () => void;
}) {
  return (
    <motion.div
      key="mobile-bar"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      // Sits above the mobile bottom nav (56px) + safe area
      className="fixed left-0 right-0 z-50 flex items-center gap-3 border-t border-white/[0.10] bg-[oklch(0.09_0.02_282)]/98 px-4 py-3 backdrop-blur-xl"
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="text-[11px] text-slate-500 tabular-nums">
          {callStatus === 'connecting' ? 'Dialing…' : callStatus === 'ringing' ? 'Ringing…' : fmtTime(elapsed)}
        </p>
      </div>
      <button type="button" onClick={onExpand} aria-label="Expand"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:text-white">
        <Maximize2 className="h-4 w-4" />
      </button>
      <button type="button" onClick={onHangup} aria-label="End call"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-900/40 transition hover:bg-red-400 active:scale-95">
        <PhoneOff className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Pop-out Return Badge ─────────────────────────────────────────────────────
// Shown when mode === 'popout'. Tab title still pulses. Clicking returns to full.

function PopoutBadge({ onReturn }: { onReturn: () => void }) {
  return (
    <motion.button
      key="popout-badge"
      type="button"
      onClick={onReturn}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-white/[0.12] bg-[oklch(0.09_0.02_282)]/96 px-3.5 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-xl transition hover:border-white/20"
      aria-label="Return to call"
    >
      <div className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </div>
      <span className="text-[11px] font-bold text-white">Live Call</span>
      <Maximize2 className="h-3 w-3 text-slate-500" />
    </motion.button>
  );
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────

export default function ActiveCallOverlay() {
  const pathname = usePathname();
  const { callStatus, activeCallId: telnyxCallId, isMuted, isOnHold, toggleMute, toggleHold, sendDTMF, hangup } = useWebPhone();
  const { activeLead, activePhone, callAnsweredAt } = useCallContext();
  const quality = useConnectionQuality();

  const [mode, setMode] = useState<OverlayMode>('full');
  const [showDTMF, setShowDTMF] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [dbCallId, setDbCallId] = useState<string | null>(null);
  const [vmDropping, setVmDropping] = useState(false);
  const [vmDropped, setVmDropped] = useState(false);
  const [coachRequested, setCoachRequested] = useState(false);

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveNotesRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag position (desktop only)
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Restore saved position ─────────────────────────────────────────────────
  useEffect(() => {
    const saved = loadSavedPos();
    if (saved) {
      dragX.set(saved.x);
      dragY.set(saved.y);
    } else {
      dragX.set(Math.max(8, window.innerWidth - OVERLAY_W - 20));
      dragY.set(Math.max(8, window.innerHeight / 2 - OVERLAY_H / 2));
    }
  }, [dragX, dragY]);

  // ── Timer ──────────────────────────────────────────────────────────────────
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

  // ── Reset on new call ──────────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus === 'connecting') {
      setNotes('');
      setMode('full');
      setShowDTMF(false);
      setShowNotes(false);
      setElapsed(0);
      setDbCallId(null);
      setVmDropped(false);
      setVmDropping(false);
      setCoachRequested(false);
    }
  }, [callStatus]);

  // ── Look up DB call ID from Telnyx call ID ─────────────────────────────────
  useEffect(() => {
    if (!telnyxCallId || dbCallId) return;
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase
        .from('calls')
        .select('id')
        .eq('telnyx_call_id', telnyxCallId)
        .single();
      if (data?.id) setDbCallId(data.id as string);
    })();
  }, [telnyxCallId, dbCallId]);

  // ── Document title pulse ───────────────────────────────────────────────────
  useEffect(() => {
    const isActive = callStatus === 'active' || callStatus === 'held';
    if (!isActive) { document.title = 'GrowthDialer'; return; }
    const name = activeLead?.name || activePhone || 'Call';
    const interval = setInterval(() => {
      document.title = document.title.startsWith('🔴')
        ? `  ${fmtTime(elapsed)} · ${name} — GrowthDialer`
        : `🔴 ${fmtTime(elapsed)} · ${name} — GrowthDialer`;
    }, 1000);
    return () => { clearInterval(interval); document.title = 'GrowthDialer'; };
  }, [callStatus, activeLead, activePhone, elapsed]);

  // ── Auto-save notes ────────────────────────────────────────────────────────
  const handleNotesChange = useCallback((v: string) => {
    setNotes(v);
    if (saveNotesRef.current) clearTimeout(saveNotesRef.current);
    saveNotesRef.current = setTimeout(async () => {
      if (!dbCallId) return;
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      await fetch(`/api/calls/${dbCallId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ notes: v }),
      });
    }, 800);
  }, [dbCallId]);

  // ── VM Drop ────────────────────────────────────────────────────────────────
  const handleVmDrop = useCallback(async () => {
    if (vmDropping || vmDropped || !telnyxCallId) return;
    setVmDropping(true);
    try {
      await fetch('/api/calls/drop-voicemail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_control_id: telnyxCallId }),
      });
      setVmDropped(true);
    } finally {
      setVmDropping(false);
    }
  }, [vmDropping, vmDropped, telnyxCallId]);

  // ── Coach Request ──────────────────────────────────────────────────────────
  const handleRequestCoach = useCallback(async () => {
    if (coachRequested || !dbCallId) return;
    setCoachRequested(true);
    await fetch('/api/coaching/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_id: dbCallId }),
    }).catch(() => {});
  }, [coachRequested, dbCallId]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const isVisible = ['connecting'ringing'active'held'].includes(callStatus);
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'Escape': e.preventDefault(); setMode((m) => m === 'full' ? 'minimized' : 'full'); break;
        case 'm': case 'M': if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleMute(); } break;
        case 'h': case 'H': if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleHold(); } break;
        case 'n': case 'N':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setShowNotes((v) => !v);
            setTimeout(() => notesRef.current?.focus(), 50);
          }
          break;
        case 'v': case 'V': if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); void handleVmDrop(); } break;
        case 'c': case 'C': if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); void handleRequestCoach(); } break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callStatus, toggleMute, toggleHold, handleVmDrop, handleRequestCoach]);

  // ── Drag end: snap to nearest edge zone ───────────────────────────────────
  const handleDragEnd = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = dragX.get();
    let y = dragY.get();

    // X: snap left or right if within threshold
    if (x < SNAP_THRESHOLD) x = SNAP_MARGIN;
    else if (x > vw - OVERLAY_W - SNAP_THRESHOLD) x = vw - OVERLAY_W - SNAP_MARGIN;

    // Y: snap top or bottom if within threshold
    if (y < SNAP_THRESHOLD) y = SNAP_MARGIN;
    else if (y > vh - OVERLAY_H - SNAP_THRESHOLD) y = vh - OVERLAY_H - SNAP_MARGIN;

    void animate(dragX, x, { type: 'spring', stiffness: 420, damping: 36 });
    void animate(dragY, y, { type: 'spring', stiffness: 420, damping: 36 });
    savePos(x, y);
  }, [dragX, dragY]);

  // ── Guard ──────────────────────────────────────────────────────────────────
  const isVisible = ['connecting'ringing'active'held'].includes(callStatus);
  // Hide on /dialer when a lead is selected (dialer page has its own LiveCallStage).
  // For manual calls from dialer (no activeLead), show the floating overlay.
  if (pathname?.startsWith('/dialer') && activeLead) return null;
  if (!isVisible) return null;

  const displayName = activeLead?.name || activePhone || 'Manual Dial';
  const displayCompany = activeLead?.company || '';
  const displayPhone = activePhone || activeLead?.phone || '';
  const isCallActive = callStatus === 'active' || callStatus === 'held';

  const statusLabel =
    callStatus === 'connecting' ? 'Dialing…'
    : callStatus === 'ringing'  ? 'Ringing…'
    : callStatus === 'held'     ? 'On Hold'
    : displayName;

  // ── Control buttons config ─────────────────────────────────────────────────
  const controls = [
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
      onClick: () => { setShowNotes((v) => !v); setShowDTMF(false); setTimeout(() => notesRef.current?.focus(), 50); },
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
    {
      icon: Voicemail,
      label: vmDropped ? 'Dropped!' : 'VM Drop',
      active: vmDropped,
      activeClass: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
      onClick: handleVmDrop,
      disabled: !isCallActive || vmDropped || vmDropping,
      shortcut: 'V',
    },
    {
      icon: Headset,
      label: coachRequested ? 'Requested' : 'Coach',
      active: coachRequested,
      activeClass: 'border-violet-500/30 bg-violet-500/15 text-violet-400',
      onClick: handleRequestCoach,
      disabled: !isCallActive || coachRequested,
      shortcut: 'C',
    },
  ] as const;

  return (
    <AnimatePresence mode="wait">
      {/* ── State 2: Minimized pill / mobile bar ─────────────────── */}
      {mode === 'minimized' && (isMobile ? (
        <MobileMinimizedBar
          key="mobile-bar"
          name={displayName}
          elapsed={elapsed}
          callStatus={callStatus}
          onExpand={() => setMode('full')}
          onHangup={hangup}
        />
      ) : (
        <MinimizedPill
          key="pill"
          name={displayName}
          elapsed={elapsed}
          callStatus={callStatus}
          onExpand={() => setMode('full')}
          onHangup={hangup}
        />
      ))}

      {/* ── State 3: Pop-out badge ──────────────────────────────── */}
      {mode === 'popout' && (
        <PopoutBadge key="popout" onReturn={() => setMode('full')} />
      )}

      {/* ── State 1: Full overlay ───────────────────────────────── */}
      {mode === 'full' && (
        <motion.div
          key="overlay"
          drag={!isMobile}
          dragMomentum={false}
          dragElastic={0}
          style={isMobile ? undefined : { x: dragX, y: dragY, position: 'fixed', top: 0, left: 0 }}
          onDragEnd={handleDragEnd}
          dragConstraints={{
            left: SNAP_MARGIN,
            top: SNAP_MARGIN,
            right: typeof window !== 'undefined' ? window.innerWidth - OVERLAY_W - SNAP_MARGIN : 800,
            bottom: typeof window !== 'undefined' ? window.innerHeight - OVERLAY_H - SNAP_MARGIN : 400,
          }}
          initial={{ opacity: 0, scale: 0.94, y: isMobile ? 40 : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: isMobile ? 40 : 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className={[
            'z-50 w-full max-w-[480px] rounded-3xl border border-white/[0.12]',
            'bg-[oklch(0.085_0.02_282)]/98 shadow-2xl shadow-black/70 backdrop-blur-2xl overflow-hidden',
            isMobile ? 'fixed bottom-4 left-4 right-4 mx-auto' : 'cursor-default select-none',
          ].join(' ')}
          aria-label="Active call overlay"
          aria-live="polite"
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className={`flex items-center justify-between px-4 pt-4 pb-2 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}>
            <div className="flex items-center gap-2">
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
              {/* Pop-out: hide overlay, show badge only */}
              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setMode('popout')}
                  aria-label="Pop out"
                  title="Hide overlay (call continues)"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-slate-600 transition hover:border-white/[0.12] hover:text-slate-300"
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
              {/* Minimize → pill / mobile bar */}
              <button
                type="button"
                onClick={() => setMode('minimized')}
                aria-label="Minimize"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-slate-600 transition hover:border-white/[0.12] hover:text-slate-300"
              >
                <Minimize2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ── Lead info + timer ───────────────────────────────────── */}
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

            <div className={`shrink-0 text-xl font-mono font-bold tabular-nums ${callStatus === 'held' ? 'text-amber-400' : 'text-white'}`}>
              {isCallActive ? fmtTime(elapsed) : (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-slate-500"
                >···</motion.span>
              )}
            </div>
          </div>

          {/* ── Live waveform (Web Audio API) ───────────────────────── */}
          {isCallActive && (
            <div className="px-5 pb-3">
              <LiveWaveform active={callStatus === 'active' && !isOnHold} />
            </div>
          )}

          {/* ── Controls ────────────────────────────────────────────── */}
          <div className="relative px-4 pb-4">
            <div className="mb-3 grid grid-cols-3 gap-2">
              {controls.map(({ icon: Icon, label, active, activeClass, onClick, disabled, shortcut }) => (
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

            {/* DTMF Pad */}
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
                  <p className="mt-1 text-[10px] text-slate-700">
                    {dbCallId ? 'Auto-saves to call record' : 'Saving locally…'}
                  </p>
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
              <kbd className="font-mono">V</kbd> VM ·{' '}
              <kbd className="font-mono">Esc</kbd> minimize
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
