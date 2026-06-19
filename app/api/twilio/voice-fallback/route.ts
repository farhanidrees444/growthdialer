import type { NextRequest } from 'next/server';
import { twilioVoiceFallbackTwiml } from '@/lib/twilio/handle-voice-webhook';

/** POST /api/twilio/voice-fallback — apology + hangup when primary voice URL fails */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const errorCode = formData.get('ErrorCode')?.toString();
    const errorUrl = formData.get('ErrorUrl')?.toString();
    const callSid = formData.get('CallSid')?.toString();
    if (errorCode || errorUrl) {
      console.error('[TwilioVoiceFallback] primary webhook failed', {
        errorCode,
        errorUrl,
        callSid,
      });
    }
  } catch {
    /* still return TwiML */
  }
  return twilioVoiceFallbackTwiml(request);
}
