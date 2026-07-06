import type { SupabaseClient } from '@supabase/supabase-js';
import { toE164 } from '@/lib/telnyx';
import { fetchDialerQueueLeads } from '@/lib/dialer/queue-query';
import type { DialerQueueConfig } from '@/lib/dialer/queue-query';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { prefetchUserCallerNumbers, resolveCallerIdFromCache } from '@/lib/dialer/resolve-caller-id';
import type { ParallelDialLeg, ParallelDialSession } from './types';
import { resolveWorkspaceOutboundTrust } from '@/lib/compliance/workspace-trust';
import { resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';
import { getTelephonyProvider } from '@/lib/telephony';
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
  const provider = getTelephonyProvider();
  if (!provider.isConfigured()) {
    throw new Error('Voice dial application is not configured');
  }

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
  const webhookUrl = resolveVoiceWebhookUrl();
  if (!webhookUrl) {
    throw new Error('Voice webhook URL is not configured');
  }

  const amd = session.amd_enabled ? 'detect' : 'disabled';
  const numberCache = await prefetchUserCallerNumbers(supabase, userId);
  if (!numberCache.numbers.length) {
    throw new Error('No active caller ID — extend or add a number in My Numbers');
  }
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

  const dialLead = async (lead: LeadRecord): Promise<ParallelDialLeg | null> => {
    const e164 = toE164(lead.phone);
    if (!e164) return null;

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
      return null;
    }

    try {
      const handle = await provider.makeCall({
        tenantId: workspaceId,
        agentId: userId,
        to: e164,
        from: fromNumber,
        leadId: lead.id,
        webhookUrl,
        amd,
        timeoutSecs: 30,
        parallelSessionId: session.id,
        parallelLegId: legRow.id,
        trust,
      });

      const { data: updatedLeg } = await supabase
        .from('parallel_dial_legs')
        .update({
          telnyx_call_id: handle.callControlId,
          call_id: handle.dbCallId,
          status: 'ringing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', legRow.id)
        .select('*')
        .single();

      triggerParallelLegTrackingAsync({
        event: 'batch_started',
        session_id: session.id,
        leg_id: legRow.id,
        user_id: userId,
        workspace_id: session.workspace_id,
        telnyx_call_id: handle.callControlId,
        phone: e164,
        lead_id: lead.id,
        at: new Date().toISOString(),
      });

      return (updatedLeg as ParallelDialLeg | null) ?? null;
    } catch (err) {
      console.error(`[PARALLEL] dial failed for ${e164}:`, err);
      await supabase
        .from('parallel_dial_legs')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', legRow.id);
      return null;
    }
  };

  // Genuine race — originate every line concurrently, not sequentially.
  const settled = await Promise.allSettled(
    (leads as LeadRecord[]).map((lead) => dialLead(lead)),
  );

  const legs = settled
    .filter((r): r is PromiseFulfilledResult<ParallelDialLeg | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((leg): leg is ParallelDialLeg => Boolean(leg));

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

  const provider = getTelephonyProvider();

  await Promise.allSettled(
    legs.map(async (leg) => {
      if (leg.telnyx_call_id) {
        try {
          await provider.hangupCall(leg.telnyx_call_id);
        } catch (err) {
          console.error('[PARALLEL] hangup failed:', leg.telnyx_call_id, err);
        }
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
