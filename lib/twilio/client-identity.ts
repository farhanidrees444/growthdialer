/** Prefix for Twilio Client identities — must match webhook `<Client>` routing. */
export const TWILIO_IDENTITY_PREFIX = 'gd_';

/**
 * Stable Twilio Client identity for an authenticated user.
 * Used by token issuance and inbound `<Dial><Client>` routing.
 */
export function toTwilioClientIdentity(userId: string): string {
  return `${TWILIO_IDENTITY_PREFIX}${userId}`;
}

/**
 * Parse user id from Twilio Client identity or `client:identity` From header.
 */
export function parseTwilioClientIdentity(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let identity = raw.trim();
  if (identity.toLowerCase().startsWith('client:')) {
    identity = identity.slice(7);
  }
  if (!identity.startsWith(TWILIO_IDENTITY_PREFIX)) return null;
  const userId = identity.slice(TWILIO_IDENTITY_PREFIX.length);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return null;
  }
  return userId;
}
