import type { SupabaseClient } from '@supabase/supabase-js';
import { telnyxCallAction } from '@/lib/inbound/telnyx-actions';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RingTimeoutParams {
  callId: string;
  callControlId: string;
  userId: string;
  ringSeconds: number;
  inboundMode: string;
}

/**
 * After ringSeconds, if the inbound call is still ringing:
 * - browser / forward → cascade to voicemail (answer + record)
 * - voicemail / off → no-op (handled at initiation)
 */
export async function processInboundRingTimeout(
  supabase: SupabaseClient,
  params: RingTimeoutParams,
): Promise<void> {
  const { callId, callControlId, userId, ringSeconds, inboundMode } = params;

  if (!['browser', 'forward'].includes(inboundMode)) return;

  await sleep(Math.max(ringSeconds, 10) * 1000);

  const { data: call } = await supabase
    .from('calls')
    .select('id, status, answered_at, direction, telnyx_webrtc_leg_id, telnyx_session_id, telnyx_call_id')
    .eq('id', callId)
    .maybeSingle();

  if (!call || call.direction !== 'inbound') return;
  if (call.answered_at) return;
  if (call.status !== 'ringing') return;

  const hasBrowserLeg = Boolean(
    call.telnyx_webrtc_leg_id
    || (
      call.telnyx_session_id
      && call.telnyx_call_id
      && call.telnyx_session_id !== call.telnyx_call_id
    ),
  );
  if (inboundMode === 'browser' && hasBrowserLeg && ringSeconds < 55) {
    return;
  }

  console.log('[INBOUND] Ring timeout — cascading to voicemail:', callId);

  await telnyxCallAction(callControlId, 'answer');
  await telnyxCallAction(callControlId, 'record_start', {
    format: 'mp3',
    channels: 'single',
    play_beep: true,
  });

  await supabase
    .from('calls')
    .update({
      status: 'voicemail',
      disposition: 'voicemail',
    })
    .eq('id', callId);

  const { data: notifSettings } = await supabase
    .from('user_settings')
    .select('missed_call_notify')
    .eq('user_id', userId)
    .maybeSingle();

  if ((notifSettings?.missed_call_notify as boolean | null) !== false) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'call',
      title: 'Voicemail',
      body: 'An inbound caller was sent to voicemail after no answer',
      metadata: { call_id: callId, event: 'inbound_ring_timeout' },
    }).maybeSingle();
  }
}
