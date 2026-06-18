import type { SupabaseClient } from '@supabase/supabase-js';
import { getCachedNumberOwner } from '@/lib/inbound/number-owner-cache';
import { normalizeE164 } from '@/lib/inbound/phone';
import { resolveUserWorkspaceId } from '@/lib/inbound/resolve-workspace';

const INBOUND_STATUS_MAP: Record<string, string> = {
  queued: 'ringing',
  ringing: 'ringing',
  'in-progress': 'active',
  completed: 'completed',
  busy: 'missed',
  failed: 'failed',
  'no-answer': 'missed',
  canceled: 'missed',
};

function mapInboundStatus(raw: string | null | undefined): string {
  if (!raw) return 'ringing';
  return INBOUND_STATUS_MAP[raw.toLowerCase()] ?? raw.toLowerCase();
}

async function writeInboundCall(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('inbound_calls')
    .upsert(row, { onConflict: 'twilio_call_sid' });

  if (error?.code === '42P01') return;
  if (error) console.warn('[TwilioInboundCalls] write failed:', error.message);
}

export async function recordInboundCallStarted(
  supabase: SupabaseClient,
  params: {
    callSid: string | null;
    fromNumber: string;
    toNumber: string;
    ownerAgentId: string;
    workspaceId?: string | null;
    routedAgentId?: string | null;
  },
): Promise<void> {
  if (!params.callSid) return;

  await writeInboundCall(supabase, {
    twilio_call_sid: params.callSid,
    workspace_id: params.workspaceId ?? null,
    owner_agent_id: params.ownerAgentId,
    routed_agent_id: params.routedAgentId ?? null,
    from_number: normalizeE164(params.fromNumber) ?? params.fromNumber,
    to_number: normalizeE164(params.toNumber) ?? params.toNumber,
    status: 'ringing',
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function syncInboundCallFromTwilioStatus(
  supabase: SupabaseClient,
  params: Record<string, string>,
): Promise<void> {
  const callSid = params.CallSid?.trim();
  if (!callSid) return;

  const direction = (params.Direction ?? '').toLowerCase();
  const from = params.From ?? '';
  const to = params.To ?? '';
  const parentCallSid = params.ParentCallSid?.trim() || null;
  const status = mapInboundStatus(params.CallStatus ?? params.DialCallStatus);
  const duration = params.CallDuration ? Number.parseInt(params.CallDuration, 10) : null;
  const now = new Date().toISOString();

  const normalizedTo = normalizeE164(to);
  const owner = normalizedTo ? await getCachedNumberOwner(supabase, normalizedTo) : null;
  const workspaceId = owner?.workspace_id
    ?? (owner?.user_id ? await resolveUserWorkspaceId(supabase, owner.user_id) : null);

  const updates: Record<string, unknown> = {
    twilio_call_sid: callSid,
    twilio_parent_call_sid: parentCallSid,
    workspace_id: workspaceId,
    owner_agent_id: owner?.user_id ?? null,
    from_number: normalizeE164(from) ?? from,
    to_number: normalizedTo ?? to,
    status,
    updated_at: now,
  };

  if (direction.includes('inbound') && status === 'ringing') {
    updates.started_at = now;
  }

  if (status === 'active') updates.answered_at = now;
  if (status === 'completed' || status === 'missed' || status === 'voicemail' || status === 'failed') {
    updates.ended_at = now;
    if (duration != null && !Number.isNaN(duration) && duration >= 0) {
      updates.duration_seconds = duration;
    }
  }

  await writeInboundCall(supabase, updates);
}

