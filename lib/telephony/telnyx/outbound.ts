import type { SupabaseClient } from '@supabase/supabase-js';
import type { MakeCallParams, CallHandle } from '@/lib/telephony/types';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { readCallControlAppId } from '@/lib/telephony/telnyx/env';
import { buildOutboundDialPayload } from '@/lib/voice/outbound-dial-payload';
import type { WorkspaceOutboundTrustContext } from '@/lib/compliance/ten-dlc-profile';

function defaultTrust(tenantId: string): WorkspaceOutboundTrustContext {
  return {
    workspace_id: tenantId,
    from_display_name: 'GrowthDialer',
    stir_attestation: 'none',
    ten_dlc_campaign_id: null,
    cnam_registered: false,
    trust_tier: 'unverified',
  };
}

export async function dialOutboundCall(
  supabase: SupabaseClient,
  params: MakeCallParams,
): Promise<CallHandle> {
  const appId = readCallControlAppId();
  if (!appId) {
    throw new Error('Voice service is not configured');
  }

  const trust = params.trust ?? defaultTrust(params.tenantId);
  const dialBody = buildOutboundDialPayload({
    connectionId: appId,
    to: params.to,
    from: params.from,
    webhookUrl: params.webhookUrl,
    trust,
    amd: params.amd ?? 'disabled',
    timeoutSecs: params.timeoutSecs ?? 30,
    clientState: {
      tenant_id: params.tenantId,
      agent_id: params.agentId,
      lead_id: params.leadId ?? null,
      parallel_session_id: params.parallelSessionId ?? null,
      parallel_leg_id: params.parallelLegId ?? null,
      power_dial_session_id: params.powerDialSessionId ?? null,
      ...params.clientState,
    },
  });

  const result = await telephonyRequest<{ data?: { call_control_id?: string } }>(
    '/calls',
    { method: 'POST', body: JSON.stringify(dialBody) },
  );

  const callControlId = result.data?.call_control_id;
  if (!callControlId) {
    throw new Error('Voice provider did not return a call id');
  }

  const nowIso = new Date().toISOString();
  const { data: inserted, error } = await supabase
    .from('calls')
    .insert({
      user_id: params.agentId,
      workspace_id: params.tenantId,
      lead_id: params.leadId ?? null,
      direction: 'outbound',
      to_number: params.to,
      from_number: params.from,
      telnyx_call_id: callControlId,
      status: 'initiated',
      started_at: nowIso,
      created_at: nowIso,
      parallel_dial_session_id: params.parallelSessionId ?? null,
      parallel_dial_leg_id: params.parallelLegId ?? null,
      power_dial_session_id: params.powerDialSessionId ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[telephony/outbound] call row insert failed:', error);
  }

  return {
    callControlId,
    dbCallId: inserted?.id ?? null,
    status: 'initiated',
  };
}

export async function hangupProviderCall(callControlId: string): Promise<void> {
  await telephonyRequest(
    `/calls/${encodeURIComponent(callControlId)}/actions/hangup`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export async function bridgeCalls(
  callControlIdA: string,
  callControlIdB: string,
): Promise<void> {
  await telephonyRequest(
    `/calls/${encodeURIComponent(callControlIdA)}/actions/bridge`,
    {
      method: 'POST',
      body: JSON.stringify({ call_control_id: callControlIdB }),
    },
  );
}

/**
 * Transfer creates a brand-new Leg B with its own call_control_id (Telnyx
 * webhook sequence: call.initiated → call.bridged (on original leg) →
 * call.answered/call.hangup on Leg B). `targetLegClientState` tags Leg B so
 * its own webhooks can be attributed back to our inbound state machine
 * without relying on the shared call_session_id (which the original leg
 * also carries) — this is what lets us fail over to the next ring-group
 * agent the instant a SIP transfer target fails, not just on timeout.
 */
export async function transferCall(
  callControlId: string,
  to: string,
  from?: string,
  targetLegClientState?: Record<string, unknown>,
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = from ? { to, from } : { to };
    if (targetLegClientState) {
      body.target_leg_client_state = Buffer.from(
        JSON.stringify(targetLegClientState),
      ).toString('base64');
    }
    await telephonyRequest(
      `/calls/${encodeURIComponent(callControlId)}/actions/transfer`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
    return true;
  } catch (error) {
    console.error('[telephony/outbound] transfer failed:', error);
    return false;
  }
}

export async function answerCall(callControlId: string): Promise<void> {
  await telephonyRequest(
    `/calls/${encodeURIComponent(callControlId)}/actions/answer`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}
