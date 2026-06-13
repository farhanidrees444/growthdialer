import type { SupabaseClient } from '@supabase/supabase-js';

export interface CallEventLogRow {
  call_control_id: string;
  event_type: string;
  received_at: string;
  answer_sent_at?: string | null;
  answer_response_time_ms?: number | null;
  telnyx_status?: string | null;
  error_message?: string | null;
}

/** Fire-and-forget safe — never throws to caller. */
export async function logCallEvent(
  supabase: SupabaseClient,
  row: CallEventLogRow,
): Promise<void> {
  try {
    const { error } = await supabase.from('call_events').insert({
      call_control_id: row.call_control_id,
      event_type: row.event_type,
      received_at: row.received_at,
      answer_sent_at: row.answer_sent_at ?? null,
      answer_response_time_ms: row.answer_response_time_ms ?? null,
      telnyx_status: row.telnyx_status ?? null,
      error_message: row.error_message ?? null,
    });
    if (error) {
      console.warn('[WEBHOOK] call_events insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[WEBHOOK] call_events insert exception:', err);
  }
}
