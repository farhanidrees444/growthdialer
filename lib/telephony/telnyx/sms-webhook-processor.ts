import { createServiceClient } from '@/lib/supabase/service';
import { markWebhookProcessed } from '@/lib/telephony/telnyx/webhook-log';
import { resolveWorkspaceForDid } from '@/lib/telephony/telnyx/inbound';

function readPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const data = payload.data as Record<string, unknown> | undefined;
  return (data?.payload as Record<string, unknown> | undefined) ?? {};
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

  const inner = readPayload(payload);
  const messageId = typeof inner.id === 'string' ? inner.id : null;
  const fromNumber = typeof inner.from === 'string' ? inner.from : '';
  const toNumber = typeof inner.to === 'string' ? inner.to : '';
  const body = typeof inner.text === 'string' ? inner.text : '';

  try {
    const workspaceId = await resolveWorkspaceForDid(supabase, toNumber);
    if (!workspaceId) {
      await markWebhookProcessed(eventLogId, 'ignored', 'unknown_destination_number');
      return;
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('phone', fromNumber)
      .maybeSingle();

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

    await markWebhookProcessed(eventLogId, 'processed');
  } catch (error) {
    console.error('[telephony/sms] processor error:', error);
    await markWebhookProcessed(
      eventLogId,
      'failed',
      error instanceof Error ? error.message : 'processor_failed',
    );
  }
}
