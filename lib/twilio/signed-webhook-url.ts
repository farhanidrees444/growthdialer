import { resolveVoiceAppBaseUrl } from '@/lib/voice/webhook-url';

/** URL Twilio signed — prefer APP_URL over request origin (Vercel proxy safe). */
export function resolveTwilioSignedWebhookUrl(path: string, requestOrigin?: string): string {
  const base = resolveVoiceAppBaseUrl();
  if (base) return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  if (requestOrigin) return `${requestOrigin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return path;
}
