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
  providerReachable?: boolean;
  hasRecentInbound?: boolean;
  credentialEnvSwap?: boolean;
  callControlReady?: boolean;
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

  const voiceLineOperational =
    Boolean(input.providerReachable)
    && input.credentialReady
    && (input.primaryRouted || input.hasRecentInbound);

  if (!input.connection.ok && !voiceLineOperational) {
    if (input.connection.env_mismatch) {
      blockers.push({
        code: 'connection_env_mismatch',
        label: 'Voice connection settings need attention',
        fix:
          'Your SIP connection ID and browser credential ID may be swapped in deployment settings. Update them and redeploy — we also try to auto-resolve on load.',
      });
    } else if (input.connection.failure_reason === 'auth_failed') {
      blockers.push({
        code: 'voice_api_auth',
        label: 'Voice API key rejected',
        fix: 'Regenerate your voice API key in the provider portal, update deployment settings, and redeploy.',
      });
    } else if (input.connection.failure_reason === 'missing_api_key') {
      blockers.push({
        code: 'missing_api_key',
        label: 'Voice API key missing on server',
        fix: 'Add your voice API key to deployment settings and redeploy.',
      });
    } else if (input.connection.failure_reason === 'missing_connection_id') {
      blockers.push({
        code: 'missing_connection_id',
        label: 'Voice connection ID missing',
        fix: 'Add your SIP connection ID and browser telephony credential to deployment settings, then redeploy.',
      });
    } else if (input.connection.failure_reason === 'not_found') {
      blockers.push({
        code: 'connection_not_found',
        label: 'Voice connection not found',
        fix:
          'Use your SIP connection ID from the voice portal — not the browser credential or phone number ID.',
      });
    } else {
      blockers.push({
        code: 'connection_config',
        label: 'Voice line setup incomplete',
        fix: 'Refresh this page — we auto-configure on load. If this persists, check deployment logs.',
      });
    }
  }

  if (input.callControlReady === false) {
    blockers.push({
      code: 'call_control_app',
      label: 'Programmable voice application not configured',
      fix:
        'Set TELNYX_CALL_CONTROL_APP_ID in deployment settings, then redeploy.',
    });
  }

  if (!input.eventsVerified && !input.hasRecentInbound) {
    blockers.push({
      code: 'webhook_verify',
      label: 'Call event verification not enabled',
      fix:
        'Add your voice public key to deployment settings so inbound webhooks are verified, then redeploy.',
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
        'In deployment settings, set TELNYX_TELEPHONY_CREDENTIAL_ID to the Credential ID from your SIP connection (not the connection ID). Keep this tab open and allow microphone access.',
    });
  }

  if (input.credentialEnvSwap) {
    blockers.push({
      code: 'credential_env_swap',
      label: 'Browser credential ID looks like a connection ID',
      fix:
        'TELNYX_TELEPHONY_CREDENTIAL_ID should be the Credential ID under your SIP connection — not the connection ID itself. We auto-discover when possible; fix env vars and redeploy for reliability.',
    });
  }

  // When no numbers exist, surface only the actionable setup step first.
  if (!input.hasNumbers) {
    return blockers.filter((b) => b.code === 'no_numbers' || b.code === 'inbound_off');
  }

  return blockers;
}

export function isTelnyxInboundReady(input: {
  hasNumbers: boolean;
  inboundEnabled: boolean;
  browserAnswering: boolean;
  primaryRouted: boolean;
  credentialReady: boolean;
  eventsVerified: boolean;
  appUrl: string;
  connectionOk: boolean;
  blockers: InboundBlocker[];
}): boolean {
  return (
    input.hasNumbers
    && input.inboundEnabled
    && input.browserAnswering
    && input.primaryRouted
    && input.credentialReady
    && input.eventsVerified
    && Boolean(input.appUrl)
    && input.connectionOk
    && input.blockers.length === 0
  );
}

export function resolveInboundAppUrl(host: string | null): string {
  return resolveVoiceAppBaseUrl() || (host ? `https://${host}` : '');
}
