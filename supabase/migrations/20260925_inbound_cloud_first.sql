-- Inbound cloud-first: anchor the caller leg in the cloud, then hunt the agent.
-- cloud_anchored_at: when the caller leg was answered via Call Control (the
--   call is safely held on cloud media from this point — never dead air).
-- hunt_step: current phase of the agent hunt state machine. Values:
--   'browser' / 'browser_active'   -> dialing/waiting on the agent's browser/SIP leg
--   'mobile' / 'mobile_active'     -> dialing/waiting on the agent's mobile fallback over PSTN
--   'voicemail' / 'voicemail_active' -> playing greeting + recording
--   'done'                         -> hunt finished (bridged, voicemail, or missed)
-- Phase transitions use compare-and-set on hunt_step so concurrent advancers
-- (webhook hunt task, decline API, cron sweep) can never double-dial or
-- double-bridge.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.calls
ADD COLUMN IF NOT EXISTS cloud_anchored_at TIMESTAMPTZ;

ALTER TABLE public.calls
ADD COLUMN IF NOT EXISTS hunt_step TEXT;

-- Web Push subscriptions so an incoming call surfaces even when the browser
-- tab is closed. Endpoint is globally unique (one row per device subscription).
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
ON public.push_subscriptions (user_id);

-- RLS: users manage only their own subscriptions. Server-side sends use the
-- service role (the API routes above run with the service client after
-- cookie-auth), so policies are a defense-in-depth backstop for direct access.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'push_subscriptions'
      AND policyname = 'push_subscriptions_owner_all'
  ) THEN
    CREATE POLICY push_subscriptions_owner_all
    ON public.push_subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
