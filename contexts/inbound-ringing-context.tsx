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
import { resumeVoiceAudioContext } from '@/lib/voice/audio-unlock';
import { unlockRemoteAudioElement } from '@/lib/voice/remote-audio';
import { voiceSessionLog } from '@/lib/debug/voice-session-log';

export interface InboundLead {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

export interface InboundRingingCall {
  id: string;
  call_control_id: string;
  from_number: string | null;
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
const DISMISS_STATUSES = new Set(['missed', 'rejected', 'voicemail', 'failed', 'declined']);

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
    phoneStatus,
    iceConnectionState,
    hangup,
    requestMicPermission,
    isInboundRinging,
    waitForPhoneReady,
    waitForInboundWebRtcLeg,
    setInboundAcceptInFlight,
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
    // Leg B is dialed on accept — overlay is driven by DB/realtime only until then.
    return true;
  }, [blocksNewInboundNow]);

  const clearCall = useCallback((stopAudio = true) => {
    callIdRef.current = null;
    ringStartedRef.current = null;
    stickyRingRef.current = false;
    setAccepting(false);
    acceptingRef.current = false;
    setCall(null);
    setRingElapsedSec(0);
    if (stopAudio) stopInboundRingtone();
  }, []);

  const finishAccept = useCallback((callId: string) => {
    // #region agent log
    voiceSessionLog({
      location: 'inbound-ringing-context.tsx:finishAccept',
      message: 'accept completed',
      data: { callId, callStatus: callStatusRef.current },
      hypothesisId: 'H-D',
      runId: 'run1',
    });
    // #endregion
    stopInboundRingtone();
    acceptingRef.current = false;
    setAccepting(false);
    setInboundAcceptInFlight(false);
    stickyRingRef.current = false;
    callIdRef.current = null;
    ringStartedRef.current = null;
    setRingElapsedSec(0);
    setCall(null);
    window.dispatchEvent(
      new CustomEvent('gd-inbound-answered', { detail: { callId } }),
    );
  }, [setInboundAcceptInFlight]);

  const shouldDismissStatus = useCallback((status: string) => {
    return DISMISS_STATUSES.has(status);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const broadcastChannel = supabase
      .channel(`incoming-calls:${userId}`)
      .on(
        'broadcast',
        { event: 'incoming_call' },
        (msg) => {
          const p = msg.payload as {
            call_id?: string;
            call_control_id?: string;
            caller_number?: string | null;
            to_number?: string | null;
          };
          if (!p.call_id || !p.call_control_id) return;
          if (blocksNewInboundNow()) {
            void apiFetchRef.current('/api/calls/decline', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ call_control_id: p.call_control_id }),
            }).catch(() => {});
            return;
          }
          beginRing({
            id: p.call_id,
            call_control_id: p.call_control_id,
            from_number: p.caller_number ?? null,
            to_number: p.to_number ?? '',
            lead_id: null,
            status: 'ringing',
          });
        },
      )
      .on(
        'broadcast',
        { event: 'call_missed' },
        () => {
          if (stickyRingRef.current && !acceptingRef.current) {
            clearCall(true);
          }
        },
      )
      .on(
        'broadcast',
        { event: 'call_declined' },
        () => {
          if (stickyRingRef.current && !acceptingRef.current) {
            clearCall(true);
          }
        },
      )
      .on(
        'broadcast',
        { event: 'call_cleared' },
        () => {
          if (stickyRingRef.current && !acceptingRef.current) {
            clearCall(true);
          }
        },
      )
      .on(
        'broadcast',
        { event: 'call_active' },
        (msg) => {
          const p = msg.payload as { call_id?: string };
          if (p.call_id && acceptingRef.current && callIdRef.current === p.call_id) {
            finishAccept(p.call_id);
          }
        },
      )
      .subscribe();

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
            call_control_id: (row.telnyx_call_id as string) ?? '',
            from_number: (row.from_number as string | null) ?? null,
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

          if (status === 'active' || status === 'in_progress' || status === 'connecting') {
            const id = row.id as string;
            if (acceptingRef.current && callIdRef.current === id && callStatusRef.current === 'active') {
              finishAccept(id);
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
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(channel);
      stopInboundRingtone();
    };
  }, [userId, blocksNewInboundNow, beginRing, clearCall, shouldDismissStatus, finishAccept]);

  useEffect(() => {
    if (!userId || !isInboundRinging || hasOutboundSession) return;
    void apiFetchRef.current('/api/inbound/ringing')
      .then((r) => r.json())
      .then((data: { call?: InboundRingingCall | null }) => {
        if (data.call?.status === 'ringing' && !blocksNewInboundNow()) {
          beginRing(data.call);
        }
      })
      .catch(() => { /* non-fatal */ });
  }, [isInboundRinging, hasOutboundSession, userId, beginRing, blocksNewInboundNow]);

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

  // WebRTC went live while accept is in flight — close overlay immediately.
  useEffect(() => {
    if (!accepting || !callIdRef.current) return;
    if (callStatus === 'active') {
      finishAccept(callIdRef.current);
    }
  }, [accepting, callStatus, finishAccept]);

  useEffect(() => {
    const onWebrtcActive = () => {
      if (acceptingRef.current && callIdRef.current) {
        finishAccept(callIdRef.current);
      }
    };
    window.addEventListener('gd-webrtc-inbound-active', onWebrtcActive);
    return () => window.removeEventListener('gd-webrtc-inbound-active', onWebrtcActive);
  }, [finishAccept]);

  const accept = useCallback(async () => {
    if (!call || acceptingRef.current) return;
    const callId = call.id;
    acceptingRef.current = true;
    setAccepting(true);
    setInboundAcceptInFlight(true);
    stopInboundRingtone();

    voiceSessionLog({
      location: 'inbound-ringing-context.tsx:accept:start',
      message: '2-leg accept started',
      data: { callId, phoneStatus, callStatus, hasOutboundSession },
      hypothesisId: 'H-2LEG',
      runId: 'run10',
    });

    void requestMicPermission();
    await resumeVoiceAudioContext();
    await unlockRemoteAudioElement();

    const leadName = call.lead
      ? [call.lead.first_name, call.lead.last_name].filter(Boolean).join(' ')
      : 'Unknown Caller';

    registerCallMeta(
      call.lead && call.from_number
        ? {
            id: call.lead_id ?? '',
            name: leadName,
            company: call.lead.company ?? '',
            phone: call.from_number,
          } as Parameters<typeof registerCallMeta>[0]
        : null,
      call.from_number ?? '',
    );

    const acceptRes = await apiFetch('/api/calls/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_control_id: call.call_control_id }),
    }).catch((err) => {
      console.error('[INBOUND] accept dial failed:', err);
      return null;
    });
    if (!acceptRes?.ok) {
      console.error('[INBOUND] Leg B dial failed:', acceptRes?.status);
      setInboundAcceptInFlight(false);
      acceptingRef.current = false;
      setAccepting(false);
      playInboundRingtone();
      return;
    }

    setCall(null);
    stickyRingRef.current = false;

    await waitForPhoneReady(5000);

    let legReady = await waitForInboundWebRtcLeg(12000);
    if (!legReady) {
      const redial = await apiFetch(`/api/calls/${callId}/ensure-browser-leg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_redial: true }),
      }).catch(() => null);
      if (redial?.ok) {
        legReady = await waitForInboundWebRtcLeg(10000);
      }
    }

    if (!legReady) {
      console.error('[INBOUND] No WebRTC invite after Leg B dial');
      setInboundAcceptInFlight(false);
      acceptingRef.current = false;
      setAccepting(false);
      hangup();
      clearCall(true);
      return;
    }

    const answered = await answerIncomingCall();
    if (!answered) {
      console.error('[INBOUND] WebRTC answer failed');
      setInboundAcceptInFlight(false);
      acceptingRef.current = false;
      setAccepting(false);
      hangup();
      clearCall(true);
      return;
    }

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && acceptingRef.current) {
      if (callStatusRef.current === 'active') {
        finishAccept(callId);
        return;
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    console.error('[INBOUND] Accept timed out — bridge did not complete');
    setInboundAcceptInFlight(false);
    acceptingRef.current = false;
    setAccepting(false);
    hangup();
    clearCall(true);
  }, [call, registerCallMeta, answerIncomingCall, apiFetch, clearCall, hangup, finishAccept, waitForPhoneReady, waitForInboundWebRtcLeg, setInboundAcceptInFlight, requestMicPermission, phoneStatus, callStatus, hasOutboundSession]);

  const decline = useCallback(async () => {
    if (!call || accepting) return;
    const callControlId = call.call_control_id;
    clearCall(true);
    hangup();
    try {
      await apiFetch('/api/calls/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_control_id: callControlId }),
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
