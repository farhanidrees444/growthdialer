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
    setAccepting(true);
    acceptingRef.current = true;
    stopInboundRingtone();

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

    const micOk = await requestMicPermission();
    if (!micOk) {
      console.warn('[INBOUND] Microphone permission denied — audio may not work');
    }

    await waitForPhoneReady(8000);

    try {
      const ensureRes = await apiFetch(`/api/calls/${callId}/ensure-browser-leg`, { method: 'POST' });
      if (!ensureRes.ok) {
        console.warn('[INBOUND] ensure-browser-leg failed:', ensureRes.status);
      }
    } catch (err) {
      console.warn('[INBOUND] ensure-browser-leg error:', err);
    }

    let legReady = await waitForInboundWebRtcLeg(18_000);
    if (!legReady) {
      try {
        await apiFetch(`/api/calls/${callId}/ensure-browser-leg`, { method: 'POST' });
      } catch { /* retry once */ }
      legReady = await waitForInboundWebRtcLeg(10_000);
    }

    if (!legReady) {
      console.error('[INBOUND] No WebRTC leg in browser — cannot answer');
      hangup();
      clearCall(true);
      return;
    }

    const answered = await answerIncomingCall();
    if (!answered) {
      console.error('[INBOUND] WebRTC answer() failed');
      hangup();
      clearCall(true);
      return;
    }

    // Wait until media path is live before REST bridge fallback (avoids ICE race).
    const mediaDeadline = Date.now() + 12_000;
    while (Date.now() < mediaDeadline) {
      if (callStatusRef.current === 'active') break;
      await new Promise((r) => setTimeout(r, 120));
    }

    const answerRequest = apiFetch(`/api/calls/${callId}/answer`, { method: 'POST' }).catch((err) => {
      console.error('[INBOUND] REST answer failed:', err);
      return null;
    });

    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (callStatusRef.current === 'active') {
        finishAccept(callId);
        void answerRequest;
        return;
      }
      if (!acceptingRef.current) return;
      await new Promise((r) => setTimeout(r, 150));
    }

    const res = await answerRequest;
    if (res?.ok || callStatusRef.current === 'active') {
      finishAccept(callId);
      return;
    }

    console.error('[INBOUND] Accept timed out — WebRTC did not connect');
    hangup();
    clearCall(true);
  }, [call, accepting, registerCallMeta, requestMicPermission, answerIncomingCall, apiFetch, clearCall, hangup, finishAccept, waitForPhoneReady, waitForInboundWebRtcLeg]);

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
