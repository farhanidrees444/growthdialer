-- Comprehensive column guard: ensure all pipeline columns exist
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS telnyx_session_id       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS was_recorded             BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recording_url            TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recording_supabase_path  TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS transcript               TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_processed             BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_processing_status     TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_processed_at          TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_error                 TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hangup_cause             TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS duration_seconds         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status                   TEXT    DEFAULT 'initiated';

-- Fast lookup by Telnyx session ID (used by all post-call webhook events)
CREATE INDEX IF NOT EXISTS idx_calls_telnyx_session_id
  ON public.calls (telnyx_session_id)
  WHERE telnyx_session_id IS NOT NULL;

COMMENT ON COLUMN public.calls.telnyx_session_id IS 'Telnyx call_session_id — set by call.initiated webhook, used for all subsequent event lookups';
COMMENT ON COLUMN public.calls.hangup_cause       IS 'Telnyx hangup_cause code (e.g. normal_clearing, user_busy)';
COMMENT ON COLUMN public.calls.ai_error           IS 'Error message if AI processing failed, max 500 chars';
