import type { SupabaseClient } from '@supabase/supabase-js';
import type { MessageHandle, SendSMSParams } from '@/lib/telephony/types';
import { telephonyRequest } from '@/lib/telephony/telnyx/http';
import { readSmsWebhookUrl } from '@/lib/telephony/telnyx/env';
import {
  checkWorkspaceSmsGate,
  isPhoneSmsOptedOut,
} from '@/lib/compliance/sms-gate';
import { assertSmsBodyLength, normalizeSmsBody, withComplianceFooter } from '@/lib/compliance/sms-compose';

export class SmsSendBlockedError extends Error {
  readonly status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function sendProviderSms(
  supabase: SupabaseClient,
  params: SendSMSParams,
): Promise<MessageHandle> {
  const bodyError = assertSmsBodyLength(params.body);
  if (bodyError) {
    throw new SmsSendBlockedError(bodyError, 400);
  }

  const gate = await checkWorkspaceSmsGate(supabase, params.tenantId);
  if (!gate.ok) {
    throw new SmsSendBlockedError(gate.error, gate.status);
  }

  const optedOut = await isPhoneSmsOptedOut(supabase, params.tenantId, params.to);
  if (optedOut) {
    throw new SmsSendBlockedError('This number has opted out of SMS', 403);
  }

  const text = withComplianceFooter(normalizeSmsBody(params.body), true);

  const { data: row, error: insertError } = await supabase
    .from('sms_messages')
    .insert({
      workspace_id: params.tenantId,
      agent_id: params.agentId,
      lead_id: params.leadId ?? null,
      direction: 'outbound',
      from_number: params.from,
      to_number: params.to,
      body: text,
      status: 'queued',
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[telephony/sms] insert failed:', insertError);
  }

  const webhookUrl = readSmsWebhookUrl();
  const payload: Record<string, unknown> = {
    from: params.from,
    to: params.to,
    text,
    messaging_profile_id: gate.messagingProfileId,
  };
  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
    payload.webhook_failover_url = webhookUrl;
  }

  try {
    const result = await telephonyRequest<{ data?: { id?: string } }>(
      '/messages',
      {
        method: 'POST',
        body: JSON.stringify(payload),
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
  } catch (err) {
    if (row?.id) {
      await supabase
        .from('sms_messages')
        .update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'send_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    }
    throw err;
  }
}
