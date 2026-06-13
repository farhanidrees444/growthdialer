import type { WorkspaceOutboundTrustContext } from '@/lib/compliance/ten-dlc-profile';

export interface OutboundDialPayloadInput {
  connectionId: string;
  to: string;
  from: string;
  webhookUrl: string;
  trust: WorkspaceOutboundTrustContext;
  clientState?: Record<string, unknown>;
  timeoutSecs?: number;
  amd?: 'detect' | 'disabled';
}

/**
 * Telnyx Call Control v2 dial body with CNAM + STIR/SHAKEN-ready metadata.
 * Attestation is carrier-side; we pass structural client_state for audit trails.
 */
export function buildOutboundDialPayload(input: OutboundDialPayloadInput): Record<string, unknown> {
  const clientState = {
    workspace_id: input.trust.workspace_id,
    trust_tier: input.trust.trust_tier,
    stir_attestation: input.trust.stir_attestation,
    ten_dlc_campaign_id: input.trust.ten_dlc_campaign_id,
    cnam_registered: input.trust.cnam_registered,
    ...input.clientState,
  };

  const body: Record<string, unknown> = {
    connection_id: input.connectionId,
    to: input.to,
    from: input.from,
    webhook_url: input.webhookUrl,
    webhook_url_method: 'POST',
    webhook_api_version: '2',
    timeout_secs: input.timeoutSecs ?? 30,
    answering_machine_detection: input.amd ?? 'disabled',
    client_state: Buffer.from(JSON.stringify(clientState)).toString('base64'),
  };

  if (input.trust.from_display_name) {
    body.from_display_name = input.trust.from_display_name;
  }

  if (input.trust.stir_attestation !== 'none') {
    body.custom_headers = [
      { name: 'X-GD-STIR-Attestation', value: input.trust.stir_attestation },
      { name: 'X-GD-Trust-Tier', value: input.trust.trust_tier },
    ];
  }

  return body;
}
