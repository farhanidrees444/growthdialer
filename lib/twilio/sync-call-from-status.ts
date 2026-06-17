import type { SupabaseClient } from '@supabase/supabase-js';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { normalizeE164 } from '@/lib/inbound/phone';
import { parseTwilioClientIdentity } from '@/lib/twilio/client-identity';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';

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

/**
 * Upsert call rows from Twilio status callbacks (CallSid stored in telnyx_call_id column).
 */
export async function syncCallFromTwilioStatus(
  supabase: SupabaseClient,
  params: Record<string, string>,
): Promise<void> {
  const callSid = params.CallSid?.trim();
  if (!callSid) return;

  const callStatus = params.CallStatus?.trim() ?? '';
  const direction = (params.Direction ?? '').toLowerCase();
  const from = params.From ?? '';
  const to = params.To ?? '';
  const duration = params.CallDuration ? Number.parseInt(params.CallDuration, 10) : null;

  const { data: existing } = await supabase
    .from('calls')
    .select('id, user_id, status, answered_at, direction')
    .eq('telnyx_call_id', callSid)
    .maybeSingle();

  const mappedStatus = mapTwilioStatus(callStatus);
  const now = new Date().toISOString();

  if (existing?.id) {
    const updates: Record<string, unknown> = {
      status: mappedStatus,
    };
    if (mappedStatus === 'active' && !existing.answered_at) {
      updates.answered_at = now;
    }
    if (mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'missed') {
      updates.ended_at = now;
      if (duration != null && !Number.isNaN(duration)) {
        updates.duration_seconds = duration;
      }
    }
    await supabase.from('calls').update(updates).eq('id', existing.id);
    return;
  }

  // Create row on first status for inbound PSTN (browser outbound creates row via /api/calls/dial)
  if (!direction.includes('inbound')) return;

  const toE164 = normalizeE164(to);
  if (!toE164) return;

  const owner = await getCachedNumberOwner(supabase, toE164);
  if (!owner?.user_id) return;

  const workspaceId = owner.workspace_id
    ?? await resolveUserWorkspaceId(supabase, owner.user_id);

  await supabase.from('calls').insert({
    user_id: owner.user_id,
    workspace_id: workspaceId,
    direction: 'inbound',
    telnyx_call_id: callSid,
    from_number: normalizeE164(from) ?? from,
    to_number: toE164,
    status: mappedStatus,
    started_at: now,
    answered_at: mappedStatus === 'active' ? now : null,
    ended_at:
      mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'missed'
        ? now
        : null,
    duration_seconds: duration != null && !Number.isNaN(duration) ? duration : null,
  });
}

export async function resolveUserIdFromStatusParams(
  params: Record<string, string>,
): Promise<string | null> {
  const from = params.From ?? '';
  const parsed = parseTwilioClientIdentity(from);
  if (parsed) return parsed;

  const toE164 = normalizeE164(params.To ?? '');
  if (!toE164) return null;

  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();
  if (!supabase) return null;

  const owner = await getCachedNumberOwner(supabase, toE164);
  return owner?.user_id ?? null;
}
