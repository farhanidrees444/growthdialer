import { NextRequest, NextResponse } from 'next/server';
import { VoiceResponse, validateTwilioRequest } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    // Validate Twilio request signature
    const signature = request.headers.get('x-twilio-signature');
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/outbound-twiml`;

    if (!signature) {
      console.error('Missing Twilio signature on outbound TwiML');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const body: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      body[key] = value;
    }

    // Validate signature
    if (!validateTwilioRequest(url, signature, body)) {
      console.error('Invalid Twilio signature on outbound TwiML');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { AnsweredBy, CallSid, UserId, userId } = body;
    // Prefer the userId forwarded via status-callback params; fall back to default
    const agentIdentity = UserId || userId || 'default-user';

    const twiml = new VoiceResponse();

    // Check if voicemail was detected
    if (AnsweredBy === 'machine_start' || AnsweredBy === 'machine_end_beep') {
      // Leave voicemail message
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Hello, this is an automated call from GrowthDialer. We\'re reaching out about your business needs. Please call us back at your earliest convenience to discuss how we can help grow your sales. Thank you.');

      twiml.hangup();

      console.log('Voicemail message left for call:', CallSid);
    } else {
      // Human answered - connect to agent
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Please hold while we connect you to the next available representative.');

      const dial = twiml.dial({
        action: '/api/twilio/dial-complete',
      });

      dial.client(agentIdentity);
    }

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Outbound TwiML error:', error);
    const twiml = new VoiceResponse();
    twiml.say('An error occurred. Please try again.');
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}