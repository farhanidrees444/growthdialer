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
import { bindRemoteStreamToAudio, unlockRemoteAudioElement } from '@/lib/voice/remote-audio';
import { attachPeerConnectionMonitor } from '@/lib/voice/peer-monitor';
import {
  extractCallSidFromSdkCall,
  extractInboundFromNumber,
  extractInboundToNumber,
  isTwilioCallOpen,
} from '@/lib/twilio/extract-call-sid';

export type CallPhase = 'idle' | 'incoming' | 'connecting' | 'active' | 'ended';

export interface CallsContextValue {
  phase: CallPhase;
  fromNumber: string | null;
  toNumber: string | null;
  callId: string | null;
  durationSec: number;
  ringElapsedSec: number;
  isMuted: boolean;
  isOnHold: boolean;
  minimized: boolean;
  connectError: string | null;
  isInboundSession: boolean;
  isRinging: boolean;
  accept: () => Promise<void>;
  decline: () => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDigit: (digit: string) => void;
  setMinimized: (value: boolean) => void;
}

const CallsContext = createContext<CallsContextValue | null>(null);

const OPEN_POLL_MS = 250;
const OPEN_TIMEOUT_MS = 15_000;
const AUDIO_RETRY_MS = 400;
const AUDIO_RETRY_MAX = 20;

function bindRemoteAudio(call: Call): void {
  try {
    const stream = (call as Call & { getRemoteStream?: () => MediaStream | null }).getRemoteStream?.();
    if (stream) {
      void bindRemoteStreamToAudio(stream);
    }
  } catch {
    /* optional SDK API */
  }
}

export function CallsProvider({ children }: { children: ReactNode }) {
  const { registerInboundHandler, requestMicPermission } = useWebPhone();
  const { registerCallMeta } = useCallContext();

  const [phase, setPhase] = useState<CallPhase>('idle');
  const [fromNumber, setFromNumber] = useState<string | null>(null);
  const [toNumber, setToNumber] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [ringElapsedSec, setRingElapsedSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const callRef = useRef<Call | null>(null);
  const phaseRef = useRef<CallPhase>('idle');
  const handlersBoundRef = useRef<WeakSet<Call>>(new WeakSet());
  const peerCleanupRef = useRef<(() => void) | null>(null);
  const openPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRetryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringStartedRef = useRef<number | null>(null);
  const activeStartedRef = useRef<number | null>(null);
  const endedHandledRef = useRef(false);
  const promotedRef = useRef<WeakSet<Call>>(new WeakSet());
  phaseRef.current = phase;

  const clearOpenPoll = useCallback(() => {
    if (openPollRef.current) {
      clearInterval(openPollRef.current);
      openPollRef.current = null;
    }
  }, []);

  const clearAudioRetry = useCallback(() => {
    if (audioRetryRef.current) {
      clearInterval(audioRetryRef.current);
      audioRetryRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearOpenPoll();
    clearAudioRetry();
    peerCleanupRef.current?.();
    peerCleanupRef.current = null;
    callRef.current = null;
    ringStartedRef.current = null;
    activeStartedRef.current = null;
    endedHandledRef.current = false;
    stopInboundRingtone();
    setPhase('idle');
    setFromNumber(null);
    setToNumber(null);
    setCallId(null);
    setDurationSec(0);
    setRingElapsedSec(0);
    setIsMuted(false);
    setIsOnHold(false);
    setMinimized(false);
    setConnectError(null);
  }, [clearAudioRetry, clearOpenPoll]);

  const endSession = useCallback(() => {
    if (endedHandledRef.current) return;
    endedHandledRef.current = true;
    clearOpenPoll();
    clearAudioRetry();
    peerCleanupRef.current?.();
    peerCleanupRef.current = null;
    stopInboundRingtone();
    setPhase('ended');
    window.dispatchEvent(new CustomEvent('gd-call-ended'));
    setTimeout(resetSession, 600);
  }, [clearAudioRetry, clearOpenPoll, resetSession]);

  const startAudioRetry = useCallback((call: Call) => {
    clearAudioRetry();
    let attempts = 0;
    audioRetryRef.current = setInterval(() => {
      attempts += 1;
      bindRemoteAudio(call);
      if (attempts >= AUDIO_RETRY_MAX) clearAudioRetry();
    }, AUDIO_RETRY_MS);
  }, [clearAudioRetry]);

  const syncCallLeg = useCallback((call: Call, from: string | null, to: string | null) => {
    const sid = extractCallSidFromSdkCall(call);
    if (!sid) return;
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
  }, []);

  const goActive = useCallback((call: Call) => {
    if (promotedRef.current.has(call)) return;
    promotedRef.current.add(call);

    clearOpenPoll();
    stopInboundRingtone();
    setConnectError(null);
    activeStartedRef.current = Date.now();
    bindRemoteAudio(call);
    startAudioRetry(call);
    setPhase('active');
    setDurationSec(0);

    const sid = extractCallSidFromSdkCall(call);
    const from = extractInboundFromNumber(call);
    const to = extractInboundToNumber(call);
    if (from) setFromNumber(from);
    if (to) setToNumber(to);
    if (sid) {
      setCallId(sid);
      window.dispatchEvent(new CustomEvent('gd-inbound-answered', { detail: { callId: sid } }));
    }

    syncCallLeg(call, from, to);
  }, [clearOpenPoll, startAudioRetry, syncCallLeg]);

  const bindCallHandlers = useCallback((call: Call) => {
    if (handlersBoundRef.current.has(call)) return;
    handlersBoundRef.current.add(call);

    peerCleanupRef.current?.();
    peerCleanupRef.current = attachPeerConnectionMonitor(call, {
      onRemoteTrack: (stream) => { void bindRemoteStreamToAudio(stream); },
      onIceState: (state) => {
        if (state === 'connected' || state === 'completed') {
          bindRemoteAudio(call);
          if (phaseRef.current === 'connecting' || phaseRef.current === 'incoming') {
            goActive(call);
          }
        }
      },
    });

    call.on('accept', () => goActive(call));
    call.on('disconnect', () => endSession());
    call.on('cancel', () => endSession());
    call.on('reject', () => endSession());
    call.on('error', (err: unknown) => {
      console.error('[Calls] call error:', err);
      setConnectError('Voice link error — try again or check mic permission.');
      endSession();
    });

    if (isTwilioCallOpen(call)) goActive(call);
  }, [endSession, goActive]);

  const onIncoming = useCallback((call: Call) => {
    console.log('[Calls] inbound ring', extractCallSidFromSdkCall(call), call.status());

    if (callRef.current && callRef.current !== call) {
      try { callRef.current.disconnect(); } catch { /* ignore */ }
    }

    endedHandledRef.current = false;
    clearOpenPoll();
    clearAudioRetry();
    callRef.current = call;

    const from = extractInboundFromNumber(call);
    const to = extractInboundToNumber(call);
    const sid = extractCallSidFromSdkCall(call);

    ringStartedRef.current = Date.now();
    setFromNumber(from);
    setToNumber(to);
    setCallId(sid);
    setRingElapsedSec(0);
    setDurationSec(0);
    setIsMuted(false);
    setIsOnHold(false);
    setMinimized(false);
    setConnectError(null);
    setPhase('incoming');
    playInboundRingtone();

    bindCallHandlers(call);

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
  }, [bindCallHandlers, clearAudioRetry, clearOpenPoll]);

  // Register before paint so we never miss an early incoming leg.
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

  useEffect(() => {
    if (phase !== 'active') return;
    const t = setInterval(() => {
      if (activeStartedRef.current) {
        setDurationSec(Math.floor((Date.now() - activeStartedRef.current) / 1000));
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

    try {
      if (!isTwilioCallOpen(call)) {
        call.accept({ rtcConstraints: { audio: true } });
      }
    } catch (err) {
      console.error('[Calls] accept failed:', err);
      setConnectError('Could not answer — tap Accept again.');
      setPhase('incoming');
      playInboundRingtone();
      return;
    }

    if (isTwilioCallOpen(call)) {
      goActive(call);
      return;
    }

    clearOpenPoll();
    const deadline = Date.now() + OPEN_TIMEOUT_MS;
    openPollRef.current = setInterval(() => {
      const current = callRef.current;
      if (!current) {
        clearOpenPoll();
        return;
      }
      if (isTwilioCallOpen(current) || promotedRef.current.has(current)) {
        goActive(current);
        return;
      }
      if (Date.now() > deadline) {
        clearOpenPoll();
        console.error('[Calls] accept timed out — call never reached open');
        setConnectError('Could not establish voice link. Check network and try again.');
        setPhase('incoming');
        playInboundRingtone();
      }
    }, OPEN_POLL_MS);
  }, [clearOpenPoll, fromNumber, goActive, registerCallMeta, requestMicPermission]);

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

  const hangup = useCallback(() => {
    const call = callRef.current;
    if (call) {
      try { call.disconnect(); } catch { /* ignore */ }
    }
    endSession();
  }, [endSession]);

  const toggleMute = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    try {
      const next = !isMuted;
      call.mute(next);
      setIsMuted(next);
    } catch (err) {
      console.error('[Calls] mute error:', err);
    }
  }, [isMuted]);

  const toggleHold = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    try {
      const next = !isOnHold;
      call.mute(next);
      setIsOnHold(next);
    } catch (err) {
      console.error('[Calls] hold error:', err);
    }
  }, [isOnHold]);

  const sendDigit = useCallback((digit: string) => {
    try { callRef.current?.sendDigits(digit); } catch { /* ignore */ }
  }, []);

  return (
    <CallsContext.Provider
      value={{
        phase,
        fromNumber,
        toNumber,
        callId,
        durationSec,
        ringElapsedSec,
        isMuted,
        isOnHold,
        minimized,
        connectError,
        isInboundSession: phase !== 'idle',
        isRinging: phase === 'incoming',
        accept,
        decline,
        hangup,
        toggleMute,
        toggleHold,
        sendDigit,
        setMinimized,
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
