import type { SupabaseClient } from '@supabase/supabase-js';

export const CALL_RECORDINGS_BUCKET = 'call-recordings';
export const SIGNED_PLAYBACK_TTL_SEC = 3600;

export function callRecordingStoragePath(userId: string, callId: string): string {
  return `${userId}/${callId}.mp3`;
}

function twilioBasicAuthHeader(): string | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) return null;
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
}

/** Download call audio from a voice-service recording URL. */
export async function downloadRecordingAudio(
  recordingUrl: string,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  let audioRes = await fetch(recordingUrl, { signal: AbortSignal.timeout(60_000) });
  if (!audioRes.ok && audioRes.status === 401) {
    audioRes = await fetch(recordingUrl, {
      headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(60_000),
    });
  }
  if (!audioRes.ok && audioRes.status === 401) {
    const auth = twilioBasicAuthHeader();
    if (auth) {
      audioRes = await fetch(recordingUrl, {
        headers: { Authorization: auth },
        signal: AbortSignal.timeout(60_000),
      });
    }
  }
  if (!audioRes.ok) {
    const errBody = await audioRes.text().catch(() => '');
    throw new Error(
      `Audio download failed: ${audioRes.status} ${audioRes.statusText} — ${errBody.slice(0, 200)}`,
    );
  }

  const buffer = await audioRes.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Downloaded audio is 0 bytes');
  }

  return {
    buffer,
    contentType: audioRes.headers.get('content-type') ?? 'audio/mpeg',
  };
}

export async function downloadRecordingFromStorage(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const { data, error } = await supabase.storage
    .from(CALL_RECORDINGS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(error?.message ?? 'Storage download failed');
  }

  const buffer = await data.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Storage audio is 0 bytes');
  }

  return { buffer, contentType: data.type || 'audio/mpeg' };
}

export type MirrorRecordingResult =
  | { ok: true; path: string; skipped?: boolean }
  | { ok: false; error: string };

export async function mirrorCallRecordingToStorage(
  supabase: SupabaseClient,
  opts: {
    callId: string;
    userId: string;
    recordingUrl: string;
    existingPath?: string | null;
  },
): Promise<MirrorRecordingResult> {
  if (opts.existingPath) {
    return { ok: true, path: opts.existingPath, skipped: true };
  }

  try {
    const { buffer, contentType } = await downloadRecordingAudio(opts.recordingUrl);
    const path = callRecordingStoragePath(opts.userId, opts.callId);

    const { error: uploadErr } = await supabase.storage
      .from(CALL_RECORDINGS_BUCKET)
      .upload(path, buffer, {
        contentType: contentType.includes('audio') ? contentType : 'audio/mpeg',
        upsert: true,
      });

    if (uploadErr) {
      return { ok: false, error: uploadErr.message };
    }

    const { error: updateErr } = await supabase
      .from('calls')
      .update({ recording_supabase_path: path })
      .eq('id', opts.callId);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    console.log('[REC-STORAGE] Mirrored call', opts.callId, '→', path, '| bytes:', buffer.byteLength);
    return { ok: true, path };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createCallRecordingSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = SIGNED_PLAYBACK_TTL_SEC,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CALL_RECORDINGS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    console.warn('[REC-STORAGE] Signed URL failed for', storagePath, ':', error?.message);
    return null;
  }
  return data.signedUrl;
}
