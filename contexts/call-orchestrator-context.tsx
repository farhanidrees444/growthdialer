'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { DispositionModal } from '@/components/dialer/disposition-modal';
import type { DispositionType, LeadRecord } from '@/lib/dialer/state-machine';
import { isTwilioCallSid } from '@/lib/twilio/extract-call-sid';

const MIN_WRAP_UP_CONNECTED_SECONDS = 5;
const WRAP_UP_STATUS_POLL_MS = 350;
const WRAP_UP_STATUS_POLL_ATTEMPTS = 6;
const UNCONNECTED_CALL_STATUSES = new Set([
  'busy',
  'canceled',
  'cancelled',
  'declined',
  'failed',
  'missed',
  'no-answer',
  'no_answer',
  'rejected',
]);
const LIVE_CONNECTED_CALL_STATUSES = new Set([
  'active',
  'answered',
  'connected',
  'in-progress',
  'in_progress',
]);

interface CallWrapUpSnapshot {
  id: string;
  status: string | null;
  direction: string | null;
  answered_at: string | null;
  duration_seconds: number | null;
}

export interface PowerDialBridge {
  onCallStarted: () => void;
  onCallEnd: () => void;
  onDispositionSaved: (disposition: string, wasConnected: boolean, wasMeeting: boolean) => void;
  isActive: () => boolean;
  getState: () => string;
}

interface PendingRegistration {
  e164: string;
  leadId?: string;
}

export interface CallOrchestratorValue {
  callDbId: string | null;
  callDurationSeconds: number;
  dispositionOpen: boolean;
  dispositionLead: LeadRecord | null;
  beginOutboundCall: (e164: string, leadId?: string, lead?: LeadRecord | null) => void;
  registerPowerDialBridge: (bridge: PowerDialBridge | null) => void;
  saveDisposition: (
    disposition: string,
    notes?: string,
    callbackAt?: string,
    meetingAt?: string,
  ) => Promise<boolean>;
  closeDisposition: () => void;
  onCallEnded: () => void;
}

const CallOrchestratorContext = createContext<CallOrchestratorValue | null>(null);

export function useCallOrchestrator(): CallOrchestratorValue {
  const ctx = useContext(CallOrchestratorContext);
  if (!ctx) throw new Error('useCallOrchestrator must be inside CallOrchestratorProvider');
  return ctx;
}

export function CallOrchestratorProvider({ children }: { children: ReactNode }) {
  const { callStatus, activeCallId, isInboundRinging, hasOutboundSession } = useWebPhone();
  const { activeLead, activePhone } = useCallContext();
  const { apiFetch } = useWorkspace();

  const [callDbId, setCallDbId] = useState<string | null>(null);
  const [dispositionOpen, setDispositionOpen] = useState(false);
  const [dispositionLead, setDispositionLead] = useState<LeadRecord | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const pendingRegRef = useRef<PendingRegistration | null>(null);
  const prevCallStatusRef = useRef(callStatus);
  const powerBridgeRef = useRef<PowerDialBridge | null>(null);
  const callDbIdRef = useRef<string | null>(null);
  const durationRef = useRef(0);
  const dispositionLeadRef = useRef<LeadRecord | null>(null);
  const hadActiveCallRef = useRef(false);
  const inboundCallActiveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  callDbIdRef.current = callDbId;
  dispositionLeadRef.current = dispositionLead;

  const registerPowerDialBridge = useCallback((bridge: PowerDialBridge | null) => {
    powerBridgeRef.current = bridge;
  }, []);

  const isEligibleForWrapUp = useCallback((call: CallWrapUpSnapshot | null, localSeconds: number) => {
    if (!call) return false;
    const status = (call.status ?? '').toLowerCase();
    if (UNCONNECTED_CALL_STATUSES.has(status)) return false;

    const connectedByStatus = LIVE_CONNECTED_CALL_STATUSES.has(status);
    const connectedByAnswer = Boolean(call.answered_at);
    const duration = call.duration_seconds ?? localSeconds;

    return (connectedByAnswer || connectedByStatus) && duration >= MIN_WRAP_UP_CONNECTED_SECONDS;
  }, []);

  const fetchCallWrapUpSnapshot = useCallback(async (
    dbId: string,
    localSeconds: number,
  ): Promise<CallWrapUpSnapshot | null> => {
    let lastSnapshot: CallWrapUpSnapshot | null = null;

    for (let attempt = 0; attempt < WRAP_UP_STATUS_POLL_ATTEMPTS; attempt += 1) {
      try {
        const res = await apiFetch(`/api/calls/${dbId}`);
        if (!res.ok) return lastSnapshot;
        const data = await res.json() as { call?: CallWrapUpSnapshot };
        lastSnapshot = data.call ?? null;

        const status = (lastSnapshot?.status ?? '').toLowerCase();
        if (UNCONNECTED_CALL_STATUSES.has(status) || isEligibleForWrapUp(lastSnapshot, localSeconds)) {
          return lastSnapshot;
        }
      } catch {
        return lastSnapshot;
      }

      if (attempt < WRAP_UP_STATUS_POLL_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, WRAP_UP_STATUS_POLL_MS));
      }
    }

    return lastSnapshot;
  }, [apiFetch, isEligibleForWrapUp]);

  const beginOutboundCall = useCallback((e164: string, leadId?: string, lead?: LeadRecord | null) => {
    pendingRegRef.current = { e164, leadId };
    if (lead) {
      setDispositionLead(lead);
      dispositionLeadRef.current = lead;
    }
    hadActiveCallRef.current = false;
    setCallDbId(null);
    setCallDurationSeconds(0);
    durationRef.current = 0;
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setCallDurationSeconds(0);
    durationRef.current = 0;
  }, []);

  // Accumulate talk time while call is active
  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setCallDurationSeconds(durationRef.current);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  useEffect(() => {
    const onAnswered = (e: Event) => {
      const detail = (e as CustomEvent<{ callId?: string }>).detail;
      inboundCallActiveRef.current = true;
      if (detail?.callId) setCallDbId(detail.callId);
    };
    const onEnded = () => {
      inboundCallActiveRef.current = false;
    };
    window.addEventListener('gd-inbound-answered', onAnswered);
    window.addEventListener('gd-call-ended', onEnded);
    return () => {
      window.removeEventListener('gd-inbound-answered', onAnswered);
      window.removeEventListener('gd-call-ended', onEnded);
    };
  }, []);

  // Pick up outbound calls started outside the dialer (e.g. leads page)
  useEffect(() => {
    if (isInboundRinging && !hasOutboundSession) return;
    if (!activePhone || callStatus === 'idle' || callStatus === 'ended') return;
    if (!pendingRegRef.current && (callStatus === 'connecting' || callStatus === 'ringing')) {
      pendingRegRef.current = {
        e164: activePhone,
        leadId: activeLead?.id,
      };
    }
    if (activeLead) {
      setDispositionLead(activeLead);
      dispositionLeadRef.current = activeLead;
    }
  }, [callStatus, activePhone, activeLead, isInboundRinging, hasOutboundSession]);

  // Register DB call once Telnyx assigns call_control_id (retry — webhook race can precede insert)
  useEffect(() => {
    if (isInboundRinging && !hasOutboundSession) return;
    if (!activeCallId || !pendingRegRef.current) return;
    const { e164, leadId } = pendingRegRef.current;

    const register = async (attempt = 0): Promise<void> => {
      try {
        const r = await apiFetch('/api/calls/dial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: e164, lead_id: leadId, call_control_id: activeCallId }),
        });
        const data = await r.json() as { db_id?: string; error?: string };
        if (data.db_id) {
          pendingRegRef.current = null;
          setCallDbId(data.db_id);
          return;
        }
        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1) ** 2));
          return register(attempt + 1);
        }
        console.error('[CallOrchestrator] call registration failed after retries:', data.error);
        toast.error('Call connected but logging failed — disposition may not save.');
      } catch (err) {
        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1) ** 2));
          return register(attempt + 1);
        }
        console.error('[CallOrchestrator] call registration error:', err);
      }
    };

    void register();
  }, [activeCallId, apiFetch, isInboundRinging, hasOutboundSession]);

  // When Twilio assigns a real CallSid after provisional SDK id, link it to the DB row.
  useEffect(() => {
    if (isInboundRinging && !hasOutboundSession) return;
    if (!callDbId || !activeCallId || !isTwilioCallSid(activeCallId)) return;

    void apiFetch('/api/calls/sync-leg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_sid: activeCallId,
        db_id: callDbId,
        direction: 'outbound',
      }),
    }).catch(() => { /* non-fatal */ });
  }, [activeCallId, callDbId, apiFetch, isInboundRinging, hasOutboundSession]);

  const handleCallEnded = useCallback(() => {
    const seconds = durationRef.current;
    const dbId = callDbIdRef.current;
    const lead = dispositionLeadRef.current ?? activeLead;
    const bridge = powerBridgeRef.current;

    bridge?.onCallEnd();

    const finishWithoutWrapUp = () => {
      setCallDbId(null);
      hadActiveCallRef.current = false;
      resetTimer();

      if (bridge?.isActive()) {
        setTimeout(() => {
          bridge.onDispositionSaved('no_answer', false, false);
        }, 500);
      }
    };

    if (inboundCallActiveRef.current) {
      inboundCallActiveRef.current = false;
      finishWithoutWrapUp();
      return;
    }

    if (!dbId || !hadActiveCallRef.current) {
      finishWithoutWrapUp();
      return;
    }

    void fetchCallWrapUpSnapshot(dbId, seconds).then((snapshot) => {
      if (callDbIdRef.current !== dbId) return;

      if (isEligibleForWrapUp(snapshot, seconds)) {
        setDispositionLead(lead);
        setDispositionOpen(true);
        hadActiveCallRef.current = false;
        return;
      }

      finishWithoutWrapUp();
    });
  }, [activeLead, fetchCallWrapUpSnapshot, isEligibleForWrapUp, resetTimer]);

  // Central call lifecycle transitions
  useEffect(() => {
    const prev = prevCallStatusRef.current;
    prevCallStatusRef.current = callStatus;

    if ((prev === 'connecting' || prev === 'ringing') && callStatus === 'active') {
      const isInboundSession = !hasOutboundSession && isInboundRinging;
      if (!isInboundSession && !inboundCallActiveRef.current) {
        hadActiveCallRef.current = true;
        if (activeLead) {
          setDispositionLead(activeLead);
          dispositionLeadRef.current = activeLead;
        }
      }
      powerBridgeRef.current?.onCallStarted();
    }

    if (
      (prev === 'active' || prev === 'held' || prev === 'connecting' || prev === 'ringing') &&
      (callStatus === 'ended' || callStatus === 'idle')
    ) {
      handleCallEnded();
    }
  }, [callStatus, activeLead, handleCallEnded, hasOutboundSession, isInboundRinging]);

  const saveDisposition = useCallback(async (
    disposition: string,
    notes?: string,
    callbackAt?: string,
    meetingAt?: string,
  ): Promise<boolean> => {
    const dbId = callDbIdRef.current;
    const bridge = powerBridgeRef.current;

    if (dbId) {
      try {
        const res = await apiFetch(`/api/calls/${dbId}/disposition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            disposition,
            notes,
            callback_at: callbackAt,
            meeting_at: meetingAt,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          toast.error(err.error ?? 'Failed to save disposition');
          return false;
        }
      } catch {
        toast.error('Failed to save disposition');
        return false;
      }
    }

    if (bridge?.isActive()) {
      toast.success('Saved · Loading next lead…', { duration: 2000 });
    } else {
      toast.success(`Marked as ${disposition.replace(/_/g, ' ')}`);
    }

    setDispositionOpen(false);
    setCallDbId(null);
    setDispositionLead(null);
    resetTimer();

    if (bridge?.isActive()) {
      const wasConnected = ['interested', 'meeting_booked', 'callback', 'gatekeeper'].includes(disposition);
      const wasMeeting = disposition === 'meeting_booked';
      bridge.onDispositionSaved(disposition, wasConnected, wasMeeting);
    }

    return true;
  }, [apiFetch, resetTimer]);

  const closeDisposition = useCallback(() => {
    const bridge = powerBridgeRef.current;
    if (bridge?.isActive() && bridge.getState() === 'disposition') {
      void saveDisposition('voicemail');
      return;
    }
    setDispositionOpen(false);
    setCallDbId(null);
    setDispositionLead(null);
    resetTimer();
  }, [saveDisposition, resetTimer]);

  return (
    <CallOrchestratorContext.Provider
      value={{
        callDbId,
        callDurationSeconds,
        dispositionOpen,
        dispositionLead,
        beginOutboundCall,
        registerPowerDialBridge,
        saveDisposition,
        closeDisposition,
        onCallEnded: handleCallEnded,
      }}
    >
      {children}
      <DispositionModal
        open={dispositionOpen}
        lead={dispositionLead}
        callDuration={callDurationSeconds}
        onSave={(disp, notes, callbackAt, meetingAt) => {
          void saveDisposition(disp, notes, callbackAt, meetingAt);
        }}
        onClose={closeDisposition}
      />
    </CallOrchestratorContext.Provider>
  );
}
