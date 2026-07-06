'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { playInboundRingtone, stopInboundRingtone } from '@/lib/inbound/ringtone';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

export interface ServerInboundRing {
  inboundCallId: string;
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
  return {
    inboundCallId: id,
    providerCallId: (row.provider_call_id as string | null) ?? null,
    fromNumber: rawFrom,
    toNumber: (row.to_number as string | null) ?? null,
    displayFrom: formatInboundCallerDisplay(rawFrom),
    ringStartedAt: Date.now(),
  };
}

/**
 * Server-authoritative inbound ring — fires when inbound_calls is routed to this
 * agent, even if the WebRTC SDK is slow to surface the SIP leg.
 */
export function useInboundServerRing(userId: string | null | undefined) {
  const [ring, setRing] = useState<ServerInboundRing | null>(null);
  const ringRef = useRef<ServerInboundRing | null>(null);
  ringRef.current = ring;

  const clearRing = useCallback((options?: { stopTone?: boolean }) => {
    if (options?.stopTone !== false) {
      stopInboundRingtone();
    }
    setRing(null);
  }, []);

  const loadActiveRing = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('inbound_calls')
      .select('id, provider_call_id, from_number, to_number, status, started_at')
      .eq('routed_agent_id', userId)
      .eq('status', 'ringing')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      const mapped = mapRow(data as Record<string, unknown>);
      if (mapped) {
        setRing(mapped);
        playInboundRingtone();
        return;
      }
    }
    clearRing();
  }, [clearRing, userId]);

  useEffect(() => {
    if (!userId) {
      clearRing();
      return;
    }

    void loadActiveRing();

    const supabase = createClient();
    const channel = supabase
      .channel(`server-inbound-ring-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inbound_calls',
          filter: `routed_agent_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
          if (!row?.id) return;

          if (payload.eventType === 'DELETE' || row.status !== 'ringing') {
            if (ringRef.current?.inboundCallId === row.id) {
              clearRing();
            }
            return;
          }

          const mapped = mapRow(row);
          if (!mapped) return;

          setRing(mapped);
          playInboundRingtone();
        },
      )
      .subscribe();

    return () => {
      stopInboundRingtone();
      void supabase.removeChannel(channel);
    };
  }, [clearRing, loadActiveRing, userId]);

  // Fallback when Supabase Realtime is not yet enabled on inbound_calls.
  useEffect(() => {
    if (!userId) return;
    const poll = setInterval(() => {
      void loadActiveRing();
    }, 2500);
    return () => clearInterval(poll);
  }, [loadActiveRing, userId]);

  return { serverRing: ring, clearServerRing: clearRing, refreshServerRing: loadActiveRing };
}
