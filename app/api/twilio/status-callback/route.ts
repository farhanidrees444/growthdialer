import { NextRequest } from 'next/server';
import { handleTwilioStatusCallback } from '@/lib/twilio/handle-status-callback';

/** POST /api/twilio/status-callback */
export async function POST(request: NextRequest) {
  return handleTwilioStatusCallback(request, '/api/twilio/status-callback');
}
