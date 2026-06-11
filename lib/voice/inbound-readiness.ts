import { resolveVoiceAppBaseUrl } from '@/lib/voice/webhook-url';
import type { ConnectionConfigureResult } from '@/lib/voice/configure-connection';

export interface InboundBlocker {
  code: string;
  label: string;
  fix: string;
}

/** User-facing blockers for inbound (no vendor names). */
export function listInboundBlockers(input: {
  connection: ConnectionConfigureResult;
  eventsVerified: boolean;
  appUrl: string;
  primaryRouted: boolean;
  hasNumbers: boolean;
  inboundEnabled: boolean;
  browserAnswering: boolean;
  credentialReady: boolean;
}): InboundBlocker[] {
  const blockers: InboundBlocker[] = [];

  if (!input.hasNumbers) {
    blockers.push({
      code: 'no_numbers',
      label: 'No phone numbers',
      fix: 'Purchase or assign a number in My Numbers.',
    });
  }

  if (!input.inboundEnabled) {
    blockers.push({
      code: 'inbound_off',
      label: 'Inbound routing is off',
      fix: 'Switch routing to Ring in Browser on this page.',
    });
  }

  if (!input.appUrl) {
    blockers.push({
      code: 'app_url',
      label: 'App URL not set on server',
      fix: 'Set APP_URL to your live dashboard URL (e.g. https://app.growthdialer.com), then redeploy.',
    });
  }

  if (!input.connection.ok) {
    if (input.connection.env_mismatch) {
      blockers.push({
        code: 'connection_env_mismatch',
        label: 'Connection ID mismatch on server',
        fix:
          'TELNYX_CONNECTION_ID must be your SIP Connection ID — not the browser telephony credential ID (those are two different values). Update in deployment settings and redeploy; latest code also auto-resolves from your credential.',
      });
    } else if (input.connection.failure_reason === 'auth_failed') {
      blockers.push({
        code: 'voice_api_auth',
        label: 'Voice API key rejected',
        fix: 'Regenerate your voice API key in the provider portal and update TELNYX_API_KEY in Vercel, then redeploy.',
      });
    } else if (input.connection.failure_reason === 'missing_api_key') {
      blockers.push({
        code: 'missing_api_key',
        label: 'Voice API key missing on server',
        fix: 'Add TELNYX_API_KEY to your deployment environment and redeploy.',
      });
    } else if (input.connection.failure_reason === 'missing_connection_id') {
      blockers.push({
        code: 'missing_connection_id',
        label: 'Voice connection ID missing',
        fix: 'Add TELNYX_CONNECTION_ID (SIP Connection ID) and TELNYX_TELEPHONY_CREDENTIAL_ID (browser credential) to your deployment environment.',
      });
    } else if (input.connection.failure_reason === 'not_found') {
      blockers.push({
        code: 'connection_not_found',
        label: 'Voice connection not found',
        fix:
          'TELNYX_CONNECTION_ID must be the SIP Connection ID from your voice portal (Credential Connection), not the telephony credential or phone number ID.',
      });
    } else {
      blockers.push({
        code: 'connection_config',
        label: 'Voice line setup incomplete',
        fix: 'Refresh this page — we auto-configure on load. If this persists, check deployment logs for [VOICE].',
      });
    }
  }

  if (!input.eventsVerified) {
    blockers.push({
      code: 'webhook_verify',
      label: 'Call event verification not enabled',
      fix:
        'Add TELNYX_PUBLIC_KEY (Public Key from your voice portal → API Keys) to your deployment environment and redeploy.',
    });
  }

  if (input.hasNumbers && !input.primaryRouted) {
    blockers.push({
      code: 'number_routing',
      label: 'Primary number not linked to voice line',
      fix: 'Click “Link numbers for inbound” on this page (or refresh — we auto-link on load).',
    });
  }

  if (input.browserAnswering && !input.credentialReady) {
    blockers.push({
      code: 'browser_credential',
      label: 'Browser voice endpoint not ready',
      fix:
        'Add TELNYX_TELEPHONY_CREDENTIAL_ID to your deployment environment, keep this tab open, and allow microphone access.',
    });
  }

  return blockers;
}

export function resolveInboundAppUrl(host: string | null): string {
  return resolveVoiceAppBaseUrl() || (host ? `https://${host}` : '');
}
