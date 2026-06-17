import type { SupabaseClient } from '@supabase/supabase-js';
import { voiceLog } from '@/lib/voice/structured-log';
import { voiceServerLog } from '@/lib/debug/voice-server-log';

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

export interface BroadcastSendResult {
  ok: boolean;
  status: 'sent' | 'channel_error' | 'timeout' | 'subscribe_failed';
  durationMs: number;
}

/** Server-side Realtime broadcast to agent dashboard (best-effort). */
export async function broadcastIncomingCallEvent(
  supabase: SupabaseClient,
  userId: string,
  event: IncomingCallsBroadcastEvent,
  payload: IncomingCallBroadcastPayload,
): Promise<void> {
  const chName = channelName(userId);
  const startMs = Date.now();

  console.log(`[BROADCAST] Starting ${event} → userId=${userId} | channel=${chName} | control=${payload.call_control_id}`);

  try {
    const channel = supabase.channel(chName);

    await new Promise<void>((resolve) => {
      let settled = false;

      const done = (status: BroadcastSendResult['status']) => {
        if (settled) return;
        settled = true;
        const durationMs = Date.now() - startMs;
        void supabase.removeChannel(channel);

        const ok = status === 'sent';
        void voiceLog[ok ? 'info' : 'error'](
          {
            service: 'inbound-broadcast',
            event,
            user_id: userId,
            channel: chName,
            call_control_id: payload.call_control_id,
            call_id: payload.call_id,
            broadcast_status: status,
            duration_ms: durationMs,
          },
          ok
            ? `Realtime broadcast sent: ${event}`
            : `Realtime broadcast failed: ${event} (${status})`,
        );

        void voiceServerLog({
          location: 'incoming-calls-broadcast',
          message: `broadcast ${status === 'sent' ? 'sent' : 'failed'} (${status})`,
          data: {
            userId,
            channel: chName,
            event,
            callId: payload.call_id ?? null,
            callControlId: payload.call_control_id,
            durationMs,
          },
          hypothesisId: 'H-M',
          runId: 'run11',
        });

        resolve();
      };

      const timer = setTimeout(() => {
        console.warn(`[BROADCAST] Timeout after ${BROADCAST_WAIT_MS}ms | event=${event} | channel=${chName}`);
        done('timeout');
      }, BROADCAST_WAIT_MS);

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[BROADCAST] Subscribed → sending ${event} | channel=${chName}`);
          void channel
            .send({ type: 'broadcast', event, payload })
            .then(() => {
              clearTimeout(timer);
              console.log(`[BROADCAST] Sent ${event} | channel=${chName} | duration=${Date.now() - startMs}ms`);
              done('sent');
            })
            .catch((sendErr: unknown) => {
              clearTimeout(timer);
              const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
              console.error(`[BROADCAST] Send failed: ${event} | channel=${chName} | error=${msg}`);
              done('channel_error');
            });
        }
        if (status === 'CHANNEL_ERROR') {
          clearTimeout(timer);
          console.error(`[BROADCAST] CHANNEL_ERROR | event=${event} | channel=${chName}`);
          done('channel_error');
        }
        if (status === 'TIMED_OUT') {
          clearTimeout(timer);
          console.warn(`[BROADCAST] TIMED_OUT (Supabase) | event=${event} | channel=${chName}`);
          done('timeout');
        }
        if (status === 'CLOSED' && !settled) {
          clearTimeout(timer);
          console.warn(`[BROADCAST] CLOSED before send | event=${event} | channel=${chName}`);
          done('subscribe_failed');
        }
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[BROADCAST] Exception: ${event} | channel=${chName} | error=${msg}`);
    void voiceLog.error(
      {
        service: 'inbound-broadcast',
        event,
        user_id: userId,
        channel: chName,
        call_control_id: payload.call_control_id,
        error: msg,
      },
      `Realtime broadcast exception: ${event}`,
    );
  }
}
