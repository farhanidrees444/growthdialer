-- Migration 005: Disposition system + power dialer
-- Run in the Supabase SQL editor before deploying this version.
-- Safe to run multiple times (idempotent).

-- ── calls: new columns ────────────────────────────────────────────────────────
ALTER TABLE calls ADD COLUMN IF NOT EXISTS disposition_notes     TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS callback_at           TIMESTAMPTZ;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS power_dial_session_id UUID;

-- ── power_dial_sessions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS power_dial_sessions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) NOT NULL,
  started_at       TIMESTAMPTZ DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  total_calls      INT         DEFAULT 0,
  connected_calls  INT         DEFAULT 0,
  meetings_booked  INT         DEFAULT 0,
  total_talk_time  INT         DEFAULT 0,
  status           TEXT        DEFAULT 'active'
                               CHECK (status IN ('active', 'paused', 'ended'))
);

-- FK from calls to power_dial_sessions (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'calls_power_dial_session_fk'
      AND table_name = 'calls'
  ) THEN
    ALTER TABLE calls ADD CONSTRAINT calls_power_dial_session_fk
      FOREIGN KEY (power_dial_session_id) REFERENCES power_dial_sessions(id);
  END IF;
END $$;

-- ── leads: dnc flag ───────────────────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS dnc BOOLEAN DEFAULT false;

-- Update status constraint to allow 'invalid_phone' (added in 005)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'new', 'queued', 'contacted', 'connected',
  'meeting_booked', 'not_interested', 'do_not_call',
  'callback', 'wrong_number', 'invalid_phone'
));

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_power_dial_sessions_user_id ON power_dial_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_power_dial_sessions_status  ON power_dial_sessions (status);
CREATE INDEX IF NOT EXISTS idx_calls_power_dial_session    ON calls (power_dial_session_id);

-- ── RLS on power_dial_sessions ────────────────────────────────────────────────
ALTER TABLE power_dial_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'power_dial_sessions' AND policyname = 'pds_select_own'
  ) THEN
    CREATE POLICY pds_select_own ON power_dial_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'power_dial_sessions' AND policyname = 'pds_insert_own'
  ) THEN
    CREATE POLICY pds_insert_own ON power_dial_sessions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'power_dial_sessions' AND policyname = 'pds_update_own'
  ) THEN
    CREATE POLICY pds_update_own ON power_dial_sessions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
