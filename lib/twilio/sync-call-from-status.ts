import type { SupabaseClient } from '@supabase/supabase-js';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';
import { isTwilioCallSid } from '@/lib/twilio/extract-call-sid';
import { findCallByTwilioLegs } from '@/lib/twilio/find-call-row';
import { parseTwilioClientIdentity } from '@/lib/twilio/client-identity';

const STATUS_MAP: Record<string, string> = {
  queued: 'ringing',
  ringing: 'ringing',
  'in-progress': 'active',
  completed: 'completed',
  busy: 'failed',
  failed: 'failed',
  'no-answer': 'missed',
  canceled: 'missed',
};

function mapTwilioStatus(status: string): string {
  return STATUS_MAP[status.toLowerCase()] ?? status.toLowerCase();
}

async function resolveLeadIdForInbound(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  fromNumber: string,
): Promise<string | null> {
  const from = normalizeE164(fromNumber);
  if (!from) return null;

  let query = supabase
    .from('leads')
    .select('id')
    .eq('user_id', userId)
    .eq('phone', from)
    .limit(1);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data } = await query.maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/**
 * Upsert call rows from Twilio status callbacks.
 * Matches primary + paired legs stored in telnyx_call_id / telnyx_session_id / telnyx_webrtc_leg_id.
 */
export async function syncCallFromTwilioStatus(
  supabase: SupabaseClient,
  params: Record<string, string>,
): Promise<void> {
  const callSid = params.CallSid?.trim();
  if (!callSid || !isTwilioCallSid(callSid)) return;

  const parentCallSid = params.ParentCallSid?.trim();
  const callStatus = params.CallStatus?.trim() ?? '';
  const direction = (params.Direction ?? '').toLowerCase();
  const from = params.From ?? '';
  const to = params.To ?? '';
  const duration = params.CallDuration ? Number.parseInt(params.CallDuration, 10) : null;

  const existing = await findCallByTwilioLegs(supabase, [callSid, parentCallSid]);

  const mappedStatus = mapTwilioStatus(callStatus);
  const now = new Date().toISOString();

  if (existing?.id) {
    const updates: Record<string, unknown> = { status: mappedStatus };

    if (parentCallSid && isTwilioCallSid(parentCallSid)) {
      if (existing.telnyx_call_id === callSid && existing.telnyx_session_id !== parentCallSid) {
        updates.telnyx_session_id = parentCallSid;
      } else if (existing.telnyx_call_id === parentCallSid && existing.telnyx_session_id !== callSid) {
        updates.telnyx_session_id = callSid;
      }
    }

    if (mappedStatus === 'active' && !existing.answered_at) {
      updates.answered_at = now;
    }
    if (mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'missed') {
      updates.ended_at = now;
      if (duration != null && !Number.isNaN(duration) && duration > 0) {
        updates.duration_seconds = duration;
      }
    }

    await supabase.from('calls').update(updates).eq('id', existing.id);
    return;
  }

  if (!direction.includes('inbound')) {
    const clientUserId = parseTwilioClientIdentity(from);
    if (clientUserId && direction.includes('outbound')) {
      const toE164 = normalizeE164(to);
      if (!toE164) return;

      const workspaceId = await resolveUserWorkspaceId(supabase, clientUserId);
      await supabase.from('calls').insert({
        user_id: clientUserId,
        workspace_id: workspaceId,
        direction: 'outbound',
        telnyx_call_id: isTwilioCallSid(parentCallSid) ? parentCallSid : callSid,
        telnyx_session_id: isTwilioCallSid(parentCallSid) && parentCallSid !== callSid ? callSid : null,
        from_number: normalizeE164(from) ?? from,
        to_number: toE164,
        status: mappedStatus,
        started_at: now,
        answered_at: mappedStatus === 'active' ? now : null,
        ended_at:
          mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'missed'
            ? now
            : null,
        duration_seconds: duration != null && !Number.isNaN(duration) && duration > 0 ? duration : null,
      });
    }
    return;
  }

  const toE164 = normalizeE164(to);
  if (!toE164) return;

  const owner = await getCachedNumberOwner(supabase, toE164);
  if (!owner?.user_id) return;

  const workspaceId = owner.workspace_id
    ?? await resolveUserWorkspaceId(supabase, owner.user_id);

  const leadId = await resolveLeadIdForInbound(
    supabase,
    owner.user_id,
    workspaceId,
    from,
  );

  await supabase.from('calls').insert({
    user_id: owner.user_id,
    workspace_id: workspaceId,
    lead_id: leadId,
    direction: 'inbound',
    telnyx_call_id: isTwilioCallSid(parentCallSid) ? parentCallSid : callSid,
    telnyx_session_id: isTwilioCallSid(parentCallSid) && parentCallSid !== callSid ? callSid : null,
    from_number: normalizeE164(from) ?? from,
    to_number: toE164,
    status: mappedStatus,
    started_at: now,
    answered_at: mappedStatus === 'active' ? now : null,
    ended_at:
      mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'missed'
        ? now
        : null,
    duration_seconds: duration != null && !Number.isNaN(duration) && duration > 0 ? duration : null,
  });
}
