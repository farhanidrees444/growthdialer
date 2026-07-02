import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';

export interface LogWebhookInput {
  channel: 'voice' | 'sms';
  eventType: string;
  payload: Record<string, unknown>;
  providerEventId?: string | null;
  callControlId?: string | null;
  messageId?: string | null;
  workspaceId?: string | null;
  agentId?: string | null;
}

function readNested(payload: Record<string, unknown>, key: string): string | null {
  const data = payload.data as Record<string, unknown> | undefined;
  const payloadObj = data?.payload as Record<string, unknown> | undefined;
  const value = payloadObj?.[key] ?? data?.[key];
  return typeof value === 'string' ? value : null;
}

export function extractCallControlId(payload: Record<string, unknown>): string | null {
  return readNested(payload, 'call_control_id');
}

export function extractMessageId(payload: Record<string, unknown>): string | null {
  return readNested(payload, 'id') ?? readNested(payload, 'message_id');
}

export function extractEventType(payload: Record<string, unknown>): string {
  const data = payload.data as Record<string, unknown> | undefined;
  const eventType = data?.event_type ?? payload.event_type;
  return typeof eventType === 'string' ? eventType : 'unknown';
}

export async function logWebhookEvent(
  input: LogWebhookInput,
  supabase?: SupabaseClient | null,
): Promise<string | null> {
  const client = supabase ?? createServiceClient();
  if (!client) {
    console.error('[telephony/webhook] service client unavailable for event log');
    return null;
  }

  const { data, error } = await client
    .from('telephony_webhook_events')
    .insert({
      channel: input.channel,
      event_type: input.eventType,
      provider_event_id: input.providerEventId ?? null,
      call_control_id: input.callControlId ?? null,
      message_id: input.messageId ?? null,
      workspace_id: input.workspaceId ?? null,
      agent_id: input.agentId ?? null,
      payload: input.payload,
      process_status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[telephony/webhook] failed to log event:', error);
    return null;
  }

  return data?.id ?? null;
}

export async function markWebhookProcessed(
  eventLogId: string,
  status: 'processed' | 'failed' | 'ignored',
  error?: string,
): Promise<void> {
  const client = createServiceClient();
  if (!client) return;

  await client
    .from('telephony_webhook_events')
    .update({
      process_status: status,
      process_error: error ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventLogId);
}
