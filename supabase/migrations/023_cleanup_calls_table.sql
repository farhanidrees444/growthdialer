-- Migration 023: Remove dead Twilio-era columns from calls table
--
-- WHEN TO RUN: After confirming the webhook fix works end-to-end in production.
-- HOW TO RUN: Paste into Supabase Dashboard → SQL Editor → Run.
-- SAFE TO RE-RUN: All statements are idempotent (DROP IF EXISTS).
--
-- What this removes:
--   twilio_call_sid    — Twilio era, code deleted, no longer written or read
--   recording_sid      — Twilio era, zero code references
--   duration           — Old duplicate of duration_seconds; all code uses duration_seconds
--   recording_duration — Old duplicate; app/api/recordings/route.ts now uses duration_seconds

-- Drop dead Twilio-era columns
ALTER TABLE calls DROP COLUMN IF EXISTS twilio_call_sid;
ALTER TABLE calls DROP COLUMN IF EXISTS recording_sid;

-- Drop old duration duplicates (duration_seconds is the canonical column everywhere)
ALTER TABLE calls DROP COLUMN IF EXISTS duration;
ALTER TABLE calls DROP COLUMN IF EXISTS recording_duration;

-- Ensure the session_id index exists (idempotent; may already exist from migration 010)
CREATE INDEX IF NOT EXISTS idx_calls_telnyx_session_id
  ON public.calls (telnyx_session_id)
  WHERE telnyx_session_id IS NOT NULL;

-- Ensure the call_id unique index exists (required for upsert ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_telnyx_call_id
  ON public.calls (telnyx_call_id)
  WHERE telnyx_call_id IS NOT NULL;
