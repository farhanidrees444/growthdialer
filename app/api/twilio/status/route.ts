import { NextRequest, NextResponse } from 'next/server';
import { syncCallFromTwilioStatus } from '@/lib/twilio/sync-call-from-status';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import { resolveTwilioSignedWebhookUrl } from '@/lib/twilio/signed-webhook-url';
import { createServiceClient } from '@/lib/supabase/service';

function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

/**
 * POST /api/twilio/status
 * Twilio call status callbacks — persist lifecycle to calls table.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = formDataToParams(formData);

    const webhookUrl = resolveTwilioSignedWebhookUrl('/api/twilio/status', request.nextUrl.origin);
    const signature = request.headers.get('x-twilio-signature');
    const verification = validateTwilioWebhookRequest(signature, webhookUrl, params);

    if (!verification.ok) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    await syncCallFromTwilioStatus(supabase, params);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(
      '[TwilioStatus] Exception:',
      error instanceof Error ? error.message : String(error),
    );
    return new NextResponse(null, { status: 204 });
  }
}
