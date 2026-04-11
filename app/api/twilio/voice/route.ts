import { NextRequest, NextResponse } from 'next/server';
import { VoiceResponse, validateTwilioRequest, isValidPhoneNumber } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-twilio-signature');
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`;

    const formData = await request.formData();
    const body: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      body[key] = value;
    }

    if (!signature || !validateTwilioRequest(url, signature, body)) {
      console.warn('Twilio voice request failed validation, returning safe TwiML response.');
      const twiml = new VoiceResponse();
      twiml.say('Unauthorized request.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const { To, From, Direction, CallSid, LeadId, UserId } = body;

    const twiml = new VoiceResponse();
    const twilioCallerId = process.env.TWILIO_PHONE_NUMBER || undefined;

    if (To) {
      if (To.startsWith('client:')) {
        const dial = twiml.dial({
          callerId: twilioCallerId,
          record: 'record-from-answer-dual',
          action: '/api/twilio/dial-complete',
        });
        dial.client(To.replace('client:', ''));
      } else if (isValidPhoneNumber(To)) {
        const dial = twiml.dial({
          callerId: twilioCallerId,
          record: 'record-from-answer-dual',
          action: '/api/twilio/dial-complete',
        });
        dial.number(To);
      } else {
        twiml.say('Invalid destination number');
        twiml.hangup();
      }
    } else {
      const dial = twiml.dial({
        callerId: twilioCallerId,
        record: 'record-from-answer-dual',
        action: '/api/twilio/dial-complete',
      });
      dial.client('default-user');
    }

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Voice endpoint error:', error);
    const twiml = new VoiceResponse();
    twiml.say('An error occurred. Please try again.');
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

// Handle GET requests (Twilio sometimes sends GET)
export async function GET() {
  const twiml = new VoiceResponse();
  twiml.say('Voice endpoint is working');
  twiml.hangup();

  return new NextResponse(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}