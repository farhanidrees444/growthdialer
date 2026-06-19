/** Prefix for Twilio Client identities — must match webhook `<Client>` routing. */
export const TWILIO_IDENTITY_PREFIX = 'gd_';

const USER_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMPACT_USER_ID_REGEX = /^[0-9a-f]{32}$/i;
const TWILIO_CLIENT_IDENTITY_REGEX = /^gd_[A-Za-z0-9_]{1,118}$/;

/**
 * Stable Twilio Client identity for an authenticated user.
 * Used by token issuance and inbound `<Dial><Client>` routing.
 */
export function toTwilioClientIdentity(userId: string): string {
  return `${TWILIO_IDENTITY_PREFIX}${userId.replace(/-/g, '')}`;
}

export function isValidTwilioClientIdentity(identity: string | null | undefined): identity is string {
  return Boolean(identity && TWILIO_CLIENT_IDENTITY_REGEX.test(identity));
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

  if (USER_ID_REGEX.test(userId)) {
    return userId;
  }

  if (COMPACT_USER_ID_REGEX.test(userId)) {
    return [
      userId.slice(0, 8),
      userId.slice(8, 12),
      userId.slice(12, 16),
      userId.slice(16, 20),
      userId.slice(20),
    ].join('-');
  }

  return null;
}
