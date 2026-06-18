import { readEnv } from '@/lib/voice/read-env';

/** Resolve the public app base URL for voice webhooks and internal callbacks. */
export function resolveVoiceAppBaseUrl(): string {
  const explicit =
    process.env.APP_URL?.trim()
    ?? process.env.NEXT_PUBLIC_APP_URL?.trim()
    ?? '';

  if (explicit) {
    const normalized = explicit.replace(/\/$/, '');
    if (/^https?:\/\/(www\.)?growthdialer\.com$/i.test(normalized)) {
      return 'https://app.growthdialer.com';
    }
    return normalized;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  return '';
}

export function resolveVoiceWebhookUrl(): string {
  const base = resolveVoiceAppBaseUrl();
  if (!base) return '';
  return `${base}/api/twilio/voice`;
}
