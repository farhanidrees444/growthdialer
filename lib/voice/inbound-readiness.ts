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
      fix: 'In Vercel → Settings → Environment Variables, set APP_URL to https://app.growthdialer.com (your live dashboard URL), then redeploy.',
    });
  }

  if (!input.connection.ok) {
    if (input.connection.message.includes('incorrect')) {
      blockers.push({
        code: 'connection_id_swap',
        label: 'Connection ID mismatch on server',
        fix:
          'In Vercel, set TELNYX_CONNECTION_ID to your SIP Connection ID (not the browser credential ID). Keep the browser credential in TELNYX_TELEPHONY_CREDENTIAL_ID. Redeploy after saving.',
      });
    } else {
      blockers.push({
        code: 'connection_config',
        label: 'Voice connection not configured',
        fix:
          'Confirm TELNYX_API_KEY and TELNYX_CONNECTION_ID in Vercel match your voice portal, then open this page again to auto-configure.',
      });
    }
  }

  if (!input.eventsVerified) {
    blockers.push({
      code: 'webhook_verify',
      label: 'Call event verification not enabled',
      fix:
        'In Vercel, add TELNYX_PUBLIC_KEY (from your voice provider portal → API Keys → Public Key). Redeploy — without it inbound webhooks are rejected in production.',
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
        'Set TELNYX_TELEPHONY_CREDENTIAL_ID in Vercel, keep this tab open, and allow microphone access.',
    });
  }

  return blockers;
}

export function resolveInboundAppUrl(host: string | null): string {
  return resolveVoiceAppBaseUrl() || (host ? `https://${host}` : '');
}
