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

export function voiceApiBearerToken(): string {
  return readVoiceApiKey() ?? '';
}

/** Call Control application id for inbound/outbound routing. */
export function readCallControlAppId(): string | null {
  return readEnv('TELNYX_CALL_CONTROL_APP_ID');
}

/** SIP / WebRTC connection id for browser credentials. */
export function readConfiguredConnectionId(): string | null {
  return readEnv('TELNYX_CONNECTION_ID');
}

/** @deprecated Legacy alias */
export function readTelephonyCredentialId(): string | null {
  return null;
}
