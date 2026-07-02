import type { SupabaseClient } from '@supabase/supabase-js';
import telnyxClient, { toE164 } from '@/lib/telnyx';
import { fetchDialerQueueLeads } from '@/lib/dialer/queue-query';
import type { DialerQueueConfig } from '@/lib/dialer/queue-query';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { prefetchUserCallerNumbers, resolveCallerIdFromCache } from '@/lib/dialer/resolve-caller-id';
import type { ParallelDialLeg, ParallelDialSession } from './types';
import { getActiveCallControlAppId } from '@/lib/voice/configure-connection';
import { resolveWorkspaceOutboundTrust } from '@/lib/compliance/workspace-trust';
import { buildOutboundDialPayload } from '@/lib/voice/outbound-dial-payload';
import { triggerParallelLegTrackingAsync } from './leg-tracking';

export async function dialParallelBatch(
  supabase: SupabaseClient,
  session: ParallelDialSession,
  userId: string,
  options: {
    excludeLeadIds?: string[];
    queueConfig?: DialerQueueConfig;
  } = {},
): Promise<{ legs: ParallelDialLeg[]; leads: LeadRecord[] }> {
  return dialParallelBatchTelnyx(supabase, session, userId, options);
}

async function dialParallelBatchTelnyx(
  supabase: SupabaseClient,
  session: ParallelDialSession,
  userId: string,
  options: {
    excludeLeadIds?: string[];
    queueConfig?: DialerQueueConfig;
  } = {},
): Promise<{ legs: ParallelDialLeg[]; leads: LeadRecord[] }> {
  const queueConfig: DialerQueueConfig = {
    ...(session.queue_config ?? { tab: 'queue', sort: 'priority' }),
    ...options.queueConfig,
    limit: session.lines_count,
    offset: 0,
    excludeIds: options.excludeLeadIds ?? [],
  };

  const { data: leads, error } = await fetchDialerQueueLeads(
    supabase,
    session.workspace_id!,
    queueConfig,
  );
  if (error) throw error;
  if (!leads?.length) return { legs: [], leads: [] };

  const batchNumber = session.total_batches + 1;
  const { resolveVoiceWebhookUrl } = await import('@/lib/voice/webhook-url');
  const webhookUrl = resolveVoiceWebhookUrl();
  const callControlAppId = await getActiveCallControlAppId();
  if (!callControlAppId) {
    throw new Error('Voice dial application is not configured');
  }
  const amd = session.amd_enabled ? 'detect' : 'disabled';
  const numberCache = await prefetchUserCallerNumbers(supabase, userId);
  const workspaceId = session.workspace_id ?? '';
  const trust = workspaceId
    ? await resolveWorkspaceOutboundTrust(supabase, workspaceId, numberCache.numbers[0]?.phone_number ?? '')
    : {
      workspace_id: workspaceId,
      from_display_name: 'GrowthDialer',
      stir_attestation: 'none' as const,
      ten_dlc_campaign_id: null,
      cnam_registered: false,
      trust_tier: 'unverified' as const,
    };

  const legs: ParallelDialLeg[] = [];

  for (const lead of leads as LeadRecord[]) {
    const e164 = toE164(lead.phone);
    if (!e164) continue;

    const { fromNumber } = resolveCallerIdFromCache(numberCache, lead.phone);

    const { data: legRow, error: legErr } = await supabase
      .from('parallel_dial_legs')
      .insert({
        session_id: session.id,
        lead_id: lead.id,
        lead_name: lead.name,
        phone: e164,
        status: 'dialing',
        batch_number: batchNumber,
      })
      .select('*')
      .single();

    if (legErr || !legRow) {
      console.error('[PARALLEL] leg insert failed:', legErr);
      continue;
    }

    try {
      const dialBody = buildOutboundDialPayload({
        connectionId: callControlAppId,
        to: e164,
        from: fromNumber,
        webhookUrl,
        trust,
        amd,
        timeoutSecs: 30,
        clientState: {
          parallel_session_id: session.id,
          parallel_leg_id: legRow.id,
        },
      });

      const result = await telnyxClient.calls.dial(
        dialBody as unknown as Parameters<typeof telnyxClient.calls.dial>[0],
      );

      const callControlId = result.data?.call_control_id;
      const nowIso = new Date().toISOString();

      let callId: string | null = null;
      if (callControlId) {
        const { data: callRow } = await supabase
          .from('calls')
          .insert({
            user_id: userId,
            workspace_id: session.workspace_id,
            lead_id: lead.id,
            direction: 'outbound',
            to_number: e164,
            from_number: fromNumber,
            telnyx_call_id: callControlId,
            status: 'initiated',
            started_at: nowIso,
            created_at: nowIso,
            parallel_dial_session_id: session.id,
            parallel_dial_leg_id: legRow.id,
          })
          .select('id')
          .single();
        callId = callRow?.id ?? null;
      }

      const { data: updatedLeg } = await supabase
        .from('parallel_dial_legs')
        .update({
          telnyx_call_id: callControlId ?? null,
          call_id: callId,
          status: callControlId ? 'ringing' : 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', legRow.id)
        .select('*')
        .single();

      if (updatedLeg) legs.push(updatedLeg as ParallelDialLeg);

      triggerParallelLegTrackingAsync({
        event: 'batch_started',
        session_id: session.id,
        leg_id: legRow.id,
        user_id: userId,
        workspace_id: session.workspace_id,
        telnyx_call_id: callControlId ?? null,
        phone: e164,
        lead_id: lead.id,
        at: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[PARALLEL] dial failed for ${e164}:`, err);
      await supabase
        .from('parallel_dial_legs')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', legRow.id);
    }
  }

  await supabase
    .from('parallel_dial_sessions')
    .update({
      status: 'dialing',
      total_batches: batchNumber,
      total_dialed: session.total_dialed + legs.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  return { legs, leads: leads as LeadRecord[] };
}

export async function cancelRingingLegs(
  supabase: SupabaseClient,
  sessionId: string,
  exceptLegId?: string,
): Promise<void> {
  let query = supabase
    .from('parallel_dial_legs')
    .select('id, telnyx_call_id, status')
    .eq('session_id', sessionId)
    .in('status', ['dialing', 'ringing', 'answered']);

  if (exceptLegId) query = query.neq('id', exceptLegId);

  const { data: legs } = await query;
  if (!legs?.length) return;

  const { hangupCallControl } = await import('./agent-bridge');

  await Promise.all(
    legs.map(async (leg) => {
      if (leg.telnyx_call_id) {
        await hangupCallControl(leg.telnyx_call_id);
      }
      await supabase
        .from('parallel_dial_legs')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leg.id);
    }),
  );
}
