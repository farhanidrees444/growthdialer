import type { SupabaseClient } from '@supabase/supabase-js';
import { logCallEvent } from '@/lib/webhooks/log-call-event';

export type InboundCallStep =
  | 'ringing'
  | 'connecting'
  | 'active'
  | 'ended'
  | 'missed'
  | 'declined'
  | 'leg_a_answered'
  | 'leg_a_playback_started'
  | 'leg_a_playback_stopped'
  | 'agent_notified'
  | 'agent_accepted'
  | 'agent_declined'
  | 'leg_b_dialed'
  | 'leg_b_answered'
  | 'call_bridged'
  | 'ring_timeout';

export async function logInboundCallStep(
  supabase: SupabaseClient,
  callControlId: string,
  step: InboundCallStep,
  extra?: { error_message?: string | null; telnyx_status?: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  await logCallEvent(supabase, {
    call_control_id: callControlId,
    event_type: step,
    received_at: now,
    telnyx_status: extra?.telnyx_status ?? 'ok',
    error_message: extra?.error_message ?? null,
  });
}
