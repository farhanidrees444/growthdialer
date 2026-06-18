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
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
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
  call_control_id: string;
  from_number: string | null;
  to_number: string;
  lead_id: string | null;
  status: string;
  lead?: InboundLead | null;
  provider?: 'twilio' | 'legacy';
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

const ACCEPT_EVENT_TIMEOUT_MS = 12_000;

function blocksNewInbound(hasOutboundSession: boolean, callStatus: string): boolean {
  if (hasOutboundSession) return true;
  return callStatus === 'active' || callStatus === 'held';
}

export function InboundRingingProvider({
  children,
}: {
  userId?: string | undefined;
  children: ReactNode;
}) {
  const [call, setCall] = useState<InboundRingingCall | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [ringElapsedSec, setRingElapsedSec] = useState(0);

  const ringStartedRef = useRef<number | null>(null);
  const acceptingRef = useRef(false);
  const acceptWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callMetaRef = useRef<InboundRingingCall | null>(null);

  const {
    answerIncomingCall,
    hangup,
    callStatus,
    hasOutboundSession,
    isInboundRinging,
    requestMicPermission,
  } = useWebPhone();
  const { registerCallMeta } = useCallContext();

  const callStatusRef = useRef(callStatus);
  callStatusRef.current = callStatus;
  callMetaRef.current = call;

  const clearAcceptWatchdog = useCallback(() => {
    if (acceptWatchdogRef.current) {
      clearTimeout(acceptWatchdogRef.current);
      acceptWatchdogRef.current = null;
    }
  }, []);

  const clearCall = useCallback((stopAudio = true) => {
    clearAcceptWatchdog();
    acceptingRef.current = false;
    setAccepting(false);
    setCall(null);
    ringStartedRef.current = null;
    setRingElapsedSec(0);
    if (stopAudio) stopInboundRingtone();
  }, [clearAcceptWatchdog]);

  const finishActive = useCallback((callId: string) => {
    clearAcceptWatchdog();
    stopInboundRingtone();
    acceptingRef.current = false;
    setAccepting(false);
    setCall(null);
    ringStartedRef.current = null;
    setRingElapsedSec(0);
    window.dispatchEvent(
      new CustomEvent('gd-inbound-answered', { detail: { callId } }),
    );
  }, [clearAcceptWatchdog]);

  useEffect(() => {
    const onRing = (ev: Event) => {
      const detail = (ev as CustomEvent<{
        call_id?: string;
        from_number?: string | null;
        to_number?: string | null;
      }>).detail;

      if (!detail?.call_id) return;
      if (blocksNewInbound(hasOutboundSession, callStatusRef.current)) {
        hangup();
        return;
      }

      ringStartedRef.current = Date.now();
      setRingElapsedSec(0);
      setAccepting(false);
      acceptingRef.current = false;

      setCall({
        id: detail.call_id,
        call_control_id: detail.call_id,
        from_number: detail.from_number ?? null,
        to_number: detail.to_number ?? '',
        lead_id: null,
        status: 'ringing',
        provider: 'twilio',
      });
      playInboundRingtone();
    };

    const onCallEnded = () => clearCall(true);

    const onWebrtcActive = () => {
      const meta = callMetaRef.current;
      if (acceptingRef.current && meta) {
        finishActive(meta.id);
      }
    };

    window.addEventListener('gd-webrtc-inbound-ring', onRing);
    window.addEventListener('gd-call-ended', onCallEnded);
    window.addEventListener('gd-webrtc-inbound-active', onWebrtcActive);

    return () => {
      window.removeEventListener('gd-webrtc-inbound-ring', onRing);
      window.removeEventListener('gd-call-ended', onCallEnded);
      window.removeEventListener('gd-webrtc-inbound-active', onWebrtcActive);
      stopInboundRingtone();
    };
  }, [hasOutboundSession, hangup, clearCall, finishActive]);

  useEffect(() => {
    if (!call || accepting) return;
    if (!isInboundRinging && callStatus === 'idle') {
      const t = setTimeout(() => {
        if (!acceptingRef.current && callStatusRef.current === 'idle') {
          clearCall(true);
        }
      }, 600);
      return () => clearTimeout(t);
    }
  }, [call, accepting, isInboundRinging, callStatus, clearCall]);

  useEffect(() => {
    if (accepting && callStatus === 'active' && call) {
      finishActive(call.id);
    }
  }, [accepting, callStatus, call, finishActive]);

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
    if (!call || acceptingRef.current) return;

    acceptingRef.current = true;
    setAccepting(true);
    stopInboundRingtone();

    void requestMicPermission();
    await resumeVoiceAudioContext();
    await unlockRemoteAudioElement();

    registerCallMeta(null, call.from_number ?? '');

    const ok = await answerIncomingCall();
    if (!ok) {
      acceptingRef.current = false;
      setAccepting(false);
      playInboundRingtone();
      return;
    }

    clearAcceptWatchdog();
    acceptWatchdogRef.current = setTimeout(() => {
      if (callStatusRef.current !== 'active') {
        console.error('[Inbound] Twilio accept event did not fire within 12s', {
          callId: call.id,
          callStatus: callStatusRef.current,
        });
        acceptingRef.current = false;
        setAccepting(false);
      }
    }, ACCEPT_EVENT_TIMEOUT_MS);
  }, [call, answerIncomingCall, clearAcceptWatchdog, registerCallMeta, requestMicPermission]);

  const decline = useCallback(async () => {
    if (!call || acceptingRef.current) return;
    clearCall(true);
    hangup();
    window.dispatchEvent(new CustomEvent('gd-call-ended'));
  }, [call, clearCall, hangup]);

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
