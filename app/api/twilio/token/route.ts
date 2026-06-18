import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toTwilioClientIdentity } from '@/lib/twilio/client-identity';
import { resolveTwilioAccessTokenCredentials } from '@/lib/twilio/access-token-credentials';
import { readTwilioTwimlAppSid } from '@/lib/twilio/voice-config';
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

    const creds = resolveTwilioAccessTokenCredentials();
    const twimlAppSid = readTwilioTwimlAppSid();

    if (!creds) {
      console.error('[TwilioToken] Missing TWILIO_ACCOUNT_SID or signing credentials');
      return NextResponse.json(
        { error: 'Voice credentials not configured on server', code: 'missing_credentials' },
        { status: 503 },
      );
    }
    if (!twimlAppSid) {
      console.error('[TwilioToken] Missing TWILIO_TWIML_APP_SID');
      return NextResponse.json(
        { error: 'Voice application not configured on server', code: 'missing_twiml_app' },
        { status: 503 },
      );
    }

    const identity = toTwilioClientIdentity(authUser.id);

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    const token = new AccessToken(
      creds.accountSid,
      creds.signingKeySid,
      creds.secret,
      {
        identity,
        ttl: 3600,
      },
    );

    token.addGrant(voiceGrant);

    return NextResponse.json({
      token: token.toJwt(),
      identity,
    });
  } catch (error) {
    console.error('[TwilioToken] Exception:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Could not issue voice credentials' },
      { status: 500 },
    );
  }
}
