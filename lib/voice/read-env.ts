/** Read and normalize a server env var (trim whitespace and surrounding quotes). */
export function readEnv(name: string): string | null {
  const raw = process.env[name];
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');
}

export function readVoiceApiKey(): string | null {
  return readEnv('TELNYX_API_KEY');
}

/** Bearer token for voice REST calls (answer, bridge, dial). */
export function voiceApiBearerToken(): string {
  return readVoiceApiKey() ?? '';
}

export function readTelephonyCredentialId(): string | null {
  return readEnv('TELNYX_TELEPHONY_CREDENTIAL_ID') ?? readEnv('TELNYX_CREDENTIAL_ID');
}

export function readConfiguredConnectionId(): string | null {
  return (
    readEnv('TELNYX_CONNECTION_ID')
    ?? readEnv('TELNYX_CREDENTIAL_CONNECTION_ID')
  );
}
