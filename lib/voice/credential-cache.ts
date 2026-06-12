const TTL_MS = 25 * 60 * 1000;
/** Browser JWTs should not be served stale for long. */
const TOKEN_TTL_MS = 8 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const tokenOkCache = new Map<string, CacheEntry<boolean>>();
const tokenValueCache = new Map<string, CacheEntry<string>>();
const sipUsernameCache = new Map<string, CacheEntry<string | null>>();

function readCache<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const hit = map.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    map.delete(key);
    return undefined;
  }
  return hit.value;
}

function writeCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T): void {
  map.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

export function cachedCredentialTokenOk(credentialId: string): boolean | undefined {
  return readCache(tokenOkCache, credentialId);
}

export function setCachedCredentialTokenOk(credentialId: string, ok: boolean): void {
  writeCache(tokenOkCache, credentialId, ok);
}

export function cachedCredentialToken(credentialId: string): string | undefined {
  return readCache(tokenValueCache, credentialId);
}

export function setCachedCredentialToken(credentialId: string, token: string): void {
  tokenValueCache.set(credentialId, { value: token, expiresAt: Date.now() + TOKEN_TTL_MS });
}

export function invalidateCredentialCache(credentialId: string): void {
  tokenOkCache.delete(credentialId);
  tokenValueCache.delete(credentialId);
  sipUsernameCache.delete(credentialId);
}

export function cachedSipUsername(credentialId: string): string | null | undefined {
  return readCache(sipUsernameCache, credentialId);
}

export function setCachedSipUsername(credentialId: string, username: string | null): void {
  writeCache(sipUsernameCache, credentialId, username);
}
