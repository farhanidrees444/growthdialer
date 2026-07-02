'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TelnyxRTC, type Call } from '@telnyx/webrtc';
import { toast } from 'sonner';

const TOKEN_URL = '/api/voice/token';
const TOKEN_TTL_MS = 3600 * 1000;
const TOKEN_REFRESH_RATIO = 0.75;

export interface UseTelephonyDeviceOptions {
  manualInit?: boolean;
  onIncoming?: (call: Call) => void;
}

export interface UseTelephonyDeviceReturn {
  client: TelnyxRTC | null;
  isReady: boolean;
  incomingCall: Call | null;
  activeCall: Call | null;
  isMuted: boolean;
  voiceError: string | null;
  acceptCall: () => void;
  rejectCall: () => void;
  makeCall: (toNumber: string, callerId?: string) => Promise<Call | null>;
  hangup: () => void;
  toggleMute: () => void;
  initDevice: () => Promise<void>;
  refreshToken: () => Promise<void>;
  destroyDevice: () => void;
}

function decodeJwtExpiryMs(jwt: string): number | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function useTelephonyDevice(options: UseTelephonyDeviceOptions = {}): UseTelephonyDeviceReturn {
  const [client, setClient] = useState<TelnyxRTC | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const clientRef = useRef<TelnyxRTC | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIncomingRef = useRef(options.onIncoming);
  onIncomingRef.current = options.onIncoming;

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleTokenRefresh = useCallback((jwt: string, refreshFn: () => Promise<void>) => {
    clearRefreshTimer();
    const expMs = decodeJwtExpiryMs(jwt) ?? Date.now() + TOKEN_TTL_MS;
    const ttlRemaining = expMs - Date.now();
    const refreshAt = Math.max(15_000, ttlRemaining * TOKEN_REFRESH_RATIO);
    refreshTimerRef.current = setTimeout(() => {
      if (mountedRef.current) void refreshFn();
    }, refreshAt);
  }, [clearRefreshTimer]);

  const bindClientEvents = useCallback((rtc: TelnyxRTC) => {
    rtc.on('telnyx.ready', () => {
      if (!mountedRef.current) return;
      setIsReady(true);
      setVoiceError(null);
    });

    rtc.on('telnyx.error', (error: Error) => {
      if (!mountedRef.current) return;
      const message = error?.message ?? 'Voice connection failed';
      setVoiceError(message);
      toast.error(message);
    });

    rtc.on('telnyx.notification', (notification: { type?: string; call?: Call }) => {
      if (!mountedRef.current || !notification.call) return;
      const call = notification.call;

      if (notification.type === 'callUpdate') {
        if (call.direction === 'inbound' && call.state === 'ringing') {
          setIncomingCall(call);
          onIncomingRef.current?.(call);
          return;
        }

        if (call.state === 'active') {
          setIncomingCall(null);
          setActiveCall(call);
          return;
        }

        if (call.state === 'hangup' || call.state === 'destroy') {
          setIncomingCall((current) => (current?.id === call.id ? null : current));
          setActiveCall((current) => (current?.id === call.id ? null : current));
          setIsMuted(false);
        }
      }
    });
  }, []);

  const destroyDevice = useCallback(() => {
    clearRefreshTimer();
    clientRef.current?.disconnect();
    clientRef.current = null;
    setClient(null);
    setIsReady(false);
    setIncomingCall(null);
    setActiveCall(null);
    setIsMuted(false);
  }, [clearRefreshTimer]);

  const initDevice = useCallback(async () => {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      const message = body.error ?? 'Could not connect voice service';
      setVoiceError(message);
      throw new Error(message);
    }

    const data = await res.json() as { login_token?: string; token?: string };
    const loginToken = data.login_token ?? data.token;
    if (!loginToken) {
      throw new Error('Voice token missing from server response');
    }

    destroyDevice();

    const rtc = new TelnyxRTC({ login_token: loginToken });
    rtc.remoteElement = 'remoteMedia';
    bindClientEvents(rtc);
    rtc.connect();

    clientRef.current = rtc;
    setClient(rtc);
    scheduleTokenRefresh(loginToken, initDevice);
  }, [bindClientEvents, destroyDevice, scheduleTokenRefresh]);

  const refreshToken = useCallback(async () => {
    await initDevice();
  }, [initDevice]);

  useEffect(() => {
    mountedRef.current = true;
    if (!options.manualInit) {
      void initDevice().catch(() => undefined);
    }
    return () => {
      mountedRef.current = false;
      destroyDevice();
    };
  }, [destroyDevice, initDevice, options.manualInit]);

  const acceptCall = useCallback(() => {
    incomingCall?.answer();
    setActiveCall(incomingCall);
    setIncomingCall(null);
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    incomingCall?.hangup();
    setIncomingCall(null);
  }, [incomingCall]);

  const makeCall = useCallback(async (toNumber: string, callerId?: string) => {
    if (!clientRef.current) {
      throw new Error('Voice service is not ready');
    }

    const call = clientRef.current.newCall({
      destinationNumber: toNumber,
      callerNumber: callerId,
    });
    setActiveCall(call);
    return call;
  }, []);

  const hangup = useCallback(() => {
    activeCall?.hangup();
    incomingCall?.hangup();
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
  }, [activeCall, incomingCall]);

  const toggleMute = useCallback(() => {
    if (!activeCall) return;
    if (isMuted) {
      activeCall.unmuteAudio();
    } else {
      activeCall.muteAudio();
    }
    setIsMuted((value) => !value);
  }, [activeCall, isMuted]);

  return {
    client,
    isReady,
    incomingCall,
    activeCall,
    isMuted,
    voiceError,
    acceptCall,
    rejectCall,
    makeCall,
    hangup,
    toggleMute,
    initDevice,
    refreshToken,
    destroyDevice,
  };
}
