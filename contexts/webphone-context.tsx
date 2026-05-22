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
  isMuted: boolean;
  isOnHold: boolean;
  micPermission: MicPermission;
  makeCall: (destination: string, callerNumber?: string, onCallCreated?: (callId: string) => void) => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDTMF: (digit: string) => void;
  reconnect: () => void;
  requestMicPermission: () => Promise<boolean>;
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
  // Track whether we are mounted to avoid setState after unmount
  const mountedRef = useRef(true);

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) setter(value);
  }, []);

  // ── Init / Reconnect ─────────────────────────────────────────────────────────
  const initClient = useCallback(async () => {
    safeSet(setPhoneStatus, 'initializing');
    try {
      // Dynamic import prevents SSR from pulling in browser-only code
      const { TelnyxRTC } = await import('@telnyx/webrtc');

      const res = await fetch('/api/voice/token', { method: 'POST' });
      if (!res.ok) {
        console.error('[WebPhone] token fetch failed:', res.status);
        safeSet(setPhoneStatus, 'error');
        return;
      }
      const creds = await res.json();
      if (creds.error) {
        console.error('[WebPhone] token error:', creds.error);
        safeSet(setPhoneStatus, 'error');
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
        safeSet(setPhoneStatus, 'ready');
      });

      client.on('telnyx.error', (err: unknown) => {
        console.error('[WebPhone] error event:', err);
        safeSet(setPhoneStatus, 'error');
      });

      client.on('telnyx.notification', (notification: INotification) => {
        if (notification.type !== 'callUpdate' || !notification.call) return;

        const call = notification.call as unknown as Call;
        const mapped = mapCallState(call.state);

        activeCallRef.current = call;
        safeSet(setActiveCallId, call.id ?? null);
        safeSet(setCallStatus, mapped);

        if (mapped === 'ended') {
          activeCallRef.current = null;
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
      safeSet(setPhoneStatus, 'error');
    }
  }, [safeSet]);

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

  // ── Call actions ─────────────────────────────────────────────────────────────
  const makeCall = useCallback((destination: string, callerNumber?: string, onCallCreated?: (callId: string) => void) => {
    if (!clientRef.current) {
      console.warn('[WebPhone] makeCall: client not initialized');
      return;
    }
    if (phoneStatus !== 'ready') {
      console.warn('[WebPhone] makeCall: phone not ready, status:', phoneStatus);
      return;
    }
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
      // Fire callback immediately so the consumer can register a DB record
      // with the correct WebRTC call_control_id (avoids duplicate server-side call)
      if (call?.id) {
        onCallCreated?.(call.id as string);
      }
    } catch (err) {
      console.error('[WebPhone] newCall error:', err);
      setCallStatus('idle');
    }
  }, [phoneStatus]);

  const hangup = useCallback(() => {
    if (activeCallRef.current) {
      try { activeCallRef.current.hangup(); } catch { /* ignore */ }
    }
    activeCallRef.current = null;
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

  const reconnect = useCallback(() => { initClient(); }, [initClient]);

  return (
    <WebPhoneContext.Provider
      value={{
        phoneStatus,
        callStatus,
        activeCallId,
        isMuted,
        isOnHold,
        micPermission,
        makeCall,
        hangup,
        toggleMute,
        toggleHold,
        sendDTMF,
        reconnect,
        requestMicPermission,
      }}
    >
      {/* Hidden audio element — Telnyx WebRTC plays remote audio through this */}
      <audio id={AUDIO_EL_ID} autoPlay playsInline style={{ display: 'none' }} />
      {children}
    </WebPhoneContext.Provider>
  );
}
