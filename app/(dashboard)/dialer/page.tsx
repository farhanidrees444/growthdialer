'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { toast } from 'sonner';

import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { useCallOrchestrator } from '@/contexts/call-orchestrator-context';
import { useDialerMode } from '@/hooks/use-dialer-mode';
import { useCallRealtime } from '@/hooks/use-call-realtime';
import { useDialerHotkeys } from '@/hooks/use-dialer-hotkeys';
import { usePowerDialer } from '@/hooks/use-power-dialer';
import { useParallelDialer } from '@/hooks/use-parallel-dialer';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/workspace-context';
import { ownCallsOrFilter } from '@/lib/auth/call-access';
import { bestEffortE164 } from '@/lib/phone';
import { X as XIcon } from 'lucide-react';

import { HeaderStrip } from '@/components/dialer/header-strip';
import { QueueColumn } from '@/components/dialer/queue-column';
import { BrowseStage } from '@/components/dialer/browse-stage';
import { PreviewStage } from '@/components/dialer/preview-stage';
import { LiveCallStage } from '@/components/dialer/live-call-stage';
import { AiBriefPanel } from '@/components/dialer/ai-brief-panel';
import { LiveInsightsPanel } from '@/components/dialer/live-insights-panel';
import { ManualDialpadOverlay } from '@/components/dialer/manual-dialpad-overlay';
import { ShortcutsHelpModal } from '@/components/dialer/shortcuts-help-modal';
import { PowerBanner } from '@/components/dialer/power-banner';
import { PowerCountdownStage } from '@/components/dialer/power-countdown';
import DialModeSegmented, { type DialMode } from '@/components/dialer/DialModeSegmented';
import { ParallelDialConfigModal } from '@/components/dialer/parallel-dial-config-modal';
import { ParallelDialStage } from '@/components/dialer/parallel-dial-stage';
import { ParallelSessionBanner } from '@/components/dialer/parallel-session-banner';
import { DialerFloatingActions } from '@/components/dialer/dialer-floating-actions';
import { DialerStageAmbient } from '@/components/dialer/dialer-stage-ambient';

import type { LeadRecord, DispositionType } from '@/lib/dialer/state-machine';
import { isInboundPreAnswer } from '@/lib/inbound/pre-answer';

// ── DTMF keypad overlay ────────────────────────────────────────────────────────
const DTMF_KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function DtmfKeypad({ onSend, onClose }: { onSend: (d: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      className="fixed right-4 z-[var(--z-drawer)] w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-white/[0.10] p-4 shadow-2xl backdrop-blur-2xl bg-zinc-900/95 lg:right-6"
      style={{
        bottom:
          'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 5rem + var(--gd-dock-call-height, 0px))',
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-white/40 uppercase tracking-widest">Keypad</span>
        <button onClick={onClose} className="min-h-11 px-2 text-sm text-white/50 hover:text-white">Done</button>
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

// ── Call timer (accumulates across hold; reset explicitly on new call) ─────────
function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  const reset = useCallback(() => setSecs(0), []);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return { formatted: `${m}:${s}`, seconds: secs, reset };
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
  const router = useRouter();
  const {
    callStatus, isMuted, isOnHold, phoneStatus, activeCallId,
    isInboundRinging, hasOutboundSession,
    makeCall, hangup, toggleMute, toggleHold, sendDTMF, waitForPhoneReady, reconnect, voiceError,
  } = useWebPhone();

  const { mode, selectedLead, activeCallDbId, selectLead, startCall, endCall } = useDialerMode();
  const { registerCallMeta } = useCallContext();
  const {
    callDbId,
    dispositionOpen,
    beginOutboundCall,
    registerPowerDialBridge,
    saveDisposition,
  } = useCallOrchestrator();
  const { currentWorkspace, apiFetch } = useWorkspace();

  // Stable ref so powerDialer.onShouldDial can call initiateCall once it's defined
  const initiateCallRef = useRef<((phone: string, lead?: LeadRecord) => void) | null>(null);
  // Power dialer state machine
  const [powerConfirmOpen, setPowerConfirmOpen] = useState(false);
  const [parallelConfirmOpen, setParallelConfirmOpen] = useState(false);
  const [dialMode, setDialMode] = useState<DialMode>('manual');
  const [voiceProvider, setVoiceProvider] = useState<'telnyx'>('telnyx');

  const parallelDialer = useParallelDialer({
    onLeadConnected: (lead, leg) => {
      selectLead(lead);
      startCall(leg.call_id ?? '', leg.call_id ?? '');
      beginOutboundCall(lead.phone, lead.id, lead);
    },
  });

  const powerDialer = usePowerDialer({
    apiFetch,
    onLeadReady: (lead) => { selectLead(lead); },
    onShouldDial: (lead) => {
      void (async () => {
        if (!fromNumberRef.current) {
          toast.error('Claim a caller ID before power dialing');
          void powerDialerRef.current.stop();
          router.push('/numbers');
          return;
        }
        const ready = await waitForPhoneReady();
        if (!ready) {
          toast.error('Phone not ready — power dial stopped');
          void powerDialerRef.current.stop();
          return;
        }
        initiateCallRef.current?.(lead.phone, lead);
      })();
    },
    onSessionComplete: () => { selectLead(null); },
  });

  // Stable ref so the callStatus effect always calls the latest powerDialer methods
  const powerDialerRef = useRef(powerDialer);
  powerDialerRef.current = powerDialer;
  const parallelDialerRef = useRef(parallelDialer);
  parallelDialerRef.current = parallelDialer;

  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<TodayStats>({ calls: 0, connects: 0, meetings: 0, streak: 0 });
  const [todayCalls, setTodayCalls] = useState<CallDot[]>([]);
  const [queueCounts, setQueueCounts] = useState({ queue: 0, hot: 0, callbacks: 0 });
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dtmfOpen, setDtmfOpen] = useState(false);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [mobileAiBriefOpen, setMobileAiBriefOpen] = useState(false);
  const [mobileLiveInsightsOpen, setMobileLiveInsightsOpen] = useState(false);
  const [dncConfirmOpen, setDncConfirmOpen] = useState(false);
  const [switchLeadTarget, setSwitchLeadTarget] = useState<LeadRecord | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueLeads, setQueueLeads] = useState<LeadRecord[]>([]);
  const [fromNumber, setFromNumber] = useState<string>('');
  const fromNumberRef = useRef(fromNumber);
  fromNumberRef.current = fromNumber;

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

  // Default outbound caller ID — same source as /api/numbers/list
  const loadFromNumber = useCallback(async () => {
    try {
      const res = await apiFetch('/api/numbers/list');
      if (!res.ok) return;
      const data = await res.json() as {
        numbers?: Array<{ phone_number: string; is_default: boolean; status: string; is_callable?: boolean }>;
      };
      const nums = (data.numbers ?? []).filter((n) => n.status === 'active' && n.is_callable !== false);
      const defaultNum = nums.find((n) => n.is_default) ?? nums[0];
      if (defaultNum?.phone_number) setFromNumber(defaultNum.phone_number);
    } catch { /* non-fatal */ }
  }, [apiFetch]);

  useEffect(() => {
    if (!userId) return;
    void loadFromNumber();
    void apiFetch('/api/voice/health')
      .then((res) => res.ok ? res.json() : null)
      .then((data: { provider?: 'telnyx' } | null) => {
        if (data?.provider === 'telnyx') setVoiceProvider('telnyx');
      })
      .catch(() => {});
  }, [userId, loadFromNumber, apiFetch]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      const res = await apiFetch('/api/stats/today');
      if (!res.ok) return;
      const data = await res.json() as { callsToday: number; connectRate: number; meetingsBooked: number };
      setStats((prev) => ({
        ...prev,
        calls: data.callsToday ?? 0,
        connects: Math.round((data.callsToday ?? 0) * ((data.connectRate ?? 0) / 100)),
        meetings: data.meetingsBooked ?? 0,
      }));
    } catch { /* silent */ }
  }, [apiFetch, currentWorkspace?.id]);

  const loadTodayCalls = useCallback(async () => {
    if (!userId || !currentWorkspace?.id) return;
    try {
      const supabase = createClient();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('calls')
        .select('id, disposition, created_at, leads(name)')
        .or(ownCallsOrFilter(currentWorkspace.id, userId))
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
  }, [userId, currentWorkspace?.id]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadTodayCalls(); }, [loadTodayCalls]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useCallRealtime({
    userId,
    onCallUpdate: () => { loadStats(); loadTodayCalls(); },
    onLeadUpdate: () => { /* queue self-refreshes */ },
  });

  // Bridge power / parallel dialer ↔ global call orchestrator
  useEffect(() => {
    registerPowerDialBridge({
      onCallStarted: () => {
        if (parallelDialerRef.current.isActive) parallelDialerRef.current.onCallStarted();
        else powerDialerRef.current.onCallStarted();
      },
      onCallEnd: () => {
        if (parallelDialerRef.current.isActive) parallelDialerRef.current.onCallEnd();
        else powerDialerRef.current.onCallEnd();
      },
      onDispositionSaved: (disp, wasConnected, wasMeeting) => {
        if (parallelDialerRef.current.isActive) {
          parallelDialerRef.current.onDispositionSaved(disp, wasConnected, wasMeeting);
        } else {
          powerDialerRef.current.onDispositionSaved(disp, wasConnected, wasMeeting);
        }
      },
      isActive: () => parallelDialerRef.current.isActive || powerDialerRef.current.isActive,
      getState: () =>
        parallelDialerRef.current.isActive
          ? parallelDialerRef.current.state
          : powerDialerRef.current.state,
    });
    return () => registerPowerDialBridge(null);
  }, [registerPowerDialBridge]);

  // Dialer UI mode transitions + stats refresh
  useEffect(() => {
    const prev = prevCallStatus.current;
    prevCallStatus.current = callStatus;

    if ((prev === 'connecting' || prev === 'ringing') && callStatus === 'active') {
      if (selectedLead && hasOutboundSession) {
        startCall(callDbId ?? '', callDbId ?? '');
      }
    }

    if (
      (prev === 'active' || prev === 'held' || prev === 'connecting' || prev === 'ringing') &&
      (callStatus === 'ended' || callStatus === 'idle')
    ) {
      endCall();
      callTimerRef.current.reset();
      loadStats();
      loadTodayCalls();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus, callDbId]);

  // ── Call initiation ─────────────────────────────────────────────────────────
  const initiateCall = useCallback(async (phone: string, lead?: LeadRecord) => {
    if (callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'active' || callStatus === 'held') {
      toast.error('End the current call before starting a new one');
      return;
    }
    const e164 = bestEffortE164(phone);
    if (!e164) {
      toast.error('Invalid phone number');
      return;
    }

    const ready = await waitForPhoneReady();
    if (!ready) {
      toast.error('Phone not ready — please wait a moment');
      return;
    }

    let callerId = fromNumber;
    if (!callerId) {
      try {
        const res = await apiFetch('/api/numbers/list');
        if (res.ok) {
          const data = await res.json() as { numbers?: Array<{ phone_number: string; is_default: boolean; status: string }> };
          const nums = (data.numbers ?? []).filter((n) => n.status === 'active');
          const defaultNum = nums.find((n) => n.is_default) ?? nums[0];
          callerId = defaultNum?.phone_number ?? '';
          if (callerId) setFromNumber(callerId);
        }
      } catch { /* non-fatal */ }
    }
    if (!callerId) {
      toast.error('No active caller ID — extend or add a number in My Numbers');
      router.push('/numbers');
      return;
    }

    callTimer.reset();
    if (lead) {
      registerCallMeta(lead as import('@/components/dialer/LeadCard').LeadRecord, e164);
      startCall('', '');
    } else {
      selectLead(null);
      registerCallMeta(null, e164);
    }
    beginOutboundCall(e164, lead?.id, lead ?? null);
    makeCall(e164, callerId);
  }, [callStatus, waitForPhoneReady, makeCall, fromNumber, apiFetch, startCall, registerCallMeta, selectLead, callTimer, beginOutboundCall, router]);

  // Update ref on every render so powerDialer.onShouldDial always calls latest version
  initiateCallRef.current = initiateCall;

  const handleCallLead = useCallback(() => {
    if (!selectedLead) return;
    initiateCall(selectedLead.phone, selectedLead);
  }, [selectedLead, initiateCall]);

  const handleEndCall = useCallback(() => { hangup(); }, [hangup]);

  const handleDropVoicemail = useCallback(async () => {
    if (!activeCallId) return;
    const res = await apiFetch('/api/calls/drop-voicemail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_control_id: activeCallId,
        call_db_id: callDbId ?? undefined,
      }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string; voicemail_name?: string };
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to drop voicemail');
    } else {
      toast.success(`Voicemail dropped${data.voicemail_name ? ` · ${data.voicemail_name}` : ''}`);
    }
  }, [activeCallId, callDbId, apiFetch]);

  // ── Lead actions ────────────────────────────────────────────────────────────
  const handleMarkHot = useCallback(async () => {
    if (!selectedLead) return;
    const supabase = createClient();
    const newScore = (selectedLead.ai_score ?? 0) >= 70 ? 50 : 80;
    await supabase.from('leads').update({ ai_score: newScore }).eq('id', selectedLead.id);
    selectLead({ ...selectedLead, ai_score: newScore });
    toast.success(newScore >= 70 ? 'Marked as hot' : 'Removed hot status');
  }, [selectedLead, selectLead]);

  const handleDnc = useCallback(() => {
    if (!selectedLead) return;
    setDncConfirmOpen(true);
  }, [selectedLead]);

  const confirmDnc = useCallback(async () => {
    if (!selectedLead) return;
    setDncConfirmOpen(false);
    const supabase = createClient();
    await supabase.from('leads').update({ dnc: true, status: 'do_not_call' }).eq('id', selectedLead.id);
    selectLead(null);
    toast.success('Marked as DNC');
  }, [selectedLead, selectLead]);

  const confirmSwitchLead = useCallback(() => {
    if (!switchLeadTarget) return;
    hangup();
    selectLead(switchLeadTarget);
    setSwitchLeadTarget(null);
  }, [switchLeadTarget, hangup, selectLead]);

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
    powerDialActive: powerDialer.isActive,
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
      if (dispositionOpen && disps[idx]) void saveDisposition(disps[idx]);
    },
    onClose: () => { setDialpadOpen(false); setShortcutsOpen(false); setDtmfOpen(false); },
  });

  const inboundPreAnswer = isInboundPreAnswer(isInboundRinging, hasOutboundSession, callStatus);
  const isLive = mode === 'live' && !inboundPreAnswer;
  const showAiPanel = (mode === 'preview' || mode === 'live') && !inboundPreAnswer;

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden" aria-label="AI Dialer">

      {/* Header strip — always visible */}
      <HeaderStrip
        stats={stats}
        callStatus={callStatus}
        phoneStatus={phoneStatus}
        voiceError={voiceError}
        inboundPreAnswer={inboundPreAnswer}
        callTimer={callStatus === 'active' ? callTimer.formatted : undefined}
        activeLeadName={selectedLead?.name}
        todayCalls={todayCalls}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onReconnect={reconnect}
      />

      <div className="flex-shrink-0 border-b border-white/[0.06] bg-white/[0.01] px-4 py-3 backdrop-blur-xl">
        <DialModeSegmented
          mode={dialMode}
          onModeChange={setDialMode}
          onStartPowerDial={() => setPowerConfirmOpen(true)}
          onStartParallelDial={() => setParallelConfirmOpen(true)}
          powerActive={powerDialer.isActive}
          parallelActive={parallelDialer.isActive}
          disabled={isLive}
        />
      </div>

      {/* Live call banner */}
      <AnimatePresence>
        {isLive && selectedLead && (
          <motion.div
            key="live-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 flex min-w-0 items-center gap-3 px-4 border-b border-red-500/20 overflow-hidden"
            style={{ background: 'rgba(239,68,68,0.06)' }}
          >
            <motion.div
              className="w-2 h-2 shrink-0 rounded-full bg-red-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="shrink-0 text-sm font-semibold text-red-400">LIVE</span>
            <span className="shrink-0 text-sm text-white/50 tabular-nums font-mono">{callTimer.formatted}</span>
            <span className="hidden text-white/25 sm:inline">·</span>
            <span className="hidden text-sm text-white/50 font-mono sm:inline">{selectedLead.phone}</span>
            <span className="hidden text-white/25 sm:inline">→</span>
            <span className="min-w-0 truncate text-sm text-white/80">{selectedLead.name}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power dialer banner — visible during any active session state */}
      <AnimatePresence>
        {parallelDialer.isActive && parallelDialer.session && (
          <ParallelSessionBanner
            session={parallelDialer.session}
            state={parallelDialer.state}
            onPause={parallelDialer.pause}
            onResume={parallelDialer.resume}
            onStop={parallelDialer.stop}
          />
        )}

        {powerDialer.isActive && !parallelDialer.isActive && (
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
          className={`flex-shrink-0 border-r border-white/[0.06] overflow-hidden bg-white/[0.01] transition-all duration-300 backdrop-blur-xl ${
            isLive ? 'w-0 md:w-20' : 'w-0 md:w-[300px] lg:w-[380px]'
          } flex-col hidden md:flex`}
        >
          {isLive ? (
            /* Collapsed avatar strip */
            <div className="flex flex-col items-center gap-2 pt-4 px-2">
              <span className="text-[9px] uppercase tracking-widest text-white/25 mb-1">Next</span>
              {queueLeads.slice(0, 6).map((lead, i) => (
                <button
                  key={lead.id}
                  title={lead.name}
                  onClick={() => setSwitchLeadTarget(lead)}
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
              onLeadsChange={setQueueLeads}
            />
          )}
        </div>

        {/* Center stage */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <DialerStageAmbient
            variant={
              isLive ? 'live' : powerDialer.isActive ? 'power' : 'idle'
            }
          />
          <AnimatePresence mode="wait">
            {mode === 'browse' && parallelDialer.isActive && parallelDialer.session && (
              <motion.div key="parallel" className="absolute inset-0">
                <ParallelDialStage
                  session={parallelDialer.session}
                  legs={parallelDialer.legs}
                  state={parallelDialer.state}
                />
              </motion.div>
            )}
            {mode === 'browse' && !parallelDialer.isActive && (
              <motion.div key="browse" className="absolute inset-0">
                <BrowseStage
                  queueCount={queueCounts.queue}
                  hotCount={queueCounts.hot}
                  callbackCount={queueCounts.callbacks}
                  onStartPowerDial={() => { setDialMode('power'); setPowerConfirmOpen(true); }}
                  onStartParallelDial={() => { setDialMode('parallel'); setParallelConfirmOpen(true); }}
                  onOpenManualDial={() => setDialpadOpen(true)}
                />
              </motion.div>
            )}
            {/* Normal preview (no power dial) */}
            {mode === 'preview' && selectedLead && !powerDialer.isActive && !parallelDialer.isActive && (
              <motion.div key="preview" className="absolute inset-0 overflow-y-auto scrollbar-hide">
                <PreviewStage
                  lead={selectedLead}
                  onCall={handleCallLead}
                  onSkip={handleSkip}
                  onMarkHot={handleMarkHot}
                  onDnc={handleDnc}
                  onClose={() => selectLead(null)}
                  disabled={phoneStatus !== 'ready' || !fromNumber}
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
                  callDbId={callDbId}
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
              className="flex-shrink-0 border-l border-white/[0.06] overflow-hidden hidden xl:flex flex-col bg-white/[0.01] backdrop-blur-xl"
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
              onClick={() => setMobileQueueOpen(true)}
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

      <DialerFloatingActions
        mode={mode}
        selectedLead={selectedLead}
        queueCount={queueCounts.queue}
        onOpenDialpad={() => setDialpadOpen(true)}
        onOpenQueue={() => setMobileQueueOpen(true)}
        onOpenAiBrief={() => setMobileAiBriefOpen(true)}
        onOpenLiveInsights={() => setMobileLiveInsightsOpen(true)}
      />

      {/* ── Overlays ── */}

      {/* DNC confirm */}
      <AnimatePresence>
        {dncConfirmOpen && selectedLead && (
          <motion.div
            key="dnc-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDncConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/[0.10] p-6 bg-zinc-900 shadow-2xl space-y-4"
            >
              <div>
                <h2 className="text-base font-semibold text-white">Mark as Do Not Call?</h2>
                <p className="text-sm text-white/50 mt-1">
                  {selectedLead.name} will be removed from your queue and flagged DNC.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDncConfirmOpen(false)}
                  className="flex-1 min-h-11 rounded-xl text-sm text-white/50 bg-white/[0.05] border border-white/[0.07]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDnc()}
                  className="flex-[2] min-h-11 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500"
                >
                  Mark DNC
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Switch lead during live call */}
      <AnimatePresence>
        {switchLeadTarget && (
          <motion.div
            key="switch-lead"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSwitchLeadTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/[0.10] p-6 bg-zinc-900 shadow-2xl space-y-4"
            >
              <div>
                <h2 className="text-base font-semibold text-white">Switch to {switchLeadTarget.name}?</h2>
                <p className="text-sm text-white/50 mt-1">Your current call will end before switching leads.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSwitchLeadTarget(null)}
                  className="flex-1 min-h-11 rounded-xl text-sm text-white/50 bg-white/[0.05] border border-white/[0.07]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSwitchLead}
                  className="flex-[2] min-h-11 rounded-xl text-sm font-semibold text-white gradient-brand"
                >
                  End &amp; switch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ParallelDialConfigModal
        open={parallelConfirmOpen}
        queueCount={queueCounts.queue}
        onClose={() => setParallelConfirmOpen(false)}
        onStart={(cfg) => {
          setDialMode('parallel');
          void parallelDialer.start(cfg);
        }}
      />

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
                    void (async () => {
                      if (!fromNumber) {
                        toast.error('Claim a caller ID before starting power dial');
                        setPowerConfirmOpen(false);
                        router.push('/numbers');
                        return;
                      }
                      const ready = await waitForPhoneReady();
                      if (!ready) {
                        toast.error('Phone not ready — wait for Ready status');
                        return;
                      }
                      setPowerConfirmOpen(false);
                      powerDialer.start({ delay_seconds: 5 });
                    })();
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

      {/* Parallel session summary */}
      <AnimatePresence>
        {!parallelDialer.isActive && parallelDialer.summary && (
          <motion.div
            key="pl-summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/[0.10] p-6 bg-zinc-900 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold text-white">Parallel session complete</h2>
                <p className="text-sm text-white/40">
                  {Math.floor(parallelDialer.summary.duration_seconds / 60)}m{' '}
                  {parallelDialer.summary.duration_seconds % 60}s ·{' '}
                  {parallelDialer.summary.connect_rate}% connect rate
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <SummaryCell label="Dialed" value={parallelDialer.summary.dialed} />
                <SummaryCell label="Connects" value={parallelDialer.summary.connects} color="cyan" />
                <SummaryCell label="Meetings" value={parallelDialer.summary.meetings} color="green" />
              </div>
              <button
                type="button"
                onClick={() => parallelDialer.dismissSummary()}
                className="w-full min-h-11 rounded-xl text-sm font-semibold text-white gradient-brand"
              >
                Done
              </button>
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
                style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
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

      {/* ── Mobile Queue Drawer ── */}
      <AnimatePresence>
        {mobileQueueOpen && (
          <>
            <motion.div
              key="queue-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[var(--z-drawer)] bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileQueueOpen(false)}
            />
            <motion.div
              key="queue-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-drawer)] flex flex-col rounded-t-3xl border-t border-white/[0.10] bg-zinc-900 overflow-hidden"
              style={{ height: '80vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <span className="text-sm font-semibold text-white">Call Queue</span>
                <button
                  type="button"
                  onClick={() => setMobileQueueOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 hover:text-white"
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
              className="md:hidden fixed inset-0 z-[var(--z-drawer)] bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileAiBriefOpen(false)}
            />
            <motion.div
              key="ai-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-drawer)] flex flex-col rounded-t-3xl border-t border-white/[0.10] bg-zinc-900 overflow-hidden"
              style={{ height: '80vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <span className="text-sm font-semibold text-white">AI Brief</span>
                <button
                  type="button"
                  onClick={() => setMobileAiBriefOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 hover:text-white"
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

      {/* ── Mobile Live Insights Drawer ── */}
      <AnimatePresence>
        {mobileLiveInsightsOpen && selectedLead && mode === 'live' && (
          <>
            <motion.div
              key="live-insights-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[var(--z-drawer)] bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileLiveInsightsOpen(false)}
            />
            <motion.div
              key="live-insights-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-drawer)] flex flex-col rounded-t-3xl border-t border-white/[0.10] bg-zinc-900 overflow-hidden"
              style={{ height: '80vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <span className="text-sm font-semibold text-white">Live insights</span>
                <button
                  type="button"
                  onClick={() => setMobileLiveInsightsOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 hover:text-white"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <LiveInsightsPanel lead={selectedLead} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
