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
import { createClient } from '@/lib/supabase/client';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { playInboundRingtone, stopInboundRingtone } from '@/lib/inbound/ringtone';

export interface InboundLead {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

export interface InboundRingingCall {
  id: string;
  from_number: string;
  to_number: string;
  lead_id: string | null;
  status: string;
  lead?: InboundLead | null;
}

interface InboundRingingContextValue {
  call: InboundRingingCall | null;
  accept: () => Promise<void>;
  decline: () => Promise<void>;
  accepting: boolean;
  isRinging: boolean;
  ringElapsedSec: number;
}

const InboundRingingContext = createContext<InboundRingingContextValue | null>(null);

const TERMINAL_STATUSES = new Set(['missed', 'completed', 'rejected', 'voicemail', 'failed']);

function blocksInboundUi(
  hasOutboundSession: boolean,
  isInboundRinging: boolean,
  callStatus: string,
): boolean {
  if (hasOutboundSession) return true;
  if (isInboundRinging) return false;
  return callStatus === 'connecting' || callStatus === 'active' || callStatus === 'held';
}

export function InboundRingingProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: ReactNode;
}) {
  const [call, setCall] = useState<InboundRingingCall | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [ringElapsedSec, setRingElapsedSec] = useState(0);
  const callIdRef = useRef<string | null>(null);
  const ringStartedRef = useRef<number | null>(null);
  const acceptingRef = useRef(false);

  const {
    answerIncomingCall,
    hasOutboundSession,
    isInboundRinging,
    callStatus,
    hangup,
    requestMicPermission,
  } = useWebPhone();
  const { registerCallMeta } = useCallContext();
  const { apiFetch } = useWorkspace();

  const hasOutboundSessionRef = useRef(hasOutboundSession);
  const isInboundRingingRef = useRef(isInboundRinging);
  const callStatusRef = useRef(callStatus);
  const apiFetchRef = useRef(apiFetch);
  hasOutboundSessionRef.current = hasOutboundSession;
  isInboundRingingRef.current = isInboundRinging;
  callStatusRef.current = callStatus;
  apiFetchRef.current = apiFetch;
  acceptingRef.current = accepting;

  const isOutboundBusy = useCallback(() => {
    return blocksInboundUi(
      hasOutboundSessionRef.current,
      isInboundRingingRef.current,
      callStatusRef.current,
    );
  }, []);

  const beginRing = useCallback((incoming: InboundRingingCall) => {
    if (isOutboundBusy()) return false;
    callIdRef.current = incoming.id;
    ringStartedRef.current = Date.now();
    setRingElapsedSec(0);
    setAccepting(false);
    setCall(incoming);
    playInboundRingtone();
    return true;
  }, [isOutboundBusy]);

  const clearCall = useCallback((stopAudio = true) => {
    callIdRef.current = null;
    ringStartedRef.current = null;
    setAccepting(false);
    setCall(null);
    setRingElapsedSec(0);
    if (stopAudio) stopInboundRingtone();
  }, []);

  const shouldDismissStatus = useCallback((status: string) => {
    if (acceptingRef.current && status === 'in_progress') return false;
    return TERMINAL_STATUSES.has(status);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`inbound-ring-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.direction !== 'inbound' || row.status !== 'ringing') return;
          if (isOutboundBusy()) {
            void apiFetchRef.current(`/api/calls/${row.id as string}/end`, { method: 'POST' }).catch(() => {});
            return;
          }

          let lead: InboundLead | null = null;
          if (row.lead_id) {
            const { data } = await supabase
              .from('leads')
              .select('first_name, last_name, company')
              .eq('id', row.lead_id as string)
              .maybeSingle();
            lead = data ?? null;
          }

          beginRing({
            id: row.id as string,
            from_number: row.from_number as string,
            to_number: row.to_number as string,
            lead_id: row.lead_id as string | null,
            status: row.status as string,
            lead,
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.id !== callIdRef.current) return;
          const status = row.status as string;
          if (status === 'in_progress' && acceptingRef.current) {
            clearCall(true);
            window.dispatchEvent(new CustomEvent('gd-call-ended'));
            return;
          }
          if (shouldDismissStatus(status)) {
            clearCall(true);
            window.dispatchEvent(new CustomEvent('gd-call-ended'));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopInboundRingtone();
    };
  }, [userId, isOutboundBusy, beginRing, clearCall, shouldDismissStatus]);

  useEffect(() => {
    if (!userId) return;

    const poll = async () => {
      if (callIdRef.current || isOutboundBusy()) return;
      try {
        const res = await apiFetchRef.current('/api/inbound/ringing');
        if (!res.ok) return;
        const data = await res.json() as { call?: InboundRingingCall | null };
        if (data.call?.status === 'ringing') beginRing(data.call);
      } catch { /* non-fatal */ }
    };

    const onWebrtcRing = () => void poll();
    window.addEventListener('gd-webrtc-inbound-ring', onWebrtcRing);

    void poll();
    const interval = setInterval(() => void poll(), 1500);
    return () => {
      clearInterval(interval);
      window.removeEventListener('gd-webrtc-inbound-ring', onWebrtcRing);
    };
  }, [userId, isOutboundBusy, beginRing]);

  useEffect(() => {
    if (!call) return;
    const tick = setInterval(() => {
      if (ringStartedRef.current) {
        setRingElapsedSec(Math.floor((Date.now() - ringStartedRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [call]);

  const outboundBlocks = blocksInboundUi(hasOutboundSession, isInboundRinging, callStatus);
  const visibleCall = outboundBlocks ? null : call;

  const accept = useCallback(async () => {
    if (!call || accepting) return;
    setAccepting(true);
    stopInboundRingtone();

    const callId = call.id;
    const leadName = call.lead
      ? [call.lead.first_name, call.lead.last_name].filter(Boolean).join(' ')
      : 'Unknown Caller';

    registerCallMeta(
      call.lead
        ? {
            id: call.lead_id ?? '',
            name: leadName,
            company: call.lead.company ?? '',
            phone: call.from_number,
          } as Parameters<typeof registerCallMeta>[0]
        : null,
      call.from_number,
    );

    const micOk = await requestMicPermission();
    if (!micOk) {
      console.warn('[INBOUND] Microphone permission denied — audio may not work');
    }

    answerIncomingCall();

    for (let i = 0; i < 25; i++) {
      const st = callStatusRef.current;
      if (st === 'active' || st === 'connecting') break;
      await new Promise((r) => setTimeout(r, 200));
    }

    try {
      await apiFetch(`/api/calls/${callId}/answer`, { method: 'POST' });
    } catch {
      console.error('[INBOUND] REST answer failed');
    }

    setAccepting(false);
    if (callStatusRef.current === 'active' || callStatusRef.current === 'connecting') {
      clearCall(true);
    }
  }, [call, accepting, registerCallMeta, requestMicPermission, answerIncomingCall, apiFetch, clearCall]);

  const decline = useCallback(async () => {
    if (!call || accepting) return;
    const callId = call.id;
    clearCall(true);
    try {
      await apiFetch(`/api/calls/${callId}/end`, { method: 'POST' });
    } catch { /* non-fatal */ }
    hangup();
    window.dispatchEvent(new CustomEvent('gd-call-ended'));
  }, [call, accepting, clearCall, apiFetch, hangup]);

  return (
    <InboundRingingContext.Provider
      value={{
        call: visibleCall,
        accept,
        decline,
        accepting,
        isRinging: Boolean(visibleCall),
        ringElapsedSec,
      }}
    >
      {children}
    </InboundRingingContext.Provider>
  );
}

export function useInboundRinging(): InboundRingingContextValue {
  const ctx = useContext(InboundRingingContext);
  if (!ctx) {
    throw new Error('useInboundRinging must be used inside InboundRingingProvider');
  }
  return ctx;
}
