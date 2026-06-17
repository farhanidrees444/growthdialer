import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toTwilioClientIdentity } from '@/lib/twilio/client-identity';
import { resolveTwilioAccessTokenCredentials } from '@/lib/twilio/access-token-credentials';
import { readTwilioTwimlAppSid, isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';
import twilio from 'twilio';

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

/** Issues Twilio browser voice credentials (legacy path alias for /api/twilio/token). */
export async function POST(_request: NextRequest) {
  if (!isTwilioVoiceConfigured()) {
    return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creds = resolveTwilioAccessTokenCredentials();
    const twimlAppSid = readTwilioTwimlAppSid();
    if (!creds || !twimlAppSid) {
      return NextResponse.json({ error: 'Voice service configuration incomplete' }, { status: 500 });
    }

    const identity = toTwilioClientIdentity(authUser.id);
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    const token = new AccessToken(creds.accountSid, creds.signingKeySid, creds.secret, {
      identity,
      ttl: 3600,
    });
    token.addGrant(voiceGrant);

    return NextResponse.json({
      token: token.toJwt(),
      login_token: token.toJwt(),
      identity,
    });
  } catch (error) {
    console.error('[voice/token] error:', error);
    return NextResponse.json({ error: 'Could not issue credentials' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/voice/token', '/api/twilio/token');
  return NextResponse.redirect(url);
}
