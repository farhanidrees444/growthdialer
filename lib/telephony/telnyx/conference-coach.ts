import type { TelephonyConferenceMode } from '@/lib/telephony/types';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { readCallControlAppId } from '@/lib/telephony/telnyx/env';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';
import { createClient } from '@/lib/supabase/server';
import { resolveAgentSipUri } from '@/lib/telephony/telnyx/agent-sip';
import { buildOutboundDialPayload } from '@/lib/voice/outbound-dial-payload';
import type { WorkspaceOutboundTrustContext } from '@/lib/compliance/ten-dlc-profile';

export type DialCoachLegResult =
  | { ok: true; coachCallControlId: string }
  | { ok: false; error: string; status: number };

export async function dialCoachLeg(params: {
  coachId: string;
  workspaceId: string;
  conferenceId: string;
  mode: TelephonyConferenceMode;
  agentCallControlId: string;
  callId: string;
  fromNumber: string;
}): Promise<DialCoachLegResult> {
  const appId = readCallControlAppId();
  const webhookUrl = resolveVoiceWebhookUrl();
  if (!appId || !webhookUrl) {
    return { ok: false, error: 'Voice service is not configured', status: 503 };
  }

  const supabase = await createClient();
  const coachEndpoint = await resolveAgentSipUri(supabase, params.coachId);
  if (!coachEndpoint?.sipUri) {
    return {
      ok: false,
      error: 'Coach voice endpoint is not ready — open the dialer and wait for the phone to connect',
      status: 409,
    };
  }

  const trust: WorkspaceOutboundTrustContext = {
    workspace_id: params.workspaceId,
    from_display_name: 'GrowthDialer',
    stir_attestation: 'none',
    ten_dlc_campaign_id: null,
    cnam_registered: false,
    trust_tier: 'unverified',
  };

  const dialBody = buildOutboundDialPayload({
    connectionId: appId,
    to: coachEndpoint.sipUri,
    from: params.fromNumber,
    webhookUrl,
    trust,
    amd: 'disabled',
    timeoutSecs: 45,
    clientState: {
      gd_coaching_join: true,
      conference_id: params.conferenceId,
      mode: params.mode,
      agent_call_control_id: params.agentCallControlId,
      call_id: params.callId,
      coach_id: params.coachId,
    },
  });

  try {
    const result = await telephonyRequest<{ data?: { call_control_id?: string } }>(
      '/calls',
      { method: 'POST', body: JSON.stringify(dialBody) },
    );

    const coachCallControlId = result.data?.call_control_id?.trim();
    if (!coachCallControlId) {
      return { ok: false, error: 'Coach leg could not be created', status: 502 };
    }

    return { ok: true, coachCallControlId };
  } catch (err) {
    console.error('[coaching] dial coach leg failed:', err);
    return { ok: false, error: 'Could not ring the coach phone', status: 502 };
  }
}
