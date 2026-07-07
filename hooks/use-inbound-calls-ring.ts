'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { playInboundRingtone, stopInboundRingtone } from '@/lib/inbound/ringtone';
import { formatInboundCallerDisplay, normalizeE164 } from '@/lib/inbound/phone';

export interface ServerInboundRing {
  callId: string;
  telnyxSessionId: string | null;
  providerCallId: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  displayFrom: string;
  ringStartedAt: number;
}

function mapRow(row: Record<string, unknown>): ServerInboundRing | null {
  const id = row.id as string | undefined;
  const status = row.status as string | undefined;
  if (!id || status !== 'ringing') return null;

  const rawFrom = (row.from_number as string | null) ?? null;
  const startedAt = row.started_at as string | undefined;
  return {
    callId: id,
    telnyxSessionId: (row.telnyx_session_id as string | null) ?? null,
    providerCallId: (row.telnyx_call_id as string | null) ?? null,
    fromNumber: rawFrom,
    toNumber: (row.to_number as string | null) ?? null,
    displayFrom: formatInboundCallerDisplay(rawFrom),
    ringStartedAt: startedAt ? new Date(startedAt).getTime() : Date.now(),
  };
}

function dispatchInboundRingEvent(ring: ServerInboundRing | null) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('gd-inbound-server-ring', { detail: ring }),
  );
}

/** Server-authoritative inbound ring from `calls` (direction=inbound, status=ringing). */
export function useInboundCallsRing(userId: string | null | undefined) {
  const [ring, setRing] = useState<ServerInboundRing | null>(null);
  const ringRef = useRef<ServerInboundRing | null>(null);
  const missPollsRef = useRef(0);
  const ownedDidsRef = useRef<Set<string>>(new Set());
  ringRef.current = ring;

  const clearRing = useCallback((options?: { stopTone?: boolean }) => {
    if (options?.stopTone !== false) {
      stopInboundRingtone();
    }
    missPollsRef.current = 0;
    setRing(null);
    dispatchInboundRingEvent(null);
  }, []);

  const applyRing = useCallback((mapped: ServerInboundRing | null) => {
    if (mapped) {
      missPollsRef.current = 0;
      const same =
        ringRef.current?.callId === mapped.callId
        && ringRef.current?.telnyxSessionId === mapped.telnyxSessionId;
      if (!same) {
        console.log('[INBOUND-POPUP-TRIGGER] showing popup for', mapped.telnyxSessionId);
        setRing(mapped);
        playInboundRingtone();
        dispatchInboundRingEvent(mapped);
      }
      return;
    }

    if (!ringRef.current) {
      missPollsRef.current = 0;
      return;
    }

    missPollsRef.current += 1;
    if (missPollsRef.current >= 3) {
      clearRing();
    }
  }, [clearRing]);

  const loadOwnedDids = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('purchased_numbers')
      .select('phone_number')
      .eq('user_id', userId)
      .neq('status', 'released');

    const variants = new Set<string>();
    for (const row of data ?? []) {
      const raw = row.phone_number as string | undefined;
      if (!raw) continue;
      const e164 = normalizeE164(raw);
      if (e164) variants.add(e164);
      variants.add(raw);
    }
    ownedDidsRef.current = variants;
  }, [userId]);

  const rowTargetsUser = useCallback((row: Record<string, unknown>) => {
    const assignedUserId = row.user_id as string | undefined;
    if (assignedUserId && assignedUserId === userId) return true;
    const toNumber = row.to_number as string | undefined;
    if (!toNumber) return false;
    if (ownedDidsRef.current.has(toNumber)) return true;
    const e164 = normalizeE164(toNumber);
    return Boolean(e164 && ownedDidsRef.current.has(e164));
  }, [userId]);

  const handleRealtimeRow = useCallback((row: Record<string, unknown> | undefined) => {
    if (!row?.id) return;
    if (row.direction !== 'inbound') return;

    if (row.status !== 'ringing') {
      if (ringRef.current?.callId === row.id) {
        clearRing();
      }
      return;
    }

    if (!rowTargetsUser(row)) return;
    const mapped = mapRow(row);
    if (!mapped) return;
    applyRing(mapped);
  }, [applyRing, clearRing, rowTargetsUser]);

  const loadActiveRing = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch('/api/inbound/ringing', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json() as { call?: Record<string, unknown> | null };
      if (data.call) {
        applyRing(mapRow(data.call));
        return;
      }
      applyRing(null);
    } catch {
      // Keep current ring on transient network errors.
    }
  }, [applyRing, userId]);

  useEffect(() => {
    if (!userId) {
      clearRing();
      return;
    }

    void loadOwnedDids().then(() => loadActiveRing());

    const supabase = createClient();
    const channel = supabase
      .channel(`inbound-calls-ring-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: 'direction=eq.inbound',
        },
        (payload) => {
          handleRealtimeRow(payload.new as Record<string, unknown> | undefined);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: 'direction=eq.inbound',
        },
        (payload) => {
          handleRealtimeRow((payload.new ?? payload.old) as Record<string, unknown> | undefined);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void loadActiveRing();
        }
      });

    return () => {
      stopInboundRingtone();
      void supabase.removeChannel(channel);
    };
  }, [clearRing, handleRealtimeRow, loadActiveRing, loadOwnedDids, userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const pollMs = ringRef.current ? 500 : 1000;
    const poll = setInterval(() => {
      void loadActiveRing();
    }, pollMs);

    return () => clearInterval(poll);
  }, [loadActiveRing, ring, userId]);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void loadActiveRing();
      }
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [loadActiveRing, userId]);

  return { serverRing: ring, clearServerRing: clearRing, refreshServerRing: loadActiveRing };
}
