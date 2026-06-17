import type { InboundBlocker } from '@/lib/voice/inbound-readiness';
import {
  isTwilioVoiceConfigured,
  readTwilioAccountSid,
  readTwilioAuthToken,
  readTwilioTwimlAppSid,
} from '@/lib/twilio/voice-config';
import { resolveVoiceAppBaseUrl, resolveVoiceWebhookUrl } from '@/lib/voice/webhook-url';

export interface TwilioReadinessInput {
  hasNumbers: boolean;
  inboundEnabled: boolean;
  browserAnswering: boolean;
  appUrl?: string;
  /** User owns a DB number matching TWILIO_NUMBER */
  twilioNumberLinked?: boolean;
}

export function listTwilioInboundBlockers(input: TwilioReadinessInput): InboundBlocker[] {
  const blockers: InboundBlocker[] = [];

  if (!input.hasNumbers) {
    blockers.push({
      code: 'no_numbers',
      label: 'No phone numbers',
      fix: 'Purchase or assign a number in My Numbers.',
    });
    return blockers.filter((b) => b.code === 'no_numbers' || !input.inboundEnabled);
  }

  if (!input.inboundEnabled) {
    blockers.push({
      code: 'inbound_off',
      label: 'Inbound routing is off',
      fix: 'Switch routing to Ring in Browser on this page.',
    });
  }

  const appUrl = input.appUrl ?? resolveVoiceAppBaseUrl();
  if (!appUrl) {
    blockers.push({
      code: 'app_url',
      label: 'App URL not set on server',
      fix: 'Set APP_URL to your live dashboard URL (e.g. https://app.growthdialer.com), then redeploy.',
    });
  }

  if (!readTwilioAccountSid() || !readTwilioAuthToken()) {
    blockers.push({
      code: 'voice_credentials',
      label: 'Voice credentials missing on server',
      fix: 'Add your voice account credentials to deployment settings and redeploy.',
    });
  }

  if (!readTwilioTwimlAppSid()) {
    blockers.push({
      code: 'twiml_app',
      label: 'Programmable voice application not configured',
      fix: 'Set TWILIO_TWIML_APP_SID to your TwiML application ID in deployment settings, then redeploy.',
    });
  }

  return blockers;
}

export function isTwilioInboundReady(input: TwilioReadinessInput): boolean {
  if (!isTwilioVoiceConfigured()) return false;
  if (!input.inboundEnabled || !input.browserAnswering) return false;
  if (!input.hasNumbers) return false;
  const appUrl = input.appUrl ?? resolveVoiceAppBaseUrl();
  if (!appUrl) return false;
  return listTwilioInboundBlockers(input).length === 0;
}

export function twilioWebhookUrl(): string {
  return resolveVoiceWebhookUrl();
}
