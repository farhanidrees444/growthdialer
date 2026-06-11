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

/** Only statuses that mean the agent can no longer answer. */
const DISMISS_STATUSES = new Set(['missed', 'rejected', 'voicemail', 'failed']);

function blocksNewInbound(
  hasOutboundSession: boolean,
  callStatus: string,
): boolean {
  if (hasOutboundSession) return true;
  return callStatus === 'active' || callStatus === 'held';
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
  const stickyRingRef = useRef(false);

  const {
    answerIncomingCall,
    hasOutboundSession,
    callStatus,
    hangup,
    requestMicPermission,
    isInboundRinging,
  } = useWebPhone();
  const { registerCallMeta } = useCallContext();
  const { apiFetch } = useWorkspace();

  const hasOutboundSessionRef = useRef(hasOutboundSession);
  const callStatusRef = useRef(callStatus);
  const isInboundRingingRef = useRef(isInboundRinging);
  const apiFetchRef = useRef(apiFetch);
  hasOutboundSessionRef.current = hasOutboundSession;
  callStatusRef.current = callStatus;
  isInboundRingingRef.current = isInboundRinging;
  apiFetchRef.current = apiFetch;
  acceptingRef.current = accepting;

  const blocksNewInboundNow = useCallback(() => {
    return blocksNewInbound(hasOutboundSessionRef.current, callStatusRef.current);
  }, []);

  const beginRing = useCallback((incoming: InboundRingingCall) => {
    if (blocksNewInboundNow()) return false;
    callIdRef.current = incoming.id;
    stickyRingRef.current = true;
    if (!ringStartedRef.current) {
      ringStartedRef.current = Date.now();
      setRingElapsedSec(0);
    }
    setAccepting(false);
    setCall(incoming);
    playInboundRingtone();
    return true;
  }, [blocksNewInboundNow]);

  const clearCall = useCallback((stopAudio = true) => {
    callIdRef.current = null;
    ringStartedRef.current = null;
    stickyRingRef.current = false;
    setAccepting(false);
    setCall(null);
    setRingElapsedSec(0);
    if (stopAudio) stopInboundRingtone();
  }, []);

  const shouldDismissStatus = useCallback((status: string) => {
    return DISMISS_STATUSES.has(status);
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
          if (blocksNewInboundNow()) {
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

          if (status === 'in_progress') {
            stopInboundRingtone();
            if (!acceptingRef.current) {
              stickyRingRef.current = false;
              clearCall(false);
            }
            return;
          }

          if (row.ended_at || shouldDismissStatus(status)) {
            const ringAgeMs = ringStartedRef.current
              ? Date.now() - ringStartedRef.current
              : Infinity;
            // Brief grace only for bridge race — not for finished test calls.
            if (
              !row.ended_at
              && isInboundRingingRef.current
              && !hasOutboundSessionRef.current
              && (status === 'failed' || status === 'missed')
              && ringAgeMs < 8000
            ) {
              return;
            }
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
  }, [userId, blocksNewInboundNow, beginRing, clearCall, shouldDismissStatus]);

  useEffect(() => {
    if (!userId) return;

    const poll = async () => {
      if (blocksNewInboundNow() && !stickyRingRef.current) return;

      try {
        const res = await apiFetchRef.current('/api/inbound/ringing');
        if (!res.ok) return;
        const data = await res.json() as { call?: InboundRingingCall | null };

        if (data.call?.status === 'ringing') {
          if (!callIdRef.current) {
            beginRing(data.call);
          } else if (data.call.id !== callIdRef.current) {
            // Newer live ring supersedes a stale overlay (e.g. prior test call).
            beginRing(data.call);
          } else {
            setCall((prev) => (prev ? { ...prev, ...data.call } : data.call!));
            stickyRingRef.current = true;
          }
          return;
        }

        if (stickyRingRef.current && callIdRef.current && !data.call) {
          if (isInboundRingingRef.current && !hasOutboundSessionRef.current) {
            const graceMs = Date.now() - (ringStartedRef.current ?? Date.now());
            if (graceMs < 10000) return;
          }
          clearCall(true);
        }
      } catch { /* non-fatal */ }
    };

    const onWebrtcRing = () => {
      if (callIdRef.current) {
        stickyRingRef.current = true;
        playInboundRingtone();
      }
      void poll();
    };

    window.addEventListener('gd-webrtc-inbound-ring', onWebrtcRing);

    void poll();
    const interval = setInterval(() => void poll(), 1500);
    return () => {
      clearInterval(interval);
      window.removeEventListener('gd-webrtc-inbound-ring', onWebrtcRing);
    };
  }, [userId, blocksNewInboundNow, beginRing, clearCall]);

  useEffect(() => {
    if (!call) return;
    const tick = setInterval(() => {
      if (ringStartedRef.current) {
        setRingElapsedSec(Math.floor((Date.now() - ringStartedRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [call]);

  const accept = useCallback(async () => {
    if (!call || accepting) return;
    setAccepting(true);
    stopInboundRingtone();

    const callId = call.id;

    try {
      const check = await apiFetch('/api/inbound/ringing');
      if (check.ok) {
        const body = await check.json() as { call?: { id: string } | null };
        if (!body.call || body.call.id !== callId) {
          setAccepting(false);
          clearCall(true);
          return;
        }
      }
    } catch { /* proceed if check fails */ }
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

    let answerOk = false;
    try {
      const res = await apiFetch(`/api/calls/${callId}/answer`, { method: 'POST' });
      answerOk = res.ok;
      if (!res.ok) {
        console.error('[INBOUND] REST answer failed:', res.status);
        hangup();
        clearCall(true);
        setAccepting(false);
        return;
      }
    } catch {
      console.error('[INBOUND] REST answer failed');
      hangup();
      clearCall(true);
      setAccepting(false);
      return;
    }

    setAccepting(false);
    if (answerOk && (callStatusRef.current === 'active' || callStatusRef.current === 'connecting')) {
      stickyRingRef.current = false;
      clearCall(true);
      window.dispatchEvent(
        new CustomEvent('gd-inbound-answered', { detail: { callId } }),
      );
    }
  }, [call, accepting, registerCallMeta, requestMicPermission, answerIncomingCall, apiFetch, clearCall, hangup]);

  const decline = useCallback(async () => {
    if (!call || accepting) return;
    const callId = call.id;
    clearCall(true);
    hangup();
    try {
      await apiFetch(`/api/calls/${callId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip_hangup: true }),
      });
    } catch { /* non-fatal */ }
    window.dispatchEvent(new CustomEvent('gd-call-ended'));
  }, [call, accepting, clearCall, apiFetch, hangup]);

  return (
    <InboundRingingContext.Provider
      value={{
        call,
        accept,
        decline,
        accepting,
        isRinging: Boolean(call),
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
