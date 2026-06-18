import twilio from 'twilio';
import { readTwilioAccountSid, readTwilioAuthToken } from '@/lib/twilio/voice-config';

/** Server-side Twilio REST client (Account SID + Auth Token). */
export function getTwilioRestClient(): twilio.Twilio | null {
  const accountSid = readTwilioAccountSid();
  const authToken = readTwilioAuthToken();
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}
