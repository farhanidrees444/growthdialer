import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';
import { toE164 } from '@/lib/telnyx';
import { fetchDialerQueueLeads } from '@/lib/dialer/queue-query';
import type { DialerQueueConfig } from '@/lib/dialer/queue-query';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { prefetchUserCallerNumbers, resolveCallerIdFromCache } from '@/lib/dialer/resolve-caller-id';
import type { ParallelDialLeg, ParallelDialSession } from '@/lib/parallel-dial/types';
import { createTwilioOutboundCall } from '@/lib/twilio/outbound-call';
import { triggerParallelLegTrackingAsync } from '@/lib/parallel-dial/leg-tracking';

export async function dialParallelBatchTwilio(
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
  const numberCache = await prefetchUserCallerNumbers(supabase, userId);
  const legs: ParallelDialLeg[] = [];
  const amd = session.amd_enabled;

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
      console.error('[TwilioParallel] leg insert failed:', legErr);
      continue;
    }

    try {
      const { callSid } = await createTwilioOutboundCall({
        to: e164,
        from: fromNumber,
        userId,
        machineDetection: amd,
        extraQuery: {
          gd_parallel_session_id: session.id,
          gd_parallel_leg_id: legRow.id,
        },
      });

      const nowIso = new Date().toISOString();
      let callId: string | null = null;

      if (callSid) {
        const { data: callRow } = await supabase
          .from('calls')
          .insert({
            user_id: userId,
            workspace_id: session.workspace_id,
            lead_id: lead.id,
            direction: 'outbound',
            to_number: e164,
            from_number: fromNumber,
            telnyx_call_id: callSid,
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
          telnyx_call_id: callSid ?? null,
          call_id: callId,
          status: callSid ? 'ringing' : 'failed',
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
        telnyx_call_id: callSid ?? null,
        phone: normalizeE164(e164) ?? e164,
        lead_id: lead.id,
        at: nowIso,
      });
    } catch (err) {
      console.error(`[TwilioParallel] dial failed for ${e164}:`, err);
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
