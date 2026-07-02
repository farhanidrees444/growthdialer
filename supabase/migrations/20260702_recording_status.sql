-- Recording lifecycle on calls rows (media fork → webhook → storage mirror).
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS recording_status TEXT DEFAULT NULL;

COMMENT ON COLUMN public.calls.recording_status IS
  'idle/recording/saved/failed/skipped_short — set by telephony recording pipeline';

CREATE INDEX IF NOT EXISTS idx_calls_recording_status
  ON public.calls (recording_status)
  WHERE recording_status IS NOT NULL;
