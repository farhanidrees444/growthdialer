import { NextResponse } from 'next/server';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';

/** Block legacy Telnyx-only number APIs when Twilio is the active voice provider. */
export function blockLegacyTelnyxNumberApi(): NextResponse | null {
  if (!isTwilioVoiceConfigured()) return null;
  return NextResponse.json(
    {
      error:
        'Self-serve number purchase is not available yet. Contact support to assign a voice line to your account.',
    },
    { status: 503 },
  );
}
