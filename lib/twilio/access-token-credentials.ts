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
  // API keys must be SK… — Account SID (AC…) is a common misconfiguration.
  if (apiKey && apiSecret && /^SK/i.test(apiKey)) {
    return { accountSid, signingKeySid: apiKey, secret: apiSecret };
  }
  if (apiKey && apiSecret && !/^SK/i.test(apiKey)) {
    console.warn(
      '[Twilio] TWILIO_API_KEY must start with SK — ignoring and falling back to auth token',
    );
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (authToken) {
    return { accountSid, signingKeySid: accountSid, secret: authToken };
  }

  return null;
}
