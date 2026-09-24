import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { findLeadByCallerPhone } from '@/lib/inbound/match-lead';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import {
  resolveNumberRouting,
  type ResolvedNumberRouting,
} from '@/lib/voice/phone-number-settings';
import { resolveAgentSipUri } from '@/lib/telephony/telnyx/agent-sip';
import { listRingableAgents } from '@/lib/telephony/telnyx/inbound';
import { answerCall, hangupProviderCall, rejectCall, transferCall } from '@/lib/telephony/telnyx/outbound';
import {
  advanceCloudHunt,
  isAgentVoiceRegistered,
  routeToVoicemail,
  waitForHuntBridge,
} from './cloud-hunt';

export interface InboundRoutingContext {
  providerCallId: string;
  callSessionId: string | null;
  fromNumber: string | null;
  toNumber: string;
  ownerUserId: string;
  workspaceId: string | null;
  purchasedNumberId?: string;
  callsRowId: string;
}

export async function findInboundCallBySession(
  supabase: SupabaseClient,
  telnyxSessionId: string,
) {
  const { data } = await supabase
    .from('calls')
    .select('id, user_id, status, direction, telnyx_call_id, telnyx_webrtc_leg_id, telnyx_session_id, from_number, to_number, answered_at, workspace_id, leg_b_status, leg_b_call_control_id, cloud_anchored_at, hunt_step')
    .eq('telnyx_session_id', telnyxSessionId)
    .eq('direction', 'inbound')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function pickRoundRobinAgent(
  supabase: SupabaseClient,
  workspaceId: string,
  candidates: string[],
): Promise<string | null> {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  const { data: lastRouted } = await supabase
    .from('calls')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('direction', 'inbound')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastAgentId = lastRouted?.user_id as string | undefined;
  if (!lastAgentId) return candidates[0];

  const lastIndex = candidates.indexOf(lastAgentId);
  if (lastIndex === -1) return candidates[0];
  return candidates[(lastIndex + 1) % candidates.length];
}

async function upsertInboundCallsRow(
  supabase: SupabaseClient,
  ctx: Omit<InboundRoutingContext, 'callsRowId'> & { leadId: string | null; ringingUserId: string },
): Promise<string | null> {
  if (ctx.callSessionId) {
    const { data: bySession } = await supabase
      .from('calls')
      .select('id')
      .eq('telnyx_session_id', ctx.callSessionId)
      .eq('direction', 'inbound')
      .maybeSingle();
    if (bySession?.id) return bySession.id;
  }

  const { data: existing } = await supabase
    .from('calls')
    .select('id')
    .eq('telnyx_call_id', ctx.providerCallId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: inserted, error } = await supabase
    .from('calls')
    .insert({
      user_id: ctx.ringingUserId,
      workspace_id: ctx.workspaceId,
      lead_id: ctx.leadId,
      direction: 'inbound',
      telnyx_call_id: ctx.providerCallId,
      telnyx_session_id: ctx.callSessionId,
      from_number: ctx.fromNumber,
      to_number: ctx.toNumber,
      status: 'ringing',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[INBOUND-DB] insert failed:', error.message);
    if (ctx.callSessionId) {
      const { data: raced } = await supabase
        .from('calls')
        .select('id')
        .eq('telnyx_session_id', ctx.callSessionId)
        .eq('direction', 'inbound')
        .maybeSingle();
      return raced?.id ?? null;
    }
    const { data: raced } = await supabase
      .from('calls')
      .select('id')
      .eq('telnyx_call_id', ctx.providerCallId)
      .maybeSingle();
    return raced?.id ?? null;
  }

  console.log('[INBOUND-DB-INSERT] call row created', {
    telnyx_session_id: ctx.callSessionId,
    user_id: ctx.ringingUserId,
    status: 'ringing',
    from_number: ctx.fromNumber,
    call_id: inserted?.id,
  });
  return inserted?.id ?? null;
}

async function setCallStatus(
  supabase: SupabaseClient,
  callsRowId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await supabase.from('calls').update(patch).eq('id', callsRowId);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  console.log('[INBOUND-ROUTE] forward', { to: forwardTo, session: ctx.callSessionId });
  await answerCall(ctx.providerCallId);
  await transferCall(ctx.providerCallId, forwardTo);
  await setCallStatus(supabase, ctx.callsRowId, { status: 'forwarded' });
  // Ring-timeout failover is handled by the /api/cron/inbound-health-sweep cron.
}

async function assignInboundRingTarget(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  agentId: string,
  routing: ResolvedNumberRouting,
): Promise<void> {
  await setCallStatus(supabase, ctx.callsRowId, {
    user_id: agentId,
    status: 'ringing',
  });

  console.log('[INBOUND-RING] server popup target', {
    agent_id: agentId,
    session: ctx.callSessionId,
  });
  // Ring-timeout failover is handled by the /api/cron/inbound-health-sweep cron.
}

async function ringCurrentAgent(
  supabase: SupabaseClient,
  ctx: InboundRoutingContext,
  agentId: string,
  routing: ResolvedNumberRouting,
): Promise<boolean> {
  await assignInboundRingTarget(supabase, ctx, agentId, routing);

  const sip = await resolveAgentSipUri(supabase, agentId);
  if (!sip) {
    console.warn('[INBOUND-RING] no SIP credential — server popup only', agentId);
    return true;
  }

  // Presence gate: never transfer the PSTN leg to an agent whose browser voice
  // node isn't registered — the caller would ring forever with no media.
  // Returning false lets the ring group advance to the next agent.
  if (!(await isAgentVoiceRegistered(supabase, agentId))) {
    console.warn('[INBOUND-RING] agent voice node not registered — advance ring group', agentId);
    return false;
  }

  console.log('[INBOUND-RING] transfer to agent', {
    agent_id: agentId,
    session: ctx.callSessionId,
    sip: sip.sipUsername,
  });

  const transferred = await transferCall(ctx.providerCallId, sip.sipUri, ctx.toNumber, {
    gd_inbound_leg_b: true,
    telnyx_session_id: ctx.callSessionId,
    agent_id: agentId,
    gd_from_number: ctx.fromNumber ?? '',
    gd_to_number: ctx.toNumber,
  });

  if (!transferred) {
    console.error('[INBOUND-RING] SIP transfer failed — advance ring group', { agent_id: agentId });
    return false;
  }

  // Leg B (agent) transfer was accepted by the provider. The webhook work
  // advances leg_b_status to ringing/answered/bridged (or failed/hungup);
  // leg_b_call_control_id isn't known until the Leg B webhooks arrive.
  await setCallStatus(supabase, ctx.callsRowId, {
    leg_b_status: 'initiated',
    leg_b_call_control_id: null,
  });

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
    console.warn('[INBOUND-ROUTE] workspace missing — server popup for number owner');
    await ringCurrentAgent(supabase, ctx, ctx.ownerUserId, routing);
    return;
  }

  const candidates = await listRingableAgents(supabase, ctx.workspaceId);
  const ordered = [
    ...(candidates.includes(ctx.ownerUserId) ? [ctx.ownerUserId] : []),
    ...candidates.filter((id) => id !== ctx.ownerUserId),
  ];

  const pool = ordered.length ? ordered : [ctx.ownerUserId];
  const startAgentId = await pickRoundRobinAgent(supabase, ctx.workspaceId, pool) ?? pool[0];
  const startIndex = pool.indexOf(startAgentId);
  const rotated = [...pool.slice(startIndex), ...pool.slice(0, startIndex)];

  for (const agentId of rotated) {
    const rang = await ringCurrentAgent(supabase, ctx, agentId, routing);
    if (rang) {
      console.log('[INBOUND-ROUTE] browser ring started', { agent_id: agentId });
      return;
    }
  }

  await assignInboundRingTarget(supabase, ctx, ctx.ownerUserId, routing);
  console.log('[INBOUND-ROUTE] fallback server popup for owner', { agent_id: ctx.ownerUserId });
}


export async function advanceInboundRingGroup(
  supabase: SupabaseClient,
  telnyxSessionId: string,
  reason: 'agent_declined' | 'ring_timeout' | 'agent_unreachable',
): Promise<{ ok: boolean; status: string }> {
  const call = await findInboundCallBySession(supabase, telnyxSessionId);
  if (!call?.telnyx_call_id) {
    return { ok: false, status: 'not_found' };
  }

  if (call.status !== 'ringing' && call.status !== 'missed') {
    return { ok: false, status: call.status ?? 'unknown' };
  }

  const workspaceId = call.workspace_id as string | null;
  const currentAgentId = call.user_id as string;
  const providerCallId = call.telnyx_call_id as string;

  console.log('[INBOUND-ROUTE] advance ring group', { reason, session: telnyxSessionId });

  if (!workspaceId) {
    await hangupProviderCall(providerCallId);
    await setCallStatus(supabase, call.id, { status: 'missed', disposition: 'missed' });
    return { ok: true, status: 'missed' };
  }

  const { data: ownerNumber } = await supabase
    .from('purchased_numbers')
    .select('user_id, id')
    .eq('phone_number', call.to_number as string)
    .neq('status', 'released')
    .limit(1)
    .maybeSingle();

  const ownerUserId = ownerNumber?.user_id as string | undefined;
  if (!ownerUserId) {
    await hangupProviderCall(providerCallId);
    await setCallStatus(supabase, call.id, { status: 'missed', disposition: 'missed' });
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
  const remaining = currentIndex >= 0 ? ordered.slice(currentIndex + 1) : ordered;

  const ctx: InboundRoutingContext = {
    providerCallId,
    callSessionId: telnyxSessionId,
    fromNumber: call.from_number as string | null,
    toNumber: call.to_number as string,
    ownerUserId,
    workspaceId,
    purchasedNumberId: ownerNumber?.id as string | undefined,
    callsRowId: call.id,
  };

  // Cloud-first hunt: the caller is held on cloud media while we hunt
  // browser -> mobile -> voicemail. Advance the hunt state machine instead of
  // the legacy ring group — its compare-and-set on hunt_step keeps concurrent
  // advancers (webhook, decline API, sweep) from double-dialing.
  if ((call as { cloud_anchored_at?: string | null }).cloud_anchored_at) {
    await advanceCloudHunt(supabase, ctx, routing, reason);
    return { ok: true, status: 'ringing' };
  }

  for (const agentId of remaining) {
    const rang = await ringCurrentAgent(supabase, ctx, agentId, routing);
    if (rang) return { ok: true, status: 'ringing' };
  }

  if (routing.inbound_forward_number) {
    await routeToForward(supabase, ctx, routing);
    return { ok: true, status: 'forwarded' };
  }

  await routeToVoicemail(supabase, ctx, routing, reason);
  return { ok: true, status: 'voicemail' };
}

/**
 * Poll the calls row until the agent leg (Leg B) is confirmed answered/bridged
 * by the webhook work. Gives up after ~8s — the caller must not hear ringback
 * forever, so a missing bridge means we fail over instead of answering.
 */
async function waitForLegBAnswer(
  supabase: SupabaseClient,
  callsRowId: string,
): Promise<boolean> {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('calls')
      .select('leg_b_status')
      .eq('id', callsRowId)
      .maybeSingle();
    const status = (data?.leg_b_status as string | undefined) ?? 'none';
    if (status === 'answered' || status === 'bridged') return true;
    if (status === 'failed' || status === 'hungup') return false; // terminal — don't wait out the clock
    await sleep(400);
  }
  return false;
}

export async function markInboundAccepted(
  supabase: SupabaseClient,
  telnyxSessionId: string,
  agentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const call = await findInboundCallBySession(supabase, telnyxSessionId);
  if (!call) return { ok: false, error: 'not_found' };
  if (call.status === 'active' || call.status === 'answered') return { ok: true };

  // Cloud-first: the caller leg is already anchored in the cloud and the hunt
  // owns bridging — the agent's browser leg was answered in the UI before this
  // API was called. Wait briefly for the hunt to finish the bridge and report
  // honestly instead of touching provider legs here.
  if ((call as { cloud_anchored_at?: string | null }).cloud_anchored_at) {
    const bridged = await waitForHuntBridge(supabase, call.id, 10_000);
    return bridged ? { ok: true } : { ok: false, error: 'voice_not_connected' };
  }

  const legBStatus = (call.leg_b_status as string | null) ?? 'none';
  const pstnControlId = call.telnyx_call_id as string | null;

  // Dedupe: the ring step already transferred the PSTN leg to the agent's SIP
  // credential (leg_b_status initiated/ringing), so don't transfer a second
  // time. An already-answered/bridged leg needs no transfer either. Only when
  // no transfer is in flight (none, failed, hungup) do we bridge one here.
  const legBInFlight = legBStatus === 'initiated' || legBStatus === 'ringing';
  const legBAlive = legBStatus === 'answered' || legBStatus === 'bridged';
  if (!legBInFlight && !legBAlive) {
    if (!(await isAgentVoiceRegistered(supabase, agentId))) {
      console.warn('[INBOUND-ANSWER] agent voice node not registered — cannot bridge', {
        agent_id: agentId,
        session: telnyxSessionId,
      });
      return { ok: false, error: 'voice_not_connected' };
    }

    const sip = await resolveAgentSipUri(supabase, agentId);
    if (!sip || !pstnControlId) {
      console.warn('[INBOUND-ANSWER] no SIP credential or PSTN leg — cannot bridge', {
        agent_id: agentId,
        session: telnyxSessionId,
      });
      return { ok: false, error: 'voice_not_connected' };
    }

    console.log('[INBOUND-ANSWER] bridging agent leg on accept (no ring-time transfer)', {
      agent_id: agentId,
      session: telnyxSessionId,
    });
    const transferred = await transferCall(pstnControlId, sip.sipUri, call.to_number as string, {
      gd_inbound_leg_b: true,
      telnyx_session_id: telnyxSessionId,
      agent_id: agentId,
      gd_from_number: (call.from_number as string | null) ?? '',
      gd_to_number: call.to_number as string,
    });

    if (!transferred) {
      console.error('[INBOUND-ANSWER] agent-leg transfer failed', {
        agent_id: agentId,
        session: telnyxSessionId,
      });
      await setCallStatus(supabase, call.id, { leg_b_status: 'failed' });
      return { ok: false, error: 'voice_not_connected' };
    }

    await setCallStatus(supabase, call.id, {
      leg_b_status: 'initiated',
      leg_b_call_control_id: null,
    });
  }

  if (!pstnControlId) {
    return { ok: false, error: 'answer_failed' };
  }

  // Only answer the PSTN leg once Leg B is confirmed live — answering before
  // the bridge exists is what produced answered-but-silent calls.
  const legBConfirmed = await waitForLegBAnswer(supabase, call.id);
  if (!legBConfirmed) {
    console.warn('[INBOUND-ANSWER] agent leg never bridged — failing over', {
      session: telnyxSessionId,
    });
    await advanceInboundRingGroup(supabase, telnyxSessionId, 'agent_unreachable');
    return { ok: false, error: 'voice_not_connected' };
  }

  try {
    await answerCall(pstnControlId);
  } catch (err) {
    console.error('[INBOUND-ANSWER] PSTN answer failed:', err);
    return { ok: false, error: 'answer_failed' };
  }

  console.log('[INBOUND-ANSWERED]', telnyxSessionId);

  await setCallStatus(supabase, call.id, {
    status: 'answered',
    answered_at: new Date().toISOString(),
    user_id: agentId,
    // Deadline for the first media/bridge confirmation after answer; the
    // webhook work uses it to detect answered-but-silent calls.
    media_watchdog_deadline: new Date(Date.now() + 45_000).toISOString(),
  });

  return { ok: true };
}

export async function markInboundDeclined(
  supabase: SupabaseClient,
  telnyxSessionId: string,
): Promise<void> {
  const call = await findInboundCallBySession(supabase, telnyxSessionId);
  if (!call || call.status !== 'ringing') return;

  const anchored = !!(call as { cloud_anchored_at?: string | null }).cloud_anchored_at;

  // Reject the ringing agent leg so it stops ringing on their device. For
  // cloud hunts the leg id lives on leg_b_call_control_id; the leg-B hangup
  // webhook then advances the hunt to the next phase on its own.
  const agentLegId = anchored
    ? (((call as { leg_b_call_control_id?: string | null }).leg_b_call_control_id ?? null) as string | null)
    : (call.telnyx_webrtc_leg_id as string | null);

  if (agentLegId) {
    await rejectCall(agentLegId).catch(() => hangupProviderCall(agentLegId).catch(() => undefined));
  }

  if (anchored) {
    // No leg in flight (e.g. between phases) — advance the hunt directly so a
    // decline never leaves the caller stranded. Otherwise the hangup webhook
    // advances it.
    if (!agentLegId) {
      await advanceInboundRingGroup(supabase, telnyxSessionId, 'agent_declined');
    }
  } else {
    const result = await advanceInboundRingGroup(supabase, telnyxSessionId, 'agent_declined');
    if (result.status !== 'ringing') {
      await supabase
        .from('calls')
        .update({ status: 'missed', disposition: 'declined' })
        .eq('id', call.id);
    }
  }

  console.log('[INBOUND-DECLINED]', telnyxSessionId);
}

export async function handleInboundCallInitiated(
  supabase: SupabaseClient,
  params: {
    providerCallId: string;
    callSessionId?: string;
    fromNumber: string | null;
    toNumber: string;
  },
): Promise<void> {
  const toNumber = normalizeE164(params.toNumber);
  const fromNumber = params.fromNumber;
  const callSessionId = params.callSessionId ?? null;

  console.log('[INBOUND-WEBHOOK] initiated', {
    session: callSessionId,
    control: params.providerCallId,
    from: fromNumber,
    to: toNumber,
  });

  const ownedNumber = await getCachedNumberOwner(supabase, toNumber);
  if (!ownedNumber) {
    console.log('[INBOUND-WEBHOOK] unknown DID — reject', toNumber);
    await hangupProviderCall(params.providerCallId);
    return;
  }

  const ownerUserId = ownedNumber.user_id as string;
  const workspaceId = await resolveUserWorkspaceId(supabase, ownerUserId);

  if (callSessionId) {
    const existing = await findInboundCallBySession(supabase, callSessionId);
    if (existing?.id) {
      console.log('[INBOUND-WEBHOOK] duplicate session — skip', callSessionId);
      return;
    }
  }

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

  console.log('[INBOUND-ROUTE] mode', routing.inbound_mode);

  const preCtx: Omit<InboundRoutingContext, 'callsRowId'> = {
    providerCallId: params.providerCallId,
    callSessionId,
    fromNumber,
    toNumber,
    ownerUserId,
    workspaceId: workspaceId ?? null,
    purchasedNumberId: ownedNumber.id as string | undefined,
  };

  const ringingUserId = ownerUserId;

  const callsRowId = await upsertInboundCallsRow(supabase, {
    ...preCtx,
    leadId: lead?.id ?? null,
    ringingUserId,
  });

  if (!callsRowId) return;

  console.log('[INBOUND-RINGING] call inserted, no auto-answer', {
    telnyx_session_id: callSessionId,
    user_id: ringingUserId,
    status: 'ringing',
  });

  const ctx: InboundRoutingContext = {
    ...preCtx,
    callsRowId,
  };

  // Native inbound: the SIP connection routes the call straight to the
  // browser's TelnyxRTC client, which rings and answers natively. The server
  // NEVER answers, transfers, or hunts here — it records metadata only (the
  // calls row inserted above). The old cloud-first hunt auto-answered in this
  // branch and broke browser ringing, so it stays permanently bypassed in
  // browser mode.
  if (routing.inbound_mode === 'browser') {
    console.log('[INBOUND-NATIVE] browser mode — metadata only, no server answer', {
      telnyx_session_id: callSessionId,
      calls_row: callsRowId,
      to: toNumber,
    });
    return;
  }

  if (routing.inbound_mode === 'off') {
    await hangupProviderCall(params.providerCallId);
    await setCallStatus(supabase, callsRowId, { status: 'missed', disposition: 'missed' });
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
  const { data: call } = await supabase
    .from('calls')
    .select('id, status')
    .eq('telnyx_call_id', providerCallId)
    .eq('direction', 'inbound')
    .maybeSingle();

  if (!call || call.status !== 'ringing') return;

  console.log('[INBOUND-HANGUP] caller hung up while ringing', providerCallId);

  await supabase
    .from('calls')
    .update({
      status: 'missed',
      disposition: 'missed',
      ended_at: new Date().toISOString(),
    })
    .eq('id', call.id);
}
