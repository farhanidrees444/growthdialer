import type { SupabaseClient } from '@supabase/supabase-js';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';

export type CallRecordingFormat = 'mp3' | 'wav';
export type CallRecordingChannels = 'single' | 'dual';

export interface StartRecordingOptions {
  format?: CallRecordingFormat;
  channels?: CallRecordingChannels;
  playBeep?: boolean;
}

export interface RecordableCallLegs {
  telnyx_call_id?: string | null;
  telnyx_webrtc_leg_id?: string | null;
}

/** Pick the leg that carries both parties (PSTN/prospect) over internal WebRTC bridge legs. */
export function resolveRecordableControlId(
  call: RecordableCallLegs,
  webhookControlId?: string | null,
): string | null {
  const pstn = call.telnyx_call_id?.trim() || null;
  const webrtc = call.telnyx_webrtc_leg_id?.trim() || null;
  const webhook = webhookControlId?.trim() || null;

  if (webhook && pstn && webrtc && webhook === webrtc && pstn !== webrtc) {
    return pstn;
  }

  return pstn ?? webhook ?? webrtc ?? null;
}

export async function startCallRecording(
  callControlId: string,
  options: StartRecordingOptions = {},
): Promise<boolean> {
  const { format = 'mp3', channels = 'dual', playBeep = false } = options;

  try {
    await telephonyRequest(
      `/calls/${encodeURIComponent(callControlId)}/actions/record_start`,
      {
        method: 'POST',
        body: JSON.stringify({
          format,
          channels,
          play_beep: playBeep,
        }),
      },
    );
    return true;
  } catch (err) {
    console.error('[REC] record_start failed:', callControlId, err);
    return false;
  }
}

export async function stopCallRecording(callControlId: string): Promise<void> {
  await telephonyRequest(
    `/calls/${encodeURIComponent(callControlId)}/actions/record_stop`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export async function markCallRecordingStarted(
  supabase: SupabaseClient,
  dbCallId: string,
): Promise<void> {
  await supabase
    .from('calls')
    .update({
      was_recorded: true,
      recording_status: 'recording',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dbCallId);
}

/** Media-fork recording via Call Control `record_start` (dual-channel by default). */
export async function startMediaForkRecording(
  callControlId: string,
  dbCallId: string,
  supabase?: SupabaseClient | null,
  options?: StartRecordingOptions,
): Promise<boolean> {
  const started = await startCallRecording(callControlId, options);
  if (!started) return false;

  if (supabase) {
    await markCallRecordingStarted(supabase, dbCallId);
  }
  return true;
}
