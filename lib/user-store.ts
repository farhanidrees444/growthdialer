/**
 * In-memory user registry for demo / development.
 * Resets when the serverless instance cold-starts — replace with a database for production.
 */

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  image: string | null;
};

const usersByEmail = new Map<string, StoredUser>();

const RESERVED = new Set(["demo@growthdialer.com"]);

export function isEmailTaken(email: string): boolean {
  const key = email.toLowerCase();
  return usersByEmail.has(key) || RESERVED.has(key);
}

export function registerUser(user: Omit<StoredUser, "id">): StoredUser | null {
  const key = user.email.toLowerCase();
  if (isEmailTaken(user.email)) return null;
  const id = crypto.randomUUID();
  const row: StoredUser = { ...user, id, email: key };
  usersByEmail.set(key, row);
  return row;
}

export function findRegisteredUser(email: string): StoredUser | undefined {
  return usersByEmail.get(email.toLowerCase());
}
