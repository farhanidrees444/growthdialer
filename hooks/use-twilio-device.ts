'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { toast } from 'sonner';
import { shouldBridgeAutoAnswer } from '@/lib/parallel-dial/auto-answer-flag';

const TOKEN_URL = '/api/twilio/token';
const REGISTER_TIMEOUT_MS = 25_000;
const TOKEN_TTL_MS = 3600 * 1000;
const TOKEN_REFRESH_RATIO = 0.75; // refresh at ~75% of TTL elapsed

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

function readTwilioEdge(): string | undefined {
  const edge = process.env.NEXT_PUBLIC_TWILIO_EDGE?.trim();
  return edge || undefined;
}

function isTransportError(err: Error): boolean {
  const msg = err.message ?? '';
  return msg.includes('31009') || msg.toLowerCase().includes('transport');
}

export interface UseTwilioDeviceOptions {
  /** When true, skip auto-init on mount — parent calls initDevice once. */
  manualInit?: boolean;
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
  destroyDevice: () => void;
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
  const isReadyRef = useRef(false);
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const outboundDialRef = useRef(false);
  const mountedRef = useRef(true);
  const initAttemptsRef = useRef(0);
  const initInFlightRef = useRef<Promise<void> | null>(null);
  const registerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initDeviceRef = useRef<() => Promise<void>>(async () => {});
  const onIncomingRef = useRef(options.onIncoming);
  onIncomingRef.current = options.onIncoming;

  const clearRegisterTimeout = useCallback(() => {
    if (registerTimeoutRef.current) {
      clearTimeout(registerTimeoutRef.current);
      registerTimeoutRef.current = null;
    }
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const setReady = useCallback((ready: boolean) => {
    isReadyRef.current = ready;
    if (mountedRef.current) setIsReady(ready);
  }, []);

  const scheduleTokenRefresh = useCallback((jwt: string) => {
    clearRefreshTimer();
    const expMs = decodeJwtExpiryMs(jwt) ?? Date.now() + TOKEN_TTL_MS;
    const ttlRemaining = expMs - Date.now();
    const refreshAt = Math.max(15_000, ttlRemaining * TOKEN_REFRESH_RATIO);
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
      session_meta?: Record<string, string>;
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
    if (data.session_meta) {
      try {
        sessionStorage.setItem('gd_voice_session_meta', JSON.stringify(data.session_meta));
      } catch { /* ignore */ }
    }
    return { token: data.token, identity: data.identity };
  }, []);

  const bindCallRefs = useCallback((call: Call | null, incoming: Call | null) => {
    activeCallRef.current = call;
    incomingCallRef.current = incoming;
    setActiveCall(call);
    setIncomingCall(incoming);
  }, []);

  const destroyDevice = useCallback(() => {
    clearRegisterTimeout();
    clearRefreshTimer();
    setReady(false);
    const d = deviceRef.current;
    deviceRef.current = null;
    if (d) {
      try { d.destroy(); } catch { /* ignore */ }
    }
    if (mountedRef.current) setDevice(null);
  }, [clearRegisterTimeout, clearRefreshTimer, setReady]);

  const initDevice = useCallback(async () => {
    if (initInFlightRef.current) {
      await initInFlightRef.current;
      return;
    }

    const run = async () => {
      setReady(false);

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
            if (existing.state === Device.State.Unregistered) {
              await existing.register();
            }
            scheduleTokenRefresh(tokenData.token);
            setReady(true);
            initAttemptsRef.current = 0;
            return;
          } catch {
            destroyDevice();
          }
        }

        const edge = readTwilioEdge();
        const newDevice = new Device(tokenData.token, {
          codecPreferences: ['pcmu', 'opus'] as Call.Codec[],
          closeProtection: true,
          allowIncomingWhileBusy: true,
          logLevel: process.env.NODE_ENV === 'development' ? 1 : 0,
          ...(edge ? { edge } : {}),
        } as ConstructorParameters<typeof Device>[1]);

        deviceRef.current = newDevice;
        if (mountedRef.current) setDevice(newDevice);

        newDevice.on('registered', () => {
          clearRegisterTimeout();
          initAttemptsRef.current = 0;
          setReady(true);
          setVoiceError(null);
        });

        newDevice.on('unregistered', () => {
          setReady(false);
        });

        newDevice.on('error', (err: Error) => {
          console.error('[TwilioDevice] device error:', err.message);
          setVoiceError(err.message || 'Voice device error');

          if (isTransportError(err)) {
            initAttemptsRef.current += 1;
            if (initAttemptsRef.current <= 3) {
              setTimeout(() => { if (mountedRef.current) void initDeviceRef.current(); }, 1500 * initAttemptsRef.current);
            } else {
              toast.error('Voice connection lost — tap reconnect in the dialer header.');
            }
            return;
          }

          toast.error(err.message || 'Voice connection error');
        });

        newDevice.on('incoming', (call: Call) => {
          console.log('[TwilioDevice] INCOMING FIRED', Date.now(), {
            sid: call.parameters?.CallSid ?? null,
            status: call.status?.() ?? null,
            direction: call.direction ?? null,
            deviceState: newDevice.state,
          });

          if (outboundDialRef.current) {
            try { call.reject(); } catch { /* ignore */ }
            return;
          }

          bindCallRefs(call, call);
          outboundDialRef.current = false;

          onIncomingRef.current?.(call);

          if (shouldBridgeAutoAnswer()) {
            try {
              call.accept();
            } catch (err) {
              console.warn('[TwilioDevice] bridge auto-answer failed:', err);
            }
          }
        });

        registerTimeoutRef.current = setTimeout(() => {
          if (!deviceRef.current || deviceRef.current !== newDevice) return;
          if (isReadyRef.current) return;
          console.warn('[TwilioDevice] registration timed out');
          setVoiceError('Voice registration timed out — check voice app URL and network.');
          toast.error('Voice registration timed out');
          destroyDevice();
          initAttemptsRef.current += 1;
          if (initAttemptsRef.current < 3) {
            setTimeout(() => { if (mountedRef.current) void initDeviceRef.current(); }, 1500 * initAttemptsRef.current);
          }
        }, REGISTER_TIMEOUT_MS);

        await newDevice.register();
        scheduleTokenRefresh(tokenData.token);

        if (newDevice.state === Device.State.Registered) {
          clearRegisterTimeout();
          setReady(true);
        }
      } catch (err) {
        console.error('[TwilioDevice] init error:', err);
        initAttemptsRef.current += 1;
        if (initAttemptsRef.current < 3) {
          setTimeout(() => { if (mountedRef.current) void initDeviceRef.current(); }, 1500 * initAttemptsRef.current);
        }
      }
    };

    initInFlightRef.current = run().finally(() => {
      initInFlightRef.current = null;
    });
    await initInFlightRef.current;
  }, [bindCallRefs, clearRegisterTimeout, destroyDevice, fetchToken, scheduleTokenRefresh, setReady]);

  initDeviceRef.current = initDevice;

  const refreshToken = useCallback(async () => {
    const tokenData = await fetchToken();
    if (!tokenData) return;
    const d = deviceRef.current;
    if (d) {
      try {
        await d.updateToken(tokenData.token);
        scheduleTokenRefresh(tokenData.token);
        if (d.state === Device.State.Unregistered) {
          await d.register();
        }
        setReady(d.state === Device.State.Registered);
        return;
      } catch {
        /* fall through to full re-init */
      }
    }
    await initDevice();
  }, [fetchToken, initDevice, scheduleTokenRefresh, setReady]);

  const waitUntilReady = useCallback(async (timeoutMs = 12_000): Promise<boolean> => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const d = deviceRef.current;
      if (d && isReadyRef.current && d.state === Device.State.Registered) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }, []);

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
    const ready = await waitUntilReady();
    const d = deviceRef.current;
    if (!ready || !d) {
      toast.error('Phone not ready — wait for Live status or tap reconnect');
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
      const msg = err instanceof Error ? err.message : 'Could not place call';
      if (isTransportError(err instanceof Error ? err : new Error(msg))) {
        toast.error('Voice link dropped — reconnecting…');
        void initDeviceRef.current();
      } else {
        toast.error('Could not place call');
      }
      return null;
    }
  }, [bindCallRefs, waitUntilReady]);

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
      if (!options.manualInit) {
        destroyDevice();
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
    destroyDevice,
  };
}
