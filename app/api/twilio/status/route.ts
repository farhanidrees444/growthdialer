import { NextRequest } from 'next/server';
import { handleTwilioStatusCallback } from '@/lib/twilio/handle-status-callback';

/** POST /api/twilio/status — compatibility alias for older configured status callbacks. */
export async function POST(request: NextRequest) {
  return handleTwilioStatusCallback(request, '/api/twilio/status');
}
