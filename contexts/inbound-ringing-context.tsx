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
    phoneStatus,
    iceConnectionState,
    hangup,
    requestMicPermission,
    isInboundRinging,
    waitForPhoneReady,
    waitForInboundWebRtcLeg,
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
    // Pre-warm browser WebRTC leg while overlay is visible (cuts accept latency).
    void apiFetchRef.current(`/api/calls/${incoming.id}/ensure-browser-leg`, { method: 'POST' }).catch(() => {});
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
    stickyRingRef.current = false;
    callIdRef.current = null;
    ringStartedRef.current = null;
    setRingElapsedSec(0);
    setCall(null);
    window.dispatchEvent(
      new CustomEvent('gd-inbound-answered', { detail: { callId } }),
    );
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

          if (status === 'in_progress') {
            const id = row.id as string;
            if (acceptingRef.current && callIdRef.current === id) {
              finishAccept(id);
            } else {
              stopInboundRingtone();
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
    if (!call || accepting) return;
    const callId = call.id;
    const webrtcAlreadyRinging = isInboundRingingRef.current;
    setAccepting(true);
    acceptingRef.current = true;
    stopInboundRingtone();

    // #region agent log
    voiceSessionLog({
      location: 'inbound-ringing-context.tsx:accept:start',
      message: 'accept started',
      data: { callId, phoneStatus, callStatus, isInboundRinging, hasOutboundSession, webrtcAlreadyRinging },
      hypothesisId: 'H-A,H-D,H-F',
      runId: 'run2',
    });
    // #endregion

    // User gesture — unlock Web Audio + remote element before WebRTC answer.
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

    // Parallel: mic, short phone-ready check, ensure leg (often pre-warmed on ring).
    void requestMicPermission();
    const [, ensureRes] = await Promise.all([
      waitForPhoneReady(2000),
      apiFetch(`/api/calls/${callId}/ensure-browser-leg`, { method: 'POST' }).catch(() => null),
    ]);

    // #region agent log
    voiceSessionLog({
      location: 'inbound-ringing-context.tsx:accept:phoneReady',
      message: 'pre-answer prep done',
      data: { callId, callStatus: callStatusRef.current, webrtcAlreadyRinging },
      hypothesisId: 'H-A',
      runId: 'run3',
    });
    // #endregion

    let ensureStatus = ensureRes?.status ?? 0;
    if (ensureRes?.ok) {
      const body = await ensureRes.json().catch(() => ({})) as { created?: boolean };
      voiceSessionLog({
        location: 'inbound-ringing-context.tsx:accept:ensureLeg',
        message: 'ensure-browser-leg done',
        data: { callId, ensureStatus, ensureCreated: body.created ?? null },
        hypothesisId: 'H-B',
        runId: 'run3',
      });
    }

    // Brief wait for SDK invite — overlay often appears before WebRTC rings.
    await waitForInboundWebRtcLeg(webrtcAlreadyRinging ? 1500 : 3500);

    // #region agent log
    voiceSessionLog({
      location: 'inbound-ringing-context.tsx:accept:legReady',
      message: 'leg wait complete',
      data: { callId, callStatus: callStatusRef.current, isInboundRinging: isInboundRingingRef.current },
      hypothesisId: 'H-B',
      runId: 'run3',
    });
    // #endregion

    // WebRTC + REST answer in parallel — bridge completes server-side via bridge_on_answer.
    const answerRequest = apiFetch(`/api/calls/${callId}/answer`, { method: 'POST' }).catch((err) => {
      console.error('[INBOUND] REST answer failed:', err);
      return null;
    });
    const answered = await answerIncomingCall();

    // #region agent log
    voiceSessionLog({
      location: 'inbound-ringing-context.tsx:accept:answered',
      message: 'parallel answer done',
      data: { callId, answered, callStatus: callStatusRef.current, iceConnectionState },
      hypothesisId: 'H-C',
      runId: 'run3',
    });
    // #endregion

    const res = await answerRequest;
    if (res?.ok || answered || callStatusRef.current === 'active') {
      finishAccept(callId);
      return;
    }

    // Brief wait for WebRTC active after REST marked in_progress.
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (callStatusRef.current === 'active' || !acceptingRef.current) {
        if (callStatusRef.current === 'active') finishAccept(callId);
        return;
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    // #region agent log
    voiceSessionLog({
      location: 'inbound-ringing-context.tsx:accept:timeout',
      message: 'accept timed out',
      data: { callId, callStatus: callStatusRef.current, iceConnectionState },
      hypothesisId: 'H-C,H-D',
      runId: 'run3',
    });
    // #endregion
    console.error('[INBOUND] Accept timed out — WebRTC did not connect');
    hangup();
    clearCall(true);
  }, [call, accepting, registerCallMeta, answerIncomingCall, apiFetch, clearCall, hangup, finishAccept, waitForPhoneReady, waitForInboundWebRtcLeg, phoneStatus, callStatus, iceConnectionState, isInboundRinging, hasOutboundSession]);

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
