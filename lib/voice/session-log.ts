import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';

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

/** Server-side voice diagnostics — writes to Supabase (works on Vercel serverless). */
export async function voiceSessionLog(
  params: VoiceSessionLogPayload | LegacyVoiceLogPayload,
): Promise<void> {
  const normalized = normalizeVoiceLogPayload(params);
  const supabase = createServiceClient();
  if (!supabase) {
    console.warn('[VoiceSessionLog]', normalized.event, normalized.payload);
    return;
  }

  const { error } = await supabase.from('voice_session_logs').insert({
    user_id: normalized.userId ?? null,
    call_sid: normalized.callSid ?? null,
    event: normalized.event,
    payload: normalized.payload ?? {},
  });

  if (error) {
    console.warn('[VoiceSessionLog] insert failed:', error.message, normalized.event);
  }
}

/** Client-side POST to session log API (fire-and-forget). */
export function voiceClientLog(
  event: string,
  payload: Record<string, unknown> = {},
  callSid?: string | null,
): void {
  void fetch('/api/voice/session-log', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, payload, call_sid: callSid ?? null }),
  }).catch(() => {});
}

export async function voiceSessionLogWithClient(
  supabase: SupabaseClient,
  params: VoiceSessionLogPayload,
): Promise<void> {
  const { error } = await supabase.from('voice_session_logs').insert({
    user_id: params.userId ?? null,
    call_sid: params.callSid ?? null,
    event: params.event,
    payload: params.payload ?? {},
  });
  if (error) console.warn('[VoiceSessionLog]', error.message);
}
