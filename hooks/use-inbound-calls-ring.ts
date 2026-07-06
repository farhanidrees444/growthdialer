'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { playInboundRingtone, stopInboundRingtone } from '@/lib/inbound/ringtone';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

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

/** Server-authoritative inbound ring from `calls` (direction=inbound, status=ringing). */
export function useInboundCallsRing(userId: string | null | undefined) {
  const [ring, setRing] = useState<ServerInboundRing | null>(null);
  const ringRef = useRef<ServerInboundRing | null>(null);
  ringRef.current = ring;

  const clearRing = useCallback((options?: { stopTone?: boolean }) => {
    if (options?.stopTone !== false) {
      stopInboundRingtone();
    }
    setRing(null);
  }, []);

  const applyRing = useCallback((mapped: ServerInboundRing | null) => {
    if (mapped) {
      setRing(mapped);
      playInboundRingtone();
      return;
    }
    clearRing();
  }, [clearRing]);

  const loadActiveRing = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch('/api/inbound/ringing', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json() as { call?: Record<string, unknown> | null };
      if (data.call) {
        const mapped = mapRow(data.call);
        applyRing(mapped);
        return;
      }
    } catch {
      // fall through to direct query
    }

    const supabase = createClient();
    const { data } = await supabase
      .from('calls')
      .select('id, telnyx_session_id, telnyx_call_id, from_number, to_number, status, started_at')
      .eq('user_id', userId)
      .eq('direction', 'inbound')
      .eq('status', 'ringing')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      applyRing(mapRow(data as Record<string, unknown>));
      return;
    }
    clearRing();
  }, [applyRing, clearRing, userId]);

  useEffect(() => {
    if (!userId) {
      clearRing();
      return;
    }

    void loadActiveRing();

    const supabase = createClient();
    const channel = supabase
      .channel(`inbound-calls-ring-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
          if (!row?.id) return;
          if (row.direction !== 'inbound') return;

          if (payload.eventType === 'DELETE' || row.status !== 'ringing') {
            if (ringRef.current?.callId === row.id) {
              clearRing();
            }
            return;
          }

          const mapped = mapRow(row);
          if (!mapped) return;
          applyRing(mapped);
        },
      )
      .subscribe();

    return () => {
      stopInboundRingtone();
      void supabase.removeChannel(channel);
    };
  }, [applyRing, clearRing, loadActiveRing, userId]);

  useEffect(() => {
    if (!userId) return;
    const poll = setInterval(() => {
      void loadActiveRing();
    }, 2000);
    return () => clearInterval(poll);
  }, [loadActiveRing, userId]);

  return { serverRing: ring, clearServerRing: clearRing, refreshServerRing: loadActiveRing };
}
