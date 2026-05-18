-- Migration 007: AI Call Intelligence
-- Run this in Supabase SQL editor

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. call_analytics table
CREATE TABLE IF NOT EXISTS call_analytics (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id             UUID REFERENCES calls(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id             UUID,
  transcript          TEXT,
  transcript_embedding vector(768),
  summary             JSONB,       -- array of 3 bullet strings
  sentiment           TEXT,        -- 'positive' | 'neutral' | 'negative'
  sentiment_score     FLOAT,       -- -1 to 1
  talking_points      JSONB,       -- string[]
  objections          JSONB,       -- string[]
  buying_signals      JSONB,       -- string[]
  next_steps          TEXT,
  suggested_disposition TEXT,
  ai_model_used       TEXT,
  processing_time_ms  INT,
  error               TEXT,        -- non-null when processing failed
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 3. lead_memory table (AI long-term memory per lead)
CREATE TABLE IF NOT EXISTS lead_memory (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id           UUID NOT NULL,
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type       TEXT NOT NULL,  -- 'preference' | 'objection' | 'interest' | 'fact'
  content           TEXT NOT NULL,
  content_embedding vector(768),
  source_call_id    UUID REFERENCES calls(id) ON DELETE SET NULL,
  importance_score  FLOAT DEFAULT 0.5,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 4. Add analytics_id foreign key to calls
ALTER TABLE calls ADD COLUMN IF NOT EXISTS analytics_id UUID;

-- 5. Vector similarity search for lead memory
CREATE OR REPLACE FUNCTION search_lead_memory(
  query_embedding   vector(768),
  lead_id_param     UUID,
  match_count       INT DEFAULT 5
)
RETURNS TABLE (
  id               UUID,
  lead_id          UUID,
  memory_type      TEXT,
  content          TEXT,
  importance_score FLOAT,
  similarity       FLOAT,
  created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lm.id,
    lm.lead_id,
    lm.memory_type,
    lm.content,
    lm.importance_score,
    1 - (lm.content_embedding <=> query_embedding) AS similarity,
    lm.created_at
  FROM lead_memory lm
  WHERE lm.lead_id = lead_id_param
    AND lm.content_embedding IS NOT NULL
  ORDER BY lm.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_call_analytics_call_id  ON call_analytics(call_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_user_id  ON call_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_memory_lead_id     ON lead_memory(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_memory_user_id     ON lead_memory(user_id);

-- 7. RLS
ALTER TABLE call_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_memory     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own analytics" ON call_analytics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own memories" ON lead_memory
  FOR ALL USING (auth.uid() = user_id);

-- 8. Supabase Storage bucket: run this separately or via dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('call-recordings', 'call-recordings', false)
-- ON CONFLICT (id) DO NOTHING;
