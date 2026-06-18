import { NextRequest } from 'next/server';
import { handleTwilioVoiceWebhook } from '@/lib/twilio/handle-voice-webhook';

/** POST /api/twilio/webhook — compatibility alias for older configured voice URLs. */
export async function POST(request: NextRequest) {
  return handleTwilioVoiceWebhook(request, '/api/twilio/webhook');
}
