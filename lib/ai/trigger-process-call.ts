/**
 * Trigger /api/ai/process-call for a saved recording.
 * Used by Telnyx webhook, reprocess route, backfill, and cron retry.
 */

export type TriggerAiResult =
  | { ok: true; status: number; body: string }
  | { ok: false; reason: 'misconfigured' | 'fetch_error'; detail: string };

export function resolveAppBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? '';
  return base.replace(/\/$/, '');
}

export async function triggerProcessCall(callId: string): Promise<TriggerAiResult> {
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  if (!internalSecret) {
    return { ok: false, reason: 'misconfigured', detail: 'INTERNAL_API_SECRET not set' };
  }

  const baseUrl = resolveAppBaseUrl();
  if (!baseUrl) {
    return { ok: false, reason: 'misconfigured', detail: 'APP_URL / NEXT_PUBLIC_APP_URL not set' };
  }

  const aiUrl = `${baseUrl}/api/ai/process-call`;

  try {
    const res = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({ call_id: callId }),
      signal: AbortSignal.timeout(120_000),
    });
    const body = await res.text().catch(() => '');
    return { ok: true, status: res.status, body: body.slice(0, 500) };
  } catch (err) {
    return {
      ok: false,
      reason: 'fetch_error',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Fire-and-forget with logging — for webhook fast 200 response. */
export function triggerProcessCallAsync(callId: string, logPrefix = '[REC-D]'): void {
  void triggerProcessCall(callId).then((result) => {
    if (!result.ok) {
      console.error(`${logPrefix} AI trigger failed for call ${callId}:`, result.detail);
      return;
    }
    console.log(
      `${logPrefix} AI trigger response for call ${callId}:`,
      result.status,
      '|',
      result.body.slice(0, 300),
    );
  });
}
