-- Migration 002: Telnyx call tracking columns
-- Run this in the Supabase SQL editor.

-- Add Telnyx-specific columns to the calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS to_number        TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS from_number      TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS telnyx_call_id   TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'initiated';
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url    TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS answered_at      TIMESTAMP WITH TIME ZONE;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS ended_at         TIMESTAMP WITH TIME ZONE;

-- Unique index so webhook can look up calls by Telnyx call_control_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_telnyx_call_id
  ON calls (telnyx_call_id)
  WHERE telnyx_call_id IS NOT NULL;

-- Add title column to leads if not present (needed by dialer)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title TEXT;

-- Add extra dialer fields to leads if not present
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin           TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_attempts      INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called_at     TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_callback_at   TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes              TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_size       TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry           TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS revenue            TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS activity_summary   TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profile_url        TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags               TEXT[];
