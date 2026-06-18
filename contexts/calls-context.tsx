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
import type { Call } from '@twilio/voice-sdk';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { playInboundRingtone, stopInboundRingtone } from '@/lib/inbound/ringtone';
import { resumeVoiceAudioContext } from '@/lib/voice/audio-unlock';
import { bindRemoteStreamToAudio, unlockRemoteAudioElement } from '@/lib/voice/remote-audio';
import { getCallPeerConnection } from '@/lib/voice/peer-monitor';
import {
  extractCallSidFromSdkCall,
  extractInboundFromNumber,
  extractInboundToNumber,
  isTwilioCallOpen,
} from '@/lib/twilio/extract-call-sid';

/**
 * Calls — self-contained inbound calling on the native Twilio Voice SDK.
 *
 * This module owns the full inbound lifecycle (ringing → connecting → active →
 * ended) with a single linear state machine driven by the SDK's own Call events.
 * It reuses the shared Device registered by the WebPhone provider, so outbound
 * dialing and the power/parallel dialer are untouched.
 */

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
  /** True for any non-idle inbound session. */
  isInboundSession: boolean;
  /** True while the line is ringing (pre-answer). */
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

const OPEN_POLL_INTERVAL_MS = 200;
const OPEN_POLL_TIMEOUT_MS = 10_000;

function bindRemoteAudio(call: Call): void {
  // Twilio plays remote audio automatically, but we also bind the stream to our
  // unlocked <audio> element so playback survives autoplay policies + device swaps.
  try {
    const stream = (call as Call & { getRemoteStream?: () => MediaStream | null }).getRemoteStream?.();
    if (stream) {
      void bindRemoteStreamToAudio(stream);
      return;
    }
  } catch {
    /* getRemoteStream not available in this SDK build */
  }

  const pc = getCallPeerConnection(call);
  if (!pc) return;
  for (const receiver of pc.getReceivers()) {
    if (receiver.track?.kind === 'audio' && receiver.track.readyState === 'live') {
      void bindRemoteStreamToAudio(new MediaStream([receiver.track]));
      return;
    }
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

  const callRef = useRef<Call | null>(null);
  const phaseRef = useRef<CallPhase>('idle');
  const mountedRef = useRef(true);
  const ringStartedRef = useRef<number | null>(null);
  const activeStartedRef = useRef<number | null>(null);
  const openPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openPollDeadlineRef = useRef<number>(0);
  const endedHandledRef = useRef(false);
  phaseRef.current = phase;

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) setter(value);
  }, []);

  const clearOpenPoll = useCallback(() => {
    if (openPollRef.current) {
      clearInterval(openPollRef.current);
      openPollRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearOpenPoll();
    callRef.current = null;
    ringStartedRef.current = null;
    activeStartedRef.current = null;
    endedHandledRef.current = false;
    stopInboundRingtone();
    safeSet(setPhase, 'idle');
    safeSet(setFromNumber, null);
    safeSet(setToNumber, null);
    safeSet(setCallId, null);
    safeSet(setDurationSec, 0);
    safeSet(setRingElapsedSec, 0);
    safeSet(setIsMuted, false);
    safeSet(setIsOnHold, false);
    safeSet(setMinimized, false);
  }, [clearOpenPoll, safeSet]);

  const endSession = useCallback(() => {
    if (endedHandledRef.current) return;
    endedHandledRef.current = true;
    clearOpenPoll();
    stopInboundRingtone();
    safeSet(setPhase, 'ended');
    window.dispatchEvent(new CustomEvent('gd-call-ended'));
    setTimeout(() => {
      if (mountedRef.current) resetSession();
    }, 600);
  }, [clearOpenPoll, resetSession, safeSet]);

  const goActive = useCallback((call: Call) => {
    if (phaseRef.current === 'active') return;
    clearOpenPoll();
    stopInboundRingtone();
    activeStartedRef.current = Date.now();
    bindRemoteAudio(call);
    safeSet(setPhase, 'active');
    safeSet(setDurationSec, 0);
    const sid = extractCallSidFromSdkCall(call);
    if (sid) {
      window.dispatchEvent(new CustomEvent('gd-inbound-answered', { detail: { callId: sid } }));
    }
  }, [clearOpenPoll, safeSet]);

  // ── Incoming call handler (owns the raw SDK Call) ──────────────────────────
  useEffect(() => {
    const onIncoming = (call: Call) => {
      // A new inbound call supersedes any lingering session.
      if (callRef.current && callRef.current !== call) {
        try { callRef.current.disconnect(); } catch { /* ignore */ }
      }
      clearOpenPoll();
      endedHandledRef.current = false;
      callRef.current = call;

      const from = extractInboundFromNumber(call);
      const to = extractInboundToNumber(call);
      const sid = extractCallSidFromSdkCall(call);

      ringStartedRef.current = Date.now();
      safeSet(setFromNumber, from);
      safeSet(setToNumber, to);
      safeSet(setCallId, sid);
      safeSet(setRingElapsedSec, 0);
      safeSet(setDurationSec, 0);
      safeSet(setIsMuted, false);
      safeSet(setIsOnHold, false);
      safeSet(setMinimized, false);
      safeSet(setPhase, 'incoming');
      playInboundRingtone();

      call.on('accept', () => goActive(call));
      call.on('disconnect', () => endSession());
      call.on('cancel', () => endSession());
      call.on('reject', () => endSession());
      call.on('error', (err: unknown) => {
        console.error('[Calls] call error:', err);
        endSession();
      });

      // Rare: call already open by the time we attach (e.g. very fast media).
      if (isTwilioCallOpen(call)) goActive(call);
    };

    registerInboundHandler(onIncoming);
    return () => registerInboundHandler(null);
  }, [registerInboundHandler, clearOpenPoll, safeSet, goActive, endSession]);

  // ── Timers ─────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const accept = useCallback(async () => {
    const call = callRef.current;
    if (!call || phaseRef.current !== 'incoming') return;

    safeSet(setPhase, 'connecting');
    stopInboundRingtone();

    // CRITICAL: acquire the microphone BEFORE accept so the SDK can build
    // two-way media immediately. Doing this fire-and-forget is what previously
    // left calls stuck on "connecting" with no audio.
    try {
      await requestMicPermission();
    } catch {
      /* continue — caller audio can still play even if mic is blocked */
    }
    await resumeVoiceAudioContext();
    await unlockRemoteAudioElement();

    registerCallMeta(null, fromNumber ?? '');

    try {
      if (!isTwilioCallOpen(call)) call.accept();
    } catch (err) {
      console.error('[Calls] accept failed:', err);
      // Revert to ringing so the agent can retry.
      safeSet(setPhase, 'incoming');
      playInboundRingtone();
      return;
    }

    if (isTwilioCallOpen(call)) {
      goActive(call);
      return;
    }

    // Fallback: if the 'accept' event is missed, poll for the open status.
    clearOpenPoll();
    openPollDeadlineRef.current = Date.now() + OPEN_POLL_TIMEOUT_MS;
    openPollRef.current = setInterval(() => {
      const current = callRef.current;
      if (!current) { clearOpenPoll(); return; }
      if (isTwilioCallOpen(current)) {
        goActive(current);
      } else if (Date.now() > openPollDeadlineRef.current) {
        console.error('[Calls] call did not reach open status within timeout');
        clearOpenPoll();
      }
    }, OPEN_POLL_INTERVAL_MS);
  }, [clearOpenPoll, fromNumber, goActive, registerCallMeta, requestMicPermission, safeSet]);

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
    // The Twilio SDK has no native hold; mute both directions as a substitute.
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
