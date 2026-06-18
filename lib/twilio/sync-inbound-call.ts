import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeE164 } from '@/lib/inbound/phone';

function mapInboundStatus(params: Record<string, string>): string {
  const dialStatus = params.DialCallStatus?.trim().toLowerCase();
  if (dialStatus === 'answered') return 'active';
  if (dialStatus === 'completed') return 'completed';
  if (dialStatus === 'busy' || dialStatus === 'failed' || dialStatus === 'no-answer') return 'missed';

  const callStatus = params.CallStatus?.trim().toLowerCase();
  switch (callStatus) {
    case 'queued':
    case 'ringing':
    case 'in-progress':
      return 'ringing';
    case 'completed':
      return 'completed';
    case 'busy':
    case 'failed':
    case 'no-answer':
    case 'canceled':
      return 'missed';
    default:
      return callStatus || 'ringing';
  }
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
    workspaceId?: string | null;
    ownerAgentId?: string | null;
    routedAgentId?: string | null;
  },
): Promise<void> {
  if (!params.callSid) return;

  await writeInboundCall(supabase, {
    twilio_call_sid: params.callSid,
    workspace_id: params.workspaceId ?? null,
    owner_agent_id: params.ownerAgentId ?? params.routedAgentId ?? null,
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
  const status = mapInboundStatus(params);
  const duration = params.CallDuration ? Number.parseInt(params.CallDuration, 10) : null;
  const now = new Date().toISOString();

  const normalizedTo = normalizeE164(to);
  const updates: Record<string, unknown> = {
    twilio_call_sid: callSid,
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

