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

const DISPOSITION_THRESHOLD_SEC = 10;

export interface PowerDialBridge {
  onCallStarted: () => void;
  onCallEnd: () => void;
  onDispositionSaved: (disposition: DispositionType, wasConnected: boolean, wasMeeting: boolean) => void;
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
  beginOutboundCall: (e164: string, leadId?: string) => void;
  registerPowerDialBridge: (bridge: PowerDialBridge | null) => void;
  saveDisposition: (
    disposition: DispositionType,
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
  const { callStatus, activeCallId } = useWebPhone();
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  callDbIdRef.current = callDbId;
  dispositionLeadRef.current = dispositionLead;

  const registerPowerDialBridge = useCallback((bridge: PowerDialBridge | null) => {
    powerBridgeRef.current = bridge;
  }, []);

  const beginOutboundCall = useCallback((e164: string, leadId?: string) => {
    pendingRegRef.current = { e164, leadId };
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

  // Pick up outbound calls started outside the dialer (e.g. leads page)
  useEffect(() => {
    if (callStatus !== 'connecting' || pendingRegRef.current || !activePhone) return;
    pendingRegRef.current = {
      e164: activePhone,
      leadId: activeLead?.id,
    };
    if (activeLead) setDispositionLead(activeLead);
  }, [callStatus, activePhone, activeLead]);

  // Register DB call once Telnyx assigns call_control_id
  useEffect(() => {
    if (!activeCallId || !pendingRegRef.current) return;
    const { e164, leadId } = pendingRegRef.current;
    pendingRegRef.current = null;

    void apiFetch('/api/calls/dial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: e164, lead_id: leadId, call_control_id: activeCallId }),
    })
      .then((r) => r.json())
      .then((data: { db_id?: string; call_control_id?: string }) => {
        const id = data.db_id ?? data.call_control_id ?? null;
        if (id) setCallDbId(id);
      })
      .catch(() => { /* non-fatal */ });
  }, [activeCallId, apiFetch]);

  const autoSaveVoicemail = useCallback(async (dbId: string) => {
    try {
      await apiFetch(`/api/calls/${dbId}/disposition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disposition: 'voicemail' }),
      });
    } catch { /* non-fatal */ }
  }, [apiFetch]);

  const handleCallEnded = useCallback(() => {
    const seconds = durationRef.current;
    const dbId = callDbIdRef.current;
    const lead = dispositionLeadRef.current ?? activeLead;
    const bridge = powerBridgeRef.current;

    bridge?.onCallEnd();

    if (seconds >= DISPOSITION_THRESHOLD_SEC) {
      setDispositionLead(lead);
      setDispositionOpen(true);
      return;
    }

    if (dbId) void autoSaveVoicemail(dbId);

    if (bridge?.isActive()) {
      setTimeout(() => {
        bridge.onDispositionSaved('voicemail', false, false);
      }, 2000);
    }

    setCallDbId(null);
    resetTimer();
  }, [activeLead, autoSaveVoicemail, resetTimer]);

  // Central call lifecycle transitions
  useEffect(() => {
    const prev = prevCallStatusRef.current;
    prevCallStatusRef.current = callStatus;

    if ((prev === 'connecting' || prev === 'ringing') && callStatus === 'active') {
      if (activeLead) setDispositionLead(activeLead);
      powerBridgeRef.current?.onCallStarted();
    }

    if (
      (prev === 'active' || prev === 'held' || prev === 'connecting' || prev === 'ringing') &&
      (callStatus === 'ended' || callStatus === 'idle')
    ) {
      handleCallEnded();
    }
  }, [callStatus, activeLead, handleCallEnded]);

  const saveDisposition = useCallback(async (
    disposition: DispositionType,
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
