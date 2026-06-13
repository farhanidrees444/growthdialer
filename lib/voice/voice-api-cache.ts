import type { ConnectionConfigureResult } from '@/lib/voice/configure-connection';
import type { ProviderPhoneRecord } from '@/lib/voice/provider-numbers';
import type { ResolvedVoiceConnection } from '@/lib/voice/resolve-connection';

const CONNECTION_TTL_MS = 15 * 60 * 1000;
const PHONE_INDEX_TTL_MS = 5 * 60 * 1000;
const RESOLVED_CONNECTION_TTL_MS = 15 * 60 * 1000;

let connectionConfigCache: { value: ConnectionConfigureResult; expiresAt: number } | null = null;
let phoneIndexCache: { value: Map<string, ProviderPhoneRecord>; expiresAt: number } | null = null;
let resolvedConnectionCache: { value: ResolvedVoiceConnection; expiresAt: number } | null = null;

export function getCachedConnectionConfig(): ConnectionConfigureResult | null {
  if (!connectionConfigCache) return null;
  if (Date.now() > connectionConfigCache.expiresAt) {
    connectionConfigCache = null;
    return null;
  }
  return connectionConfigCache.value;
}

export function setCachedConnectionConfig(value: ConnectionConfigureResult): void {
  if (!value.ok) return;
  connectionConfigCache = { value, expiresAt: Date.now() + CONNECTION_TTL_MS };
}

export function getCachedPhoneIndex(): Map<string, ProviderPhoneRecord> | null {
  if (!phoneIndexCache) return null;
  if (Date.now() > phoneIndexCache.expiresAt) {
    phoneIndexCache = null;
    return null;
  }
  return phoneIndexCache.value;
}

export function setCachedPhoneIndex(value: Map<string, ProviderPhoneRecord>): void {
  if (value.size === 0) return;
  phoneIndexCache = { value, expiresAt: Date.now() + PHONE_INDEX_TTL_MS };
}

export function invalidatePhoneIndexCache(): void {
  phoneIndexCache = null;
}

export function getCachedResolvedConnection(): ResolvedVoiceConnection | null {
  if (!resolvedConnectionCache) return null;
  if (Date.now() > resolvedConnectionCache.expiresAt) {
    resolvedConnectionCache = null;
    return null;
  }
  return resolvedConnectionCache.value;
}

export function setCachedResolvedConnection(value: ResolvedVoiceConnection): void {
  if (!value.connectionId) return;
  resolvedConnectionCache = { value, expiresAt: Date.now() + RESOLVED_CONNECTION_TTL_MS };
}
