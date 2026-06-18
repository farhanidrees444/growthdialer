'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Call } from '@twilio/voice-sdk';
import { Device } from '@twilio/voice-sdk';
import { toast } from 'sonner';
import {
  callOrchestrator,
  initCalls,
  type CallOrchestratorSnapshot,
} from '@/src/calls';
import { eventBus } from '@/src/calls/eventBus';

const TOKEN_URL = '/api/twilio/token';
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
    return payload.exp ? payload.exp * 1000 : null;
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

export function useTwilioDevice(options: UseTwilioDeviceOptions = {}): UseTwilioDeviceReturn {
  const [snapshot, setSnapshot] = useState<CallOrchestratorSnapshot>(() => callOrchestrator.getSnapshot());
  const [voiceError, setVoiceError] = useState<string | null>(snapshot.voiceError);

  const mountedRef = useRef(true);
  const initAttemptsRef = useRef(0);
  const initInFlightRef = useRef<Promise<void> | null>(null);
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

  const syncSnapshot = useCallback((next = callOrchestrator.getSnapshot()) => {
    if (!mountedRef.current) return;
    setSnapshot(next);
    setVoiceError(next.voiceError);
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

    if (data.session_meta) {
      try {
        sessionStorage.setItem('gd_voice_session_meta', JSON.stringify(data.session_meta));
      } catch {
        // Ignore storage failures.
      }
    }

    setVoiceError(null);
    return { token: data.token, identity: data.identity };
  }, []);

  const initDevice = useCallback(async () => {
    if (initInFlightRef.current) {
      await initInFlightRef.current;
      return;
    }

    initInFlightRef.current = (async () => {
      const tokenData = await fetchToken();
      if (!tokenData) {
        initAttemptsRef.current += 1;
        if (initAttemptsRef.current < 3) {
          setTimeout(() => {
            if (mountedRef.current) void initDeviceRef.current();
          }, 1200 * initAttemptsRef.current);
        }
        return;
      }

      try {
        await initCalls(tokenData.token, {
          edge: readTwilioEdge(),
          logLevel: process.env.NODE_ENV === 'development' ? 1 : 0,
        });
        scheduleTokenRefresh(tokenData.token);
        initAttemptsRef.current = 0;
        syncSnapshot();
      } catch (error) {
        initAttemptsRef.current += 1;
        const msg = error instanceof Error ? error.message : 'Voice device could not register';
        setVoiceError(msg);
        if (initAttemptsRef.current < 3) {
          setTimeout(() => {
            if (mountedRef.current) void initDeviceRef.current();
          }, 1500 * initAttemptsRef.current);
        }
      }
    })().finally(() => {
      initInFlightRef.current = null;
    });

    await initInFlightRef.current;
  }, [fetchToken, scheduleTokenRefresh, syncSnapshot]);

  initDeviceRef.current = initDevice;

  const refreshToken = useCallback(async () => {
    await initDevice();
  }, [initDevice]);

  const acceptCall = useCallback(() => {
    void callOrchestrator.acceptIncoming();
  }, []);

  const rejectCall = useCallback(() => {
    callOrchestrator.rejectIncoming();
    syncSnapshot();
  }, [syncSnapshot]);

  const hangup = useCallback(() => {
    callOrchestrator.hangup();
    syncSnapshot();
  }, [syncSnapshot]);

  const makeCall = useCallback(async (toNumber: string, callerId?: string): Promise<Call | null> => {
    try {
      const call = await callOrchestrator.makeCall(toNumber, callerId);
      syncSnapshot();
      return call;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not place call';
      if (isTransportError(error instanceof Error ? error : new Error(msg))) {
        toast.error('Voice link dropped — reconnecting...');
        void initDeviceRef.current();
      } else {
        toast.error('Could not place call');
      }
      return null;
    }
  }, [syncSnapshot]);

  const toggleMute = useCallback(() => {
    callOrchestrator.toggleMute();
    syncSnapshot();
  }, [syncSnapshot]);

  const destroyDevice = useCallback(() => {
    clearRefreshTimer();
    callOrchestrator.destroy();
    syncSnapshot();
  }, [clearRefreshTimer, syncSnapshot]);

  useEffect(() => {
    mountedRef.current = true;
    const offSnapshot = eventBus.on<CallOrchestratorSnapshot>('CALL_SNAPSHOT', syncSnapshot);
    const offIncoming = eventBus.on<Call>('CALL_INCOMING', (call) => {
      onIncomingRef.current?.(call);
    });
    const offError = eventBus.on<Error>('DEVICE_ERROR', (error) => {
      setVoiceError(error.message || 'Voice device error');
      if (isTransportError(error)) {
        void initDeviceRef.current();
      }
    });

    syncSnapshot();
    if (!options.manualInit) {
      void initDevice();
    }

    return () => {
      mountedRef.current = false;
      offSnapshot();
      offIncoming();
      offError();
      if (!options.manualInit) {
        destroyDevice();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    device: snapshot.device,
    isReady: snapshot.isReady,
    incomingCall: snapshot.incomingCall,
    activeCall: snapshot.activeCall,
    isMuted: snapshot.isMuted,
    voiceError: voiceError ?? snapshot.voiceError,
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
