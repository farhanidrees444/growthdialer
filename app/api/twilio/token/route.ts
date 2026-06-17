'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

/**
 * GET /api/twilio/token
 * Issues a short-lived Twilio AccessToken with a VoiceGrant for the
 * authenticated user so the browser can register a Twilio Device.
 */
export async function GET(request: NextRequest) {
  const started = Date.now();

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_AUTH_TOKEN;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error('[TwilioToken] Missing Twilio environment variables');
      return NextResponse.json(
        { error: 'Voice service configuration incomplete' },
        { status: 500 },
      );
    }

    // Use the user's ID as the client identity so Twilio can route
    // inbound calls to this specific agent.
    const identity = authUser.id;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: 3600, // 1 hour — browser will refresh before expiry
    });

    token.addGrant(voiceGrant);

    const jwt = token.toJwt();

    console.log(
      `[TwilioToken] Issued token for identity=${identity} in ${Date.now() - started}ms`,
    );

    return NextResponse.json({
      token: jwt,
      identity,
    });
  } catch (error) {
    console.error(
      '[TwilioToken] Exception:',
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: 'Could not issue voice credentials' },
      { status: 500 },
    );
  }
}