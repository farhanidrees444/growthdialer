import type { SupabaseClient } from '@supabase/supabase-js';
import { isTwilioCallSid } from '@/lib/twilio/extract-call-sid';

export interface CallRowMatch {
  id: string;
  user_id: string;
  workspace_id: string | null;
  status: string;
  direction: string;
  answered_at: string | null;
  telnyx_call_id: string | null;
  telnyx_session_id: string | null;
  telnyx_webrtc_leg_id: string | null;
  lead_id: string | null;
  from_number: string | null;
  to_number: string | null;
}

function uniqueSids(...values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const v of values) {
    const t = v?.trim();
    if (t && isTwilioCallSid(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

/** Find a calls row by any stored Twilio leg id. */
export async function findCallByTwilioLegs(
  supabase: SupabaseClient,
  sids: Array<string | null | undefined>,
): Promise<CallRowMatch | null> {
  const ids = uniqueSids(...sids);
  if (ids.length === 0) return null;

  const orParts: string[] = [];
  for (const sid of ids) {
    orParts.push(`telnyx_call_id.eq.${sid}`);
    orParts.push(`telnyx_session_id.eq.${sid}`);
    orParts.push(`telnyx_webrtc_leg_id.eq.${sid}`);
  }

  const { data } = await supabase
    .from('calls')
    .select(
      'id, user_id, workspace_id, status, direction, answered_at, telnyx_call_id, telnyx_session_id, telnyx_webrtc_leg_id, lead_id, from_number, to_number',
    )
    .or(orParts.join(','))
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as CallRowMatch | null) ?? null;
}

/** Find recent ringing inbound call for user when only client leg sid is known. */
export async function findRecentInboundRingingCall(
  supabase: SupabaseClient,
  userId: string,
  withinMinutes = 5,
): Promise<CallRowMatch | null> {
  const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
  const { data } = await supabase
    .from('calls')
    .select(
      'id, user_id, workspace_id, status, direction, answered_at, telnyx_call_id, telnyx_session_id, telnyx_webrtc_leg_id, lead_id, from_number, to_number',
    )
    .eq('user_id', userId)
    .eq('direction', 'inbound')
    .in('status', ['ringing', 'initiated', 'connecting'])
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as CallRowMatch | null) ?? null;
}
