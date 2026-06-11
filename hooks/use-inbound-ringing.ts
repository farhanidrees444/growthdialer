'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { useWorkspace } from '@/contexts/workspace-context';

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

export function useInboundRinging(userId: string | undefined) {
  const [call, setCall] = useState<InboundRingingCall | null>(null);
  const [accepting, setAccepting] = useState(false);
  const callIdRef = useRef<string | null>(null);

  const { answerIncomingCall, hasOutboundSession, callStatus, hangup, requestMicPermission } = useWebPhone();
  const { registerCallMeta, callInitiatedAt } = useCallContext();
  const { apiFetch } = useWorkspace();

  const hasOutboundSessionRef = useRef(hasOutboundSession);
  const callStatusRef = useRef(callStatus);
  const apiFetchRef = useRef(apiFetch);
  hasOutboundSessionRef.current = hasOutboundSession;
  callStatusRef.current = callStatus;
  apiFetchRef.current = apiFetch;

  const isOutboundBusy = useCallback(() => {
    return (
      hasOutboundSessionRef.current
      || callStatusRef.current === 'connecting'
      || callStatusRef.current === 'active'
      || callStatusRef.current === 'held'
    );
  }, []);

  const showCall = useCallback((incoming: InboundRingingCall) => {
    if (isOutboundBusy()) return false;
    callIdRef.current = incoming.id;
    setAccepting(false);
    setCall(incoming);
    return true;
  }, [isOutboundBusy]);

  const clearCall = useCallback(() => {
    callIdRef.current = null;
    setAccepting(false);
    setCall(null);
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

          showCall({
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
          if (['missed', 'completed', 'rejected', 'voicemail'].includes(row.status as string)) {
            clearCall();
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, isOutboundBusy, showCall, clearCall]);

  useEffect(() => {
    if (!userId) return;

    const poll = async () => {
      if (callIdRef.current || isOutboundBusy()) return;
      try {
        const res = await apiFetchRef.current('/api/inbound/ringing');
        if (!res.ok) return;
        const data = await res.json() as { call?: InboundRingingCall | null };
        if (data.call?.status === 'ringing') showCall(data.call);
      } catch { /* non-fatal */ }
    };

    const onWebrtcRing = () => void poll();
    window.addEventListener('gd-webrtc-inbound-ring', onWebrtcRing);

    void poll();
    const interval = setInterval(() => void poll(), 2000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('gd-webrtc-inbound-ring', onWebrtcRing);
    };
  }, [userId, isOutboundBusy, showCall]);

  const outboundActive =
    hasOutboundSession
    || callStatus === 'connecting'
    || callStatus === 'active'
    || callStatus === 'held'
    || (callInitiatedAt != null && callStatus === 'ringing');

  const accept = useCallback(async () => {
    if (!call || accepting) return;
    setAccepting(true);

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

    for (let i = 0; i < 20; i++) {
      const st = callStatusRef.current;
      if (st === 'active' || st === 'connecting') break;
      await new Promise((r) => setTimeout(r, 200));
    }

    try {
      await apiFetch(`/api/calls/${callId}/answer`, { method: 'POST' });
    } catch {
      console.error('[INBOUND] REST answer failed');
    }

    clearCall();
  }, [call, accepting, registerCallMeta, requestMicPermission, answerIncomingCall, apiFetch, clearCall]);

  const decline = useCallback(async () => {
    if (!call || accepting) return;
    const callId = call.id;
    clearCall();
    try {
      await apiFetch(`/api/calls/${callId}/end`, { method: 'POST' });
    } catch { /* non-fatal */ }
    hangup();
  }, [call, accepting, clearCall, apiFetch, hangup]);

  return {
    call: outboundActive ? null : call,
    accept,
    decline,
    accepting,
    isRinging: Boolean(call) && !outboundActive,
  };
}
