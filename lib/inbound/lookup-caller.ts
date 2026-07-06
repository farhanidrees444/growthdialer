import { isAnonymousCaller } from '@/lib/inbound/caller-id-utils';

export { isAnonymousCaller };

/** DB-only caller enrichment — no external lookup API. */
export async function lookupCallerIdentity(_from: string): Promise<null> {
  return null;
}
