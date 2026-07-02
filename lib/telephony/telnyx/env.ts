function readEnv(name: string): string | null {
  const raw = process.env[name];
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');
}

export function readTelephonyApiKey(): string | null {
  return readEnv('TELNYX_API_KEY');
}

export function readTelephonyPublicKey(): string | null {
  return readEnv('TELNYX_PUBLIC_KEY');
}

export function readCallControlAppId(): string | null {
  return readEnv('TELNYX_CALL_CONTROL_APP_ID');
}

export function readOutboundVoiceProfileId(): string | null {
  return readEnv('TELNYX_OUTBOUND_VOICE_PROFILE_ID');
}

export function readConnectionId(): string | null {
  return readEnv('TELNYX_CONNECTION_ID');
}

export function readMessagingProfileId(): string | null {
  return readEnv('TELNYX_MESSAGING_PROFILE_ID');
}

export function readVoiceWebhookUrl(): string | null {
  return readEnv('TELNYX_VOICE_WEBHOOK_URL');
}

export function readSmsWebhookUrl(): string | null {
  return readEnv('TELNYX_SMS_WEBHOOK_URL');
}

export function readAppUrl(): string {
  return readEnv('NEXT_PUBLIC_APP_URL') ?? 'https://app.growthdialer.com';
}

export function isTelephonyConfigured(): boolean {
  return Boolean(
    readTelephonyApiKey()
    && readConnectionId()
    && readCallControlAppId(),
  );
}
