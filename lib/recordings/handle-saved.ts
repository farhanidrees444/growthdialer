import type { SupabaseClient } from '@supabase/supabase-js';
import { triggerProcessCallAsync } from '@/lib/ai/trigger-process-call';
import { shouldSkipRecordingAiQueue } from '@/lib/ai/pipeline-status';
import { triggerMirrorRecordingAsync } from '@/lib/recordings/trigger-mirror';
import { MIN_PLAYABLE_RECORDING_SECONDS } from '@/lib/recordings/eligibility';

export interface RecordingSavedPayload {
  public_recording_urls?: { mp3?: string; wav?: string };
  recording_urls?: { mp3?: string; wav?: string };
  recording_duration_millis?: number;
}

export interface RecordingSavedCallRow {
  id: string;
  user_id: string;
  lead_id: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  recording_supabase_path: string | null;
  ai_processing_status: string | null;
  ai_processed: boolean | null;
  ai_processed_at: string | null;
  analytics_id: string | null;
}

export function resolveRecordingUrl(payload: RecordingSavedPayload): string | null {
  return (
    payload.public_recording_urls?.mp3
    ?? payload.public_recording_urls?.wav
    ?? payload.recording_urls?.mp3
    ?? payload.recording_urls?.wav
    ?? null
  );
}

export async function handleCallRecordingSaved(
  supabase: SupabaseClient,
  callRow: RecordingSavedCallRow,
  payload: RecordingSavedPayload,
  recordingUrl: string,
): Promise<void> {
  console.log('[REC-B] Call:', callRow.id, '| ai_processing_status:', callRow.ai_processing_status);

  if (shouldSkipRecordingAiQueue(callRow)) {
    console.log('[REC-B] Already queued/completed — skipping AI re-queue. status:', callRow.ai_processing_status);
    if (!callRow.recording_url) {
      await supabase
        .from('calls')
        .update({
          recording_url: recordingUrl,
          was_recorded: true,
          recording_status: 'saved',
        })
        .eq('id', callRow.id);
    }
    return;
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select(
      'recording_mode, recording_auto_delete_short, ai_auto_transcribe, ai_auto_summarize, ai_detect_sentiment, ai_extract_talking_points',
    )
    .eq('user_id', callRow.user_id)
    .maybeSingle();

  const recordingMode = settings?.recording_mode ?? 'always';
  if (recordingMode === 'never') {
    console.log('[REC-B] recording_mode=never — skipping');
    return;
  }

  const payloadDuration = payload.recording_duration_millis
    ? Math.round(payload.recording_duration_millis / 1000)
    : null;
  const dur = payloadDuration ?? callRow.duration_seconds ?? 0;

  console.log(
    '[REC-B] duration resolved:',
    dur,
    's (payload:',
    payloadDuration,
    '| db:',
    callRow.duration_seconds,
    ')',
  );

  if (
    dur > 0
    && dur < MIN_PLAYABLE_RECORDING_SECONDS
    && settings?.recording_auto_delete_short !== false
  ) {
    console.log(
      `[REC-B] Call too short (${dur}s < ${MIN_PLAYABLE_RECORDING_SECONDS}s) — skipping recording AND AI`,
    );
    await supabase
      .from('calls')
      .update({
        ai_processing_status: 'skipped_short',
        recording_status: 'skipped_short',
      })
      .eq('id', callRow.id);
    return;
  }

  const recordingUpdate: Record<string, unknown> = {
    recording_url: recordingUrl,
    was_recorded: true,
    recording_status: 'saved',
    ai_processing_status: 'pending',
  };
  if (payloadDuration && payloadDuration > 0) {
    recordingUpdate.recording_duration_seconds = payloadDuration;
  }

  const { error: updateErr } = await supabase
    .from('calls')
    .update(recordingUpdate)
    .eq('id', callRow.id);

  if (updateErr) {
    console.error('[REC-B] Failed to save recording_url:', updateErr);
    await supabase
      .from('calls')
      .update({ recording_status: 'failed' })
      .eq('id', callRow.id);
    return;
  }

  console.log('[REC-C] recording_url saved to DB for call:', callRow.id);

  triggerMirrorRecordingAsync(
    callRow.id,
    callRow.user_id,
    recordingUrl,
    callRow.recording_supabase_path,
  );

  const anyAiEnabled =
    (settings?.ai_auto_transcribe ?? true)
    || (settings?.ai_auto_summarize ?? true)
    || (settings?.ai_detect_sentiment ?? true)
    || (settings?.ai_extract_talking_points ?? true);

  if (anyAiEnabled) {
    if (!process.env.INTERNAL_API_SECRET?.trim()) {
      console.error('[REC-D] INTERNAL_API_SECRET not set — cannot trigger AI pipeline for call:', callRow.id);
      await supabase
        .from('calls')
        .update({
          ai_processing_status: 'failed',
          ai_error: 'INTERNAL_API_SECRET not configured',
          recording_status: 'saved',
        })
        .eq('id', callRow.id);
    } else {
      console.log('[REC-D] Triggering AI pipeline for call:', callRow.id);
      triggerProcessCallAsync(callRow.id);
    }
  } else {
    console.log('[REC-B] All AI settings disabled — recording saved, skipping AI');
    await supabase
      .from('calls')
      .update({ ai_processing_status: 'completed' })
      .eq('id', callRow.id);
  }

  await supabase.from('activities').insert({
    user_id: callRow.user_id,
    type: 'call',
    lead_id: callRow.lead_id ?? null,
    description: 'Recording saved — AI analysis queued',
    metadata: { event: 'call.recording.saved', call_id: callRow.id, recording_url: recordingUrl },
  }).maybeSingle();
}
