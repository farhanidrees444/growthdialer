import { createServiceClient } from '@/lib/supabase/service';
import { markWebhookProcessed } from '@/lib/telephony/telnyx/webhook-log';
import { resolveWorkspaceForDid } from '@/lib/telephony/telnyx/inbound';
import { normalizeE164 } from '@/lib/inbound/phone';
import {
  isSmsOptOutKeyword,
  recordSmsOptOut,
  getWorkspaceMessagingProfile,
} from '@/lib/compliance/sms-gate';
import { extractEventType } from '@/lib/telephony/telnyx/webhook-log';

function readPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const data = payload.data as Record<string, unknown> | undefined;
  return (data?.payload as Record<string, unknown> | undefined) ?? {};
}

function readDeliveryStatus(inner: Record<string, unknown>): string | null {
  const to = inner.to as Array<{ status?: string }> | undefined;
  const first = to?.[0]?.status;
  if (typeof first === 'string') return first;
  const status = inner.status;
  return typeof status === 'string' ? status : null;
}

async function updateMessageStatus(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  messageId: string | null,
  status: string,
  errorMessage?: string | null,
): Promise<void> {
  if (!messageId) return;

  const mapped =
    status === 'delivered' ? 'delivered'
    : status === 'sent' || status === 'sending' ? 'sent'
    : status === 'delivery_failed' || status === 'failed' ? 'failed'
    : null;

  if (!mapped) return;

  await supabase
    .from('sms_messages')
    .update({
      status: mapped,
      error_message: errorMessage ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_message_id', messageId);
}

function readPhoneField(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'phone_number' in value) {
    const phone = (value as { phone_number?: string }).phone_number;
    return typeof phone === 'string' ? phone : '';
  }
  if (Array.isArray(value) && value[0]) {
    return readPhoneField(value[0]);
  }
  return '';
}

async function handleInboundMessage(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  inner: Record<string, unknown>,
  messageId: string | null,
): Promise<void> {
  const fromNumber = normalizeE164(readPhoneField(inner.from));
  const toNumber = normalizeE164(readPhoneField(inner.to));
  const body = typeof inner.text === 'string' ? inner.text : '';

  if (!toNumber || !fromNumber) {
    return;
  }

  const workspaceId = await resolveWorkspaceForDid(supabase, toNumber);
  if (!workspaceId) return;

  const profile = await getWorkspaceMessagingProfile(supabase, workspaceId);
  const keywords = profile?.opt_out_keywords ?? undefined;

  if (isSmsOptOutKeyword(body, keywords)) {
    await recordSmsOptOut(supabase, workspaceId, fromNumber, 'keyword');
    console.log('[telephony/sms] opt-out recorded:', fromNumber, 'workspace:', workspaceId);
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('phone', fromNumber)
    .maybeSingle();

  if (!messageId) return;

  await supabase.from('sms_messages').upsert({
    workspace_id: workspaceId,
    lead_id: lead?.id ?? null,
    direction: 'inbound',
    from_number: fromNumber,
    to_number: toNumber,
    body,
    provider_message_id: messageId,
    status: 'received',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'provider_message_id' });
}

export async function processSmsWebhookEvent(
  eventLogId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) {
    await markWebhookProcessed(eventLogId, 'failed', 'service_client_unavailable');
    return;
  }

  const eventType = extractEventType(payload);
  const inner = readPayload(payload);
  const messageId = typeof inner.id === 'string' ? inner.id : null;

  try {
    if (eventType === 'message.received') {
      await handleInboundMessage(supabase, inner, messageId);
      await markWebhookProcessed(eventLogId, 'processed');
      return;
    }

    if (
      eventType === 'message.sent'
      || eventType === 'message.finalized'
      || eventType === 'message.delivery.failed'
    ) {
      const deliveryStatus = readDeliveryStatus(inner)
        ?? (eventType === 'message.delivery.failed' ? 'failed' : 'sent');
      const errors = inner.errors as Array<{ detail?: string }> | undefined;
      const errorMessage = errors?.[0]?.detail ?? null;
      await updateMessageStatus(supabase, messageId, deliveryStatus, errorMessage);
      await markWebhookProcessed(eventLogId, 'processed');
      return;
    }

    await markWebhookProcessed(eventLogId, 'ignored', `unhandled_event:${eventType}`);
  } catch (error) {
    console.error('[telephony/sms] processor error:', error);
    await markWebhookProcessed(
      eventLogId,
      'failed',
      error instanceof Error ? error.message : 'processor_failed',
    );
  }
}
