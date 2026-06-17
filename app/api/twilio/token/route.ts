import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TWILIO_CLIENT_IDENTITY } from '@/lib/twilio/client-identity';
import {
  readTwilioAccountSid,
  readTwilioAuthToken,
  readTwilioTwimlAppSid,
} from '@/lib/twilio/voice-config';
import twilio from 'twilio';

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

/**
 * GET /api/twilio/token
 * Issues a short-lived Twilio AccessToken with VoiceGrant for browser Device registration.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountSid = readTwilioAccountSid();
    const authToken = readTwilioAuthToken();
    const twimlAppSid = readTwilioTwimlAppSid();

    if (!accountSid || !authToken || !twimlAppSid) {
      console.error('[TwilioToken] Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_TWIML_APP_SID');
      return NextResponse.json(
        { error: 'Voice service configuration incomplete' },
        { status: 500 },
      );
    }

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    const token = new AccessToken(
      accountSid,
      accountSid,
      authToken,
      {
        identity: TWILIO_CLIENT_IDENTITY,
        ttl: 3600,
      },
    );

    token.addGrant(voiceGrant);

    return NextResponse.json({
      token: token.toJwt(),
      identity: TWILIO_CLIENT_IDENTITY,
    });
  } catch (error) {
    console.error('[TwilioToken] Exception:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Could not issue voice credentials' },
      { status: 500 },
    );
  }
}
