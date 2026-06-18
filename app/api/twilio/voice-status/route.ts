import { NextRequest } from 'next/server';
import { handleTwilioStatusCallback } from '@/lib/twilio/handle-status-callback';

/** POST /api/twilio/voice-status — canonical inbound voice status callback. */
export async function POST(request: NextRequest) {
  return handleTwilioStatusCallback(request, '/api/twilio/voice-status');
}
