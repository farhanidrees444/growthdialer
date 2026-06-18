import { NextRequest } from 'next/server';
import { handleTwilioVoiceWebhook } from '@/lib/twilio/handle-voice-webhook';

/** POST /api/twilio/voice — primary TwiML voice URL */
export async function POST(request: NextRequest) {
  return handleTwilioVoiceWebhook(request, '/api/twilio/voice');
}
