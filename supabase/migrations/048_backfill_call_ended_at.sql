-- Backfill ended_at for calls that completed/dispositioned but never got a hangup timestamp.
-- Dashboard Recent Calls and talk-time widgets filter on ended_at.

UPDATE calls
SET ended_at = COALESCE(updated_at, started_at, created_at)
WHERE ended_at IS NULL
  AND (
    disposition IS NOT NULL
    OR status IN ('completed', 'missed')
    OR answered_at IS NOT NULL
    OR (duration_seconds IS NOT NULL AND duration_seconds > 0)
  );
