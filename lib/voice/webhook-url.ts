/** Resolve the public app base URL for voice webhooks and internal callbacks. */
export function resolveVoiceAppBaseUrl(): string {
  const explicit =
    process.env.APP_URL?.trim()
    ?? process.env.NEXT_PUBLIC_APP_URL?.trim()
    ?? '';

  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  return '';
}

export function resolveVoiceWebhookUrl(): string {
  const base = resolveVoiceAppBaseUrl();
  return base ? `${base}/api/telnyx/webhook` : '';
}
