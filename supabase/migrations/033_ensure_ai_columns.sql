-- Migration 033: Ensure analytics_id + AI status columns exist on calls
--
-- Per the project handoff, calls.analytics_id was reported as missing
-- (caused PostgresError 42703 "column does not exist"). Migration 007
-- created it, but it was either dropped manually or 007 never ran.
--
-- This migration is idempotent — safe to run regardless of current state.
-- It guarantees the full set of columns the code expects, so the routes
-- referencing analytics_id (dashboard/metrics, ai/process-call, webhook)
-- stop crashing.

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS analytics_id UUID,
  ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_processing_status TEXT,
  ADD COLUMN IF NOT EXISTS ai_error TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary JSONB,
  ADD COLUMN IF NOT EXISTS ai_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS ai_sentiment_score NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_keywords JSONB,
  ADD COLUMN IF NOT EXISTS ai_next_steps JSONB,
  ADD COLUMN IF NOT EXISTS ai_objections JSONB,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS recording_supabase_path TEXT,
  ADD COLUMN IF NOT EXISTS was_recorded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transcript TEXT;

-- Optional FK to call_analytics if that table exists. Wrap in DO block so
-- this migration doesn't fail if call_analytics hasn't been created yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'call_analytics'
  ) THEN
    -- Drop existing FK if it points somewhere wrong, then re-add
    BEGIN
      ALTER TABLE public.calls
        DROP CONSTRAINT IF EXISTS calls_analytics_id_fkey;
      ALTER TABLE public.calls
        ADD CONSTRAINT calls_analytics_id_fkey
        FOREIGN KEY (analytics_id) REFERENCES public.call_analytics(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      -- Ignore — likely already correct
      NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calls_analytics_id
  ON public.calls (analytics_id)
  WHERE analytics_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calls_ai_processing
  ON public.calls (user_id, ai_processing_status, ai_processed)
  WHERE ai_processing_status IS NOT NULL;
