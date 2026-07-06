export interface VoiceSessionLogPayload {
  userId?: string | null;
  callSid?: string | null;
  event: string;
  payload?: Record<string, unknown>;
}

/** @deprecated Telnyx bridge debug shape — mapped to event + payload. */
interface LegacyVoiceLogPayload {
  location?: string;
  message?: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
  runId?: string;
}

function normalizeVoiceLogPayload(
  params: VoiceSessionLogPayload | LegacyVoiceLogPayload,
): VoiceSessionLogPayload {
  if ('event' in params && typeof params.event === 'string') {
    return params;
  }
  const legacy = params as LegacyVoiceLogPayload;
  return {
    event: legacy.location ?? 'voice_debug',
    payload: {
      message: legacy.message,
      hypothesisId: legacy.hypothesisId,
      runId: legacy.runId,
      ...(legacy.data ?? {}),
    },
  };
}

/** Server-side voice diagnostics compatibility shim. Inbound outcomes are durable in `calls`. */
export async function voiceSessionLog(
  params: VoiceSessionLogPayload | LegacyVoiceLogPayload,
): Promise<void> {
  const normalized = normalizeVoiceLogPayload(params);
  console.info('[VoiceSessionLog]', normalized.event, normalized.payload ?? {});
}

/** Client-side POST to session log API (fire-and-forget). */
export function voiceClientLog(
  event: string,
  payload: Record<string, unknown> = {},
  callSid?: string | null,
): void {
  console.info('[VoiceClientLog]', event, { callSid, ...payload });
}

export async function voiceSessionLogWithClient(
  _supabase: unknown,
  params: VoiceSessionLogPayload,
): Promise<void> {
  console.info('[VoiceSessionLog]', params.event, params.payload ?? {});
}
