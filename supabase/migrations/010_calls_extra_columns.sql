-- Add columns needed for full recording + AI pipeline tracking
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS hangup_cause TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_error TEXT DEFAULT NULL;

COMMENT ON COLUMN public.calls.hangup_cause IS 'Telnyx hangup cause code (e.g. normal_clearing, user_busy)';
COMMENT ON COLUMN public.calls.ai_error IS 'Error message if AI processing failed';
