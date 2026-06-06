import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Claim a webhook event id for idempotent processing.
 * Returns false if this event was already processed.
 * If the dedup table is missing (migration not applied), returns true.
 */
export async function claimWebhookEvent(
  supabase: SupabaseClient,
  eventId: string,
  provider: 'telnyx' | 'stripe',
  eventType?: string,
): Promise<boolean> {
  if (!eventId?.trim()) return true;

  const { error } = await supabase.from('webhook_events').insert({
    id: eventId.trim(),
    provider,
    event_type: eventType ?? null,
  });

  if (!error) return true;

  // Postgres unique violation — duplicate delivery
  if (error.code === '23505') {
    console.log(`[WEBHOOK-DEDUP] Skipping duplicate ${provider} event:`, eventId);
    return false;
  }

  // Table may not exist yet — process anyway
  if (error.code === '42P01' || error.message?.includes('webhook_events')) {
    console.warn('[WEBHOOK-DEDUP] webhook_events table missing — run migration 042');
    return true;
  }

  console.warn('[WEBHOOK-DEDUP] Insert failed, processing anyway:', error.message);
  return true;
}
