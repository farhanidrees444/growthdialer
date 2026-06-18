'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { toast } from 'sonner';
import { shouldBridgeAutoAnswer } from '@/lib/parallel-dial/auto-answer-flag';

const TOKEN_URL = '/api/twilio/token';
const REGISTER_TIMEOUT_MS = 20_000;
const TOKEN_TTL_MS = 3600 * 1000;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

const TOKEN_ERROR_MESSAGES: Record<string, string> = {
  missing_credentials:
    'Voice credentials are missing on the server. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Vercel, then redeploy.',
  missing_twiml_app:
    'TWILIO_TWIML_APP_SID is not set on the server. Add it in Vercel environment variables, then redeploy.',
};

function decodeJwtExpiryMs(jwt: string): number | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    if (!payload.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export interface UseTwilioDeviceOptions {
  /** When true, skip auto-init on mount (caller will call initDevice). */
  manualInit?: boolean;
  /** Fired after an incoming call is stored (auto-answer may already have run). */
  onIncoming?: (call: Call) => void;
}

export interface UseTwilioDeviceReturn {
  device: Device | null;
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
}

/**
 * Low-level Twilio Voice SDK Device hook.
 * Supabase Realtime inbound broadcast is kept for later cleanup — not wired here.
 */
export function useTwilioDevice(options: UseTwilioDeviceOptions = {}): UseTwilioDeviceReturn {
  const [device, setDevice] = useState<Device | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const outboundDialRef = useRef(false);
  const mountedRef = useRef(true);
  const initAttemptsRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initDeviceRef = useRef<() => Promise<void>>(async () => {});
  const onIncomingRef = useRef(options.onIncoming);
  onIncomingRef.current = options.onIncoming;

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleTokenRefresh = useCallback((jwt: string) => {
    clearRefreshTimer();
    const expMs = decodeJwtExpiryMs(jwt) ?? Date.now() + TOKEN_TTL_MS;
    const refreshAt = Math.max(0, expMs - Date.now() - TOKEN_REFRESH_BUFFER_MS);
    refreshTimerRef.current = setTimeout(() => {
      if (mountedRef.current) void initDeviceRef.current();
    }, refreshAt);
  }, [clearRefreshTimer]);

  const fetchToken = useCallback(async (): Promise<{ token: string; identity?: string } | null> => {
    let res = await fetch(TOKEN_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok && res.status === 405) {
      res = await fetch(TOKEN_URL, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json().catch(() => ({})) as {
      token?: string;
      identity?: string;
      error?: string;
      code?: string;
    };

    if (!res.ok) {
      const msg =
        (data.code && TOKEN_ERROR_MESSAGES[data.code])
        ?? data.error
        ?? `Voice token request failed (${res.status})`;
      setVoiceError(msg);
      toast.error(msg);
      return null;
    }

    if (data.error || !data.token) {
      const msg = data.error ?? 'Voice token missing from server response';
      setVoiceError(msg);
      toast.error(msg);
      return null;
    }

    setVoiceError(null);
    return { token: data.token, identity: data.identity };
  }, []);

  const bindCallRefs = useCallback((call: Call | null, incoming: Call | null) => {
    activeCallRef.current = call;
    incomingCallRef.current = incoming;
    setActiveCall(call);
    setIncomingCall(incoming);
  }, []);

  const initDevice = useCallback(async () => {
    setIsReady(false);

    try {
      const tokenData = await fetchToken();
      if (!tokenData) {
        initAttemptsRef.current += 1;
        if (initAttemptsRef.current < 3) {
          setTimeout(() => { if (mountedRef.current) void initDeviceRef.current(); }, 1200 * initAttemptsRef.current);
        }
        return;
      }

      const existing = deviceRef.current;
      if (existing) {
        try {
          await existing.updateToken(tokenData.token);
          scheduleTokenRefresh(tokenData.token);
          setIsReady(true);
          initAttemptsRef.current = 0;
          return;
        } catch {
          try { existing.destroy(); } catch { /* ignore */ }
          deviceRef.current = null;
        }
      }

      const newDevice = new Device(tokenData.token, {
        codecPreferences: ['pcmu', 'opus'] as Call.Codec[],
        closeProtection: true,
        logLevel: process.env.NODE_ENV === 'development' ? 1 : 0,
      } as ConstructorParameters<typeof Device>[1]);

      deviceRef.current = newDevice;
      setDevice(newDevice);

      newDevice.on('registered', () => {
        initAttemptsRef.current = 0;
        setIsReady(true);
        setVoiceError(null);
      });

      newDevice.on('error', (err: Error) => {
        console.error('[TwilioDevice] device error:', err.message);
        setVoiceError(err.message || 'Voice device error');
        toast.error(err.message || 'Voice connection error');
      });

      newDevice.on('incoming', (call: Call) => {
        if (outboundDialRef.current) {
          try { call.reject(); } catch { /* ignore */ }
          return;
        }

        bindCallRefs(call, call);
        outboundDialRef.current = false;

        if (shouldBridgeAutoAnswer()) {
          try {
            call.accept();
          } catch (err) {
            console.warn('[TwilioDevice] bridge auto-answer failed:', err);
          }
        }

        onIncomingRef.current?.(call);
      });

      const registerTimeout = window.setTimeout(() => {
        if (!deviceRef.current || deviceRef.current !== newDevice) return;
        console.warn('[TwilioDevice] registration timed out');
        setVoiceError('Voice registration timed out — check voice app configuration and network.');
        toast.error('Voice registration timed out');
        try { newDevice.destroy(); } catch { /* ignore */ }
        if (deviceRef.current === newDevice) {
          deviceRef.current = null;
          setDevice(null);
        }
        initAttemptsRef.current += 1;
        if (initAttemptsRef.current < 3) {
          setTimeout(() => { if (mountedRef.current) void initDeviceRef.current(); }, 1200 * initAttemptsRef.current);
        }
      }, REGISTER_TIMEOUT_MS);

      try {
        await newDevice.register();
      } finally {
        window.clearTimeout(registerTimeout);
      }

      scheduleTokenRefresh(tokenData.token);
    } catch (err) {
      console.error('[TwilioDevice] init error:', err);
      initAttemptsRef.current += 1;
      if (initAttemptsRef.current < 3) {
        setTimeout(() => { if (mountedRef.current) void initDeviceRef.current(); }, 1200 * initAttemptsRef.current);
      }
    }
  }, [bindCallRefs, fetchToken, scheduleTokenRefresh]);

  initDeviceRef.current = initDevice;

  const refreshToken = useCallback(async () => {
    const tokenData = await fetchToken();
    if (!tokenData) return;
    const d = deviceRef.current;
    if (d) {
      try {
        await d.updateToken(tokenData.token);
        scheduleTokenRefresh(tokenData.token);
        return;
      } catch {
        /* fall through to full re-init */
      }
    }
    await initDevice();
  }, [fetchToken, initDevice, scheduleTokenRefresh]);

  const acceptCall = useCallback(() => {
    const target = incomingCallRef.current ?? activeCallRef.current;
    if (!target) return;
    try {
      target.accept();
    } catch (err) {
      console.error('[TwilioDevice] accept error:', err);
      toast.error('Could not answer call');
    }
  }, []);

  const rejectCall = useCallback(() => {
    const target = incomingCallRef.current ?? activeCallRef.current;
    if (!target) return;
    try {
      const status = target.status();
      if (status === 'pending' || status === 'ringing') {
        target.reject();
      } else {
        target.disconnect();
      }
    } catch { /* ignore */ }
    bindCallRefs(null, null);
    outboundDialRef.current = false;
    setIsMuted(false);
  }, [bindCallRefs]);

  const hangup = useCallback(() => {
    rejectCall();
  }, [rejectCall]);

  const makeCall = useCallback(async (toNumber: string, callerId?: string): Promise<Call | null> => {
    const d = deviceRef.current;
    if (!d || !isReady) {
      toast.error('Phone not ready');
      return null;
    }

    outboundDialRef.current = true;
    setIsMuted(false);

    try {
      const call = await d.connect({
        params: {
          To: toNumber,
          ...(callerId ? { CallerId: callerId } : {}),
        },
      });
      bindCallRefs(call, null);
      return call;
    } catch (err) {
      outboundDialRef.current = false;
      console.error('[TwilioDevice] connect error:', err);
      toast.error('Could not place call');
      return null;
    }
  }, [bindCallRefs, isReady]);

  const toggleMute = useCallback(() => {
    const target = activeCallRef.current;
    if (!target) return;
    try {
      const next = !isMuted;
      target.mute(next);
      setIsMuted(next);
    } catch (err) {
      console.error('[TwilioDevice] mute error:', err);
    }
  }, [isMuted]);

  useEffect(() => {
    mountedRef.current = true;
    if (!options.manualInit) {
      void initDevice();
    }
    return () => {
      mountedRef.current = false;
      clearRefreshTimer();
      if (deviceRef.current) {
        try { deviceRef.current.destroy(); } catch { /* ignore */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    device,
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
  };
}
