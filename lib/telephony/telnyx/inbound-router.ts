import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { findLeadByCallerPhone } from '@/lib/inbound/match-lead';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import { triggerInboundRingTimeoutAsync } from '@/lib/inbound/trigger-ring-timeout';
import {
  resolveNumberRouting,
  type ResolvedNumberRouting,
} from '@/lib/voice/phone-number-settings';
import { voiceLog } from '@/lib/voice/structured-log';
import { resolveAgentSipUri } from '@/lib/telephony/telnyx/agent-sip';
import {
  createInboundCallRow,
  listRingableAgents,
  recordInboundTransition,
} from '@/lib/telephony/telnyx/inbound';
import { answerCall, hangupProviderCall, transferCall } from '@/lib/telephony/telnyx/outbound';
import { startCallRecording } from '@/lib/telephony/telnyx/recording';

export interface InboundRoutingContext {
  providerCallId: string;
  callSessionId?: string;
  fromNumber: string | null;
  toNumber: string;
  ownerUserId: string;
  workspaceId: string | null;
  purchasedNumberId?: string;
  inboundCallId: string;
  callsRowId?: string | null;
}

async function pickRoundRobinAgent(
  supabase: SupabaseClient,
  workspaceId: string,
  candidates: string[],
): Promise<string | null> {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  const { data: lastRouted } = await supabase
    .from('inbound_call_transitions')
    .select('agent_id')
    .eq('workspace_id', workspaceId)
    .eq('reason', 'agent_ringing')
    .not('agent_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastAgentId = lastRouted?.agent_id as string | undefined;
  if (!lastAgentId) return candidates[0];

  const lastIndex = candidates.indexOf(lastAgentId);
  if (lastIndex === -1) return candidates[0];
  return candidates[(lastIndex + 1) % candidates.length];
}

async function syncCallsRow(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  leadId: string | null,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('calls')
    .select('id')
    .eq('telnyx_call_id', ctx.providerCallId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: inserted, error } = await supabase
    .from('calls')
    .insert({
      user_id: ctx.ownerUserId,
      workspace_id: ctx.workspaceId,
      lead_id: leadId,
      direction: 'inbound',
      telnyx_call_id: ctx.providerCallId,
      telnyx_session_id: ctx.callSessionId ?? null,
      from_number: ctx.fromNumber,
      to_number: ctx.toNumber,
      status: 'ringing',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    const { data: raced } = await supabase
      .from('calls')
      .select('id')
      .eq('telnyx_call_id', ctx.providerCallId)
      .maybeSingle();
    return raced?.id ?? null;
  }

  return inserted?.id ?? null;
}

async function routeToVoicemail(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  routing: ResolvedNumberRouting,
  reason: string,
): Promise<void> {
  await answerCall(ctx.providerCallId);
  await recordInboundTransition({
    inboundCallId: ctx.inboundCallId,
    workspaceId: ctx.workspaceId,
    fromStatus: 'ringing',
    toStatus: 'voicemail',
    reason,
    agentId: null,
  });

  await startCallRecording(ctx.providerCallId, {
    format: 'mp3',
    channels: routing.inbound_mode === 'voicemail' ? 'single' : 'dual',
    playBeep: routing.inbound_mode === 'voicemail',
  });

  if (ctx.callsRowId) {
    await supabase
      .from('calls')
      .update({ status: 'voicemail', disposition: 'voicemail' })
      .eq('id', ctx.callsRowId);
  }
}

async function routeToForward(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  routing: ResolvedNumberRouting,
): Promise<void> {
  const forwardTo = normalizeE164(routing.inbound_forward_number ?? '');
  if (!forwardTo) {
    await routeToVoicemail(supabase, ctx, routing, 'forward_number_missing');
    return;
  }

  await answerCall(ctx.providerCallId);
  await transferCall(ctx.providerCallId, forwardTo);

  await recordInboundTransition({
    inboundCallId: ctx.inboundCallId,
    workspaceId: ctx.workspaceId,
    fromStatus: 'ringing',
    toStatus: 'active',
    reason: 'forwarded',
    agentId: null,
  });

  triggerInboundRingTimeoutAsync(
    ctx.inboundCallId,
    ctx.providerCallId,
    ctx.ownerUserId,
    routing.inbound_ring_seconds,
    'forward',
  );
}

async function ringCurrentAgent(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  agentId: string,
  routing: ResolvedNumberRouting,
  agentIndex: number,
  agentTotal: number,
): Promise<boolean> {
  const sip = await resolveAgentSipUri(supabase, agentId);
  if (!sip) {
    voiceLog.warn(
      {
        service: 'inbound-routing',
        agent_id: agentId,
        inbound_call_id: ctx.inboundCallId,
      },
      'Agent has no voice credential — skipping',
    );
    return false;
  }

  await supabase
    .from('inbound_calls')
    .update({ routed_agent_id: agentId, updated_at: new Date().toISOString() })
    .eq('id', ctx.inboundCallId);

  await recordInboundTransition({
    inboundCallId: ctx.inboundCallId,
    workspaceId: ctx.workspaceId,
    fromStatus: 'ringing',
    toStatus: 'ringing',
    reason: 'agent_ringing',
    agentId,
    metadata: { agent_index: agentIndex, agent_total: agentTotal, sip_username: sip.sipUsername },
  });

  const transferred = await transferCall(ctx.providerCallId, sip.sipUri, ctx.toNumber, {
    gd_inbound_leg_b: true,
    inbound_call_id: ctx.inboundCallId,
    agent_id: agentId,
  });
  if (!transferred) {
    voiceLog.error(
      {
        service: 'inbound-routing',
        agent_id: agentId,
        inbound_call_id: ctx.inboundCallId,
      },
      'Transfer to agent SIP failed',
    );
    return false;
  }

  triggerInboundRingTimeoutAsync(
    ctx.inboundCallId,
    ctx.providerCallId,
    agentId,
    routing.inbound_ring_seconds,
    'browser',
  );

  return true;
}

export async function routeInboundToBrowserAgents(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
): Promise<void> {
  const routing = await resolveNumberRouting(
    supabase,
    ctx.ownerUserId,
    ctx.purchasedNumberId,
  );

  if (!ctx.workspaceId) {
    await routeToVoicemail(supabase, ctx, routing, 'workspace_missing');
    return;
  }

  const candidates = await listRingableAgents(supabase, ctx.workspaceId);
  const ordered = [
    ...(candidates.includes(ctx.ownerUserId) ? [ctx.ownerUserId] : []),
    ...candidates.filter((id) => id !== ctx.ownerUserId),
  ];

  if (!ordered.length) {
    voiceLog.info(
      { service: 'inbound-routing', inbound_call_id: ctx.inboundCallId },
      'No ringable agents — voicemail fallback',
    );
    await routeToVoicemail(supabase, ctx, routing, 'no_agents_online');
    return;
  }

  const startAgentId = await pickRoundRobinAgent(supabase, ctx.workspaceId, ordered);
  if (!startAgentId) {
    await routeToVoicemail(supabase, ctx, routing, 'round_robin_empty');
    return;
  }

  const startIndex = ordered.indexOf(startAgentId);
  const rotated = [...ordered.slice(startIndex), ...ordered.slice(0, startIndex)];

  for (let i = 0; i < rotated.length; i += 1) {
    const agentId = rotated[i];
    const rang = await ringCurrentAgent(supabase, ctx, agentId, routing, i, rotated.length);
    if (rang) {
      voiceLog.info(
        {
          service: 'inbound-routing',
          inbound_call_id: ctx.inboundCallId,
          agent_id: agentId,
          agent_index: i,
        },
        'Inbound ringing agent via SIP transfer',
      );
      return;
    }
  }

  await routeToVoicemail(supabase, ctx, routing, 'all_agents_unreachable');
}

export async function advanceInboundRingGroup(
  supabase: SupabaseClient,
  inboundCallId: string,
  reason: 'agent_declined' | 'ring_timeout' | 'agent_unreachable',
): Promise<{ ok: boolean; status: string }> {
  const { data: inbound } = await supabase
    .from('inbound_calls')
    .select('id, status, workspace_id, provider_call_id, to_number, from_number, routed_agent_id, ring_timeout_seconds')
    .eq('id', inboundCallId)
    .maybeSingle();

  if (!inbound?.provider_call_id) {
    return { ok: false, status: 'not_found' };
  }

  if (inbound.status !== 'ringing') {
    return { ok: false, status: inbound.status ?? 'unknown' };
  }

  const workspaceId = inbound.workspace_id as string | null;
  const currentAgentId = inbound.routed_agent_id as string | null;

  await recordInboundTransition({
    inboundCallId,
    workspaceId,
    fromStatus: 'ringing',
    toStatus: 'ringing',
    reason,
    agentId: currentAgentId,
  });

  if (!workspaceId) {
    await hangupProviderCall(inbound.provider_call_id);
    await recordInboundTransition({
      inboundCallId,
      workspaceId,
      fromStatus: 'ringing',
      toStatus: 'missed',
      reason: 'workspace_missing',
      agentId: null,
    });
    return { ok: true, status: 'missed' };
  }

  const { data: ownerNumber } = await supabase
    .from('purchased_numbers')
    .select('user_id, id')
    .eq('phone_number', inbound.to_number as string)
    .neq('status', 'released')
    .limit(1)
    .maybeSingle();

  const ownerUserId = ownerNumber?.user_id as string | undefined;
  if (!ownerUserId) {
    await hangupProviderCall(inbound.provider_call_id);
    await recordInboundTransition({
      inboundCallId,
      workspaceId,
      fromStatus: 'ringing',
      toStatus: 'missed',
      reason: 'owner_missing',
      agentId: null,
    });
    return { ok: true, status: 'missed' };
  }

  const routing = await resolveNumberRouting(
    supabase,
    ownerUserId,
    ownerNumber?.id as string | undefined,
  );

  const candidates = await listRingableAgents(supabase, workspaceId);
  const ordered = [
    ...(candidates.includes(ownerUserId) ? [ownerUserId] : []),
    ...candidates.filter((id) => id !== ownerUserId),
  ];

  const currentIndex = currentAgentId ? ordered.indexOf(currentAgentId) : -1;
  const remaining = currentIndex >= 0
    ? ordered.slice(currentIndex + 1)
    : ordered;

  const ctx: InboundRoutingContext = {
    providerCallId: inbound.provider_call_id,
    fromNumber: inbound.from_number as string | null,
    toNumber: inbound.to_number as string,
    ownerUserId,
    workspaceId,
    purchasedNumberId: ownerNumber?.id as string | undefined,
    inboundCallId,
    callsRowId: null,
  };

  const { data: callsRow } = await supabase
    .from('calls')
    .select('id')
    .eq('telnyx_call_id', inbound.provider_call_id)
    .maybeSingle();
  ctx.callsRowId = callsRow?.id ?? null;

  for (let i = 0; i < remaining.length; i += 1) {
    const agentId = remaining[i];
    const rang = await ringCurrentAgent(
      supabase,
      ctx,
      agentId,
      routing,
      currentIndex + 1 + i,
      ordered.length,
    );
    if (rang) return { ok: true, status: 'ringing' };
  }

  if (routing.inbound_forward_number) {
    await routeToForward(supabase, ctx, routing);
    return { ok: true, status: 'forwarded' };
  }

  await routeToVoicemail(supabase, ctx, routing, reason);
  return { ok: true, status: 'voicemail' };
}

export async function markInboundAccepted(
  supabase: SupabaseClient,
  inboundCallId: string,
  agentId: string,
): Promise<void> {
  const { data: inbound } = await supabase
    .from('inbound_calls')
    .select('id, status, workspace_id, provider_call_id')
    .eq('id', inboundCallId)
    .maybeSingle();

  if (!inbound || inbound.status === 'active') return;

  await recordInboundTransition({
    inboundCallId,
    workspaceId: (inbound.workspace_id as string | null) ?? null,
    fromStatus: inbound.status as string,
    toStatus: 'active',
    reason: 'agent_accepted',
    agentId,
  });

  if (inbound.provider_call_id) {
    const { data: callRow } = await supabase
      .from('calls')
      .select('id')
      .eq('telnyx_call_id', inbound.provider_call_id)
      .maybeSingle();

    if (callRow?.id) {
      await supabase
        .from('calls')
        .update({
          status: 'active',
          answered_at: new Date().toISOString(),
        })
        .eq('id', callRow.id);
    }
  }
}

export async function handleInboundCallInitiated(
  supabase: SupabaseClient,
  params: {
    providerCallId: string;
    callSessionId?: string;
    fromNumber: string | null;
    toNumber: string;
    direction?: string;
  },
): Promise<void> {
  const toNumber = normalizeE164(params.toNumber);
  const fromNumber = params.fromNumber;
  const ownedNumber = await getCachedNumberOwner(supabase, toNumber);

  if (!ownedNumber) {
    await hangupProviderCall(params.providerCallId);
    return;
  }

  const ownerUserId = ownedNumber.user_id as string;
  const workspaceId =
    (ownedNumber.workspace_id as string | null | undefined)
    ?? await resolveUserWorkspaceId(supabase, ownerUserId);

  const { data: existingInbound } = await supabase
    .from('inbound_calls')
    .select('id')
    .eq('provider_call_id', params.providerCallId)
    .maybeSingle();

  if (existingInbound?.id) {
    voiceLog.debug(
      { service: 'inbound-routing', inbound_call_id: existingInbound.id },
      'Duplicate call.initiated — skip routing',
    );
    return;
  }

  const inboundCallId = await createInboundCallRow({
    workspaceId: workspaceId ?? null,
    providerCallId: params.providerCallId,
    fromNumber: fromNumber ?? '',
    toNumber,
    routedAgentId: null,
  });

  if (!inboundCallId) return;

  const { data: ownedRows } = await supabase
    .from('purchased_numbers')
    .select('phone_number')
    .eq('user_id', ownerUserId)
    .neq('status', 'released');

  const lead = fromNumber
    ? await findLeadByCallerPhone(supabase, ownerUserId, fromNumber, {
      excludeNumbers: (ownedRows ?? []).map((r) => r.phone_number as string),
    })
    : null;

  const routing = await resolveNumberRouting(
    supabase,
    ownerUserId,
    ownedNumber.id as string | undefined,
  );

  const ctx: InboundRoutingContext = {
    providerCallId: params.providerCallId,
    callSessionId: params.callSessionId,
    fromNumber,
    toNumber,
    ownerUserId,
    workspaceId: workspaceId ?? null,
    purchasedNumberId: ownedNumber.id as string | undefined,
    inboundCallId,
    callsRowId: null,
  };

  ctx.callsRowId = await syncCallsRow(supabase, ctx, lead?.id ?? null);

  if (routing.inbound_mode === 'off') {
    await hangupProviderCall(params.providerCallId);
    await recordInboundTransition({
      inboundCallId,
      workspaceId: workspaceId ?? null,
      fromStatus: 'ringing',
      toStatus: 'missed',
      reason: 'inbound_off',
      agentId: null,
    });
    return;
  }

  if (routing.inbound_mode === 'voicemail') {
    await routeToVoicemail(supabase, ctx, routing, 'voicemail_mode');
    return;
  }

  if (routing.inbound_mode === 'forward') {
    await routeToForward(supabase, ctx, routing);
    return;
  }

  await routeInboundToBrowserAgents(supabase, ctx);
}

export async function finalizeInboundMissed(
  supabase: SupabaseClient,
  providerCallId: string,
): Promise<void> {
  const { data: inbound } = await supabase
    .from('inbound_calls')
    .select('id, status, workspace_id, routed_agent_id')
    .eq('provider_call_id', providerCallId)
    .maybeSingle();

  if (!inbound || inbound.status !== 'ringing') return;

  await recordInboundTransition({
    inboundCallId: inbound.id,
    workspaceId: (inbound.workspace_id as string | null) ?? null,
    fromStatus: 'ringing',
    toStatus: 'missed',
    reason: 'caller_hangup',
    agentId: (inbound.routed_agent_id as string | null) ?? null,
  });

  await supabase
    .from('calls')
    .update({
      status: 'missed',
      disposition: 'missed',
      ended_at: new Date().toISOString(),
    })
    .eq('telnyx_call_id', providerCallId);
}
