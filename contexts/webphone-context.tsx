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

export type PhoneStatus = 'idle' | 'initializing' | 'ready' | 'error';
export type WebRTCCallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'held' | 'ended';
export type MicPermission = 'unknown' | 'granted' | 'denied';

export interface WebPhoneContextValue {
  phoneStatus: PhoneStatus;
  callStatus: WebRTCCallStatus;
  activeCallId: string | null;
  /** True while an outbound dial we initiated is connecting, ringing, or live */
  hasOutboundSession: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  micPermission: MicPermission;
  makeCall: (destination: string, callerNumber?: string) => void;
  hangup: () => void;
  answerIncomingCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDTMF: (digit: string) => void;
  reconnect: () => void;
  requestMicPermission: () => Promise<boolean>;
  /** Poll until WebRTC client is ready or timeout (ms). */
  waitForPhoneReady: (timeoutMs?: number) => Promise<boolean>;
}

const WebPhoneContext = createContext<WebPhoneContextValue | null>(null);

export function useWebPhone(): WebPhoneContextValue {
  const ctx = useContext(WebPhoneContext);
  if (!ctx) throw new Error('useWebPhone must be used inside WebPhoneProvider');
  return ctx;
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

const AUDIO_EL_ID = 'telnyx-remote-audio';

export function WebPhoneProvider({ children }: { children: ReactNode }) {
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>('idle');
  const [callStatus, setCallStatus] = useState<WebRTCCallStatus>('idle');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown');

  // Refs hold live objects that should NOT trigger re-renders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);
  const activeCallRef = useRef<Call | null>(null);
  const callStatusRef = useRef<WebRTCCallStatus>('idle');
  const outboundDialRef = useRef(false);
  const [hasOutboundSession, setHasOutboundSession] = useState(false);
  const phoneStatusRef = useRef<PhoneStatus>('idle');
  callStatusRef.current = callStatus;
  phoneStatusRef.current = phoneStatus;
  // Track whether we are mounted to avoid setState after unmount
  const mountedRef = useRef(true);
  const initAttemptsRef = useRef(0);
  const initClientRef = useRef<() => Promise<void>>(async () => {});

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

  const initClient = useCallback(async () => {
    safeSet(setPhoneStatus, 'initializing');
    try {
      // Dynamic import prevents SSR from pulling in browser-only code
      const { TelnyxRTC } = await import('@telnyx/webrtc');

      const res = await fetch('/api/voice/token', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        console.error('[WebPhone] token fetch failed:', res.status);
        scheduleReconnect(`token HTTP ${res.status}`);
        return;
      }
      const creds = await res.json() as {
        login_token?: string;
        login?: string;
        password?: string;
        error?: string;
      };
      if (creds.error) {
        console.error('[WebPhone] token error:', creds.error);
        scheduleReconnect('token error');
        return;
      }
      const hasJwt = Boolean(creds.login_token);
      const hasSip = Boolean(creds.login && creds.password);
      if (!hasJwt && !hasSip) {
        console.error('[WebPhone] token response missing credentials');
        scheduleReconnect('empty credentials');
        return;
      }

      // Tear down existing client if reconnecting
      if (clientRef.current) {
        try { clientRef.current.disconnect(); } catch { /* ignore */ }
        clientRef.current = null;
      }

      const opts: IClientOptions = {};
      if (creds.login_token) {
        opts.login_token = creds.login_token;
      } else {
        opts.login = creds.login;
        opts.password = creds.password;
      }

      const client = new TelnyxRTC(opts);
      clientRef.current = client;

      // Point remote audio at the hidden <audio> element
      client.remoteElement = AUDIO_EL_ID;

      client.on('telnyx.ready', () => {
        console.log('[WebPhone] ready');
        initAttemptsRef.current = 0;
        safeSet(setPhoneStatus, 'ready');
      });

      client.on('telnyx.error', (err: unknown) => {
        console.error('[WebPhone] error event:', err);
        // Keep ready during active calls; transient socket errors should not brick dialing
        const live = callStatusRef.current;
        if (live === 'connecting' || live === 'ringing' || live === 'active' || live === 'held') {
          return;
        }
        safeSet(setPhoneStatus, 'error');
      });

      client.on('telnyx.socket.close', () => {
        if (phoneStatusRef.current === 'ready') {
          safeSet(setPhoneStatus, 'initializing');
        }
      });

      client.on('telnyx.notification', (notification: INotification) => {
        if (notification.type !== 'callUpdate' || !notification.call) return;

        const call = notification.call as unknown as Call;
        const mapped = mapCallState(call.state);

        activeCallRef.current = call;
        safeSet(setActiveCallId, call.id ?? null);
        safeSet(setCallStatus, mapped);

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
          activeCallRef.current = null;
          outboundDialRef.current = false;
          safeSet(setHasOutboundSession, false);
          safeSet(setActiveCallId, null);
          safeSet(setIsMuted, false);
          safeSet(setIsOnHold, false);
          // Brief delay so consumers see 'ended' before we flip to 'idle'
          setTimeout(() => {
            if (mountedRef.current) setCallStatus('idle');
          }, 800);
        }
      });

      client.connect();
    } catch (err) {
      console.error('[WebPhone] init error:', err);
      scheduleReconnect('init exception');
    }
  }, [safeSet, scheduleReconnect]);

  initClientRef.current = initClient;

  useEffect(() => {
    mountedRef.current = true;
    initClient();
    return () => {
      mountedRef.current = false;
      if (clientRef.current) {
        try { clientRef.current.disconnect(); } catch { /* ignore */ }
      }
    };
    // initClient is stable (only depends on safeSet which is also stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mic permission ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
      const map = (state: string): MicPermission =>
        state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'unknown';
      safeSet(setMicPermission, map(result.state));
      result.addEventListener('change', () => safeSet(setMicPermission, map(result.state)));
    }).catch(() => { /* permissions API not available */ });
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
      if (callerNumber) {
        callParams.callerNumber = callerNumber;
        callParams.callerName = 'GrowthDialer';
      }
      console.log('[WebPhone] initiating call:', {
        destinationNumber: destination,
        callerNumber: callerNumber ?? '(none)',
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

  const answerIncomingCall = useCallback(() => {
    const tryAnswer = (attempt: number) => {
      if (activeCallRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (activeCallRef.current as any).answer?.();
          console.log('[WebPhone] answered inbound call');
        } catch (err) {
          console.error('[WebPhone] answerIncomingCall error:', err);
        }
        return;
      }
      if (attempt < 20) {
        setTimeout(() => tryAnswer(attempt + 1), 200);
      } else {
        console.warn('[WebPhone] answerIncomingCall: no incoming WebRTC leg after wait');
      }
    };
    tryAnswer(0);
  }, []);

  const hangup = useCallback(() => {
    if (activeCallRef.current) {
      try { activeCallRef.current.hangup(); } catch { /* ignore */ }
    }
    activeCallRef.current = null;
    outboundDialRef.current = false;
    setHasOutboundSession(false);
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
        isMuted,
        isOnHold,
        micPermission,
        makeCall,
        hangup,
        answerIncomingCall,
        toggleMute,
        toggleHold,
        sendDTMF,
        reconnect,
        requestMicPermission,
        waitForPhoneReady,
      }}
    >
      {/* Hidden audio element — Telnyx WebRTC plays remote audio through this */}
      <audio id={AUDIO_EL_ID} autoPlay playsInline style={{ display: 'none' }} />
      {children}
    </WebPhoneContext.Provider>
  );
}
