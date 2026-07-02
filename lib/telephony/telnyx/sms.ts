import type { SupabaseClient } from '@supabase/supabase-js';
import type { MessageHandle, SendSMSParams } from '@/lib/telephony/types';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { readMessagingProfileId } from '@/lib/telephony/telnyx/env';

export async function sendProviderSms(
  supabase: SupabaseClient,
  params: SendSMSParams,
): Promise<MessageHandle> {
  const messagingProfileId = readMessagingProfileId();
  if (!messagingProfileId) {
    throw new Error('Messaging is not configured for this workspace');
  }

  const { data: row, error: insertError } = await supabase
    .from('sms_messages')
    .insert({
      workspace_id: params.tenantId,
      lead_id: params.leadId ?? null,
      direction: 'outbound',
      from_number: params.from,
      to_number: params.to,
      body: params.body,
      status: 'queued',
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[telephony/sms] insert failed:', insertError);
  }

  const result = await telephonyRequest<{ data?: { id?: string } }>(
    '/messages',
    {
      method: 'POST',
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        text: params.body,
        messaging_profile_id: messagingProfileId,
      }),
    },
  );

  const messageId = result.data?.id;
  if (!messageId) {
    throw new Error('Messaging provider did not return a message id');
  }

  if (row?.id) {
    await supabase
      .from('sms_messages')
      .update({
        provider_message_id: messageId,
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
  }

  return {
    messageId,
    dbMessageId: row?.id ?? null,
    status: 'sent',
  };
}
