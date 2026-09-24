'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = window.atob(raw);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) out[i] = bytes.charCodeAt(i);
  return out;
}

/**
 * Opt-in toggle for inbound-call push notifications. Subscribes this
 * browser via the Web Push API (service worker at /sw.js) and stores the
 * subscription server-side so the cloud hunt can notify the agent even when
 * the tab is closed.
 */
export function PushNotificationToggle() {
  const { isDark } = useSiteTheme();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const ok = typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'PushManager' in window
      && 'Notification' in window;
    setSupported(ok);
    if (!ok) return;
    if (Notification.permission === 'denied') setBlocked(true);
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setEnabled(!!sub);
      })
      .catch(() => undefined);
  }, []);

  const toggle = useCallback(async () => {
    if (busy || blocked) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const existing = await reg.pushManager.getSubscription();

      if (existing) {
        await existing.unsubscribe().catch(() => undefined);
        await fetch('/api/push/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        }).catch(() => undefined);
        setEnabled(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        setBlocked(true);
        return;
      }
      if (permission !== 'granted') return;

      const keyRes = await fetch('/api/push/public-key').catch(() => null);
      const { publicKey } = ((await keyRes?.json().catch(() => ({}))) ?? {}) as {
        publicKey?: string | null;
      };
      if (!publicKey) {
        setUnavailable(true);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });
      const saveRes = await fetch('/api/push/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      }).catch(() => null);
      if (!saveRes?.ok) {
        await sub.unsubscribe().catch(() => undefined);
        return;
      }
      setEnabled(true);
    } finally {
      setBusy(false);
    }
  }, [busy, blocked]);

  if (!supported) return null;

  const label = unavailable
    ? 'Alerts unavailable'
    : blocked
      ? 'Alerts blocked'
      : enabled
        ? 'Call alerts on'
        : 'Call alerts off';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || blocked || unavailable}
      title={
        blocked
          ? 'Notifications are blocked for this site — allow them in your browser settings to get call alerts.'
          : unavailable
            ? 'Push alerts are not configured on the server yet.'
            : enabled
              ? 'Turn off inbound-call push alerts on this device'
              : 'Get a push alert for inbound calls, even with this tab closed'
      }
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition',
        enabled
          ? isDark
            ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
            : 'border-cyan-600/30 bg-cyan-600/10 text-cyan-700'
          : 'border-white/[0.08] bg-white/[0.03] text-muted-foreground',
        !(busy || blocked || unavailable) && (isDark ? 'hover:text-white' : 'hover:text-zinc-900'),
        (busy || blocked || unavailable) && 'cursor-not-allowed opacity-60',
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : enabled ? (
        <Bell className="h-3.5 w-3.5" />
      ) : (
        <BellOff className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}
