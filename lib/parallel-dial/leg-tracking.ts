import { resolveAppBaseUrl } from '@/lib/ai/trigger-process-call';

export type ParallelLegTrackingEventType =
  | 'leg_canceled'
  | 'leg_winner'
  | 'leg_no_answer'
  | 'leg_voicemail'
  | 'batch_started';

export interface ParallelLegTrackingEvent {
  event: ParallelLegTrackingEventType;
  session_id: string;
  leg_id: string;
  user_id: string;
  workspace_id?: string | null;
  telnyx_call_id?: string | null;
  phone?: string | null;
  lead_id?: string | null;
  reason?: string | null;
  at: string;
}

/**
 * Fire-and-forget leg lifecycle events for external CRM / analytics webhooks.
 * Set `PARALLEL_LEG_TRACKING_WEBHOOK_URL` to receive JSON POST payloads.
 */
export function triggerParallelLegTrackingAsync(event: ParallelLegTrackingEvent): void {
  const externalUrl = process.env.PARALLEL_LEG_TRACKING_WEBHOOK_URL?.trim();
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  const baseUrl = resolveAppBaseUrl();

  const body = JSON.stringify(event);

  if (externalUrl) {
    void fetch(externalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(8_000),
    }).catch((err) => {
      console.warn('[PARALLEL] external leg tracking failed:', err instanceof Error ? err.message : err);
    });
  }

  if (baseUrl && internalSecret) {
    void fetch(`${baseUrl}/api/internal/parallel-leg-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body,
      signal: AbortSignal.timeout(5_000),
    }).catch(() => { /* optional internal sink */ });
  }
}
