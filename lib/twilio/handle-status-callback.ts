import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { syncCallFromTwilioStatus } from '@/lib/twilio/sync-call-from-status';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { resolveTwilioSignedWebhookUrl } from '@/lib/twilio/signed-webhook-url';
import { createServiceClient } from '@/lib/supabase/service';
import { formDataToTwilioParams } from '@/lib/twilio/handle-voice-webhook';
import { logCallEvent } from '@/lib/webhooks/log-call-event';
import { processTwilioDialerStatusCallback } from '@/lib/twilio/dialer-status';
import { syncInboundCallFromTwilioStatus } from '@/lib/twilio/sync-inbound-call';

export async function handleTwilioStatusCallback(
  request: NextRequest,
  webhookPath: string,
): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const params = formDataToTwilioParams(formData);

    const webhookUrl = resolveTwilioSignedWebhookUrl(webhookPath, request.nextUrl.origin);
    const signature = request.headers.get('x-twilio-signature');
    const verification = validateTwilioWebhookRequest(signature, webhookUrl, params);

    if (!verification.ok) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const supabase = createServiceClient();
    if (supabase) {
      const callSid = params.CallSid?.trim() ?? '';
      const callStatus = params.CallStatus?.trim() ?? params.AnsweredBy?.trim() ?? '';
      const now = new Date().toISOString();
      const isInbound = (params.Direction ?? '').toLowerCase().includes('inbound');

      void logCallEvent(supabase, {
        call_control_id: callSid,
        event_type: `twilio_${callStatus || 'callback'}`,
        received_at: now,
        telnyx_status: callStatus || null,
      });

      if (isInbound) {
        void syncInboundCallFromTwilioStatus(supabase, params).catch((err) => {
          console.error('[TwilioStatusCallback] inbound sync:', err);
        });
      } else {
        void processTwilioDialerStatusCallback(supabase, params).catch((err) => {
          console.error('[TwilioStatusCallback] dialer processing:', err);
        });

        void syncCallFromTwilioStatus(supabase, params).catch((err) => {
          console.error('[TwilioStatusCallback] sync:', err);
        });
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error(
      '[TwilioStatusCallback] Exception:',
      error instanceof Error ? error.message : String(error),
    );
    return new NextResponse(null, { status: 200 });
  }
}
