'use client';

import { useEffect, useRef } from 'react';
import { useWorkspace } from '@/contexts/workspace-context';
import { useSupabaseSession } from '@/lib/supabase/hooks';

const sessionKey = (userId: string) => `gd-voice-prepared:${userId}`;

/**
 * Silently repairs per-account voice routing once per browser session.
 * Ensures each login gets its own numbers on Call Control + WebRTC credential.
 */
export function VoiceAccountBootstrap() {
  const session = useSupabaseSession();
  const userId = session?.user?.id;
  const { apiFetch } = useWorkspace();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!userId || ranRef.current) return;
    if (typeof window === 'undefined') return;

    try {
      if (sessionStorage.getItem(sessionKey(userId)) === '1') return;
    } catch { /* private mode */ }

    ranRef.current = true;

    void apiFetch('/api/voice/prepare', { method: 'POST' })
      .then((res) => res.json())
      .then((data: { primary_routed?: boolean; credential_ready?: boolean }) => {
        if (data.primary_routed && data.credential_ready) {
          try { sessionStorage.setItem(sessionKey(userId), '1'); } catch { /* ignore */ }
        }
        window.dispatchEvent(new CustomEvent('gd-voice-account-prepared', { detail: data }));
      })
      .catch(() => { /* non-fatal — health panel can retry */ });
  }, [userId, apiFetch]);

  return null;
}
