'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { toast } from 'sonner';

import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { useDialerMode } from '@/hooks/use-dialer-mode';
import { useCallRealtime } from '@/hooks/use-call-realtime';
import { useDialerHotkeys } from '@/hooks/use-dialer-hotkeys';
import { usePowerDialer } from '@/hooks/use-power-dialer';
import { createClient } from '@/lib/supabase/client';
import { normalizePhone } from '@/lib/phone';
import { Users, Sparkles, X as XIcon } from 'lucide-react';

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
import { PowerBanner } from '@/components/dialer/power-banner';
import { PowerCountdownStage } from '@/components/dialer/power-countdown';

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

// ── Session summary stat cell ──────────────────────────────────────────────────
function SummaryCell({
  label,
  value,
  color = 'white',
}: {
  label: string;
  value: number;
  color?: 'white' | 'cyan' | 'green';
}) {
  const textColor =
    color === 'cyan' ? 'text-cyan-400' : color === 'green' ? 'text-emerald-400' : 'text-white';
  return (
    <div className="flex flex-col items-center gap-0.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      <span className={`text-2xl font-light tabular-nums ${textColor}`}>{value}</span>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface CallDot { id: string; leadName: string; disposition: string | null; time: string }
interface TodayStats { calls: number; connects: number; meetings: number; streak: number }

// ══════════════════════════════════════════════════════════════════════════════
export default function DialerPage() {
  const {
    callStatus, isMuted, isOnHold, phoneStatus, activeCallId,
    makeCall, hangup, toggleMute, toggleHold, sendDTMF,
  } = useWebPhone();

  const { mode, selectedLead, activeCallDbId, selectLead, startCall, endCall } = useDialerMode();
  const { registerCallMeta } = useCallContext();

  // Stable ref so powerDialer.onShouldDial can call initiateCall once it's defined
  const initiateCallRef = useRef<((phone: string, lead?: LeadRecord) => void) | null>(null);
  // Stable ref for phoneStatus so the retry closure always sees the latest value
  const phoneStatusRef = useRef(phoneStatus);
  phoneStatusRef.current = phoneStatus;

  // Power dialer state machine
  const [powerConfirmOpen, setPowerConfirmOpen] = useState(false);

  const powerDialer = usePowerDialer({
    onLeadReady: (lead) => { selectLead(lead); },
    onShouldDial: (lead) => {
      // Retry up to 10 × 500 ms while phone warms up, then give up
      let attempts = 0;
      const tryCall = () => {
        if (phoneStatusRef.current === 'ready') {
          initiateCallRef.current?.(lead.phone, lead);
          return;
        }
        if (attempts >= 10) {
          toast.error('Phone not ready — auto-dial skipped');
          return;
        }
        attempts++;
        setTimeout(tryCall, 500);
      };
      tryCall();
    },
    onSessionComplete: () => { selectLead(null); },
  });

  // Stable ref so the callStatus effect always calls the latest powerDialer methods
  const powerDialerRef = useRef(powerDialer);
  powerDialerRef.current = powerDialer;

  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<TodayStats>({ calls: 0, connects: 0, meetings: 0, streak: 0 });
  const [todayCalls, setTodayCalls] = useState<CallDot[]>([]);
  const [queueCounts, setQueueCounts] = useState({ queue: 0, hot: 0, callbacks: 0 });
  const [dispositionOpen, setDispositionOpen] = useState(false);
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dtmfOpen, setDtmfOpen] = useState(false);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [mobileAiBriefOpen, setMobileAiBriefOpen] = useState(false);
  const [pendingCallDbId, setPendingCallDbId] = useState<string | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueLeads, setQueueLeads] = useState<LeadRecord[]>([]);
  const [fromNumber, setFromNumber] = useState<string>('');

  const searchRef = useRef<HTMLInputElement | null>(null);
  const callTimer = useTimer(callStatus === 'active');
  const prevCallStatus = useRef(callStatus);
  const callTimerRef = useRef(callTimer);
  callTimerRef.current = callTimer;

  // ── Auth + from-number ─────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  // Fetch the user's outbound caller-ID number once userId is known.
  // Passed as callerNumber to makeCall() so Telnyx uses the purchased E.164
  // number instead of the SIP username (which caused call_rejected errors).
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from('purchased_numbers')
      .select('phone_number')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data?.phone_number) setFromNumber(data.phone_number); });
  }, [userId]);

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
      powerDialerRef.current.onCallStarted();
      // Update call IDs now that DB record exists (mode already 'live' from initiateCall)
      if (selectedLead) {
        startCall(pendingCallDbId ?? '', pendingCallDbId ?? '');
      }
    }

    if ((prev === 'active' || prev === 'connecting' || prev === 'ringing') &&
        (callStatus === 'ended' || callStatus === 'idle')) {
      powerDialerRef.current.onCallEnd();
      endCall();
      const seconds = callTimerRef.current.seconds;
      if (seconds >= 10) {
        setDispositionOpen(true);
      } else {
        if (pendingCallDbId) {
          fetch(`/api/calls/${pendingCallDbId}/disposition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disposition: 'voicemail' }),
          }).catch(() => {});
        }
        // Power mode: auto-advance to next lead after short or failed call
        if (powerDialerRef.current.isActive) {
          setTimeout(() => {
            powerDialerRef.current.onDispositionSaved('voicemail', false, false);
          }, 2000);
        }
      }
      loadStats();
      loadTodayCalls();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus]);

  // Pending call info for DB registration (set before makeCall, consumed by effect below)
  const pendingRegRef = useRef<{ e164: string; leadId?: string } | null>(null);

  // When WebRTC assigns a call_control_id (activeCallId), register the DB record.
  // This fires once per call and avoids the double-call bug: no server-side dial
  // is made in initiateCall, so only the WebRTC call goes out.
  useEffect(() => {
    if (!activeCallId || !pendingRegRef.current) return;
    const { e164, leadId } = pendingRegRef.current;
    pendingRegRef.current = null;
    fetch('/api/calls/dial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: e164, lead_id: leadId, call_control_id: activeCallId }),
    })
      .then((r) => r.json())
      .then((data: { db_id?: string; call_control_id?: string }) => {
        const id = data.db_id ?? data.call_control_id ?? null;
        if (id) setPendingCallDbId(id);
      })
      .catch(() => { /* non-fatal */ });
  }, [activeCallId]);

  // ── Call initiation ─────────────────────────────────────────────────────────
  const initiateCall = useCallback((phone: string, lead?: LeadRecord) => {
    if (phoneStatus !== 'ready') {
      toast.error('Phone not ready — please wait a moment');
      return;
    }
    const e164 = normalizePhone(phone) ?? phone;
    if (lead) {
      // Lead call: switch center column to live stage immediately
      startCall('', '');
    } else {
      // Manual dial (no lead): register in CallContext so floating overlay shows
      registerCallMeta(null, e164);
    }
    pendingRegRef.current = { e164, leadId: lead?.id };
    makeCall(e164, fromNumber || undefined);
  }, [phoneStatus, makeCall, fromNumber, startCall, registerCallMeta]);

  // Update ref on every render so powerDialer.onShouldDial always calls latest version
  initiateCallRef.current = initiateCall;

  const handleCallLead = useCallback(() => {
    if (!selectedLead) return;
    initiateCall(selectedLead.phone, selectedLead);
  }, [selectedLead, initiateCall]);

  const handleEndCall = useCallback(() => { hangup(); }, [hangup]);

  const handleDropVoicemail = useCallback(async () => {
    if (!activeCallId) return;
    const res = await fetch('/api/calls/drop-voicemail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_control_id: activeCallId,
        call_db_id: pendingCallDbId ?? undefined,
      }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string; voicemail_name?: string };
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to drop voicemail');
    } else {
      toast.success(`Voicemail dropped${data.voicemail_name ? ` · ${data.voicemail_name}` : ''}`);
    }
  }, [activeCallId, pendingCallDbId]);

  // ── Disposition ─────────────────────────────────────────────────────────────
  const handleDispositionSave = useCallback(async (
    disposition: DispositionType,
    notes?: string,
    callbackAt?: string,
    meetingAt?: string,
  ) => {
    // Save to DB only if we have an ID — don't let a missing ID block the power dialer
    if (pendingCallDbId) {
      try {
        await fetch(`/api/calls/${pendingCallDbId}/disposition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disposition, notes, callback_at: callbackAt, meeting_at: meetingAt }),
        });
      } catch {
        toast.error('Failed to save disposition');
      }
    }

    if (powerDialer.isActive) {
      toast.success('Saved · Loading next lead…', { duration: 2000 });
    } else {
      toast.success(`Marked as ${disposition.replace(/_/g, ' ')}`);
    }

    setDispositionOpen(false);
    loadStats();
    loadTodayCalls();

    // Power dial: advance to next lead automatically
    if (powerDialer.isActive && selectedLead) {
      const wasConnected = ['interested','meeting_booked','callback','gatekeeper'].includes(disposition);
      const wasMeeting = disposition === 'meeting_booked';
      powerDialer.onDispositionSaved(disposition, wasConnected, wasMeeting);
    }
  }, [pendingCallDbId, loadStats, loadTodayCalls, powerDialer, selectedLead]);

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
    if (!selectedLead) return;
    const currentIndex = queueLeads.findIndex((l) => l.id === selectedLead.id);
    const next = queueLeads[currentIndex + 1];
    if (next) {
      setQueueIndex(currentIndex + 1);
      selectLead(next);
    } else {
      selectLead(null);
      toast.info('End of queue reached');
    }
  }, [queueLeads, selectedLead, selectLead]);

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
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden" aria-label="AI Dialer">

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

      {/* Power dialer banner — visible during any active session state */}
      <AnimatePresence>
        {powerDialer.isActive && (
          <PowerBanner
            state={powerDialer.state}
            session={powerDialer.session}
            countdown={powerDialer.countdown}
            queueRemaining={powerDialer.queueRemaining}
            onPause={powerDialer.pause}
            onResume={powerDialer.resume}
            onStop={powerDialer.stop}
          />
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
                  style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(186,100%,42%))' }}
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
              onLeadsChange={setQueueLeads}
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
            {/* Normal preview (no power dial) */}
            {mode === 'preview' && selectedLead && !powerDialer.isActive && (
              <motion.div key="preview" className="absolute inset-0 overflow-y-auto scrollbar-hide">
                <PreviewStage
                  lead={selectedLead}
                  onCall={handleCallLead}
                  onSkip={handleSkip}
                  onMarkHot={handleMarkHot}
                  onDnc={handleDnc}
                  onClose={() => selectLead(null)}
                  disabled={phoneStatus !== 'ready'}
                />
              </motion.div>
            )}
            {/* Power dial preview — full-center countdown (also shown when paused) */}
            {mode === 'preview' && selectedLead && powerDialer.isActive && (
              <motion.div key="pd-preview" className="absolute inset-0">
                <PowerCountdownStage
                  lead={selectedLead}
                  countdown={powerDialer.countdown}
                  delaySeconds={powerDialer.config.delay_seconds ?? 5}
                  isPaused={powerDialer.state === 'paused'}
                  onSkip={powerDialer.skipCountdown}
                  onPause={powerDialer.pause}
                  onResume={powerDialer.resume}
                  onStop={powerDialer.stop}
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
                  callDbId={pendingCallDbId}
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
              style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(186,100%,42%))' }}
              onClick={() => setPowerConfirmOpen(true)}
            >
              Power Dial
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating manual dial button — visible in browse + preview, hidden during live call */}
      <AnimatePresence>
        {mode !== 'live' && (
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
                    powerDialer.start({ delay_seconds: 5 });
                  }}
                  className="flex-[2] h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(186,100%,42%))' }}
                >
                  Start Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power session summary modal */}
      <AnimatePresence>
        {powerDialer.state === 'ending' && powerDialer.summary && (
          <motion.div
            key="pd-summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/[0.10] p-6 bg-zinc-900 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1">
                <div className="text-4xl mb-1">⚡</div>
                <h2 className="text-lg font-semibold text-white">Session Complete</h2>
                <p className="text-sm text-white/40">
                  {Math.floor((powerDialer.summary.duration ?? 0) / 60)}m{' '}
                  {(powerDialer.summary.duration ?? 0) % 60}s total
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <SummaryCell label="Calls" value={powerDialer.summary.calls} />
                <SummaryCell label="Connects" value={powerDialer.summary.connects} color="cyan" />
                <SummaryCell label="Meetings" value={powerDialer.summary.meetings} color="green" />
              </div>
              <button
                onClick={powerDialer.dismissSummary}
                className="w-full h-10 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(186,100%,42%))' }}
              >
                Done
              </button>
            </motion.div>
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

      {/* ── Mobile floating buttons (Queue + AI Brief) — hidden on lg+ ── */}
      <AnimatePresence>
        {mode !== 'live' && (
          <motion.div
            key="mobile-fabs"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="lg:hidden fixed bottom-20 right-4 z-30 flex flex-col gap-2.5"
            style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* AI Brief button */}
            {(mode === 'preview') && selectedLead && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileAiBriefOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-full shadow-xl text-white"
                style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(186,100%,42%))', border: '1px solid rgba(255,255,255,0.15)' }}
                aria-label="Open AI Brief"
              >
                <Sparkles className="h-5 w-5" />
              </motion.button>
            )}
            {/* Queue button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileQueueOpen(true)}
              className="relative flex h-12 w-12 items-center justify-center rounded-full shadow-xl text-white"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Open Queue"
            >
              <Users className="h-5 w-5" />
              {queueCounts.queue > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {queueCounts.queue > 99 ? '99+' : queueCounts.queue}
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Queue Drawer ── */}
      <AnimatePresence>
        {mobileQueueOpen && (
          <>
            <motion.div
              key="queue-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileQueueOpen(false)}
            />
            <motion.div
              key="queue-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl border-t border-white/[0.10] bg-zinc-900 overflow-hidden"
              style={{ height: '80vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <span className="text-sm font-semibold text-white">Call Queue</span>
                <button
                  type="button"
                  onClick={() => setMobileQueueOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 hover:text-white"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <QueueColumn
                  selectedLeadId={selectedLead?.id}
                  onSelectLead={(lead) => { selectLead(lead); setMobileQueueOpen(false); }}
                  searchRef={searchRef}
                  onCountsChange={setQueueCounts}
                  onLeadsChange={setQueueLeads}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile AI Brief Drawer ── */}
      <AnimatePresence>
        {mobileAiBriefOpen && selectedLead && (
          <>
            <motion.div
              key="ai-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileAiBriefOpen(false)}
            />
            <motion.div
              key="ai-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl border-t border-white/[0.10] bg-zinc-900 overflow-hidden"
              style={{ height: '80vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <span className="text-sm font-semibold text-white">AI Brief</span>
                <button
                  type="button"
                  onClick={() => setMobileAiBriefOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 hover:text-white"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <AiBriefPanel lead={selectedLead} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
