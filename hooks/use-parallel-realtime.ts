'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ParallelDialLeg, ParallelDialSession } from '@/lib/parallel-dial/types';

interface UseParallelRealtimeOptions {
  sessionId: string | null;
  enabled: boolean;
  onLegUpdate: (leg: ParallelDialLeg) => void;
  onSessionUpdate?: (session: ParallelDialSession) => void;
}

export function useParallelRealtime({
  sessionId,
  enabled,
  onLegUpdate,
  onSessionUpdate,
}: UseParallelRealtimeOptions) {
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`parallel-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parallel_dial_legs',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            onLegUpdate(payload.new as ParallelDialLeg);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parallel_dial_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && onSessionUpdate) {
            onSessionUpdate(payload.new as ParallelDialSession);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, enabled, onLegUpdate, onSessionUpdate]);
}
