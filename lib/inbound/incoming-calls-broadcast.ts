import type { SupabaseClient } from '@supabase/supabase-js';

export type IncomingCallsBroadcastEvent =
  | 'incoming_call'
  | 'call_connecting'
  | 'call_active'
  | 'call_missed'
  | 'call_declined'
  | 'call_cleared';

export interface IncomingCallBroadcastPayload {
  call_control_id: string;
  caller_number: string | null;
  call_id?: string;
  to_number?: string | null;
  status?: string;
  timestamp: string;
}

const BROADCAST_WAIT_MS = 4000;

function channelName(userId: string): string {
  return `incoming-calls:${userId}`;
}

/** Server-side Realtime broadcast to agent dashboard (best-effort). */
export async function broadcastIncomingCallEvent(
  supabase: SupabaseClient,
  userId: string,
  event: IncomingCallsBroadcastEvent,
  payload: IncomingCallBroadcastPayload,
): Promise<void> {
  const channel = supabase.channel(channelName(userId));

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      void supabase.removeChannel(channel);
      resolve();
    }, BROADCAST_WAIT_MS);

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel
          .send({ type: 'broadcast', event, payload })
          .finally(() => {
            clearTimeout(timer);
            void supabase.removeChannel(channel);
            resolve();
          });
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer);
        void supabase.removeChannel(channel);
        resolve();
      }
    });
  });
}
