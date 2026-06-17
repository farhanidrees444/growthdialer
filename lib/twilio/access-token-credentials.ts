/**
 * Resolve Twilio AccessToken signing credentials.
 * Prefers API Key + Secret; falls back to Account SID + Auth Token.
 */
export function resolveTwilioAccessTokenCredentials(): {
  accountSid: string;
  signingKeySid: string;
  secret: string;
} | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  if (!accountSid) return null;

  const apiKey = process.env.TWILIO_API_KEY?.trim();
  const apiSecret = process.env.TWILIO_API_SECRET?.trim();
  if (apiKey && apiSecret) {
    return { accountSid, signingKeySid: apiKey, secret: apiSecret };
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (authToken) {
    return { accountSid, signingKeySid: accountSid, secret: authToken };
  }

  return null;
}
