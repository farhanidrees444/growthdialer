import { readTwilioAccountSid, readTwilioAuthToken } from '@/lib/twilio/voice-config';
import twilio from 'twilio';

/** End an active Twilio call leg via REST (CallSid stored in calls.telnyx_call_id). */
export async function hangupVoiceCall(callSid: string): Promise<void> {
  const accountSid = readTwilioAccountSid();
  const authToken = readTwilioAuthToken();
  if (!accountSid || !authToken) {
    throw new Error('Voice service is not configured');
  }

  const client = twilio(accountSid, authToken);
  await client.calls(callSid).update({ status: 'completed' });
}
