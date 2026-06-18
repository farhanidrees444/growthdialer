'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Call } from '@twilio/voice-sdk';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { playInboundRingtone, stopInboundRingtone } from '@/lib/inbound/ringtone';
import { resumeVoiceAudioContext } from '@/lib/voice/audio-unlock';
import { unlockRemoteAudioElement } from '@/lib/voice/remote-audio';
import { voiceClientLog } from '@/lib/voice/session-log';
import {
  extractCallSidFromSdkCall,
  extractInboundFromNumber,
  extractInboundToNumber,
} from '@/lib/twilio/extract-call-sid';
import { isAnonymousCaller } from '@/lib/twilio/caller-id-utils';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

export type CallPhase = 'idle' | 'incoming' | 'connecting' | 'ended';

export interface CallerContext {
  loading: boolean;
  anonymous: boolean;
  leadName: string | null;
  company: string | null;
  callerName: string | null;
  carrier: string | null;
  pastCallCount: number;
  lastDisposition: string | null;
}

export interface CallsContextValue {
  phase: CallPhase;
  fromNumber: string | null;
  toNumber: string | null;
  callId: string | null;
  ringElapsedSec: number;
  connectError: string | null;
  callerContext: CallerContext;
  isInboundSession: boolean;
  isRinging: boolean;
  accept: () => Promise<void>;
  decline: () => void;
}

const CallsContext = createContext<CallsContextValue | null>(null);

const ACCEPT_TIMEOUT_MS = 12_000;

const EMPTY_CALLER_CONTEXT: CallerContext = {
  loading: false,
  anonymous: false,
  leadName: null,
  company: null,
  callerName: null,
  carrier: null,
  pastCallCount: 0,
  lastDisposition: null,
};

export function CallsProvider({ children }: { children: ReactNode }) {
  const { registerInboundHandler, requestMicPermission, adoptInboundCall, staleTabWarning } = useWebPhone();
  const { registerCallMeta } = useCallContext();

  const [phase, setPhase] = useState<CallPhase>('idle');
  const [fromNumber, setFromNumber] = useState<string | null>(null);
  const [toNumber, setToNumber] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [ringElapsedSec, setRingElapsedSec] = useState(0);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [callerContext, setCallerContext] = useState<CallerContext>(EMPTY_CALLER_CONTEXT);

  const callRef = useRef<Call | null>(null);
  const phaseRef = useRef<CallPhase>('idle');
  const handlersBoundRef = useRef<WeakSet<Call>>(new WeakSet());
  const acceptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringStartedRef = useRef<number | null>(null);
  const endedHandledRef = useRef(false);
  phaseRef.current = phase;

  const clearAcceptTimer = useCallback(() => {
    if (acceptTimerRef.current) {
      clearTimeout(acceptTimerRef.current);
      acceptTimerRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearAcceptTimer();
    callRef.current = null;
    ringStartedRef.current = null;
    endedHandledRef.current = false;
    stopInboundRingtone();
    setPhase('idle');
    setFromNumber(null);
    setToNumber(null);
    setCallId(null);
    setRingElapsedSec(0);
    setConnectError(null);
    setCallerContext(EMPTY_CALLER_CONTEXT);
  }, [clearAcceptTimer]);

  const endSession = useCallback(() => {
    if (endedHandledRef.current) return;
    endedHandledRef.current = true;
    clearAcceptTimer();
    stopInboundRingtone();
    setPhase('ended');
    window.dispatchEvent(new CustomEvent('gd-call-ended'));
    setTimeout(resetSession, 600);
  }, [clearAcceptTimer, resetSession]);

  const fetchCallerContext = useCallback((from: string | null) => {
    if (!from || isAnonymousCaller(from)) {
      setCallerContext({
        ...EMPTY_CALLER_CONTEXT,
        anonymous: true,
      });
      return;
    }

    setCallerContext((prev) => ({ ...prev, loading: true }));
    void fetch(`/api/voice/caller-context?from=${encodeURIComponent(from)}`, {
      credentials: 'same-origin',
    })
      .then((r) => r.json())
      .then((data) => {
        setCallerContext({
          loading: false,
          anonymous: Boolean(data.anonymous),
          leadName: data.lead?.name ?? null,
          company: data.lead?.company ?? null,
          callerName: data.lookup?.callerName ?? null,
          carrier: data.lookup?.carrier ?? null,
          pastCallCount: data.past_call_count ?? 0,
          lastDisposition: data.last_disposition ?? null,
        });
      })
      .catch(() => {
        setCallerContext((prev) => ({ ...prev, loading: false }));
      });
  }, []);

  const bindRingingHandlers = useCallback((call: Call) => {
    if (handlersBoundRef.current.has(call)) return;
    handlersBoundRef.current.add(call);

    call.on('disconnect', () => endSession());
    call.on('cancel', () => endSession());
    call.on('reject', () => endSession());
    call.on('error', (err: unknown) => {
      console.error('[Calls] call error:', err);
      voiceClientLog('inbound_call_error', {
        message: err instanceof Error ? err.message : String(err),
        status: call.status(),
        parameters: call.parameters,
      }, extractCallSidFromSdkCall(call));
      setConnectError('Voice link error — try again or check mic permission.');
      endSession();
    });
  }, [endSession]);

  const onIncoming = useCallback((call: Call) => {
    console.log('[Calls] inbound ring', extractCallSidFromSdkCall(call), call.status());

    if (callRef.current && callRef.current !== call) {
      try { callRef.current.disconnect(); } catch { /* ignore */ }
    }

    endedHandledRef.current = false;
    clearAcceptTimer();
    callRef.current = call;

    const from = extractInboundFromNumber(call);
    const to = extractInboundToNumber(call);
    const sid = extractCallSidFromSdkCall(call);

    ringStartedRef.current = Date.now();
    setFromNumber(from);
    setToNumber(to);
    setCallId(sid);
    setRingElapsedSec(0);
    setConnectError(staleTabWarning
      ? 'Calls may be ringing in another tab — switch to that tab to answer.'
      : null);
    setPhase('incoming');
    playInboundRingtone();

    bindRingingHandlers(call);
    fetchCallerContext(from);

    if (sid) {
      void fetch('/api/calls/sync-leg', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_sid: sid,
          direction: 'inbound',
          from_number: from,
          to_number: to,
        }),
      }).catch(() => {});
    }
  }, [bindRingingHandlers, clearAcceptTimer, fetchCallerContext, staleTabWarning]);

  useLayoutEffect(() => {
    registerInboundHandler(onIncoming);
    return () => registerInboundHandler(null);
  }, [registerInboundHandler, onIncoming]);

  useEffect(() => {
    if (phase !== 'incoming' && phase !== 'connecting') return;
    const t = setInterval(() => {
      if (ringStartedRef.current) {
        setRingElapsedSec(Math.floor((Date.now() - ringStartedRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const accept = useCallback(async () => {
    const call = callRef.current;
    if (!call || (phaseRef.current !== 'incoming' && phaseRef.current !== 'connecting')) return;

    setPhase('connecting');
    setConnectError(null);
    stopInboundRingtone();

    const micOk = await requestMicPermission();
    if (!micOk) {
      setConnectError('Microphone access is required to answer. Allow mic in browser settings.');
      setPhase('incoming');
      playInboundRingtone();
      return;
    }

    await resumeVoiceAudioContext();
    await unlockRemoteAudioElement();
    registerCallMeta(null, fromNumber ?? '');

    const meta = {
      from: extractInboundFromNumber(call) ?? fromNumber,
      to: extractInboundToNumber(call) ?? toNumber,
    };
    const sid = extractCallSidFromSdkCall(call);

    const handoff = () => {
      clearAcceptTimer();
      adoptInboundCall(call, meta);
      resetSession();
    };

    call.once('accept', handoff);

    clearAcceptTimer();
    acceptTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== 'connecting') return;
      voiceClientLog('inbound_accept_timeout', {
        status: call.status(),
        parameters: call.parameters,
      }, sid);
      setConnectError('Call connection failed — caller will hear voicemail fallback.');
      setPhase('incoming');
      playInboundRingtone();
      call.removeListener('accept', handoff);
    }, ACCEPT_TIMEOUT_MS);

    try {
      call.accept({ rtcConstraints: { audio: true } });
    } catch (err) {
      clearAcceptTimer();
      call.removeListener('accept', handoff);
      console.error('[Calls] accept failed:', err);
      voiceClientLog('inbound_accept_throw', {
        message: err instanceof Error ? err.message : String(err),
        status: call.status(),
        parameters: call.parameters,
      }, sid);
      setConnectError('Could not answer — tap Accept again.');
      setPhase('incoming');
      playInboundRingtone();
    }
  }, [
    adoptInboundCall,
    clearAcceptTimer,
    fromNumber,
    registerCallMeta,
    requestMicPermission,
    resetSession,
    toNumber,
  ]);

  const decline = useCallback(() => {
    const call = callRef.current;
    if (call) {
      try {
        const status = call.status();
        if (status === 'pending' || status === 'ringing') call.reject();
        else call.disconnect();
      } catch { /* ignore */ }
    }
    endSession();
  }, [endSession]);

  const displayFrom = fromNumber;

  return (
    <CallsContext.Provider
      value={{
        phase,
        fromNumber: displayFrom,
        toNumber,
        callId,
        ringElapsedSec,
        connectError,
        callerContext,
        isInboundSession: phase !== 'idle',
        isRinging: phase === 'incoming',
        accept,
        decline,
      }}
    >
      {children}
    </CallsContext.Provider>
  );
}

export function useCalls(): CallsContextValue {
  const ctx = useContext(CallsContext);
  if (!ctx) throw new Error('useCalls must be used inside CallsProvider');
  return ctx;
}

export function useCallerDisplayName(from: string | null, ctx: CallerContext): string {
  if (ctx.leadName) return ctx.leadName;
  if (ctx.callerName) return ctx.callerName;
  if (!from || ctx.anonymous) return 'Unknown Caller';
  return formatInboundCallerDisplay(from);
}
