-- Migration 030: Recording diagnostics & duration field
-- Adds recording_duration_seconds (set by call.recording.saved webhook from
-- payload.recording_duration_millis) so the recordings page can show the
-- actual duration of the audio file, independent of call duration_seconds
-- (which is the talk time, not the recording length).

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS recording_duration_seconds INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.calls.recording_duration_seconds IS
  'Length of the audio recording in seconds, from Telnyx call.recording.saved payload.recording_duration_millis';

-- Helpful index for the recordings page (filters recording_url IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_calls_user_recording
  ON public.calls (user_id, started_at DESC)
  WHERE recording_url IS NOT NULL;
