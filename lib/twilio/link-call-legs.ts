import type { SupabaseClient } from '@supabase/supabase-js';
import { isTwilioCallSid } from '@/lib/twilio/extract-call-sid';
import { findCallByTwilioLegs, findRecentInboundRingingCall } from '@/lib/twilio/find-call-row';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';

export interface LinkCallLegsInput {
  userId: string;
  callSid: string;
  parentCallSid?: string | null;
  provisionalId?: string | null;
  dbId?: string | null;
  direction?: 'inbound' | 'outbound';
  fromNumber?: string | null;
  toNumber?: string | null;
  leadId?: string | null;
}

/**
 * Attach real Twilio CallSids to calls rows.
 * telnyx_call_id = primary leg; telnyx_session_id = paired leg; telnyx_webrtc_leg_id = browser leg (inbound).
 */
export async function linkCallLegs(
  supabase: SupabaseClient,
  input: LinkCallLegsInput,
): Promise<{ id: string | null }> {
  const callSid = input.callSid.trim();
  if (!isTwilioCallSid(callSid)) return { id: null };

  const parentSid = isTwilioCallSid(input.parentCallSid) ? input.parentCallSid!.trim() : null;
  const provisional = input.provisionalId?.trim() || null;

  let row =
    (input.dbId
      ? (await supabase
          .from('calls')
          .select('id, user_id, direction, telnyx_call_id, telnyx_session_id, telnyx_webrtc_leg_id')
          .eq('id', input.dbId)
          .maybeSingle()).data
      : null)
    ?? await findCallByTwilioLegs(supabase, [callSid, parentSid, provisional])
    ?? (provisional
      ? (await supabase
          .from('calls')
          .select('id, user_id, direction, telnyx_call_id, telnyx_session_id, telnyx_webrtc_leg_id')
          .eq('telnyx_call_id', provisional)
          .eq('user_id', input.userId)
          .maybeSingle()).data
      : null);

  if (!row && input.direction === 'inbound') {
    row = await findRecentInboundRingingCall(supabase, input.userId);
  }

  const updates: Record<string, unknown> = {};

  if (row) {
    if (input.direction === 'inbound') {
      updates.telnyx_webrtc_leg_id = callSid;
      if (parentSid && !row.telnyx_call_id) updates.telnyx_call_id = parentSid;
      else if (parentSid && row.telnyx_call_id !== parentSid) updates.telnyx_session_id = parentSid;
    } else {
      updates.telnyx_call_id = callSid;
      if (parentSid) updates.telnyx_session_id = parentSid;
    }

    if (input.leadId) updates.lead_id = input.leadId;
    if (input.fromNumber) updates.from_number = normalizeE164(input.fromNumber) ?? input.fromNumber;
    if (input.toNumber) updates.to_number = normalizeE164(input.toNumber) ?? input.toNumber;

    await supabase.from('calls').update(updates).eq('id', row.id);
    return { id: row.id as string };
  }

  if (input.direction !== 'inbound') {
    return { id: null };
  }

  const workspaceId = await resolveUserWorkspaceId(supabase, input.userId);
  const now = new Date().toISOString();
  const { data: inserted } = await supabase
    .from('calls')
    .insert({
      user_id: input.userId,
      workspace_id: workspaceId,
      direction: 'inbound',
      telnyx_call_id: parentSid ?? callSid,
      telnyx_webrtc_leg_id: callSid,
      telnyx_session_id: parentSid && parentSid !== callSid ? callSid : null,
      from_number: input.fromNumber ? normalizeE164(input.fromNumber) ?? input.fromNumber : null,
      to_number: input.toNumber ? normalizeE164(input.toNumber) ?? input.toNumber : null,
      lead_id: input.leadId ?? null,
      status: 'ringing',
      started_at: now,
    })
    .select('id')
    .single();

  return { id: (inserted?.id as string | undefined) ?? null };
}
