import type { SupabaseClient } from '@supabase/supabase-js';
import telnyxClient, { toE164 } from '@/lib/telnyx';
import { fetchDialerQueueLeads } from '@/lib/dialer/queue-query';
import type { DialerQueueConfig } from '@/lib/dialer/queue-query';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { resolveCallerIdForLead } from '@/lib/dialer/resolve-caller-id';
import type { ParallelDialLeg, ParallelDialSession } from './types';

export async function dialParallelBatch(
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
  const amd = session.amd_enabled ? 'detect' : undefined;

  const legs: ParallelDialLeg[] = [];

  for (const lead of leads as LeadRecord[]) {
    const e164 = toE164(lead.phone);
    if (!e164) continue;

    const { fromNumber } = await resolveCallerIdForLead(supabase, userId, lead.phone);

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
      const result = await telnyxClient.calls.dial({
        connection_id: process.env.TELNYX_CONNECTION_ID!,
        to: e164,
        from: fromNumber,
        webhook_url: webhookUrl,
        webhook_url_method: 'POST',
        ...(amd ? { answering_machine_detection: amd } : {}),
        client_state: Buffer.from(
          JSON.stringify({ parallel_session_id: session.id, parallel_leg_id: legRow.id }),
        ).toString('base64'),
      });

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
