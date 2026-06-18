'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Device } from '@twilio/voice-sdk';
import type { PhoneStatus } from '@/contexts/webphone-context';

const HEARTBEAT_MS = 25_000;
const TAB_CHANNEL = 'gd-voice-presence';

function getOrCreateTabId(): string {
  if (typeof window === 'undefined') return 'server';
  const key = 'gd_voice_tab_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function mapPhoneStatus(status: PhoneStatus): 'idle' | 'initializing' | 'ready' | 'error' | 'offline' {
  return status;
}

function mapDeviceState(device: Device | null): string | null {
  if (!device) return null;
  try {
    return device.state ?? null;
  } catch {
    return null;
  }
}

export interface UseVoicePresenceOptions {
  phoneStatus: PhoneStatus;
  device: Device | null;
  workspaceId?: string | null;
  enabled?: boolean;
}

export interface UseVoicePresenceReturn {
  /** Another browser tab may be the active voice registration. */
  staleTabWarning: boolean;
}

export function useVoicePresence({
  phoneStatus,
  device,
  workspaceId,
  enabled = true,
}: UseVoicePresenceOptions): UseVoicePresenceReturn {
  const tabIdRef = useRef(getOrCreateTabId());
  const [staleTabWarning, setStaleTabWarning] = useState(false);

  const sendHeartbeat = useCallback(async (presenceStatus: 'online' | 'away' | 'offline') => {
    if (!enabled) return;

    const payload = JSON.stringify({
      tab_id: tabIdRef.current,
      ts: Date.now(),
    });

    const body = {
      presence_status: presenceStatus,
      phone_status: mapPhoneStatus(phoneStatus),
      device_state: mapDeviceState(device),
      tab_id: tabIdRef.current,
      workspace_id: workspaceId ?? null,
    };

    if (presenceStatus === 'offline' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/voice/presence/heartbeat',
        new Blob([JSON.stringify(body)], { type: 'application/json' }),
      );
      return;
    }

    await fetch('/api/voice/presence/heartbeat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});

    try {
      const bc = new BroadcastChannel(TAB_CHANNEL);
      bc.postMessage(payload);
      bc.close();
    } catch { /* unsupported */ }
  }, [device, enabled, phoneStatus, workspaceId]);

  useEffect(() => {
    if (!enabled || phoneStatus !== 'ready') return undefined;

    void sendHeartbeat('online');

    const interval = setInterval(() => {
      const away = typeof document !== 'undefined' && document.visibilityState === 'hidden';
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      void sendHeartbeat(offline ? 'offline' : away ? 'away' : 'online');
    }, HEARTBEAT_MS);

    const onVisibility = () => {
      const away = document.visibilityState === 'hidden';
      void sendHeartbeat(away ? 'away' : 'online');
    };

    const onOnline = () => { void sendHeartbeat('online'); };
    const onOffline = () => { void sendHeartbeat('offline'); };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(TAB_CHANNEL);
      bc.onmessage = (ev: MessageEvent) => {
        try {
          const data = JSON.parse(String(ev.data)) as { tab_id?: string; ts?: number };
          if (data.tab_id && data.tab_id !== tabIdRef.current) {
            setStaleTabWarning(true);
          }
        } catch { /* ignore */ }
      };
    } catch { /* unsupported */ }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      void sendHeartbeat('offline');
      bc?.close();
    };
  }, [enabled, phoneStatus, sendHeartbeat]);

  return { staleTabWarning };
}
