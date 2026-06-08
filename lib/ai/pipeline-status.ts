/** Stuck if processing longer than this without ai_processed. */
export const AI_PROCESSING_STALE_MS = 12 * 60 * 1000;

export type CallAiPipelineRow = {
  ai_processed?: boolean | null;
  ai_processing_status?: string | null;
  ai_processed_at?: string | null;
  recording_url?: string | null;
  analytics_id?: string | null;
};

/** Whether process-call should skip this call (already done or actively running). */
export function shouldSkipAiProcessing(call: CallAiPipelineRow): { skip: boolean; reason?: string } {
  if (call.ai_processed) {
    return { skip: true, reason: 'already_processed' };
  }

  if (call.ai_processing_status === 'completed' && call.analytics_id) {
    return { skip: true, reason: 'already_completed' };
  }

  if (call.ai_processing_status === 'processing' && call.ai_processed_at) {
    const age = Date.now() - new Date(call.ai_processed_at).getTime();
    if (age < AI_PROCESSING_STALE_MS) {
      return { skip: true, reason: 'in_flight' };
    }
  }

  return { skip: false };
}

/** Whether recording.saved webhook should skip re-queueing AI. */
export function shouldSkipRecordingAiQueue(call: CallAiPipelineRow): boolean {
  if (!call.recording_url) return false;
  if (call.ai_processing_status === 'completed' && (call.ai_processed || call.analytics_id)) {
    return true;
  }
  if (call.ai_processing_status === 'processing' && call.ai_processed_at) {
    const age = Date.now() - new Date(call.ai_processed_at).getTime();
    if (age < AI_PROCESSING_STALE_MS) return true;
  }
  return false;
}
