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
  type IceConnectionQuality,
} from '@/lib/voice/peer-monitor';
import { resumeVoiceAudioContext, primeVoiceAudioOnUserGesture } from '@/lib/voice/audio-unlock';
import {
  REMOTE_AUDIO_ELEMENT_ID,
  REMOTE_AUDIO_LEGACY_ID,
  bindRemoteStreamToAudio,
  getRemoteAudioElement,
  unlockRemoteAudioElement,
} from '@/lib/voice/remote-audio';
import {
  extractCallSidFromSdkCall,
  extractInboundFromNumber,
  extractInboundToNumber,
  isTwilioCallOpen,
  isTwilioCallSid,
} from '@/lib/twilio/extract-call-sid';
import { useTwilioDevice } from '@/hooks/use-twilio-device';
import { useVoicePresence } from '@/hooks/use-voice-presence';
import { useWorkspace } from '@/contexts/workspace-context';
import { shouldBridgeAutoAnswer } from '@/lib/parallel-dial/auto-answer-flag';

export type PhoneStatus = 'idle' | 'initializing' | 'ready' | 'error';
export type WebRTCCallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'held' | 'ended';
export type MicPermission = 'unknown' | 'granted' | 'denied';
export type VoiceConnectionQuality = 'excellent' | 'good' | 'degraded' | 'disconnected' | 'unknown';
const DEBUG_ENDPOINT = 'http://127.0.0.1:7379/ingest/0b038bd8-a4b0-46ba-b218-7da01641d89a';

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
  /**
   * Register an external owner for genuine inbound PSTN calls (the Calls module).
   * When set, raw incoming calls are handed off and the WebPhone does no inbound
   * state work. Dialer bridge legs and outbound dialing are unaffected.
   * Pass null to unregister.
   */
  registerInboundHandler: (handler: ((call: Call) => void) | null) => void;
  /**
   * Hand off an accepted inbound SDK call to the shared ActiveCallOverlay path.
   * Called by CallsProvider after `call.on('accept')` fires.
   */
  adoptInboundCall: (call: Call, meta?: { from?: string | null; to?: string | null }) => void;
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

function agentDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): void {
  const payload = {
    sessionId: '30998c',
    runId: 'run1',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };

  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '30998c' },
    body: JSON.stringify(payload),
  }).catch(() => {});
  fetch('/api/agent-debug/30998c', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
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

function mapCallStatus(status: string): WebRTCCallStatus {
  switch (status) {
    case 'pending':
    case 'connecting':
      return 'connecting';
    case 'ringing':
      return 'ringing';
    case 'open':
      return 'active';
    case 'closed':
      return 'ended';
    default:
      return 'idle';
  }
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
  const externalInboundHandlerRef = useRef<((call: Call) => void) | null>(null);

  const registerInboundHandler = useCallback((handler: ((call: Call) => void) | null) => {
    externalInboundHandlerRef.current = handler;
  }, []);

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
        // #region agent log
        agentDebugLog('H3', 'contexts/webphone-context.tsx:bindPeerMonitor:onIceState', 'Inbound peer ICE state changed', {
          state,
          quality,
          callStatus: callStatusRef.current,
          snapshot: safeWebPhoneSnapshot(call),
        });
        // #endregion

        safeSet(setIceConnectionState, state);
        safeSet(setVoiceQuality, quality);
        if (quality === 'disconnected' && callStatusRef.current === 'active') {
          safeSet(setIsReconnecting, true);
        } else if (quality === 'excellent' || quality === 'good') {
          safeSet(setIsReconnecting, false);
        }
      },
      onConnectionState: (state) => {
        // #region agent log
        agentDebugLog('H3', 'contexts/webphone-context.tsx:bindPeerMonitor:onConnectionState', 'Inbound peer connection state changed', {
          state,
          callStatus: callStatusRef.current,
          snapshot: safeWebPhoneSnapshot(call),
        });
        // #endregion

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
        // #region agent log
        agentDebugLog('H3', 'contexts/webphone-context.tsx:bindPeerMonitor:onRemoteTrack', 'Remote audio track observed by peer monitor', {
          audioTracks: stream.getAudioTracks().length,
          liveAudioTracks: stream.getAudioTracks().filter((track) => track.readyState === 'live').length,
          snapshot: safeWebPhoneSnapshot(call),
        });
        // #endregion

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

    // #region agent log
    agentDebugLog('H3,H4', 'contexts/webphone-context.tsx:promoteCallToActive:start', 'Promoting SDK call to active WebPhone state', {
      isIncoming,
      callStatusBefore: callStatusRef.current,
      snapshot: safeWebPhoneSnapshot(call),
    });
    // #endregion

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
      window.dispatchEvent(new CustomEvent('gd-webrtc-inbound-active'));
    }

    bindRemoteMediaToTwilioCall(call);
    bindPeerMonitor(call);
    safeSet(setCallStatus, 'active');
    safeSet(setActiveCallId, resolvedId);

    // #region agent log
    agentDebugLog('H3,H4', 'contexts/webphone-context.tsx:promoteCallToActive:end', 'WebPhone active state set after remote media bind attempt', {
      isIncoming,
      resolvedIdKind: resolvedId.startsWith('CA') ? 'twilio-call-sid' : 'local-id',
      snapshot: safeWebPhoneSnapshot(call),
    });
    // #endregion
  }, [bindPeerMonitor, pushCallLegSync, safeSet]);

  const setupCallEventHandlers = useCallback((
    call: Call,
    isIncoming: boolean,
    meta?: { from?: string | null; to?: string | null },
  ) => {
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
      syncIfNeeded();
      promoteCallToActive(call, isIncoming, callId, meta);
    });

    call.on('disconnect', () => {
      const resolvedId = extractCallSidFromSdkCall(call) ?? callId;
      console.log('[WebPhone] call disconnected:', resolvedId);
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

      if (!acceptingInboundRef.current && !stillLive) {
        inboundRingStartedRef.current = null;
        isInboundRingingLiveRef.current = false;
        safeSet(setIsInboundRinging, false);
        safeSet(setHasOutboundSession, false);
        safeSet(setHasInboundActiveSession, false);
        safeSet(setActiveCallId, null);
        safeSet(setIsMuted, false);
        safeSet(setIsOnHold, false);
        setTimeout(() => {
          if (mountedRef.current && !activeCallRef.current && !incomingCallRef.current) {
            setCallStatus('idle');
          }
        }, 800);
      } else if (stillLive) {
        isInboundRingingLiveRef.current = true;
        safeSet(setIsInboundRinging, true);
        safeSet(setActiveCallId, incomingCallRef.current ? getCallStableId(incomingCallRef.current) : null);
      }
    });

    call.on('cancel', () => {
      const resolvedId = extractCallSidFromSdkCall(call) ?? callId;
      console.log('[WebPhone] call cancelled:', resolvedId);
      if (isIncoming && !acceptingInboundRef.current) {
        inboundRingStartedRef.current = null;
        isInboundRingingLiveRef.current = false;
        safeSet(setIsInboundRinging, false);
        safeSet(setActiveCallId, null);
        safeSet(setCallStatus, 'idle');
      }
    });

    call.on('reject', () => {
      const resolvedId = extractCallSidFromSdkCall(call) ?? callId;
      console.log('[WebPhone] call rejected:', resolvedId);
      if (isIncoming) {
        inboundRingStartedRef.current = null;
        isInboundRingingLiveRef.current = false;
        safeSet(setIsInboundRinging, false);
        safeSet(setActiveCallId, null);
        safeSet(setCallStatus, 'idle');
      }
    });
  }, [safeSet, promoteCallToActive, pushCallLegSync]);

  const adoptInboundCall = useCallback((
    call: Call,
    meta?: { from?: string | null; to?: string | null },
  ) => {
    // #region agent log
    agentDebugLog('H4', 'contexts/webphone-context.tsx:adoptInboundCall', 'CallsProvider handed accepted inbound SDK call to WebPhone', {
      callStatusBefore: callStatusRef.current,
      hasMetaFrom: Boolean(meta?.from),
      hasMetaTo: Boolean(meta?.to),
      snapshot: safeWebPhoneSnapshot(call),
    });
    // #endregion

    const callId = getCallStableId(call);
    activeCallRef.current = call;
    incomingCallRef.current = null;
    outboundDialRef.current = false;
    acceptingInboundRef.current = false;
    deviceRef.current = twilioDevice.device;

    safeSet(setHasOutboundSession, false);
    safeSet(setHasInboundActiveSession, true);
    safeSet(setIsInboundRinging, false);
    isInboundRingingLiveRef.current = false;
    inboundRingStartedRef.current = null;

    setupCallEventHandlers(call, true, meta);

    if (isTwilioCallOpen(call) || promotedActiveCallsRef.current.has(call)) {
      promoteCallToActive(call, true, callId, meta);
    } else {
      safeSet(setCallStatus, 'connecting');
      safeSet(setActiveCallId, callId);
    }
  }, [promoteCallToActive, safeSet, setupCallEventHandlers, twilioDevice.device]);

  handleIncomingRef.current = (call: Call) => {
    // Genuine inbound PSTN calls are owned by the Calls module. Dialer bridge legs
    // (power/parallel auto-answer) keep using the WebPhone's own handling below.
    if (!shouldBridgeAutoAnswer() && externalInboundHandlerRef.current) {
      outboundDialRef.current = false;
      safeSet(setHasOutboundSession, false);
      isInboundRingingLiveRef.current = true;
      safeSet(setIsInboundRinging, true);
      externalInboundHandlerRef.current(call);
      return;
    }

    const callId = getCallStableId(call);
    const fromNumber = extractInboundFromNumber(call);
    const toNumber = extractInboundToNumber(call);
    console.log('[WebPhone] incoming call:', callId, fromNumber ?? '');

    outboundDialRef.current = false;
    safeSet(setHasOutboundSession, false);

    incomingCallRef.current = call;
    activeCallRef.current = call;
    deviceRef.current = twilioDevice.device;
    safeSet(setActiveCallId, callId);

    const status = call.status();
    const mapped = mapCallStatus(status);

    safeSet(setCallStatus, mapped);

    if (mapped === 'ringing' || mapped === 'connecting') {
      if (!inboundRingStartedRef.current) {
        inboundRingStartedRef.current = Date.now();
      }
      isInboundRingingLiveRef.current = true;
      safeSet(setIsInboundRinging, true);
      bindPeerMonitor(call);

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
    }

    setupCallEventHandlers(call, true, { from: fromNumber, to: toNumber });

    if (isTwilioCallOpen(call)) {
      promoteCallToActive(call, true, callId, { from: fromNumber, to: toNumber });
    }

    const sid = extractCallSidFromSdkCall(call);
    if (sid) {
      void pushCallLegSync({
        call_sid: sid,
        direction: 'inbound',
        from_number: fromNumber,
        to_number: toNumber,
      });
    }
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

  const waitForInboundCallOpen = useCallback(async (call: Call, timeoutMs = 15_000): Promise<boolean> => {
    if (isTwilioCallOpen(call) || promotedActiveCallsRef.current.has(call)) return true;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearInterval(poll);
        clearTimeout(timer);
        call.removeListener('accept', onAccept);
        resolve(ok);
      };

      const onAccept = () => finish(true);
      call.on('accept', onAccept);

      const poll = setInterval(() => {
        if (isTwilioCallOpen(call) || promotedActiveCallsRef.current.has(call)) {
          finish(true);
        }
      }, 200);

      const timer = setTimeout(() => finish(isTwilioCallOpen(call)), timeoutMs);
    });
  }, []);

  const answerIncomingCall = useCallback(async (): Promise<boolean> => {
    const target = incomingCallRef.current ?? activeCallRef.current;
    if (!target) {
      console.warn('[WebPhone] answerIncomingCall: no incoming call');
      return false;
    }

    await resumeVoiceAudioContext();
    await unlockRemoteAudioElement();

    acceptingInboundRef.current = true;

    const callId = getCallStableId(target);
    const meta = {
      from: extractInboundFromNumber(target),
      to: extractInboundToNumber(target),
    };

    try {
      console.log('[WebPhone] accepting incoming call:', callId, 'status:', target.status());
      if (!isTwilioCallOpen(target)) {
        target.accept();
      }
      const opened = await waitForInboundCallOpen(target);
      if (opened && !promotedActiveCallsRef.current.has(target)) {
        promoteCallToActive(target, true, callId, meta);
      }
      if (!opened) {
        acceptingInboundRef.current = false;
      }
      return opened;
    } catch (err) {
      acceptingInboundRef.current = false;
      console.error('[WebPhone] accept failed:', err, {
        status: target.status(),
        parameters: target.parameters,
      });
      return false;
    }
  }, [promoteCallToActive, waitForInboundCallOpen]);

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
  }, [initClient]);

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
        registerInboundHandler,
        adoptInboundCall,
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