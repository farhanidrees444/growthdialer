'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TelnyxRTC } from '@telnyx/webrtc';
import type { PhoneStatus } from '@/contexts/webphone-context';

const HEARTBEAT_MS = 25_000;
const TAB_CHANNEL = 'gd-voice-presence';
const HEARTBEAT_URL = '/api/agent-presence/heartbeat';

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

function mapDeviceState(deviceReady: boolean, phoneStatus: PhoneStatus): string | null {
  // Honest gate for the inbound hunt: only claim 'registered' when the WebRTC
  // socket is actually up. Reporting 'registered' on a dead socket makes the
  // server dial a browser that can never answer (21s of dead air -> missed).
  if (!deviceReady) return 'not_registered';
  if (phoneStatus === 'ready') return 'registered';
  if (phoneStatus === 'initializing') return 'registering';
  return null;
}

export interface UseVoicePresenceOptions {
  phoneStatus: PhoneStatus;
  device: TelnyxRTC | null;
  /** True only while the WebRTC socket is actually connected (not just "was ready once"). */
  deviceReady: boolean;
  workspaceId?: string | null;
  enabled?: boolean;
}

export interface UseVoicePresenceReturn {
  /** Another browser tab may be the active voice registration. */
  staleTabWarning: boolean;
}

export function useVoicePresence({
  phoneStatus,
  deviceReady,
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
      device_state: mapDeviceState(deviceReady, phoneStatus),
      tab_id: tabIdRef.current,
      workspace_id: workspaceId ?? null,
    };

    if (presenceStatus === 'offline' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        HEARTBEAT_URL,
        new Blob([JSON.stringify(body)], { type: 'application/json' }),
      );
      return;
    }

    await fetch(HEARTBEAT_URL, {
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
  }, [deviceReady, enabled, phoneStatus, workspaceId]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (phoneStatus !== 'ready' && phoneStatus !== 'initializing') return undefined;

    // Honest presence: 'online' only when the voice socket is actually up.
    // A dead socket reports 'away' so the inbound hunt never dials a browser
    // that cannot answer.
    const presenceStatus = phoneStatus === 'ready' && deviceReady ? 'online' : 'away';
    void sendHeartbeat(presenceStatus);

    const interval = setInterval(() => {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      const current = phoneStatus === 'ready' && deviceReady ? 'online' : 'away';
      void sendHeartbeat(offline ? 'offline' : current);
    }, HEARTBEAT_MS);

    const onVisibility = () => {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      const current = phoneStatus === 'ready' && deviceReady ? 'online' : 'away';
      void sendHeartbeat(offline ? 'offline' : current);
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
  }, [deviceReady, enabled, phoneStatus, sendHeartbeat]);

  return { staleTabWarning };
}
