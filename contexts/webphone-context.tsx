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
import { Call } from '@twilio/voice-sdk';
import {
  attachPeerConnectionMonitor,
  getCallPeerConnection,
} from '@/lib/voice/peer-monitor';
import { resumeVoiceAudioContext, primeVoiceAudioOnUserGesture } from '@/lib/voice/audio-unlock';
import {
  REMOTE_AUDIO_ELEMENT_ID,
  REMOTE_AUDIO_LEGACY_ID,
  bindRemoteStreamToAudio,
  unlockRemoteAudioElement,
} from '@/lib/voice/remote-audio';
import {
  extractCallSidFromSdkCall,
  extractInboundFromNumber,
  extractInboundToNumber,
  isTwilioCallSid,
} from '@/lib/twilio/extract-call-sid';
import { useTwilioDevice } from '@/hooks/use-twilio-device';
import { useVoicePresence } from '@/hooks/use-voice-presence';
import { useWorkspace } from '@/contexts/workspace-context';
import { playInboundRingtone, stopInboundRingtone } from '@/lib/inbound/ringtone';
import { callOrchestrator } from '@/src/calls';

export type PhoneStatus = 'idle' | 'initializing' | 'ready' | 'error';
export type WebRTCCallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'held' | 'ended';
export type MicPermission = 'unknown' | 'granted' | 'denied';
export type VoiceConnectionQuality = 'excellent' | 'good' | 'degraded' | 'disconnected' | 'unknown';
export type IncomingCallPhase = 'idle' | 'incoming' | 'connecting' | 'active' | 'ended' | 'failed';

export interface IncomingCallUiState {
  phase: IncomingCallPhase;
  fromNumber: string | null;
  toNumber: string | null;
  callId: string | null;
  ringStartedAt: number | null;
  liveStartedAt: number | null;
  error: string | null;
}

const EMPTY_INCOMING_CALL: IncomingCallUiState = {
  phase: 'idle',
  fromNumber: null,
  toNumber: null,
  callId: null,
  ringStartedAt: null,
  liveStartedAt: null,
  error: null,
};

export interface WebPhoneContextValue {
  phoneStatus: PhoneStatus;
  callStatus: WebRTCCallStatus;
  activeCallId: string | null;
  /** True while an outbound dial we initiated is connecting, ringing, or live */
  hasOutboundSession: boolean;
  /** True while an inbound call was accepted and is live in ActiveCallOverlay */
  hasInboundActiveSession: boolean;
  /** True when the browser is ringing for an inbound call (not outbound) */
  isInboundRinging: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  micPermission: MicPermission;
  voiceQuality: VoiceConnectionQuality;
  isReconnecting: boolean;
  audioDeviceLabel: string | null;
  iceConnectionState: string | null;
  makeCall: (destination: string, callerNumber?: string) => void;
  hangup: () => void;
  answerIncomingCall: () => Promise<boolean>;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDTMF: (digit: string) => void;
  reconnect: () => void;
  requestMicPermission: () => Promise<boolean>;
  /** Poll until WebRTC client is ready or timeout (ms). */
  waitForPhoneReady: (timeoutMs?: number) => Promise<boolean>;
  /** Human-readable reason when phoneStatus is error (server config, token, device). */
  voiceError: string | null;
  incomingCall: IncomingCallUiState;
  /** Another tab may have registered the Twilio Device — calls ring there instead. */
  staleTabWarning: boolean;
}

const WebPhoneContext = createContext<WebPhoneContextValue | null>(null);

export function useWebPhone(): WebPhoneContextValue {
  const ctx = useContext(WebPhoneContext);
  if (!ctx) throw new Error('useWebPhone must be used inside WebPhoneProvider');
  return ctx;
}

/**
 * Generate a stable unique ID for a Twilio Call.
 * Twilio's Call class doesn't expose a public `sid` — we use
 * `outboundConnectionId` for outbound calls and a ref-based
 * counter for inbound calls.
 */
let callIdCounter = 0;
function getCallStableId(call: Call): string {
  const sid = extractCallSidFromSdkCall(call);
  if (sid) return sid;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = call as any;
  if (c.outboundConnectionId) return c.outboundConnectionId as string;
  if (!c.__gdId) {
    callIdCounter += 1;
    c.__gdId = `call-${callIdCounter}`;
  }
  return c.__gdId as string;
}

function safeWebPhoneSnapshot(call: Call | null): Record<string, unknown> {
  const pc = call ? getCallPeerConnection(call) : null;
  return {
    hasCall: Boolean(call),
    status: call?.status?.() ?? null,
    direction: call?.direction ?? null,
    hasPeerConnection: Boolean(pc),
    iceConnectionState: pc?.iceConnectionState ?? null,
    connectionState: pc?.connectionState ?? null,
    receiverAudioTracks: pc?.getReceivers?.().filter((r) => r.track?.kind === 'audio').length ?? null,
    liveReceiverAudioTracks: pc?.getReceivers?.().filter((r) => r.track?.kind === 'audio' && r.track.readyState === 'live').length ?? null,
  };
}

function hasVerifiedRemoteAudio(call: Call): boolean {
  try {
    const stream = call.getRemoteStream();
    const tracks = stream?.getAudioTracks?.() ?? [];
    if (tracks.some((track) => track.readyState === 'live' && track.enabled)) {
      return true;
    }
  } catch {
    // Fall through to peer connection inspection.
  }

  const pc = getCallPeerConnection(call);
  const receivers = pc?.getReceivers?.() ?? [];
  return receivers.some((receiver) => {
    const track = receiver.track;
    return track?.kind === 'audio' && track.readyState === 'live' && track.enabled;
  });
}

async function waitForVerifiedRemoteAudio(call: Call, timeoutMs = 12_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (hasVerifiedRemoteAudio(call)) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return hasVerifiedRemoteAudio(call);
}

function isIncomingTwilioCall(call: Call, outboundDialActive: boolean): boolean {
  if (outboundDialActive) return false;
  const dir = call.direction?.toLowerCase();
  if (dir === 'incoming' || dir === 'inbound') return true;
  if (dir === 'outgoing' || dir === 'outbound') return false;
  // If no direction, assume incoming (safety default)
  return true;
}

function isLiveIncomingTwilioCall(call: Call, outboundDialActive: boolean): boolean {
  if (!isIncomingTwilioCall(call, outboundDialActive)) return false;
  const status = call.status();
  return ['pending', 'ringing', 'open'].includes(status);
}

function bindRemoteMediaToTwilioCall(call: Call): void {
  try {
    const stream = call.getRemoteStream();
    if (stream) {
      void bindRemoteStreamToAudio(stream);
      return;
    }
  } catch {
    // getRemoteStream may not be available in all SDK versions
  }

  // Fallback: inspect PeerConnection receivers directly
  const pc = getCallPeerConnection(call);
  if (pc) {
    const receivers = pc.getReceivers();
    for (const receiver of receivers) {
      if (receiver.track?.kind === 'audio' && receiver.track.readyState === 'live') {
        const stream = new MediaStream([receiver.track]);
        void bindRemoteStreamToAudio(stream);
        return;
      }
    }
  }
}

export function WebPhoneProvider({ children }: { children: ReactNode }) {
  const handleIncomingRef = useRef<(call: Call) => void>(() => {});
  const { currentWorkspace } = useWorkspace();

  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>('idle');
  const [callStatus, setCallStatus] = useState<WebRTCCallStatus>('idle');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown');
  const [voiceQuality, setVoiceQuality] = useState<VoiceConnectionQuality>('unknown');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [audioDeviceLabel, setAudioDeviceLabel] = useState<string | null>(null);
  const [iceConnectionState, setIceConnectionState] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallUiState>(EMPTY_INCOMING_CALL);

  // Refs hold live objects that should NOT trigger re-renders
  const deviceRef = useRef<import('@twilio/voice-sdk').Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const callStatusRef = useRef<WebRTCCallStatus>('idle');
  const outboundDialRef = useRef(false);
  const [hasOutboundSession, setHasOutboundSession] = useState(false);
  const [hasInboundActiveSession, setHasInboundActiveSession] = useState(false);
  const [isInboundRinging, setIsInboundRinging] = useState(false);
  const phoneStatusRef = useRef<PhoneStatus>('idle');
  callStatusRef.current = callStatus;
  phoneStatusRef.current = phoneStatus;
  // Track whether we are mounted to avoid setState after unmount
  const mountedRef = useRef(true);
  const initAttemptsRef = useRef(0);
  const initClientRef = useRef<() => Promise<void>>(async () => {});
  const inboundRingStartedRef = useRef<number | null>(null);
  const peerCleanupRef = useRef<(() => void) | null>(null);
  const reconnectDuringCallRef = useRef(false);
  const acceptingInboundRef = useRef(false);
  const isInboundRingingLiveRef = useRef(false);
  const provisionalCallIdRef = useRef<string | null>(null);
  const promotedActiveCallsRef = useRef(new WeakSet<Call>());
  const callEventHandlersBoundRef = useRef(new WeakSet<Call>());
  const audioVerifiedCallsRef = useRef(new WeakSet<Call>());

  const twilioDevice = useTwilioDevice({
    manualInit: true,
    onIncoming: (call) => handleIncomingRef.current(call),
  });

  const { staleTabWarning } = useVoicePresence({
    phoneStatus,
    device: twilioDevice.device,
    workspaceId: currentWorkspace?.id ?? null,
    enabled: phoneStatus === 'ready' || phoneStatus === 'initializing',
  });

  const pushCallLegSync = useCallback(async (payload: {
    call_sid: string;
    provisional_id?: string | null;
    direction: 'inbound' | 'outbound';
    from_number?: string | null;
    to_number?: string | null;
    db_id?: string | null;
  }) => {
    try {
      await fetch('/api/calls/sync-leg', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[WebPhone] sync-leg failed', err);
    }
  }, []);

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) setter(value);
  }, []);

  const scheduleReconnect = useCallback((reason: string) => {
    if (initAttemptsRef.current >= 3) {
      safeSet(setPhoneStatus, 'error');
      safeSet(setVoiceError, (prev) => prev ?? `Voice could not connect (${reason}). Tap reconnect or check server Twilio settings.`);
      return;
    }
    initAttemptsRef.current += 1;
    const delay = 1200 * initAttemptsRef.current;
    console.warn(`[WebPhone] reconnect scheduled (${reason}) attempt ${initAttemptsRef.current}`);
    setTimeout(() => {
      if (mountedRef.current) void initClientRef.current();
    }, delay);
  }, [safeSet]);

  const bindPeerMonitor = useCallback((call: Call) => {
    peerCleanupRef.current?.();
    peerCleanupRef.current = attachPeerConnectionMonitor(call, {
      onIceState: (state, quality) => {
        safeSet(setIceConnectionState, state);
        safeSet(setVoiceQuality, quality);
        if (quality === 'disconnected' && callStatusRef.current === 'active') {
          safeSet(setIsReconnecting, true);
        } else if (quality === 'excellent' || quality === 'good') {
          safeSet(setIsReconnecting, false);
        }
      },
      onConnectionState: (state) => {
        if (state === 'failed' && callStatusRef.current === 'active') {
          safeSet(setIsReconnecting, true);
          if (!reconnectDuringCallRef.current) {
            reconnectDuringCallRef.current = true;
            scheduleReconnect('peer connection failed');
            setTimeout(() => { reconnectDuringCallRef.current = false; }, 5000);
          }
        }
      },
      onRemoteTrack: (stream) => {
        void bindRemoteStreamToAudio(stream);
      },
    });
  }, [safeSet, scheduleReconnect]);

  const promoteCallToActive = useCallback((
    call: Call,
    isIncoming: boolean,
    callId: string,
    meta?: { from?: string | null; to?: string | null },
  ) => {
    if (promotedActiveCallsRef.current.has(call)) return;
    promotedActiveCallsRef.current.add(call);

    const sid = extractCallSidFromSdkCall(call);
    if (sid) {
      const provisional = provisionalCallIdRef.current;
      void pushCallLegSync({
        call_sid: sid,
        provisional_id: provisional && provisional !== sid ? provisional : undefined,
        direction: isIncoming ? 'inbound' : 'outbound',
        from_number: meta?.from ?? undefined,
        to_number: meta?.to ?? undefined,
      });
      if (isTwilioCallSid(sid)) provisionalCallIdRef.current = null;
    }

    const resolvedId = sid ?? callId;
    console.log('[WebPhone] call active:', resolvedId, isIncoming ? 'inbound' : 'outbound');
    if (isIncoming) console.log('[Inbound] ACTIVE CALL', resolvedId);

    if (isIncoming) {
      outboundDialRef.current = false;
      safeSet(setHasOutboundSession, false);
      safeSet(setHasInboundActiveSession, true);
      isInboundRingingLiveRef.current = false;
      acceptingInboundRef.current = false;
      safeSet(setIsInboundRinging, false);
      inboundRingStartedRef.current = null;
      incomingCallRef.current = null;
      activeCallRef.current = call;
      safeSet(setIncomingCall, {
        phase: 'active',
        fromNumber: meta?.from ?? null,
        toNumber: meta?.to ?? null,
        callId: resolvedId,
        ringStartedAt: null,
        liveStartedAt: Date.now(),
        error: null,
      });
      window.dispatchEvent(new CustomEvent('gd-webrtc-inbound-active'));
    }

    bindRemoteMediaToTwilioCall(call);
    bindPeerMonitor(call);
    safeSet(setCallStatus, 'active');
    safeSet(setActiveCallId, resolvedId);
  }, [bindPeerMonitor, pushCallLegSync, safeSet]);

  const verifyInboundAudioAfterPromote = useCallback(async (
    call: Call,
  ): Promise<void> => {
    if (audioVerifiedCallsRef.current.has(call)) {
      return;
    }

    bindRemoteMediaToTwilioCall(call);
    bindPeerMonitor(call);

    const verified = await waitForVerifiedRemoteAudio(call);
    if (verified) {
      audioVerifiedCallsRef.current.add(call);
      return;
    }

    const snapshot = safeWebPhoneSnapshot(call);
    console.warn('[WebPhone] inbound accepted but remote audio was not verified yet', {
      status: call.status(),
      parameters: call.parameters,
      snapshot,
    });
    safeSet(setVoiceError, 'Call connected, but audio is still initializing. If you cannot hear the caller, reconnect voice and try again.');
  }, [bindPeerMonitor, safeSet]);

  const setupCallEventHandlers = useCallback((
    call: Call,
    isIncoming: boolean,
    meta?: { from?: string | null; to?: string | null },
  ) => {
    if (callEventHandlersBoundRef.current.has(call)) return;
    callEventHandlersBoundRef.current.add(call);

    let lastSyncedSid: string | null = null;
    const syncIfNeeded = () => {
      const sid = extractCallSidFromSdkCall(call);
      if (!sid || sid === lastSyncedSid) return;
      lastSyncedSid = sid;
      const provisional = provisionalCallIdRef.current;
      void pushCallLegSync({
        call_sid: sid,
        provisional_id: provisional && provisional !== sid ? provisional : undefined,
        direction: isIncoming ? 'inbound' : 'outbound',
        from_number: meta?.from ?? undefined,
        to_number: meta?.to ?? undefined,
      });
      safeSet(setActiveCallId, sid);
      if (isTwilioCallSid(sid)) provisionalCallIdRef.current = null;
    };

    const callId = getCallStableId(call);
    provisionalCallIdRef.current = isTwilioCallSid(callId) ? null : callId;

    call.on('ringing', syncIfNeeded);

    call.on('accept', () => {
      console.log('[WebPhone] call connected:', getCallStableId(call));
      syncIfNeeded();
      if (isIncoming) {
        promoteCallToActive(call, true, callId, meta);
        void verifyInboundAudioAfterPromote(call);
      } else {
        promoteCallToActive(call, false, callId, meta);
      }
    });

    call.on('disconnect', () => {
      const resolvedId = extractCallSidFromSdkCall(call) ?? callId;
      console.log('[WebPhone] call ended:', resolvedId);
      stopInboundRingtone();
      peerCleanupRef.current?.();
      peerCleanupRef.current = null;
      safeSet(setVoiceQuality, 'unknown');
      safeSet(setIceConnectionState, null);
      safeSet(setIsReconnecting, false);

      if (activeCallRef.current === call) {
        activeCallRef.current = incomingCallRef.current;
      }
      if (incomingCallRef.current === call) {
        incomingCallRef.current = null;
      }
      outboundDialRef.current = false;

      const stillLive = Boolean(
        incomingCallRef.current
        && isLiveIncomingTwilioCall(incomingCallRef.current, outboundDialRef.current),
      );

      if (!stillLive) {
        acceptingInboundRef.current = false;
        inboundRingStartedRef.current = null;
        isInboundRingingLiveRef.current = false;
        safeSet(setIsInboundRinging, false);
        safeSet(setHasOutboundSession, false);
        safeSet(setHasInboundActiveSession, false);
        safeSet(setActiveCallId, null);
        safeSet(setIsMuted, false);
        safeSet(setIsOnHold, false);
        if (isIncoming) {
          safeSet(setIncomingCall, {
            phase: 'ended',
            fromNumber: meta?.from ?? extractInboundFromNumber(call),
            toNumber: meta?.to ?? extractInboundToNumber(call),
            callId: resolvedId,
            ringStartedAt: null,
            liveStartedAt: null,
            error: null,
          });
        }
        setTimeout(() => {
          if (mountedRef.current && !activeCallRef.current && !incomingCallRef.current) {
            setCallStatus('idle');
            setIncomingCall(EMPTY_INCOMING_CALL);
          }
        }, 800);
      } else if (stillLive) {
        isInboundRingingLiveRef.current = true;
        safeSet(setIsInboundRinging, true);
        safeSet(setActiveCallId, incomingCallRef.current ? getCallStableId(incomingCallRef.current) : null);
      }
    });

    call.on('error', (error: unknown) => {
      const resolvedId = extractCallSidFromSdkCall(call) ?? callId;
      console.error('[WebPhone] call error:', error);
      stopInboundRingtone();
      acceptingInboundRef.current = false;
      peerCleanupRef.current?.();
      peerCleanupRef.current = null;
      safeSet(setVoiceQuality, 'unknown');
      safeSet(setIceConnectionState, null);
      safeSet(setIsReconnecting, false);

      if (isIncoming) {
        inboundRingStartedRef.current = null;
        isInboundRingingLiveRef.current = false;
        safeSet(setIsInboundRinging, false);
        safeSet(setHasInboundActiveSession, false);
        safeSet(setActiveCallId, null);
        safeSet(setCallStatus, 'ended');
        safeSet(setIncomingCall, {
          phase: 'failed',
          fromNumber: meta?.from ?? extractInboundFromNumber(call),
          toNumber: meta?.to ?? extractInboundToNumber(call),
          callId: resolvedId,
          ringStartedAt: null,
          liveStartedAt: null,
          error: error instanceof Error ? error.message : 'Voice call failed.',
        });
      }
    });

    call.on('cancel', () => {
      const resolvedId = extractCallSidFromSdkCall(call) ?? callId;
      console.log('[WebPhone] call cancelled:', resolvedId);
      stopInboundRingtone();
      if (isIncoming) {
        acceptingInboundRef.current = false;
        inboundRingStartedRef.current = null;
        isInboundRingingLiveRef.current = false;
        safeSet(setIsInboundRinging, false);
        safeSet(setActiveCallId, null);
        safeSet(setCallStatus, 'idle');
        safeSet(setIncomingCall, EMPTY_INCOMING_CALL);
      }
    });

    call.on('reject', () => {
      const resolvedId = extractCallSidFromSdkCall(call) ?? callId;
      console.log('[WebPhone] call rejected:', resolvedId);
      stopInboundRingtone();
      if (isIncoming) {
        acceptingInboundRef.current = false;
        inboundRingStartedRef.current = null;
        isInboundRingingLiveRef.current = false;
        safeSet(setIsInboundRinging, false);
        safeSet(setActiveCallId, null);
        safeSet(setCallStatus, 'idle');
        safeSet(setIncomingCall, EMPTY_INCOMING_CALL);
      }
    });
  }, [safeSet, promoteCallToActive, pushCallLegSync, verifyInboundAudioAfterPromote]);

  handleIncomingRef.current = (call: Call) => {
    const callId = getCallStableId(call);
    const fromNumber = extractInboundFromNumber(call);
    const toNumber = extractInboundToNumber(call);
    const status = call.status();

    console.log('[Inbound] INCOMING', call.parameters?.CallSid ?? callId, 'status=', status);
    console.log('[WebPhone] incoming call:', {
      callId,
      sid: call.parameters?.CallSid ?? null,
      refSidBefore: incomingCallRef.current?.parameters?.CallSid ?? null,
      status,
      direction: call.direction ?? null,
      from: fromNumber ?? null,
      to: toNumber ?? null,
    });

    outboundDialRef.current = false;
    safeSet(setHasOutboundSession, false);

    incomingCallRef.current = call;
    activeCallRef.current = call;
    deviceRef.current = twilioDevice.device;
    safeSet(setActiveCallId, callId);

    setupCallEventHandlers(call, true, { from: fromNumber, to: toNumber });

    // Inbound SDK delivery means "ring the agent", not "the agent accepted".
    // Even if a carrier/parent leg reports open, only the Accept click may
    // transition this browser leg to connecting/active.
    safeSet(setCallStatus, status === 'closed' ? 'ended' : 'ringing');

    if (!inboundRingStartedRef.current) {
      inboundRingStartedRef.current = Date.now();
    }
    isInboundRingingLiveRef.current = true;
    safeSet(setIsInboundRinging, true);
    safeSet(setIncomingCall, {
      phase: 'incoming',
      fromNumber,
      toNumber,
      callId,
      ringStartedAt: inboundRingStartedRef.current,
      liveStartedAt: null,
      error: null,
    });
    playInboundRingtone();

    window.dispatchEvent(
      new CustomEvent('gd-webrtc-inbound-ring', {
        detail: {
          call_id: callId,
          from_number: fromNumber,
          to_number: toNumber,
          provider: 'twilio',
        },
      }),
    );
  };

  const initClient = useCallback(async () => {
    safeSet(setPhoneStatus, 'initializing');
    deviceRef.current = twilioDevice.device;
    if (twilioDevice.voiceError) {
      safeSet(setVoiceError, twilioDevice.voiceError);
    }
    await twilioDevice.initDevice();
    deviceRef.current = twilioDevice.device;
    if (twilioDevice.isReady) {
      initAttemptsRef.current = 0;
      safeSet(setPhoneStatus, 'ready');
      safeSet(setVoiceError, null);
      safeSet(setIsReconnecting, false);
    } else if (twilioDevice.voiceError) {
      scheduleReconnect('token or device error');
    }
  }, [safeSet, scheduleReconnect, twilioDevice]);

  useEffect(() => {
    if (phoneStatus !== 'ready') return;
    console.log('[Device] DEVICE READY');
    const beat = setInterval(() => {
      console.log('[WebPhone] device heartbeat — status:', phoneStatusRef.current);
    }, 15_000);
    return () => clearInterval(beat);
  }, [phoneStatus]);

  initClientRef.current = initClient;

  useEffect(() => {
    deviceRef.current = twilioDevice.device;
    if (twilioDevice.isReady) {
      safeSet(setPhoneStatus, 'ready');
      safeSet(setVoiceError, twilioDevice.voiceError);
    }
    if (twilioDevice.voiceError && phoneStatusRef.current === 'initializing') {
      safeSet(setVoiceError, twilioDevice.voiceError);
    }
  }, [twilioDevice.device, twilioDevice.isReady, twilioDevice.voiceError, safeSet]);

  useEffect(() => {
    const onCallEnded = () => {
      isInboundRingingLiveRef.current = false;
      safeSet(setIsInboundRinging, false);
    };
    window.addEventListener('gd-call-ended', onCallEnded);
    return () => window.removeEventListener('gd-call-ended', onCallEnded);
  }, [safeSet]);

  useEffect(() => {
    const interval = setInterval(() => {
      const st = callStatusRef.current;
      if (st !== 'connecting' && st !== 'ringing') return;
      const started = inboundRingStartedRef.current;
      if (!started || Date.now() - started < 75_000) return;
      console.warn('[WebPhone] clearing stale pre-answer leg');
      if (activeCallRef.current) {
        try { activeCallRef.current.disconnect(); } catch { /* ignore */ }
      }
      activeCallRef.current = null;
      incomingCallRef.current = null;
      outboundDialRef.current = false;
      inboundRingStartedRef.current = null;
      safeSet(setIsInboundRinging, false);
      safeSet(setHasOutboundSession, false);
      safeSet(setActiveCallId, null);
      safeSet(setCallStatus, 'idle');
      safeSet(setIncomingCall, EMPTY_INCOMING_CALL);
    }, 5000);
    return () => clearInterval(interval);
  }, [safeSet]);

  useEffect(() => {
    mountedRef.current = true;
    primeVoiceAudioOnUserGesture();
    void initClient();

    return () => {
      mountedRef.current = false;
      twilioDevice.destroyDevice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mic permission + audio device resilience ───────────────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
      const map = (state: string): MicPermission =>
        state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'unknown';
      safeSet(setMicPermission, map(result.state));
      result.addEventListener('change', () => safeSet(setMicPermission, map(result.state)));
    }).catch(() => { /* permissions API not available */ });
  }, [safeSet]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.addEventListener) return;

    const refreshDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const input = devices.find((d) => d.kind === 'audioinput' && d.deviceId);
        safeSet(setAudioDeviceLabel, input?.label || null);

        const live = callStatusRef.current;
        if ((live === 'active' || live === 'held') && activeCallRef.current) {
          try {
            activeCallRef.current.mute(false);
            bindRemoteMediaToTwilioCall(activeCallRef.current);
          } catch { /* device swap in progress */ }
        }
      } catch { /* enumerate not available */ }
    };

    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    void refreshDevices();
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [safeSet]);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission('granted');
      return true;
    } catch {
      setMicPermission('denied');
      return false;
    }
  }, []);

  const waitForPhoneReady = useCallback((timeoutMs = 8000): Promise<boolean> => {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;
      const check = () => {
        if (twilioDevice.isReady && twilioDevice.device) {
          deviceRef.current = twilioDevice.device;
          resolve(true);
          return;
        }
        if (phoneStatusRef.current === 'error' || Date.now() >= deadline) {
          resolve(false);
          return;
        }
        setTimeout(check, 200);
      };
      check();
    });
  }, [twilioDevice.device, twilioDevice.isReady]);

  // ── Call actions ─────────────────────────────────────────────────────────────
  const makeCall = useCallback(async (destination: string, _callerNumber?: string) => {
    if (!twilioDevice.device || !twilioDevice.isReady) {
      console.warn('[WebPhone] makeCall: device not ready');
      return;
    }
    const currentStatus = callStatusRef.current;
    if (currentStatus === 'connecting' || currentStatus === 'ringing' || currentStatus === 'active' || currentStatus === 'held') {
      console.warn('[WebPhone] makeCall: call already in progress');
      return;
    }

    outboundDialRef.current = true;
    setHasOutboundSession(true);
    setCallStatus('connecting');
    setIsMuted(false);
    setIsOnHold(false);

    console.log('[WebPhone] initiating call to:', destination);
    deviceRef.current = twilioDevice.device;

    const call = await twilioDevice.makeCall(destination, _callerNumber);
    if (!call) {
      outboundDialRef.current = false;
      setHasOutboundSession(false);
      setCallStatus('idle');
      return;
    }

    if (!mountedRef.current) {
      try { call.disconnect(); } catch { /* ignore */ }
      return;
    }

    const callId = getCallStableId(call);
    activeCallRef.current = call;
    safeSet(setActiveCallId, callId);

    setupCallEventHandlers(call, false, { to: destination, from: _callerNumber ?? null });

    call.on('ringing', () => {
      console.log('[WebPhone] outbound call ringing:', getCallStableId(call));
      safeSet(setCallStatus, 'ringing');
    });
  }, [safeSet, setupCallEventHandlers, twilioDevice]);

  const answerIncomingCall = useCallback(async (): Promise<boolean> => {
    const pendingTarget = incomingCallRef.current ?? activeCallRef.current;
    console.log('[WebPhone] ACCEPT CLICKED', {
      exists: Boolean(pendingTarget),
      incomingSid: incomingCallRef.current?.parameters?.CallSid ?? null,
      activeSid: activeCallRef.current?.parameters?.CallSid ?? null,
      chosenSid: pendingTarget?.parameters?.CallSid ?? null,
      status: pendingTarget?.status?.() ?? null,
      direction: pendingTarget?.direction ?? null,
      phoneStatus: phoneStatusRef.current,
    });

    if (!pendingTarget) {
      console.warn('[WebPhone] answerIncomingCall: no incoming call');
      return false;
    }

    const pendingCallId = getCallStableId(pendingTarget);
    const pendingMeta = {
      from: extractInboundFromNumber(pendingTarget),
      to: extractInboundToNumber(pendingTarget),
    };

    await resumeVoiceAudioContext();
    await unlockRemoteAudioElement();

    acceptingInboundRef.current = true;
    stopInboundRingtone();
    safeSet(setIncomingCall, {
      phase: 'connecting',
      fromNumber: pendingMeta.from,
      toNumber: pendingMeta.to,
      callId: pendingCallId,
      ringStartedAt: inboundRingStartedRef.current,
      liveStartedAt: null,
      error: null,
    });

    // Single source of truth for accept(): prefer the orchestrator (which calls
    // call.accept() on its tracked session). If the orchestrator never received
    // this inbound call (no session → returns null), fall back to accepting the
    // live ringing Call directly so the click is never a silent no-op.
    let target: Call | null = null;
    try {
      target = await callOrchestrator.acceptIncoming({ rtcConstraints: { audio: true } });
      if (target) {
        console.log('[Inbound] accept() called', getCallStableId(target), 'via orchestrator');
      }
    } catch (err) {
      console.error('[Inbound] orchestrator accept() threw', err);
    }

    if (!target) {
      target = pendingTarget;
      try {
        if (target.status() !== 'open') {
          target.accept({ rtcConstraints: { audio: true } });
          console.log('[Inbound] accept() called', getCallStableId(target), 'direct fallback');
        } else {
          console.log('[Inbound] accept() skipped — call already open', getCallStableId(target));
        }
      } catch (err) {
        acceptingInboundRef.current = false;
        console.error('[Inbound] direct accept() threw', err, {
          status: target.status?.() ?? null,
          parameters: target.parameters,
        });
        return false;
      }
    }

    const callId = getCallStableId(target);
    const meta = {
      from: extractInboundFromNumber(target),
      to: extractInboundToNumber(target),
    };

    try {
      console.log('[WebPhone] accepting incoming call:', callId, 'status:', target.status());
      if (target.status() === 'open') {
        promoteCallToActive(target, true, callId, meta);
        void verifyInboundAudioAfterPromote(target);
      }
      return true;
    } catch (err) {
      acceptingInboundRef.current = false;
      console.error('[WebPhone] accept failed:', err, {
        status: target.status(),
        parameters: target.parameters,
      });
      return false;
    }
  }, [promoteCallToActive, safeSet, verifyInboundAudioAfterPromote]);

  const hangup = useCallback(() => {
    const target = incomingCallRef.current ?? activeCallRef.current;
    if (target) {
      try {
        const status = target.status();
        if (status === 'pending' || status === 'ringing') {
          target.reject();
        } else {
          target.disconnect();
        }
      } catch { /* ignore */ }
    }
    stopInboundRingtone();
    activeCallRef.current = null;
    incomingCallRef.current = null;
    outboundDialRef.current = false;
    setHasOutboundSession(false);
    setHasInboundActiveSession(false);
    setIsInboundRinging(false);
    setActiveCallId(null);
    setIsMuted(false);
    setIsOnHold(false);
    setCallStatus('ended');
    setIncomingCall((prev) => prev.phase === 'idle'
      ? prev
      : { ...prev, phase: 'ended', error: null });
    setTimeout(() => { if (mountedRef.current) setCallStatus('idle'); }, 800);
  }, []);

  const toggleMute = useCallback(() => {
    if (!activeCallRef.current) return;
    try {
      const newMuted = !isMuted;
      activeCallRef.current.mute(newMuted);
      setIsMuted(newMuted);
    } catch (err) {
      console.error('[WebPhone] mute error:', err);
    }
  }, [isMuted]);

  const toggleHold = useCallback(() => {
    if (!activeCallRef.current) return;
    // Twilio SDK does not have a native hold/unhold API.
    // We use mute as a substitute to prevent audio leakage.
    try {
      const newHold = !isOnHold;
      activeCallRef.current.mute(newHold);
      setIsOnHold(newHold);
    } catch (err) {
      console.error('[WebPhone] hold error:', err);
    }
  }, [isOnHold]);

  const sendDTMF = useCallback((digit: string) => {
    try { activeCallRef.current?.sendDigits(digit); } catch { /* ignore */ }
  }, []);

  const reconnect = useCallback(() => {
    initAttemptsRef.current = 0;
    safeSet(setVoiceError, null);
    void initClient();
  }, [initClient, safeSet]);

  return (
    <WebPhoneContext.Provider
      value={{
        phoneStatus,
        callStatus,
        activeCallId,
        hasOutboundSession,
        hasInboundActiveSession,
        isInboundRinging,
        isMuted,
        isOnHold,
        micPermission,
        voiceQuality,
        isReconnecting,
        audioDeviceLabel,
        iceConnectionState,
        makeCall,
        hangup,
        answerIncomingCall,
        toggleMute,
        toggleHold,
        sendDTMF,
        reconnect,
        requestMicPermission,
        waitForPhoneReady,
        voiceError: voiceError ?? twilioDevice.voiceError,
        incomingCall,
        staleTabWarning,
      }}
    >
      {/* Hidden audio — Twilio WebRTC plays remote caller audio through this element */}
      <audio
        id={REMOTE_AUDIO_ELEMENT_ID}
        data-remote-audio={REMOTE_AUDIO_LEGACY_ID}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      {children}
    </WebPhoneContext.Provider>
  );
}