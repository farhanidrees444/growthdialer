import { resolveVoiceAppBaseUrl } from '@/lib/voice/webhook-url';

export function triggerInboundRingTimeoutAsync(
  inboundCallId: string,
  callControlId: string,
  agentId: string,
  ringSeconds: number,
  inboundMode: string,
): void {
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  const baseUrl = resolveVoiceAppBaseUrl();
  if (!internalSecret || !baseUrl) {
    console.warn('[INBOUND] Cannot schedule ring timeout — INTERNAL_API_SECRET or APP_URL missing');
    return;
  }

  const url = `${baseUrl}/api/inbound/ring-timeout`;
  void fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': internalSecret,
    },
    body: JSON.stringify({
      inbound_call_id: inboundCallId,
      call_control_id: callControlId,
      agent_id: agentId,
      ring_seconds: ringSeconds,
      inbound_mode: inboundMode,
    }),
    signal: AbortSignal.timeout(120_000),
  }).then(async (res) => {
    if (!res.ok) {
      console.error('[INBOUND] Ring timeout trigger failed:', res.status, (await res.text()).slice(0, 200));
    }
  }).catch((err) => {
    console.error('[INBOUND] Ring timeout trigger error:', err);
  });
}
