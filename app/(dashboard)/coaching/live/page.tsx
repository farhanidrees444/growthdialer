'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headset, RefreshCw, Eye, Mic2, PhoneCall,
  Clock, Loader2, Users, CheckCircle2, XCircle,
  ChevronDown, Star, X as XIcon,
  type LucideIcon,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ActiveCall {
  id: string;
  user_id: string;
  lead_id: string | null;
  to_number: string;
  from_number: string;
  telnyx_call_id: string | null;
  status: string;
  created_at: string;
  started_at: string | null;
  answered_at: string | null;
  agent_name: string;
  agent_email: string;
  lead_first_name: string;
  lead_last_name: string;
  lead_company: string;
  coaching: { coach_id: string; mode: string } | null;
}

type CoachMode = 'listen' | 'whisper' | 'barge';

interface CoachingPanelProps {
  call: ActiveCall;
  sessionId: string | null;
  currentMode: CoachMode;
  onModeChange: (mode: CoachMode) => Promise<void>;
  onEnd: (rating: number, feedback: string) => Promise<void>;
  busy: boolean;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function callTimerAnchor(call: Pick<ActiveCall, 'answered_at' | 'started_at' | 'created_at'>): string {
  return call.answered_at ?? call.started_at ?? call.created_at;
}

function fmtElapsed(anchorAt: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(anchorAt).getTime()) / 1000));
  if (secs >= 3600) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}

// ── Live Waveform ─────────────────────────────────────────────────────────────

function MiniWaveform() {
  const BAR_COUNT = 18;
  return (
    <div className="flex items-center gap-[2px]" style={{ height: 16 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ background: `linear-gradient(to top, oklch(0.72 0.22 200), oklch(0.65 0.22 290))`, originY: 1 }}
          animate={{
            scaleY: [0.15, 0.4 + Math.sin(i * 0.7) * 0.3, 0.9, 0.25, 0.6 + Math.cos(i * 0.5) * 0.2, 0.15],
          }}
          transition={{
            duration: 1.1 + (i % 7) * 0.12,
            repeat: Infinity,
            delay: i * 0.06,
            ease: 'easeInOut',
          }}
          initial={{ scaleY: 0.12, height: 16 }}
        />
      ))}
    </div>
  );
}

// ── Coaching Panel ────────────────────────────────────────────────────────────

function CoachingPanel({ call, sessionId, currentMode, onModeChange, onEnd, busy, onClose }: CoachingPanelProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    const anchor = callTimerAnchor(call);
    const id = setInterval(() => setElapsed(fmtElapsed(anchor)), 1000);
    return () => clearInterval(id);
  }, [call.answered_at, call.started_at, call.created_at]);

  const agentName = call.agent_name || call.agent_email || 'Agent';
  const leadName = [call.lead_first_name, call.lead_last_name].filter(Boolean).join(' ') || call.to_number;

  const MODE_CONFIG: Record<CoachMode, { label: string; icon: LucideIcon; color: string; description: string }> = {
    listen:  { label: 'Listen',  icon: Eye,      color: 'border-blue-500/30 bg-blue-500/10 text-blue-300',    description: 'Silent — agent unaware' },
    whisper: { label: 'Whisper', icon: Mic2,     color: 'border-violet-500/30 bg-violet-500/10 text-violet-300', description: 'You speak to agent only' },
    barge:   { label: 'Barge',   icon: PhoneCall, color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',  description: '3-way — all parties hear you' },
  };

  async function handleEnd() {
    setEnding(true);
    await onEnd(rating, feedback);
    setEnding(false);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className="fixed right-4 top-20 bottom-4 z-50 w-80 rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.006_285)] shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Headset className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">Coaching</span>
          <span className="text-xs text-slate-500">{agentName.split(' ')[0]}</span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-600 hover:text-white transition">
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Call info */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-white">{leadName}</p>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono text-slate-500">{elapsed}</span>
            </div>
          </div>
          <MiniWaveform />
        </div>

        {/* Mode selector */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Coaching Mode</p>
          <div className="space-y-1.5">
            {(Object.entries(MODE_CONFIG) as [CoachMode, typeof MODE_CONFIG.listen][]).map(([mode, cfg]) => {
              const Icon = cfg.icon;
              const isActive = currentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={busy}
                  onClick={() => void onModeChange(mode)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all disabled:opacity-50",
                    isActive ? cfg.color : "border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-white/[0.10] hover:text-slate-300",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{cfg.label}</p>
                    <p className="text-[10px] opacity-70">{cfg.description}</p>
                  </div>
                  {isActive && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                  {busy && isActive && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Post-call feedback */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Post-call Feedback</p>
          {/* Star rating */}
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-0.5 transition"
              >
                <Star
                  className={cn("h-5 w-5", star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-700")}
                />
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="Feedback for the agent (visible to them after the call)…"
            className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25 transition"
          />
        </div>
      </div>

      {/* Footer: end session */}
      <div className="border-t border-white/[0.07] p-4">
        <button
          type="button"
          onClick={handleEnd}
          disabled={ending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/25 transition hover:from-red-500 hover:to-rose-500 disabled:opacity-50"
        >
          {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon className="h-4 w-4" />}
          End Coaching Session
        </button>
      </div>
    </motion.div>
  );
}

// ── Call Card ─────────────────────────────────────────────────────────────────

function CallCard({
  call,
  onStartCoaching,
  busy,
}: {
  call: ActiveCall;
  onStartCoaching: (callId: string, mode: CoachMode) => void;
  busy: string | null;
}) {
  const [elapsed, setElapsed] = useState('00:00');
  const agentName = call.agent_name || call.agent_email || 'Agent';
  const leadName = [call.lead_first_name, call.lead_last_name].filter(Boolean).join(' ') || 'Unknown';
  const leadCompany = call.lead_company;

  useEffect(() => {
    const anchor = callTimerAnchor(call);
    const id = setInterval(() => setElapsed(fmtElapsed(anchor)), 1000);
    return () => clearInterval(id);
  }, [call.answered_at, call.started_at, call.created_at]);

  const isBeingCoached = !!call.coaching;
  const isBusy = busy === call.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.08] bg-[oklch(0.09_0.006_285)] p-5 shadow-lg"
    >
      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-sm font-bold text-white shadow">
            {getInitials(agentName)}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[oklch(0.09_0.006_285)] bg-emerald-500" />
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{agentName}</p>
            <p className="text-xs text-slate-500">→ {leadName}{leadCompany ? ` · ${leadCompany}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-mono font-bold text-white tabular-nums">{elapsed}</span>
        </div>
      </div>

      {/* Waveform */}
      <div className="mb-4">
        <MiniWaveform />
      </div>

      {/* Coaching status */}
      {isBeingCoached && (
        <div className="mb-3 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-[11px] text-violet-300">
          <Headset className="mr-1.5 inline h-3 w-3" />
          Being coached · {call.coaching!.mode}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { mode: 'listen' as CoachMode,  label: 'Listen',  icon: Eye,       color: 'border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15' },
          { mode: 'whisper' as CoachMode, label: 'Whisper', icon: Mic2,      color: 'border-violet-500/25 bg-violet-500/10 text-violet-300 hover:bg-violet-500/15' },
          { mode: 'barge' as CoachMode,   label: 'Barge',   icon: PhoneCall, color: 'border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15' },
        ] as const).map(({ mode, label, icon: Icon, color }) => (
          <button
            key={mode}
            type="button"
            disabled={isBusy}
            onClick={() => onStartCoaching(call.id, mode)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10px] font-semibold transition-all disabled:opacity-50",
              color,
            )}
          >
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CoachingLivePage() {
  const { can, currentWorkspace } = useWorkspace();
  const [calls, setCalls] = useState<ActiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Active coaching session state
  const [activeSession, setActiveSession] = useState<{
    call: ActiveCall;
    sessionId: string | null;
    mode: CoachMode;
  } | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/coaching/active-calls');
      if (res.ok) {
        const data = await res.json() as { calls: ActiveCall[] };
        setCalls(data.calls ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  }, []);

  useEffect(() => {
    void fetchCalls();
    pollRef.current = setInterval(fetchCalls, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchCalls]);

  async function startCoaching(callId: string, mode: CoachMode) {
    setActionBusy(callId);
    try {
      const res = await fetch('/api/coaching/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callId, mode }),
      });
      const data = await res.json() as { ok?: boolean; session?: { id: string }; error?: string };
      if (!res.ok || !data.ok) { console.error('[coaching]', data.error); return; }
      const call = calls.find((c) => c.id === callId);
      if (call) {
        setActiveSession({ call, sessionId: data.session?.id ?? null, mode });
      }
    } finally {
      setActionBusy(null);
    }
  }

  async function changeMode(mode: CoachMode) {
    if (!activeSession?.sessionId) return;
    setActionBusy(activeSession.call.id);
    try {
      await fetch(`/api/coaching/sessions/${activeSession.sessionId}/mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      setActiveSession((prev) => prev ? { ...prev, mode } : prev);
    } finally {
      setActionBusy(null);
    }
  }

  async function endSession(rating: number, feedback: string) {
    if (!activeSession?.sessionId) { setActiveSession(null); return; }
    await fetch(`/api/coaching/sessions/${activeSession.sessionId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: rating || undefined, feedback: feedback || undefined }),
    });
    setActiveSession(null);
    void fetchCalls();
  }

  const canCoach = can('COACH_CALLS');

  if (!canCoach) {
    return (
      <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Headset className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm font-semibold text-white">Access restricted</p>
            <p className="mt-1 text-xs text-slate-600">Manager role or above required to access live coaching</p>
          </div>
      </div>
    );
  }

  const lastRefreshLabel = new Date(lastRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-white">{calls.length} active call{calls.length !== 1 ? 's' : ''}</span>
            </div>
            {currentWorkspace && (
              <span className="text-xs text-slate-600">{currentWorkspace.name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-700">Updated {lastRefreshLabel}</span>
            <button
              type="button"
              onClick={() => void fetchCalls()}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-slate-600 transition hover:border-white/[0.12] hover:text-slate-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <Headset className="h-7 w-7 text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-white">No active calls</p>
              <p className="mt-1.5 text-xs text-slate-600">When your team makes calls, they'll appear here for coaching</p>
              <p className="mt-3 text-[10px] text-slate-700">Auto-refreshes every 5 seconds</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {calls.map((call) => (
                <CallCard
                  key={call.id}
                  call={call}
                  onStartCoaching={startCoaching}
                  busy={actionBusy}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coaching panel */}
      <AnimatePresence>
        {activeSession && (
          <CoachingPanel
            call={activeSession.call}
            sessionId={activeSession.sessionId}
            currentMode={activeSession.mode}
            onModeChange={changeMode}
            onEnd={endSession}
            busy={!!actionBusy}
            onClose={() => setActiveSession(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
