'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CallRealtimeOptions {
  userId: string | null;
  onCallUpdate?: (payload: { id: string; status: string; telnyx_call_id?: string }) => void;
  onLeadUpdate?: (payload: { id: string }) => void;
}

export function useCallRealtime({ userId, onCallUpdate, onLeadUpdate }: CallRealtimeOptions) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const onCallUpdateRef = useRef(onCallUpdate);
  const onLeadUpdateRef = useRef(onLeadUpdate);
  onCallUpdateRef.current = onCallUpdate;
  onLeadUpdateRef.current = onLeadUpdate;

  const subscribe = useCallback(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel(`dialer-${userId}`);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { id: string; status: string; telnyx_call_id?: string };
          onCallUpdateRef.current?.(row);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { id: string };
          onLeadUpdateRef.current?.(row);
        },
      )
      .subscribe();

    channelRef.current = channel;
  }, [userId]);

  useEffect(() => {
    subscribe();
    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscribe]);
}
