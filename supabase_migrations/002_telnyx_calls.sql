-- Migration 002: Telnyx call tracking
-- Safe to run on a fresh database (creates tables if missing) or on top of 001 (adds new columns only).

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── leads (must exist before calls references it) ───────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) NOT NULL,
  name             TEXT,
  first_name       TEXT,
  last_name        TEXT,
  email            TEXT,
  phone            TEXT        NOT NULL,
  company          TEXT,
  title            TEXT,
  ai_score         INTEGER     DEFAULT 0,
  status           TEXT        DEFAULT 'new'
                               CHECK (status IN (
                                 'new','queued','contacted','connected',
                                 'meeting_booked','not_interested','do_not_call'
                               )),
  source           TEXT,
  notes            TEXT,
  disposition      TEXT,
  linkedin         TEXT,
  call_attempts    INTEGER     DEFAULT 0,
  last_called_at   TIMESTAMPTZ,
  next_callback_at TIMESTAMPTZ,
  company_size     TEXT,
  industry         TEXT,
  revenue          TEXT,
  activity_summary TEXT,
  profile_url      TEXT,
  tags             TEXT[],
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── calls ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID        REFERENCES auth.users(id),
  lead_id            UUID        REFERENCES leads(id),
  twilio_call_sid    TEXT        UNIQUE,
  telnyx_call_id     TEXT,
  status             TEXT        DEFAULT 'initiated',
  direction          TEXT,
  from_number        TEXT,
  to_number          TEXT,
  duration           INTEGER     DEFAULT 0,
  duration_seconds   INTEGER,
  disposition        TEXT,
  notes              TEXT,
  recording_url      TEXT,
  recording_sid      TEXT        UNIQUE,
  recording_duration INTEGER,
  started_at         TIMESTAMPTZ DEFAULT now(),
  answered_at        TIMESTAMPTZ,
  ended_at           TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- ─── Upgrade path: add new columns to pre-existing tables (idempotent) ───────

-- calls
ALTER TABLE calls ADD COLUMN IF NOT EXISTS telnyx_call_id   TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration_seconds  INTEGER;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS answered_at       TIMESTAMPTZ;

-- leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title            TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin         TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_attempts    INTEGER     DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called_at   TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_callback_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes            TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_size     TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry         TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS revenue          TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS activity_summary TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profile_url      TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags             TEXT[];

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Webhook lookups by Telnyx call_control_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_telnyx_call_id
  ON calls (telnyx_call_id)
  WHERE telnyx_call_id IS NOT NULL;

-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_calls_user_id    ON calls (user_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id    ON calls (lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_status     ON calls (status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_user_id    ON leads (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_phone      ON leads (phone);

-- ─── Row-Level Security ───────────────────────────────────────────────────────

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- calls policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'calls' AND policyname = 'calls_select_own'
  ) THEN
    CREATE POLICY calls_select_own ON calls FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'calls' AND policyname = 'calls_insert_own'
  ) THEN
    CREATE POLICY calls_insert_own ON calls FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'calls' AND policyname = 'calls_update_own'
  ) THEN
    CREATE POLICY calls_update_own ON calls FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- leads policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_select_own'
  ) THEN
    CREATE POLICY leads_select_own ON leads FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_insert_own'
  ) THEN
    CREATE POLICY leads_insert_own ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_update_own'
  ) THEN
    CREATE POLICY leads_update_own ON leads FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_delete_own'
  ) THEN
    CREATE POLICY leads_delete_own ON leads FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
