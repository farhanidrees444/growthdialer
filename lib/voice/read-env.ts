/** Read and normalize a server env var (trim whitespace and surrounding quotes). */
export function readEnv(name: string): string | null {
  const raw = process.env[name];
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');
}

export function readVoiceApiKey(): string | null {
  return readEnv('TWILIO_AUTH_TOKEN');
}

export function voiceApiBearerToken(): string {
  return readVoiceApiKey() ?? '';
}

/** Programmable voice application SID (TwiML App). */
export function readCallControlAppId(): string | null {
  return readEnv('TWILIO_TWIML_APP_SID');
}

/** @deprecated Legacy alias — use readCallControlAppId */
export function readConfiguredConnectionId(): string | null {
  return readCallControlAppId();
}

/** @deprecated Legacy alias */
export function readTelephonyCredentialId(): string | null {
  return null;
}
