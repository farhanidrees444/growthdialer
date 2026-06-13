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
import type { IClientOptions, INotification } from '@telnyx/webrtc';
import type Call from '@telnyx/webrtc/lib/src/Modules/Verto/webrtc/Call';
import {
  attachPeerConnectionMonitor,
  type IceConnectionQuality,
} from '@/lib/voice/peer-monitor';
import { resumeVoiceAudioContext } from '@/lib/voice/audio-unlock';
import {
  REMOTE_AUDIO_ELEMENT_ID,
  REMOTE_AUDIO_LEGACY_ID,
  bindRemoteStreamToAudio,
  getRemoteAudioElement,
  unlockRemoteAudioElement,
} from '@/lib/voice/remote-audio';

export type PhoneStatus = 'idle' | 'initializing' | 'ready' | 'error';
export type WebRTCCallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'held' | 'ended';
export type MicPermission = 'unknown' | 'granted' | 'denied';
export type VoiceConnectionQuality = 'excellent' | 'good' | 'degraded' | 'disconnected' | 'unknown';

export interface WebPhoneContextValue {
  phoneStatus: PhoneStatus;
  callStatus: WebRTCCallStatus;
  activeCallId: string | null;
  /** True while an outbound dial we initiated is connecting, ringing, or live */
  hasOutboundSession: boolean;
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
  /** Wait until an inbound WebRTC leg is ringing in the browser. */
  waitForInboundWebRtcLeg: (timeoutMs?: number) => Promise<boolean>;
}

const WebPhoneContext = createContext<WebPhoneContextValue | null>(null);

export function useWebPhone(): WebPhoneContextValue {
  const ctx = useContext(WebPhoneContext);
  if (!ctx) throw new Error('useWebPhone must be used inside WebPhoneProvider');
  return ctx;
}

function isIncomingTelnyxCall(call: Call, outboundDialActive: boolean): boolean {
  if (outboundDialActive) return false;
  const dir = (call as { direction?: string }).direction?.toLowerCase();
  if (dir === 'inbound' || dir === 'incoming') return true;
  if (dir === 'outbound' || dir === 'outgoing') {
    const state = (call as { state?: string }).state?.toLowerCase();
    // Server-side inbound bridge dials the browser — SDK may label the leg outbound while ringing.
    return ['ringing', 'early', 'new', 'trying', 'requesting'].includes(state ?? '');
  }
  return true;
}

function mapCallState(state: string): WebRTCCallStatus {
  switch (state) {
    case 'new':
    case 'requesting':
    case 'trying':
    case 'recovering':
      return 'connecting';
    case 'ringing':
    case 'early':
      return 'ringing';
    case 'active':
      return 'active';
    case 'held':
      return 'held';
    case 'hangup':
    case 'destroy':
    case 'purge':
      return 'ended';
    default:
      return 'idle';
  }
}

const AUDIO_EL_ID = REMOTE_AUDIO_ELEMENT_ID;
const TOKEN_URL = '/api/telnyx/token';
const PREPARE_URL = '/api/voice/prepare';
const PRESENCE_URL = '/api/voice/presence';

async function reportVoicePresence(
  phoneStatus: PhoneStatus | 'offline',
  meta?: { sip_username?: string; credential_id?: string },
): Promise<void> {
  try {
    await fetch(PRESENCE_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_status: phoneStatus,
        sip_username: meta?.sip_username ?? null,
        credential_id: meta?.credential_id ?? null,
      }),
    });
  } catch { /* non-fatal */ }
}

async function fetchAssignedCallerNumber(): Promise<string | null> {
  try {
    const res = await fetch('/api/numbers/list', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = await res.json() as {
      numbers?: Array<{ phone_number?: string; is_default?: boolean; status?: string }>;
    };
    const active = (data.numbers ?? []).filter((n) => n.status !== 'released' && n.phone_number);
    const preferred = active.find((n) => n.is_default) ?? active[0];
    return preferred?.phone_number?.trim() ?? null;
  } catch {
    return null;
  }
}

function bindRemoteMediaToAudio(call: Call): void {
  const callWithMedia = call as Call & {
    remoteStream?: MediaStream;
    peer?: { instance?: { getRemoteStreams?: () => MediaStream[] } };
  };

  const stream =
    callWithMedia.remoteStream
    ?? callWithMedia.peer?.instance?.getRemoteStreams?.()?.[0]
    ?? null;

  if (stream) {
    void bindRemoteStreamToAudio(stream);
  }
}

export function WebPhoneProvider({ children }: { children: ReactNode }) {
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

  // Refs hold live objects that should NOT trigger re-renders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const callStatusRef = useRef<WebRTCCallStatus>('idle');
  const outboundDialRef = useRef(false);
  const [hasOutboundSession, setHasOutboundSession] = useState(false);
  const [isInboundRinging, setIsInboundRinging] = useState(false);
  const phoneStatusRef = useRef<PhoneStatus>('idle');
  callStatusRef.current = callStatus;
  phoneStatusRef.current = phoneStatus;
  // Track whether we are mounted to avoid setState after unmount
  const mountedRef = useRef(true);
  const initAttemptsRef = useRef(0);
  const initClientRef = useRef<() => Promise<void>>(async () => {});
  const inboundRingStartedRef = useRef<number | null>(null);
  const defaultCallerIdRef = useRef<string | null>(null);
  const peerCleanupRef = useRef<(() => void) | null>(null);
  const reconnectDuringCallRef = useRef(false);
  const voicePrepareAttemptedRef = useRef(false);

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) setter(value);
  }, []);

  const scheduleReconnect = useCallback((reason: string) => {
    if (initAttemptsRef.current >= 3) {
      safeSet(setPhoneStatus, 'error');
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

  const initClient = useCallback(async () => {
    safeSet(setPhoneStatus, 'initializing');
    try {
      // Dynamic import prevents SSR from pulling in browser-only code
      const { TelnyxRTC } = await import('@telnyx/webrtc');

      let res = await fetch(TOKEN_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok && res.status === 503 && !voicePrepareAttemptedRef.current) {
        voicePrepareAttemptedRef.current = true;
        console.warn('[WebPhone] token unavailable — repairing voice account');
        await fetch(PREPARE_URL, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null);
        res = await fetch(TOKEN_URL, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!res.ok) {
        console.error('[WebPhone] token fetch failed:', res.status);
        scheduleReconnect(`token HTTP ${res.status}`);
        return;
      }
      const creds = await res.json() as {
        login_token?: string;
        sip_username?: string;
        credential_id?: string;
        error?: string;
      };
      if (creds.error || !creds.login_token) {
        console.error('[WebPhone] token error:', creds.error ?? 'missing login_token');
        scheduleReconnect('token error');
        return;
      }

      // Tear down existing client if reconnecting
      if (clientRef.current) {
        try { clientRef.current.disconnect(); } catch { /* ignore */ }
        clientRef.current = null;
      }

      const opts: IClientOptions = { login_token: creds.login_token };

      const client = new TelnyxRTC(opts);
      clientRef.current = client;

      // Bind SDK remote playback to our hidden <audio> element (DOM ref + id fallback).
      const remoteAudioEl = getRemoteAudioElement();
      client.remoteElement = remoteAudioEl ?? AUDIO_EL_ID;

      client.on('telnyx.ready', () => {
        console.log('[WebPhone] ready');
        initAttemptsRef.current = 0;
        safeSet(setPhoneStatus, 'ready');
        safeSet(setIsReconnecting, false);
        void reportVoicePresence('ready', {
          sip_username: creds.sip_username,
          credential_id: creds.credential_id,
        });
        void fetchAssignedCallerNumber().then((num) => {
          if (num) defaultCallerIdRef.current = num;
        });
      });

      client.on('telnyx.error', (err: unknown) => {
        console.error('[WebPhone] error event:', err);
        // Keep ready during active calls; transient socket errors should not brick dialing
        const live = callStatusRef.current;
        if (live === 'connecting' || live === 'ringing' || live === 'active' || live === 'held') {
          return;
        }
        safeSet(setPhoneStatus, 'error');
        void reportVoicePresence('error');
      });

      client.on('telnyx.socket.close', () => {
        const live = callStatusRef.current;
        if (live === 'connecting' || live === 'ringing' || live === 'active' || live === 'held') {
          safeSet(setIsReconnecting, true);
          if (!reconnectDuringCallRef.current) {
            reconnectDuringCallRef.current = true;
            scheduleReconnect('socket closed during call');
            setTimeout(() => { reconnectDuringCallRef.current = false; }, 4000);
          }
          return;
        }
        if (phoneStatusRef.current === 'ready') {
          safeSet(setPhoneStatus, 'initializing');
        }
      });

      client.on('telnyx.notification', (notification: INotification) => {
        if (notification.type === 'callUpdate' && notification.call) {
        const call = notification.call as unknown as Call;
        const mapped = mapCallState(call.state);
        const incoming = isIncomingTelnyxCall(call, outboundDialRef.current);

        if (incoming) {
          outboundDialRef.current = false;
          safeSet(setHasOutboundSession, false);
          incomingCallRef.current = call;
        }

        activeCallRef.current = call;
        safeSet(setActiveCallId, call.id ?? null);
        safeSet(setCallStatus, mapped);

        if (incoming && (mapped === 'ringing' || mapped === 'connecting')) {
          if (!inboundRingStartedRef.current) {
            inboundRingStartedRef.current = Date.now();
          }
          safeSet(setIsInboundRinging, true);
          bindPeerMonitor(call);
          if (mapped === 'ringing') {
            window.dispatchEvent(new CustomEvent('gd-webrtc-inbound-ring'));
          }
        } else if (incoming && mapped === 'active') {
          bindRemoteMediaToAudio(call);
          bindPeerMonitor(call);
          safeSet(setIsInboundRinging, false);
          inboundRingStartedRef.current = null;
          window.dispatchEvent(new CustomEvent('gd-webrtc-inbound-active'));
        } else if (!outboundDialRef.current && (mapped === 'ended' || mapped === 'idle')) {
          inboundRingStartedRef.current = null;
          safeSet(setIsInboundRinging, false);
        } else if (outboundDialRef.current) {
          safeSet(setIsInboundRinging, false);
        }

        if (mapped === 'active') {
          bindRemoteMediaToAudio(call);
          bindPeerMonitor(call);
        }

        if (mapped === 'ringing' && outboundDialRef.current) {
          void import('@/lib/parallel-dial/auto-answer-flag').then(({ shouldParallelAutoAnswer }) => {
            if (!shouldParallelAutoAnswer() || !activeCallRef.current) return;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (activeCallRef.current as any).answer?.();
              console.log('[WebPhone] parallel auto-answer');
            } catch (err) {
              console.error('[WebPhone] parallel auto-answer failed:', err);
            }
          });
        }

        if (mapped === 'ended') {
          peerCleanupRef.current?.();
          peerCleanupRef.current = null;
          safeSet(setVoiceQuality, 'unknown');
          safeSet(setIceConnectionState, null);
          safeSet(setIsReconnecting, false);
          activeCallRef.current = null;
          incomingCallRef.current = null;
          outboundDialRef.current = false;
          inboundRingStartedRef.current = null;
          safeSet(setIsInboundRinging, false);
          safeSet(setHasOutboundSession, false);
          safeSet(setActiveCallId, null);
          safeSet(setIsMuted, false);
          safeSet(setIsOnHold, false);
          // Brief delay so consumers see 'ended' before we flip to 'idle'
          setTimeout(() => {
            if (mountedRef.current) setCallStatus('idle');
          }, 800);
        }
        return;
        }

        if (notification.type === 'telnyx_rtc.attach') {
          const attachCall = (notification as INotification & { call?: Call }).call;
          if (attachCall) bindRemoteMediaToAudio(attachCall as unknown as Call);
        }
      });

      client.connect();
    } catch (err) {
      console.error('[WebPhone] init error:', err);
      scheduleReconnect('init exception');
    }
  }, [safeSet, scheduleReconnect, bindPeerMonitor]);

  useEffect(() => {
    if (phoneStatus !== 'ready') return;
    const beat = setInterval(() => {
      void reportVoicePresence('ready');
    }, 30_000);
    return () => clearInterval(beat);
  }, [phoneStatus]);

  initClientRef.current = initClient;

  useEffect(() => {
    const interval = setInterval(() => {
      const st = callStatusRef.current;
      if (st !== 'connecting' && st !== 'ringing') return;
      const started = inboundRingStartedRef.current;
      if (!started || Date.now() - started < 75_000) return;
      console.warn('[WebPhone] clearing stale pre-answer leg');
      if (activeCallRef.current) {
        try { activeCallRef.current.hangup(); } catch { /* ignore */ }
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
    initClient();

    // Refresh JWT before Telnyx token expiry (~24h) for long dashboard sessions
    const tokenRefresh = setInterval(() => {
      if (phoneStatusRef.current === 'ready' && callStatusRef.current === 'idle') {
        console.log('[WebPhone] refreshing voice token');
        void initClientRef.current();
      }
    }, 6 * 60 * 60 * 1000);

    return () => {
      mountedRef.current = false;
      void reportVoicePresence('offline');
      clearInterval(tokenRefresh);
      if (clientRef.current) {
        try { clientRef.current.disconnect(); } catch { /* ignore */ }
      }
    };
    // initClient is stable (only depends on safeSet which is also stable)
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
            activeCallRef.current.unmuteAudio();
            bindRemoteMediaToAudio(activeCallRef.current);
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
        if (clientRef.current && phoneStatusRef.current === 'ready') {
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
  }, []);

  // ── Call actions ─────────────────────────────────────────────────────────────
  const makeCall = useCallback((destination: string, callerNumber?: string) => {
    if (!clientRef.current) {
      console.warn('[WebPhone] makeCall: client not initialized');
      return;
    }
    if (phoneStatusRef.current !== 'ready') {
      console.warn('[WebPhone] makeCall: phone not ready, status:', phoneStatusRef.current);
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
    try {
      const callerId = callerNumber ?? defaultCallerIdRef.current ?? undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callParams: Record<string, any> = {
        destinationNumber: destination,
        audio: true,
        video: false,
        mediaConstraints: {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        },
        custom_headers: [
          { name: 'X-Recording-Channels', value: 'dual' },
          { name: 'X-Recording-Format', value: 'mp3' },
        ],
      };
      if (callerId) {
        callParams.callerNumber = callerId;
        callParams.callerName = 'GrowthDialer';
      }
      console.log('[WebPhone] initiating call:', {
        destinationNumber: destination,
        callerNumber: callerId ?? '(none)',
      });
      const call = clientRef.current.newCall(callParams);
      activeCallRef.current = call;
    } catch (err) {
      console.error('[WebPhone] newCall error:', err);
      outboundDialRef.current = false;
      setHasOutboundSession(false);
      setCallStatus('idle');
    }
  }, []);

  const waitForInboundWebRtcLeg = useCallback((timeoutMs = 15000): Promise<boolean> => {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;
      const check = () => {
        const target = incomingCallRef.current ?? activeCallRef.current;
        if (target && isIncomingTelnyxCall(target, outboundDialRef.current)) {
          resolve(true);
          return;
        }
        if (Date.now() >= deadline) {
          resolve(false);
          return;
        }
        setTimeout(check, 200);
      };
      check();
    });
  }, []);

  const answerIncomingCall = useCallback(async (): Promise<boolean> => {
    await resumeVoiceAudioContext();
    await unlockRemoteAudioElement();

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const target = incomingCallRef.current;
      if (target && isIncomingTelnyxCall(target, outboundDialRef.current)) {
        bindPeerMonitor(target);
        bindRemoteMediaToAudio(target);

        try {
          const callSession = target as Call & {
            answer?: (opts?: { audio?: boolean; video?: boolean }) => void | Promise<void>;
          };
          const answerResult = callSession.answer?.({ audio: true, video: false });
          if (answerResult && typeof (answerResult as Promise<void>).then === 'function') {
            await answerResult;
          }
          console.log('[WebPhone] answered inbound WebRTC session:', target.id);
        } catch (err) {
          console.error('[WebPhone] answerIncomingCall error:', err);
          return false;
        }

        const activeDeadline = Date.now() + 12_000;
        while (Date.now() < activeDeadline) {
          if (callStatusRef.current === 'active') {
            const live = activeCallRef.current ?? target;
            bindRemoteMediaToAudio(live);
            bindPeerMonitor(live);
            return true;
          }
          await new Promise((r) => setTimeout(r, 120));
        }

        return callStatusRef.current === 'active';
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    console.warn('[WebPhone] answerIncomingCall: no incoming WebRTC leg after wait');
    return false;
  }, [bindPeerMonitor]);

  const hangup = useCallback(() => {
    if (activeCallRef.current) {
      try { activeCallRef.current.hangup(); } catch { /* ignore */ }
    }
    activeCallRef.current = null;
    incomingCallRef.current = null;
    outboundDialRef.current = false;
    setHasOutboundSession(false);
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
      if (isMuted) {
        activeCallRef.current.unmuteAudio();
      } else {
        activeCallRef.current.muteAudio();
      }
      setIsMuted((prev) => !prev);
    } catch (err) {
      console.error('[WebPhone] mute error:', err);
    }
  }, [isMuted]);

  const toggleHold = useCallback(() => {
    if (!activeCallRef.current) return;
    try {
      if (isOnHold) {
        activeCallRef.current.unhold();
      } else {
        activeCallRef.current.hold();
      }
      setIsOnHold((prev) => !prev);
    } catch (err) {
      console.error('[WebPhone] hold error:', err);
    }
  }, [isOnHold]);

  const sendDTMF = useCallback((digit: string) => {
    try { activeCallRef.current?.dtmf(digit); } catch { /* ignore */ }
  }, []);

  const reconnect = useCallback(() => {
    initAttemptsRef.current = 0;
    void initClient();
  }, [initClient]);

  return (
    <WebPhoneContext.Provider
      value={{
        phoneStatus,
        callStatus,
        activeCallId,
        hasOutboundSession,
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
        waitForInboundWebRtcLeg,
      }}
    >
      {/* Hidden audio — Telnyx WebRTC plays remote caller audio through this element */}
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
