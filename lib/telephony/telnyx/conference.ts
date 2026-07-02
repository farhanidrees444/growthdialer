import type { ConferenceHandle, TelephonyConferenceMode } from '@/lib/telephony/types';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { issueWebRtcToken } from '@/lib/telephony/telnyx/webrtc';
import { createClient } from '@/lib/supabase/server';
import { transferCall } from '@/lib/telephony/telnyx/outbound';

export async function createConferenceForCall(callControlId: string): Promise<ConferenceHandle> {
  const result = await telephonyRequest<{ data?: { id?: string; call_control_id?: string } }>(
    `/calls/${encodeURIComponent(callControlId)}/actions/conference`,
    {
      method: 'POST',
      body: JSON.stringify({
        conference_name: `gd-coach-${callControlId.slice(0, 12)}`,
        start_conference_on_enter: true,
        end_conference_on_exit: false,
      }),
    },
  );

  const conferenceId = result.data?.id;
  if (!conferenceId) {
    throw new Error('Could not create coaching conference');
  }

  return {
    conferenceId,
    callControlId: result.data?.call_control_id ?? callControlId,
  };
}

export async function joinConferenceAsManager(
  conferenceId: string,
  agentId: string,
  tenantId: string,
  mode: TelephonyConferenceMode,
): Promise<void> {
  const supabase = await createClient();
  const token = await issueWebRtcToken(supabase, agentId, tenantId);
  const sipUri = token.sipUsername
    ? `sip:${token.sipUsername}@sip.telnyx.com`
    : null;

  if (!sipUri) {
    throw new Error('Could not resolve manager voice endpoint');
  }

  const muted = mode === 'listen' || mode === 'whisper';
  await telephonyRequest(
    `/conferences/${encodeURIComponent(conferenceId)}/actions/join`,
    {
      method: 'POST',
      body: JSON.stringify({
        call_control_id: conferenceId,
        client_state: Buffer.from(JSON.stringify({ mode, agent_id: agentId })).toString('base64'),
        mute: muted,
        hold: false,
        sip_uri: sipUri,
      }),
    },
  );

  if (mode === 'takeover') {
    await transferCall(conferenceId, sipUri);
  }
}
