'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { REMOTE_AUDIO_ELEMENT_ID } from '@/lib/voice/remote-audio';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  PhoneOff, Mic, MicOff, Pause, Play, Hash, FileText,
  Minimize2, Maximize2, X, Wifi, Voicemail, Headset, ExternalLink,
  Phone, Loader2, Clock, User, Building2,
} from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useInboundRinging } from '@/contexts/inbound-ringing-context';
import { useCallContext } from '@/lib/call-context';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/workspace-context';
import { PersistentCallBar } from '@/components/premium/persistent-call-bar';
import { SentimentAmbient } from '@/components/premium/sentiment-ambient';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gd-call-overlay-pos';
const OVERLAY_W = 420;
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
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(active);
  const synthTRef = useRef(0);
  activeRef.current = active;

  useEffect(() => {
    let mounted = true;

    function setupAnalyser(): AnalyserNode | null {
      const audioEl = document.getElementById(REMOTE_AUDIO_ELEMENT_ID) as HTMLAudioElement | null;
      if (!audioEl) return null;
      try {
        if (!ctxRef.current) ctxRef.current = new AudioContext();
        const ctx = ctxRef.current;
        if (!sourceRef.current) sourceRef.current = ctx.createMediaElementSource(audioEl);
        if (!analyserRef.current) {
          const an = ctx.createAnalyser();
          an.fftSize = 64;
          an.smoothingTimeConstant = 0.82;
          sourceRef.current.connect(an);
          an.connect(ctx.destination);
          analyserRef.current = an;
        }
        return analyserRef.current;
      } catch {
        return null;
      }
    }

    const data = new Uint8Array(32);

    function draw() {
      if (!mounted) return;
      const bars = barsRef.current;
      const intensity = activeRef.current ? 1 : 0.4;
      const analyser = analyserRef.current ?? setupAnalyser();

      if (analyser) {
        analyser.getByteFrequencyData(data);
        let hasSignal = false;
        bars.forEach((bar, i) => {
          const idx = Math.min(Math.floor((i / BAR_COUNT) * data.length), data.length - 1);
          const raw = (data[idx] ?? 0) / 255;
          if (raw > 0.04) hasSignal = true;
          const level = Math.max(0.06, raw * intensity);
          bar.style.transform = `scaleY(${level.toFixed(3)})`;
        });
        if (!hasSignal || !activeRef.current) {
          synthTRef.current += activeRef.current ? 0.028 : 0.018;
          bars.forEach((bar, i) => {
            const level = Math.max(0.07, 0.1 + intensity * (0.14 + 0.28 * Math.abs(Math.sin(synthTRef.current + i * 0.44))));
            bar.style.transform = `scaleY(${level.toFixed(3)})`;
          });
        }
      } else {
        synthTRef.current += activeRef.current ? 0.042 : 0.022;
        bars.forEach((bar, i) => {
          const level = Math.max(0.07, 0.1 + intensity * (0.14 + 0.34 * Math.abs(Math.sin(synthTRef.current + i * 0.44))));
          bar.style.transform = `scaleY(${level.toFixed(3)})`;
        });
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

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

function InboundWaveformBars() {
  return (
    <div className="flex h-10 items-end justify-center gap-1.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-emerald-400"
          animate={{ height: ['14px', '36px', '18px', '40px', '14px'] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function fmtInboundPhone(e164: string | null | undefined): string {
  if (!e164) return 'Unknown line';
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return e164;
}


function PulseRings() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl"
      aria-hidden
    >
      <div
        className="absolute rounded-2xl border border-emerald-500/15"
        style={{ width: '100%', height: '100%', boxShadow: '0 0 24px rgba(16, 185, 129, 0.08)' }}
      />
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
      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.006_285)] p-3 shadow-2xl backdrop-blur-xl"
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
  name, elapsed, callStatus, onExpand, onHangup, isMuted, onToggleMute, sentiment,
}: {
  name: string; elapsed: number; callStatus: string;
  onExpand: () => void; onHangup: () => void;
  isMuted: boolean; onToggleMute: () => void;
  sentiment?: string | null;
}) {
  return (
    <PersistentCallBar
      name={name}
      elapsed={elapsed}
      callStatus={callStatus}
      sentiment={sentiment}
      isMuted={isMuted}
      isMobile={false}
      layoutId="gd-call-pill"
      onExpand={onExpand}
      onHangup={onHangup}
      onToggleMute={onToggleMute}
    />
  );
}

// ─── Minimized Bar (mobile) ───────────────────────────────────────────────────

function MobileMinimizedBar({
  name, elapsed, callStatus, onExpand, onHangup, isMuted, onToggleMute, sentiment,
}: {
  name: string; elapsed: number; callStatus: string;
  onExpand: () => void; onHangup: () => void;
  isMuted: boolean; onToggleMute: () => void;
  sentiment?: string | null;
}) {
  return (
    <PersistentCallBar
      name={name}
      elapsed={elapsed}
      callStatus={callStatus}
      sentiment={sentiment}
      isMuted={isMuted}
      isMobile
      layoutId="gd-call-pill"
      onExpand={onExpand}
      onHangup={onHangup}
      onToggleMute={onToggleMute}
    />
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
      className="gd-call-dock z-[var(--z-call-bar)] flex items-center gap-2.5 rounded-2xl border border-white/[0.12] bg-[oklch(0.09_0.006_285)]/96 px-3.5 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-xl transition hover:border-white/20"
      aria-label="Return to call"
    >
      <div className="relative flex h-2 w-2 shrink-0">
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
  const {
    callStatus,
    activeCallId: telnyxCallId,
    isMuted,
    isOnHold,
    toggleMute,
    toggleHold,
    sendDTMF,
    hangup,
    hasOutboundSession,
    phoneStatus,
  } = useWebPhone();
  const {
    call: inboundCall,
    sessionPhase,
    accept: acceptInbound,
    decline: declineInbound,
    accepting: inboundAccepting,
    ringElapsedSec,
    isInboundSession,
  } = useInboundRinging();
  const { activeLead, activePhone, callAnsweredAt } = useCallContext();
  const { apiFetch } = useWorkspace();
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
  const [callSentiment, setCallSentiment] = useState<string | null>(null);

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveNotesRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const lastResetCallIdRef = useRef<string | null>(null);

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
      dragX.set(Math.max(8, window.innerWidth - OVERLAY_W - 24));
      dragY.set(24);
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

  // ── Reset on new call session only ────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'connecting' || !telnyxCallId) return;
    if (telnyxCallId === lastResetCallIdRef.current) return;
    lastResetCallIdRef.current = telnyxCallId;
    setNotes('');
    setMode('full');
    setShowDTMF(false);
    setShowNotes(false);
    setElapsed(0);
    setDbCallId(null);
    setVmDropped(false);
    setVmDropping(false);
    setCoachRequested(false);
  }, [callStatus, telnyxCallId]);

  // ── Look up DB call ID from Telnyx call ID ─────────────────────────────────
  useEffect(() => {
    const onInboundAnswered = (e: Event) => {
      const id = (e as CustomEvent<{ callId?: string }>).detail?.callId;
      if (id) setDbCallId(id);
    };
    window.addEventListener('gd-inbound-answered', onInboundAnswered);
    return () => window.removeEventListener('gd-inbound-answered', onInboundAnswered);
  }, []);

  useEffect(() => {
    if (!telnyxCallId || dbCallId) return;
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase
        .from('calls')
        .select('id')
        .or(`telnyx_call_id.eq.${telnyxCallId},telnyx_webrtc_leg_id.eq.${telnyxCallId}`)
        .maybeSingle();
      if (data?.id) setDbCallId(data.id as string);
    })();
  }, [telnyxCallId, dbCallId]);

  // ── Live AI sentiment tint (when present on call record) ───────────────────
  useEffect(() => {
    if (!dbCallId) {
      setCallSentiment(null);
      return;
    }
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase
        .from('calls')
        .select('ai_sentiment')
        .eq('id', dbCallId)
        .single();
      if (data?.ai_sentiment) setCallSentiment(data.ai_sentiment as string);
    })();
    const ch = supabase
      .channel(`overlay-sentiment-${dbCallId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${dbCallId}` },
        (payload) => {
          const s = (payload.new as { ai_sentiment?: string | null }).ai_sentiment;
          if (s) setCallSentiment(s);
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [dbCallId]);

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
      await apiFetch(`/api/calls/${dbCallId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: v }),
      });
    }, 800);
  }, [dbCallId, apiFetch]);

  // ── VM Drop ────────────────────────────────────────────────────────────────
  const handleVmDrop = useCallback(async () => {
    if (vmDropping || vmDropped || !telnyxCallId) return;
    setVmDropping(true);
    try {
      await apiFetch('/api/calls/drop-voicemail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_control_id: telnyxCallId }),
      });
      setVmDropped(true);
    } finally {
      setVmDropping(false);
    }
  }, [vmDropping, vmDropped, telnyxCallId, apiFetch]);

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
    const isVisible = ['connecting', 'ringing', 'active', 'held'].includes(callStatus);
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
  const isOutboundVisible = ['connecting', 'ringing', 'active', 'held'].includes(callStatus) && hasOutboundSession;
  const inboundOverlayVisible = isInboundSession && !hasOutboundSession;

  if (pathname?.startsWith('/dialer') && activeLead && !inboundOverlayVisible) return null;
  if (!inboundOverlayVisible && !isOutboundVisible) return null;

  // ── Persistent inbound session (ringing → connecting → connected) ─────────
  if (inboundOverlayVisible && inboundCall) {
    const leadName = inboundCall.lead
      ? [inboundCall.lead.first_name, inboundCall.lead.last_name].filter(Boolean).join(' ')
      : null;
    const displayName = inboundCall.from_number ? (leadName ?? 'Unknown Caller') : 'Unknown / Blocked';
    const initials = leadName
      ? leadName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : null;
    const isConnected = sessionPhase === 'connected' && (callStatus === 'active' || callStatus === 'held');
    const isConnecting = sessionPhase === 'connecting' || inboundAccepting;
    const headerLabel = isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Incoming call';

    return (
      <motion.div
        layoutId="gd-call-session-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Live call session"
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
        <motion.div
          layout
          className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/[0.08] shadow-[0_0_120px_rgba(6,182,212,0.25)]"
          style={{ background: 'linear-gradient(165deg, rgba(10,14,24,0.98) 0%, rgba(6,10,18,0.99) 100%)' }}
        >
          {!isConnected && !isConnecting && (
            <>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20"
              />
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.12, 0, 0.12] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 0.35 }}
                className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15"
              />
            </>
          )}

          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-6 flex items-center justify-between">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                <motion.span
                  animate={{ opacity: isConnecting ? 1 : [1, 0.35, 1] }}
                  transition={{ duration: 1.2, repeat: isConnecting ? 0 : Infinity }}
                  className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                />
                {headerLabel}
              </p>
              {!isConnected && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45">
                  <Clock className="h-3 w-3" />
                  {fmtTime(ringElapsedSec)}
                </span>
              )}
              {isConnected && (
                <span className="font-mono text-lg font-bold tabular-nums text-white">{fmtTime(elapsed)}</span>
              )}
            </div>

            <div className="mb-8 flex flex-col items-center text-center">
              <div className="relative mb-5">
                {!isConnected && !isConnecting && (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0, 0.35] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="absolute inset-[-12px] rounded-3xl bg-cyan-400/20"
                  />
                )}
                <div
                  className="relative flex h-28 w-28 items-center justify-center rounded-3xl text-3xl font-bold text-white shadow-xl shadow-cyan-500/25"
                  style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)' }}
                >
                  {initials ?? <User className="h-12 w-12" />}
                </div>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{displayName}</h2>
              {inboundCall.lead?.company && (
                <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-white/55">
                  <Building2 className="h-3.5 w-3.5" />
                  {inboundCall.lead.company}
                </p>
              )}
              <p className="mt-3 font-mono text-base text-white/50">
                {formatInboundCallerDisplay(inboundCall.from_number)}
              </p>
              <p className="mt-1 text-xs text-white/30">To your line {fmtInboundPhone(inboundCall.to_number)}</p>

              {isConnecting && (
                <div className="mt-6 w-full">
                  <InboundWaveformBars />
                  <p className="mt-3 flex items-center justify-center gap-2 text-sm text-cyan-200/75">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Securing voice link…
                  </p>
                </div>
              )}
              {isConnected && (
                <div className="mt-6 w-full">
                  <LiveWaveform active={callStatus === 'active' && !isOnHold} />
                </div>
              )}
              {!isConnected && !isConnecting && phoneStatus !== 'ready' && (
                <p className="mt-4 text-xs text-amber-400/85">Voice connection warming up…</p>
              )}
            </div>

            {isConnected ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: isMuted ? MicOff : Mic, label: isMuted ? 'Unmute' : 'Mute', onClick: toggleMute, active: isMuted },
                    { icon: isOnHold ? Play : Pause, label: isOnHold ? 'Resume' : 'Hold', onClick: toggleHold, active: isOnHold },
                    { icon: Hash, label: 'Keypad', onClick: () => setShowDTMF((v) => !v), active: showDTMF },
                  ].map(({ icon: Icon, label, onClick, active }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={onClick}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-[10px] font-semibold transition ${
                        active
                          ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300'
                          : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {showDTMF && (
                    <DtmfPad onDigit={sendDTMF} onClose={() => setShowDTMF(false)} />
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={hangup}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-4 text-sm font-semibold text-white shadow-lg shadow-red-900/25 transition hover:brightness-110 active:scale-[0.98]"
                >
                  <PhoneOff className="h-5 w-5" />
                  End Call
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void declineInbound()}
                  disabled={isConnecting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/12 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/22 active:scale-[0.98] disabled:opacity-40"
                >
                  <PhoneOff className="h-5 w-5" />
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => void acceptInbound()}
                  disabled={isConnecting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5" />
                      Accept
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const isVisible = isOutboundVisible;

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
    <AnimatePresence>
      {/* ── State 2: Minimized pill / mobile bar ─────────────────── */}
      {mode === 'minimized' && (isMobile ? (
        <MobileMinimizedBar
          key="mobile-bar"
          name={displayName}
          elapsed={elapsed}
          callStatus={callStatus}
          sentiment={callSentiment}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onExpand={() => setMode('full')}
          onHangup={hangup}
        />
      ) : (
        <MinimizedPill
          key="pill"
          name={displayName}
          elapsed={elapsed}
          callStatus={callStatus}
          sentiment={callSentiment}
          isMuted={isMuted}
          onToggleMute={toggleMute}
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
        <SentimentAmbient sentiment={callSentiment}>
        <motion.div
          layout={false}
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
          initial={hasMountedRef.current ? false : { opacity: 0, scale: 0.97, y: isMobile ? 24 : 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: isMobile ? 24 : 8 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onAnimationComplete={() => { hasMountedRef.current = true; }}
          className={[
            'relative z-[var(--z-call-bar)] w-full max-w-[420px] rounded-3xl border border-white/[0.14]',
            'bg-gradient-to-b from-[oklch(0.11_0.012_285)]/98 via-[oklch(0.085_0.008_285)]/98 to-[oklch(0.07_0.006_285)]/98',
            'shadow-[0_24px_80px_-12px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl overflow-hidden',
            isMobile
              ? 'fixed left-4 right-4 mx-auto bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+1rem)]'
              : 'cursor-default select-none',
          ].join(' ')}
          aria-label="Active call overlay"
          aria-live="polite"
        >
          {/* Static ambient glow + top accent */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl" aria-hidden>
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/[0.07] blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-violet-500/[0.06] blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          </div>

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className={`flex items-center justify-between px-4 pt-4 pb-2 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="relative flex h-2 w-2">
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${
                    callStatus === 'active' ? 'bg-emerald-500 gd-live-dot'
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
                <div className="absolute inset-0 -m-2 rounded-full bg-amber-500/15 ring-1 ring-amber-500/20" />
              )}
              <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-lg font-bold text-white shadow-lg ${
                callStatus === 'active' ? 'shadow-emerald-900/40' : ''
              }`}>
                {getInitials(displayName)}
                {callStatus === 'active' && !isOnHold && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[oklch(0.085_0.006_285)] bg-emerald-400" />
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
                <span className="text-slate-500 tracking-widest">···</span>
              )}
            </div>
          </div>

          {/* ── Live waveform (remote audio tap) ────────────────────── */}
          {isCallActive && (
            <div className="relative px-5 pb-3">
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
                  className={`relative flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[10px] font-semibold transition-all disabled:opacity-30 ${
                    active
                      ? activeClass
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-500 hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-300 hover:ring-1 hover:ring-white/[0.06]'
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
        </SentimentAmbient>
      )}
    </AnimatePresence>
  );
}
