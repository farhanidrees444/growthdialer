'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { toast } from 'sonner';

import { useWebPhone } from '@/contexts/webphone-context';
import { useDialerMode } from '@/hooks/use-dialer-mode';
import { useCallRealtime } from '@/hooks/use-call-realtime';
import { useDialerHotkeys } from '@/hooks/use-dialer-hotkeys';
import { usePowerDial } from '@/hooks/use-power-dial';
import { createClient } from '@/lib/supabase/client';
import { normalizePhone } from '@/lib/phone';

import { HeaderStrip } from '@/components/dialer/header-strip';
import { QueueColumn } from '@/components/dialer/queue-column';
import { BrowseStage } from '@/components/dialer/browse-stage';
import { PreviewStage } from '@/components/dialer/preview-stage';
import { LiveCallStage } from '@/components/dialer/live-call-stage';
import { AiBriefPanel } from '@/components/dialer/ai-brief-panel';
import { LiveInsightsPanel } from '@/components/dialer/live-insights-panel';
import { DispositionModal } from '@/components/dialer/disposition-modal';
import { ManualDialpadOverlay } from '@/components/dialer/manual-dialpad-overlay';
import { ShortcutsHelpModal } from '@/components/dialer/shortcuts-help-modal';

import type { LeadRecord, DispositionType } from '@/lib/dialer/state-machine';

// ── DTMF keypad overlay ────────────────────────────────────────────────────────
const DTMF_KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function DtmfKeypad({ onSend, onClose }: { onSend: (d: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      className="fixed bottom-24 right-6 z-50 w-64 rounded-2xl border border-white/[0.10] p-4 shadow-2xl backdrop-blur-2xl bg-zinc-900/95"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-white/40 uppercase tracking-widest">Keypad</span>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xs">Done</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DTMF_KEYS.map((k) => (
          <motion.button
            key={k}
            onClick={() => onSend(k)}
            whileTap={{ scale: 0.88 }}
            className="h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xl font-light text-white hover:bg-white/[0.12] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          >
            {k}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Call timer ─────────────────────────────────────────────────────────────────
function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (running) {
      setSecs(0);
      ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return { formatted: `${m}:${s}`, seconds: secs };
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface CallDot { id: string; leadName: string; disposition: string | null; time: string }
interface TodayStats { calls: number; connects: number; meetings: number; streak: number }

// ══════════════════════════════════════════════════════════════════════════════
export default function DialerPage() {
  const {
    callStatus, isMuted, isOnHold, phoneStatus,
    makeCall, hangup, toggleMute, toggleHold, sendDTMF,
  } = useWebPhone();

  const { mode, selectedLead, activeCallDbId, selectLead, startCall, endCall } = useDialerMode();

  // Power dial session state
  const [powerConfirmOpen, setPowerConfirmOpen] = useState(false);

  const powerDial = usePowerDial({
    onLeadReady: (lead) => { selectLead(lead); },
    onSessionEnd: () => { selectLead(null); },
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<TodayStats>({ calls: 0, connects: 0, meetings: 0, streak: 0 });
  const [todayCalls, setTodayCalls] = useState<CallDot[]>([]);
  const [queueCounts, setQueueCounts] = useState({ queue: 0, hot: 0, callbacks: 0 });
  const [dispositionOpen, setDispositionOpen] = useState(false);
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dtmfOpen, setDtmfOpen] = useState(false);
  const [pendingCallDbId, setPendingCallDbId] = useState<string | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueLeads, setQueueLeads] = useState<LeadRecord[]>([]);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const callTimer = useTimer(callStatus === 'active');
  const prevCallStatus = useRef(callStatus);
  const callTimerRef = useRef(callTimer);
  callTimerRef.current = callTimer;

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/today');
      if (!res.ok) return;
      const data = await res.json() as { callsToday: number; connectRate: number; meetingsBooked: number };
      setStats((prev) => ({
        ...prev,
        calls: data.callsToday ?? 0,
        connects: Math.round((data.callsToday ?? 0) * ((data.connectRate ?? 0) / 100)),
        meetings: data.meetingsBooked ?? 0,
      }));
    } catch { /* silent */ }
  }, []);

  const loadTodayCalls = useCallback(async () => {
    if (!userId) return;
    try {
      const supabase = createClient();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('calls')
        .select('id, disposition, created_at, leads(name)')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) {
        setTodayCalls(
          data.map((c) => {
            const lead = c.leads;
            const leadName = Array.isArray(lead)
              ? (lead[0]?.name ?? 'Unknown')
              : ((lead as { name: string } | null)?.name ?? 'Unknown');
            return {
              id: c.id,
              leadName,
              disposition: c.disposition,
              time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
          }),
        );
      }
    } catch { /* silent */ }
  }, [userId]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadTodayCalls(); }, [loadTodayCalls]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useCallRealtime({
    userId,
    onCallUpdate: () => { loadStats(); loadTodayCalls(); },
    onLeadUpdate: () => { /* queue self-refreshes */ },
  });

  // ── Call status transitions ─────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevCallStatus.current;
    prevCallStatus.current = callStatus;

    if ((prev === 'connecting' || prev === 'ringing') && callStatus === 'active') {
      if (mode === 'preview' && selectedLead && pendingCallDbId) {
        startCall(pendingCallDbId, pendingCallDbId);
      }
    }

    if ((prev === 'active' || prev === 'connecting' || prev === 'ringing') &&
        (callStatus === 'ended' || callStatus === 'idle')) {
      endCall();
      const seconds = callTimerRef.current.seconds;
      if (seconds >= 10 && pendingCallDbId) {
        setDispositionOpen(true);
      } else if (pendingCallDbId) {
        fetch(`/api/calls/${pendingCallDbId}/disposition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disposition: 'voicemail' }),
        }).catch(() => {});
      }
      loadStats();
      loadTodayCalls();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus]);

  // ── Call initiation ─────────────────────────────────────────────────────────
  const initiateCall = useCallback(async (phone: string, lead?: LeadRecord) => {
    if (phoneStatus !== 'ready') {
      toast.error('Phone not ready — please wait a moment');
      return;
    }
    const e164 = normalizePhone(phone) ?? phone;
    try {
      const res = await fetch('/api/calls/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: e164, lead_id: lead?.id }),
      });
      const data = await res.json() as { call_control_id?: string };
      setPendingCallDbId(data.call_control_id ?? null);
      makeCall(e164);
    } catch {
      toast.error('Failed to initiate call');
    }
  }, [phoneStatus, makeCall]);

  const handleCallLead = useCallback(() => {
    if (!selectedLead) return;
    initiateCall(selectedLead.phone, selectedLead);
  }, [selectedLead, initiateCall]);

  const handleEndCall = useCallback(() => { hangup(); }, [hangup]);

  const handleDropVoicemail = useCallback(async () => {
    if (!pendingCallDbId) return;
    try {
      await fetch('/api/calls/drop-voicemail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_control_id: pendingCallDbId }),
      });
      toast.success('Voicemail dropped');
    } catch {
      toast.error('Failed to drop voicemail');
    }
  }, [pendingCallDbId]);

  // ── Disposition ─────────────────────────────────────────────────────────────
  const handleDispositionSave = useCallback(async (
    disposition: DispositionType,
    notes?: string,
    callbackAt?: string,
  ) => {
    if (!pendingCallDbId) return;
    try {
      await fetch(`/api/calls/${pendingCallDbId}/disposition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disposition, notes, callback_at: callbackAt }),
      });
      toast.success(`Marked as ${disposition.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to save disposition');
    }
    setDispositionOpen(false);
    loadStats();
    loadTodayCalls();

    // If power dial is active, advance to next lead automatically
    if (powerDial.isActive && selectedLead) {
      const wasConnected = ['interested','meeting_booked','callback','gatekeeper'].includes(disposition);
      const wasMeeting = disposition === 'meeting_booked';
      powerDial.advanceToNext(selectedLead.id, wasConnected, wasMeeting);
    }
  }, [pendingCallDbId, loadStats, loadTodayCalls, powerDial, selectedLead]);

  // ── Lead actions ────────────────────────────────────────────────────────────
  const handleMarkHot = useCallback(async () => {
    if (!selectedLead) return;
    const supabase = createClient();
    const newScore = (selectedLead.ai_score ?? 0) >= 70 ? 50 : 80;
    await supabase.from('leads').update({ ai_score: newScore }).eq('id', selectedLead.id);
    selectLead({ ...selectedLead, ai_score: newScore });
    toast.success(newScore >= 70 ? 'Marked as hot' : 'Removed hot status');
  }, [selectedLead, selectLead]);

  const handleDnc = useCallback(async () => {
    if (!selectedLead) return;
    if (!confirm(`Mark ${selectedLead.name} as Do Not Call?`)) return;
    const supabase = createClient();
    await supabase.from('leads').update({ dnc: true, status: 'do_not_call' }).eq('id', selectedLead.id);
    selectLead(null);
    toast.success('Marked as DNC');
  }, [selectedLead, selectLead]);

  const handleSkip = useCallback(() => {
    const next = queueLeads[queueIndex + 1];
    if (next) { setQueueIndex((i) => i + 1); selectLead(next); }
    else { selectLead(null); }
  }, [queueLeads, queueIndex, selectLead]);

  // ── Hotkeys ─────────────────────────────────────────────────────────────────
  useDialerHotkeys({
    mode,
    onOpenManualDial: () => setDialpadOpen(true),
    onOpenShortcuts: () => setShortcutsOpen(true),
    onFocusSearch: () => searchRef.current?.focus(),
    onNavigateQueue: (dir) => {
      const next = dir === 'down' ? queueIndex + 1 : queueIndex - 1;
      const clamped = Math.max(0, Math.min(next, queueLeads.length - 1));
      const lead = queueLeads[clamped];
      if (lead) { setQueueIndex(clamped); selectLead(lead); }
    },
    onSelectLead: () => { const lead = queueLeads[queueIndex]; if (lead) selectLead(lead); },
    onStartPowerDial: () => setPowerConfirmOpen(true),
    onStartCall: handleCallLead,
    onSkipLead: handleSkip,
    onMarkHot: handleMarkHot,
    onQuickNote: () => { /* preview-stage handles this internally */ },
    onEndCall: handleEndCall,
    onToggleMute: toggleMute,
    onToggleHold: toggleHold,
    onOpenNotes: () => { /* live-call-stage handles internally */ },
    onDropVoicemail: handleDropVoicemail,
    onOpenKeypad: () => setDtmfOpen((p) => !p),
    onDisposition: (idx) => {
      const disps: DispositionType[] = [
        'interested','meeting_booked','callback','voicemail',
        'gatekeeper','not_interested','wrong_number','dnc',
      ];
      if (dispositionOpen && disps[idx]) handleDispositionSave(disps[idx]);
    },
    onClose: () => { setDialpadOpen(false); setShortcutsOpen(false); setDtmfOpen(false); },
  });

  const isLive = mode === 'live';
  const showAiPanel = mode === 'preview' || mode === 'live';

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden" aria-label="AI Dialer">

      {/* Header strip — always visible */}
      <HeaderStrip
        stats={stats}
        callStatus={callStatus}
        callTimer={callStatus === 'active' ? callTimer.formatted : undefined}
        activeLeadName={selectedLead?.name}
        todayCalls={todayCalls}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* Live call banner */}
      <AnimatePresence>
        {isLive && selectedLead && (
          <motion.div
            key="live-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 flex items-center gap-3 px-4 border-b border-red-500/20 overflow-hidden"
            style={{ background: 'rgba(239,68,68,0.06)' }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-red-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-semibold text-red-400">LIVE</span>
            <span className="text-sm text-white/50 tabular-nums font-mono">{callTimer.formatted}</span>
            <span className="text-white/25">·</span>
            <span className="text-sm text-white/50 font-mono">{selectedLead.phone}</span>
            <span className="text-white/25">→</span>
            <span className="text-sm text-white/80">{selectedLead.name}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-column layout */}
      <div className="flex flex-1 min-h-0">

        {/* Queue column */}
        <div
          className={`flex-shrink-0 border-r border-white/[0.06] overflow-hidden transition-all duration-300 ${
            isLive ? 'w-0 lg:w-20' : 'w-0 lg:w-[380px]'
          } flex-col hidden lg:flex`}
        >
          {isLive ? (
            /* Collapsed avatar strip */
            <div className="flex flex-col items-center gap-2 pt-4 px-2">
              <span className="text-[9px] uppercase tracking-widest text-white/25 mb-1">Next</span>
              {queueLeads.slice(0, 6).map((lead, i) => (
                <button
                  key={lead.id}
                  title={lead.name}
                  onClick={() => {
                    if (confirm(`Switch to ${lead.name}?`)) {
                      hangup();
                      selectLead(lead);
                    }
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white transition-opacity ${
                    i === 0 ? 'ring-2 ring-red-500/60' : 'opacity-50 hover:opacity-80'
                  }`}
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
                >
                  {lead.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                </button>
              ))}
            </div>
          ) : (
            <QueueColumn
              selectedLeadId={selectedLead?.id}
              onSelectLead={selectLead}
              searchRef={searchRef}
              onCountsChange={setQueueCounts}
            />
          )}
        </div>

        {/* Center stage */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === 'browse' && (
              <motion.div key="browse" className="absolute inset-0">
                <BrowseStage
                  queueCount={queueCounts.queue}
                  hotCount={queueCounts.hot}
                  callbackCount={queueCounts.callbacks}
                  onStartPowerDial={() => setPowerConfirmOpen(true)}
                />
              </motion.div>
            )}
            {mode === 'preview' && selectedLead && (
              <motion.div key="preview" className="absolute inset-0 overflow-y-auto scrollbar-hide">
                <PreviewStage
                  lead={selectedLead}
                  onCall={handleCallLead}
                  onSkip={handleSkip}
                  onMarkHot={handleMarkHot}
                  onDnc={handleDnc}
                  disabled={phoneStatus !== 'ready'}
                />
              </motion.div>
            )}
            {mode === 'live' && selectedLead && (
              <motion.div key="live" className="absolute inset-0 overflow-y-auto scrollbar-hide">
                <LiveCallStage
                  lead={selectedLead}
                  callStatus={callStatus}
                  isMuted={isMuted}
                  isOnHold={isOnHold}
                  onToggleMute={toggleMute}
                  onToggleHold={toggleHold}
                  onDropVoicemail={handleDropVoicemail}
                  onOpenKeypad={() => setDtmfOpen((p) => !p)}
                  onEndCall={handleEndCall}
                  callDbId={activeCallDbId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right AI panel */}
        <AnimatePresence>
          {showAiPanel && selectedLead && (
            <motion.div
              key="ai-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="flex-shrink-0 border-l border-white/[0.06] overflow-hidden hidden xl:flex flex-col"
            >
              {mode === 'preview' ? (
                <AiBriefPanel lead={selectedLead} />
              ) : (
                <LiveInsightsPanel lead={selectedLead} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom bar */}
      <AnimatePresence>
        {mode === 'browse' && (
          <motion.div
            key="mobile-bar"
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="lg:hidden flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]"
            style={{ background: 'rgba(9,9,11,0.9)' }}
          >
            <button
              onClick={() => setDialpadOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white/70"
            >
              <Phone className="w-4 h-4" />
              Manual Dial
            </button>
            <button
              className="flex-1 flex items-center justify-center h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white/70"
              onClick={() => toast.info('Filters coming soon')}
            >
              Filters
            </button>
            <button
              className="flex-1 h-11 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
              onClick={() => setPowerConfirmOpen(true)}
            >
              Power Dial
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating manual dial button (desktop browse) */}
      <AnimatePresence>
        {mode === 'browse' && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setDialpadOpen(true)}
            className="hidden lg:flex fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
            aria-label="Open manual dialer (D)"
          >
            <Phone className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Overlays ── */}
      {/* Power Dial confirm modal */}
      <AnimatePresence>
        {powerConfirmOpen && (
          <motion.div
            key="pd-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setPowerConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/[0.10] p-6 bg-zinc-900 shadow-2xl space-y-4"
            >
              <div>
                <h2 className="text-base font-semibold text-white">Start AI Power Dial</h2>
                <p className="text-sm text-white/50 mt-1">
                  {queueCounts.queue > 0
                    ? `Auto-dial ${queueCounts.queue} leads in queue. You'll review each before the call connects.`
                    : 'No leads in queue. Import leads first.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setPowerConfirmOpen(false)}
                  className="flex-1 h-10 rounded-xl text-sm text-white/50 bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.09] transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={queueCounts.queue === 0}
                  onClick={() => {
                    setPowerConfirmOpen(false);
                    powerDial.startSession(queueCounts.queue);
                  }}
                  className="flex-[2] h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
                >
                  Start Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power dial countdown overlay */}
      <AnimatePresence>
        {powerDial.isActive && powerDial.countdown !== null && (
          <motion.div
            key="pd-countdown"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-2xl border border-purple-500/30 bg-zinc-900/95 shadow-2xl"
          >
            <span className="text-sm text-white/60">Next lead in</span>
            <span className="text-2xl font-bold text-white tabular-nums w-8 text-center">{powerDial.countdown}</span>
            <button
              onClick={powerDial.skipCountdown}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Skip →
            </button>
            <button
              onClick={powerDial.endSession}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              End session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power dial active indicator (top-right) */}
      <AnimatePresence>
        {powerDial.isActive && powerDial.countdown === null && (
          <motion.div
            key="pd-indicator"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-16 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-purple-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-purple-300">Power Mode</span>
            <span className="text-purple-400/60">{powerDial.session?.total_calls ?? 0} calls</span>
            <button
              onClick={powerDial.endSession}
              className="ml-1 text-purple-400/60 hover:text-purple-300 transition-colors"
              aria-label="End power dial session"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ManualDialpadOverlay
        open={dialpadOpen}
        onClose={() => setDialpadOpen(false)}
        onDial={(phone) => initiateCall(phone)}
      />

      <DispositionModal
        open={dispositionOpen}
        lead={selectedLead}
        callDuration={callTimer.seconds}
        onSave={handleDispositionSave}
        onClose={() => setDispositionOpen(false)}
      />

      <ShortcutsHelpModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <AnimatePresence>
        {dtmfOpen && (
          <DtmfKeypad
            onSend={(d) => { sendDTMF(d); toast.info(`DTMF: ${d}`, { duration: 800 }); }}
            onClose={() => setDtmfOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
