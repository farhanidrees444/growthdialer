import twilio, { twiml } from 'twilio';

// Twilio REST client singleton
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// AccessToken generator for browser client
export function generateAccessToken(identity: string): string {
  const { AccessToken } = twilio.jwt;
  const { VoiceGrant } = AccessToken;

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
    incomingAllow: true,
  });

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY_SID!,
    process.env.TWILIO_API_KEY_SECRET!,
    { identity, ttl: 3600 } // 1 hour expiry
  );

  token.addGrant(voiceGrant);
  return token.toJwt();
}

// Twilio request validator for webhook security
export function validateTwilioRequest(
  url: string,
  signature: string,
  body: Record<string, any>
): boolean {
  const { validateRequest } = twilio;
  return validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    body
  );
}

// VoiceResponse export for TwiML generation
export const VoiceResponse = twiml.VoiceResponse;

// Utility function to validate E.164 phone numbers
export function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

// Utility function to check if number is premium/international (basic check)
export function isPremiumNumber(phone: string): boolean {
  // Block premium numbers (starting with certain codes)
  const premiumPrefixes = ['+1900', '+1970', '+1980'];
  return premiumPrefixes.some(prefix => phone.startsWith(prefix));
}