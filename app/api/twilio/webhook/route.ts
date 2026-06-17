import { NextRequest, NextResponse } from 'next/server';
import { TWILIO_CLIENT_IDENTITY } from '@/lib/twilio/client-identity';
import { validateTwilioWebhookRequest } from '@/lib/twilio/validate-webhook';
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

/**
 * POST /api/twilio/webhook
 *
 * Handles Twilio voice webhook requests (TwiML App voice URL):
 *   - Inbound PSTN → route to browser Client
 *   - Outbound browser connect → dial PSTN with callerId
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = formDataToParams(formData);
    const to = params.To ?? '';
    const from = params.From ?? '';

    const webhookUrl = request.nextUrl.origin + request.nextUrl.pathname;
    const signature = request.headers.get('x-twilio-signature');
    const verification = validateTwilioWebhookRequest(signature, webhookUrl, params);

    if (!verification.ok) {
      console.error('[TwilioWebhook] Signature validation failed:', verification.reason);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    console.log(`[TwilioWebhook] To=${to} From=${from}`);

    const twilioNumber = process.env.TWILIO_NUMBER?.trim();

    const response = new VoiceResponse();

    // INBOUND: call arrived at our Twilio number → ring browser client
    if (twilioNumber && to === twilioNumber) {
      console.log(`[TwilioWebhook] INBOUND — routing to client ${TWILIO_CLIENT_IDENTITY}`);
      const dial = response.dial({
        callerId: from,
      });
      dial.client(TWILIO_CLIENT_IDENTITY);
    } else {
      // OUTBOUND: browser initiated call → dial PSTN
      console.log('[TwilioWebhook] OUTBOUND — dialing PSTN number');
      const dial = response.dial({
        callerId: twilioNumber ?? undefined,
      });
      dial.number(to);
    }

    const twiml = response.toString();

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
    });
  } catch (error) {
    console.error(
      '[TwilioWebhook] Exception:',
      error instanceof Error ? error.message : String(error),
    );

    const fallback = new VoiceResponse();
    fallback.say('Sorry, an error occurred. Please try again later.');

    return new NextResponse(fallback.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
    });
  }
}
