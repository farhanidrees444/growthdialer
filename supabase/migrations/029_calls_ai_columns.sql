-- Migration 029: Add AI result columns directly to calls table so the
-- recordings list can read them without joining call_analytics.
-- process-call writes these after AI completes (see [AI-5] log).

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS ai_sentiment       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_sentiment_score FLOAT   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_summary         JSONB   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_next_steps      TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_keywords        JSONB   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_objections      JSONB   DEFAULT NULL;

COMMENT ON COLUMN public.calls.ai_sentiment       IS 'Cached from call_analytics: positive | neutral | negative';
COMMENT ON COLUMN public.calls.ai_sentiment_score IS 'Cached from call_analytics: -1.0 to 1.0';
COMMENT ON COLUMN public.calls.ai_summary         IS 'Cached from call_analytics: JSONB array of bullet strings';
COMMENT ON COLUMN public.calls.ai_next_steps      IS 'Cached from call_analytics: next action string';
COMMENT ON COLUMN public.calls.ai_keywords        IS 'Cached from call_analytics: JSONB array of talking point strings';
COMMENT ON COLUMN public.calls.ai_objections      IS 'Cached from call_analytics: JSONB array of objection strings';
