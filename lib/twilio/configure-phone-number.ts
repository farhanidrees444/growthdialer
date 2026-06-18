import { getTwilioRestClient } from '@/lib/twilio/rest-client';
import { readTwilioTwimlAppSid } from '@/lib/twilio/voice-config';
import { normalizeE164 } from '@/lib/inbound/phone';
import { toTwilioClientIdentity } from '@/lib/twilio/client-identity';

const FRIENDLY_PREFIX = 'gd_';

export function twilioNumberFriendlyName(userId: string): string {
  return `${FRIENDLY_PREFIX}${userId}`;
}

export function parseUserIdFromTwilioFriendlyName(name: string | null | undefined): string | null {
  if (!name?.startsWith(FRIENDLY_PREFIX)) return null;
  const userId = name.slice(FRIENDLY_PREFIX.length);
  return /^[0-9a-f-]{36}$/i.test(userId) ? userId : null;
}

/** Point an owned Twilio DID at the GrowthDialer TwiML App. */
export async function configureTwilioNumberVoiceApp(
  e164: string,
  userId?: string,
): Promise<boolean> {
  const phone = normalizeE164(e164);
  const twimlAppSid = readTwilioTwimlAppSid();
  const client = getTwilioRestClient();
  if (!phone || !twimlAppSid || !client) return false;

  try {
    const matches = await client.incomingPhoneNumbers.list({ phoneNumber: phone, limit: 1 });
    const incoming = matches[0];
    if (!incoming?.sid) return false;

    await client.incomingPhoneNumbers(incoming.sid).update({
      voiceApplicationSid: twimlAppSid,
      ...(userId ? { friendlyName: twilioNumberFriendlyName(userId) } : {}),
    });
    return true;
  } catch (err) {
    console.error('[Twilio] number voice app update failed:', phone, err);
    return false;
  }
}

/** Configure every number in the Twilio account tagged to this user. */
export async function configureAllTwilioNumbersForUser(userId: string): Promise<{
  configured: number;
  failed: number;
}> {
  const client = getTwilioRestClient();
  const twimlAppSid = readTwilioTwimlAppSid();
  if (!client || !twimlAppSid) return { configured: 0, failed: 0 };

  let configured = 0;
  let failed = 0;
  const friendly = twilioNumberFriendlyName(userId);

  try {
    const numbers = await client.incomingPhoneNumbers.list({ limit: 200 });
    for (const num of numbers) {
      if (num.friendlyName !== friendly && !num.friendlyName?.includes(userId)) continue;
      try {
        await client.incomingPhoneNumbers(num.sid).update({
          voiceApplicationSid: twimlAppSid,
          friendlyName: friendly,
        });
        configured += 1;
      } catch {
        failed += 1;
      }
    }
  } catch (err) {
    console.error('[Twilio] configureAllTwilioNumbersForUser failed:', err);
  }

  return { configured, failed };
}
