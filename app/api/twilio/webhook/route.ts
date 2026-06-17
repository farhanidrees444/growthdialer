'use server';

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

/**
 * POST /api/twilio/webhook
 *
 * Handles Twilio's incoming voice webhook requests.
 * Twilio calls this URL (configured in the TwiML App) whenever:
 *   - An inbound call arrives at our Twilio number
 *   - An outbound call is initiated from the browser via Device.connect()
 *
 * INBOUND:  To === TWILIO_NUMBER → route the call to our client identity
 * OUTBOUND: To is a PSTN number → dial out to that number with our callerId
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = (formData.get('To') as string) ?? '';
    const from = (formData.get('From') as string) ?? '';

    console.log(`[TwilioWebhook] To=${to} From=${from}`);

    const twilioNumber = process.env.TWILIO_NUMBER;

    const response = new VoiceResponse();

    // INBOUND: The call is coming to our Twilio number.
    // Route it to the client identity registered in the browser.
    if (twilioNumber && to === twilioNumber) {
      console.log('[TwilioWebhook] INBOUND — routing to client identity');
      const dial = response.dial({
        callerId: from, // pass the original caller's number
      });
      dial.client('agent_farhan');
    } else {
      // OUTBOUND: The browser initiated a call to a PSTN number.
      // Dial out to that number with our Twilio number as the callerId.
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

    // Return a safe TwiML response even on error so Twilio doesn't retry endlessly
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