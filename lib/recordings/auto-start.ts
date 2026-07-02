import type { SupabaseClient } from '@supabase/supabase-js';
import { getTelephonyProvider } from '@/lib/telephony';
import { resolveRecordableControlId } from '@/lib/telephony/telnyx/recording';

export interface AutoStartRecordingCallRow {
  id: string;
  user_id: string;
  telnyx_call_id?: string | null;
  telnyx_webrtc_leg_id?: string | null;
  recording_status?: string | null;
  was_recorded?: boolean | null;
}

/**
 * Start media-fork recording when user settings allow it.
 * Idempotent while `recording_status=recording` on the same call row.
 */
export async function maybeAutoStartRecording(
  supabase: SupabaseClient,
  callRow: AutoStartRecordingCallRow,
  webhookControlId: string,
): Promise<boolean> {
  if (callRow.recording_status === 'recording') {
    return true;
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('recording_mode')
    .eq('user_id', callRow.user_id)
    .maybeSingle();

  const recordingMode = settings?.recording_mode ?? 'always';
  if (recordingMode === 'never') {
    return false;
  }

  const controlId = resolveRecordableControlId(callRow, webhookControlId);
  if (!controlId) {
    console.warn('[REC-A] No recordable call control id for call:', callRow.id);
    return false;
  }

  const provider = getTelephonyProvider();
  if (!provider.isConfigured()) {
    console.warn('[REC-A] Voice provider not configured — skip recording for call:', callRow.id);
    return false;
  }

  try {
    await provider.startRecording(controlId, callRow.id);
    console.log('[REC-A] Recording started | call:', callRow.id, '| control:', controlId);
    return true;
  } catch (err) {
    console.error('[REC-A] startRecording failed | call:', callRow.id, err);
    return false;
  }
}
