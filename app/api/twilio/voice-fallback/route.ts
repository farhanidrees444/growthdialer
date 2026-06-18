import { twilioVoiceFallbackTwiml } from '@/lib/twilio/handle-voice-webhook';

/** POST /api/twilio/voice-fallback — apology + hangup when primary voice URL fails */
export async function POST() {
  return twilioVoiceFallbackTwiml();
}
