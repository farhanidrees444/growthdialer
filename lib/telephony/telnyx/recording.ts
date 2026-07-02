import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { createServiceClient } from '@/lib/supabase/service';

export async function startMediaForkRecording(
  callControlId: string,
  dbCallId: string,
): Promise<void> {
  await telephonyRequest(
    `/calls/${encodeURIComponent(callControlId)}/actions/record_start`,
    {
      method: 'POST',
      body: JSON.stringify({
        format: 'wav',
        channels: 'dual',
        play_beep: false,
      }),
    },
  );

  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase
    .from('calls')
    .update({
      recording_status: 'recording',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dbCallId);
}
