import { isValidCallerPhone, normalizeE164 } from '@/lib/inbound/phone';
import { isAnonymousCaller } from '@/lib/twilio/caller-id-utils';
import { getTwilioRestClient } from '@/lib/twilio/rest-client';

export interface CallerLookupResult {
  callerName: string | null;
  carrier: string | null;
  lineType: string | null;
}

export { isAnonymousCaller };

/** Twilio Lookup v2 — caller name / carrier when available. */
export async function lookupCallerIdentity(fromRaw: string): Promise<CallerLookupResult | null> {
  const from = normalizeE164(fromRaw);
  if (!from || isAnonymousCaller(from)) return null;

  const client = getTwilioRestClient();
  if (!client) return null;

  try {
    const result = await client.lookups.v2
      .phoneNumbers(from)
      .fetch({ fields: 'caller_name,line_type_intelligence' });

    const callerName = result.callerName?.callerName?.trim() || null;
    const lineIntel = result.lineTypeIntelligence as { carrier_name?: string; type?: string } | undefined;

    return {
      callerName,
      carrier: lineIntel?.carrier_name?.trim() || null,
      lineType: lineIntel?.type?.trim() || null,
    };
  } catch {
    return null;
  }
}
