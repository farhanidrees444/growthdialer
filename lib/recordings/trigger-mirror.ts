import { createServiceClient } from '@/lib/supabase/service';
import { mirrorCallRecordingToStorage } from '@/lib/recordings/storage';

/** Fire-and-forget — mirror Telnyx recording into Supabase Storage after webhook save. */
export function triggerMirrorRecordingAsync(
  callId: string,
  userId: string,
  recordingUrl: string,
  existingPath?: string | null,
  logPrefix = '[REC-STORAGE]',
): void {
  void (async () => {
    const supabase = createServiceClient();
    if (!supabase) {
      console.error(`${logPrefix} Service client unavailable — cannot mirror call ${callId}`);
      return;
    }

    const result = await mirrorCallRecordingToStorage(supabase, {
      callId,
      userId,
      recordingUrl,
      existingPath,
    });

    if (!result.ok) {
      console.error(`${logPrefix} Mirror failed for call ${callId}:`, result.error);
      return;
    }
    if (!result.skipped) {
      console.log(`${logPrefix} Mirror complete for call ${callId} → ${result.path}`);
    }
  })();
}
