-- Migration 004: Phone numbers table
-- Safe to run multiple times (idempotent).

CREATE TABLE IF NOT EXISTS purchased_numbers (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) NOT NULL,
  phone_number     TEXT        UNIQUE NOT NULL,
  telnyx_number_id TEXT,
  telnyx_order_id  TEXT,
  country          TEXT        DEFAULT 'US',
  monthly_cost     NUMERIC     DEFAULT 1.00,
  is_default       BOOLEAN     DEFAULT false,
  status           TEXT        DEFAULT 'active' CHECK (status IN ('active', 'released', 'pending')),
  purchased_at     TIMESTAMPTZ DEFAULT now(),
  released_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purchased_numbers_user_id ON purchased_numbers (user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_numbers_status  ON purchased_numbers (user_id, status);

ALTER TABLE purchased_numbers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchased_numbers' AND policyname = 'purchased_numbers_select_own'
  ) THEN
    CREATE POLICY purchased_numbers_select_own ON purchased_numbers FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchased_numbers' AND policyname = 'purchased_numbers_insert_own'
  ) THEN
    CREATE POLICY purchased_numbers_insert_own ON purchased_numbers FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchased_numbers' AND policyname = 'purchased_numbers_update_own'
  ) THEN
    CREATE POLICY purchased_numbers_update_own ON purchased_numbers FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchased_numbers' AND policyname = 'purchased_numbers_delete_own'
  ) THEN
    CREATE POLICY purchased_numbers_delete_own ON purchased_numbers FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
