-- Inbound media reliability: track leg-B (SIP/browser) dial state and media watchdog deadlines.
-- leg_b_status: lifecycle of the per-user SIP/browser leg for inbound calls.
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS leg_b_status TEXT NOT NULL DEFAULT 'none';

-- Call Control ID of the leg-B SIP dial (used for watchdog hangups / correlation).
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS leg_b_call_control_id TEXT;

-- When set and status='answered', the per-minute cron sweep must hang up the
-- provider leg unless leg_b_status reached 'answered'/'bridged' by this time.
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS media_watchdog_deadline TIMESTAMPTZ;

-- Hot-path inbound lookups by Telnyx session id.
CREATE INDEX IF NOT EXISTS idx_calls_telnyx_session_id ON public.calls (telnyx_session_id);

-- Watchdog sweep scans only rows with a deadline set.
CREATE INDEX IF NOT EXISTS idx_calls_leg_b_watchdog ON public.calls (media_watchdog_deadline) WHERE media_watchdog_deadline IS NOT NULL;
