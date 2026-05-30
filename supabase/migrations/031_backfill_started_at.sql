-- Migration 031: Backfill started_at for existing outbound calls
--
-- BUG: app/api/calls/dial/route.ts and app/api/calls/parallel/route.ts were
-- writing only `created_at` (not `started_at`) on outbound call INSERTs.
-- Downstream queries filter/order by `started_at` (numbers/list,
-- recordings/list, analytics/distribution, dashboard Number Health card),
-- so every outbound call was invisible to those queries → stats showed 0.
--
-- Code is now fixed (commit "set started_at on outbound dial"). This
-- migration repairs historical rows so the dashboards finally show real
-- numbers for past calls.

UPDATE public.calls
SET started_at = created_at
WHERE started_at IS NULL
  AND created_at IS NOT NULL;

-- Direction backfill: webhook always set direction='inbound' for incoming
-- calls but the dial routes used to leave it NULL. Anything with a
-- telnyx_call_id and no direction is overwhelmingly outbound.
UPDATE public.calls
SET direction = 'outbound'
WHERE direction IS NULL
  AND telnyx_call_id IS NOT NULL;
