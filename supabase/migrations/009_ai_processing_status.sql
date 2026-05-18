-- Add ai_processing_status column to calls for real-time status tracking
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS ai_processing_status TEXT DEFAULT NULL;

COMMENT ON COLUMN public.calls.ai_processing_status IS 'NULL = not started, processing = in-flight, completed = done, failed = error';

-- Ensure FK from call_analytics → calls exists for reliable joins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'call_analytics_call_id_fkey'
      AND table_name = 'call_analytics'
  ) THEN
    ALTER TABLE public.call_analytics
      ADD CONSTRAINT call_analytics_call_id_fkey
      FOREIGN KEY (call_id) REFERENCES public.calls(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Index to speed up per-user metrics queries
CREATE INDEX IF NOT EXISTS idx_calls_user_created
  ON public.calls (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calls_user_ai
  ON public.calls (user_id, ai_processed, ai_processing_status);

-- Grant realtime SELECT on calls so subscriptions work
ALTER TABLE public.calls REPLICA IDENTITY FULL;
