-- Migration 003: Complete schema audit and additions
-- Safe to run multiple times (idempotent).

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── leads: add missing columns ───────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value   NUMERIC    DEFAULT 0;

-- Update status constraint to include callback and wrong_number
-- (Drop old constraint if it exists, then recreate with full list)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    'new', 'queued', 'contacted', 'connected',
    'meeting_booked', 'not_interested', 'do_not_call',
    'callback', 'wrong_number'
  ));

-- ─── calls: add missing columns ───────────────────────────────────────────────
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_notes TEXT;

-- ─── activities table (NEW) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('call', 'meeting', 'note', 'import', 'status_change')),
  lead_id     UUID        REFERENCES leads(id) ON DELETE SET NULL,
  description TEXT        NOT NULL DEFAULT '',
  metadata    JSONB       DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_score       ON leads (ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_last_called ON leads (last_called_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads (user_id, status);

CREATE INDEX IF NOT EXISTS idx_calls_answered_at ON calls (answered_at);
CREATE INDEX IF NOT EXISTS idx_calls_user_date   ON calls (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_user_id   ON activities (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id   ON activities (lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type      ON activities (type);

-- ─── RLS on activities ────────────────────────────────────────────────────────
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'activities_select_own'
  ) THEN
    CREATE POLICY activities_select_own ON activities FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'activities_insert_own'
  ) THEN
    CREATE POLICY activities_insert_own ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'activities_insert_service'
  ) THEN
    -- Allow service role to insert (for webhook use without user session)
    CREATE POLICY activities_insert_service ON activities FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'activities_update_own'
  ) THEN
    CREATE POLICY activities_update_own ON activities FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── Service-role bypass for webhook updates on calls/leads ───────────────────
-- Allow the webhook (service role) to update calls even though RLS is enabled
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'calls' AND policyname = 'calls_update_service'
  ) THEN
    CREATE POLICY calls_update_service ON calls FOR UPDATE TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'calls' AND policyname = 'calls_select_service'
  ) THEN
    CREATE POLICY calls_select_service ON calls FOR SELECT TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_update_service'
  ) THEN
    CREATE POLICY leads_update_service ON leads FOR UPDATE TO service_role USING (true);
  END IF;
END $$;
