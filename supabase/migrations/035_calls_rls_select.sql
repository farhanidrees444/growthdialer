-- Migration 035: Row-Level Security SELECT policy for the calls table.
--
-- WHY: Supabase Realtime postgres_changes subscriptions respect RLS.
-- Without a SELECT policy, any authenticated user could potentially
-- subscribe to another user's call events. With this policy, each user
-- can only receive their own rows.
--
-- SAFE to run: all server-side writes go through the service role client
-- which bypasses RLS entirely. Only browser-client SELECTs are affected —
-- every existing browser query already filters by user_id, so they are
-- compatible with this policy.
--
-- Run in Supabase SQL Editor (Farhan runs this manually).

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Add SELECT policy only if no SELECT or ALL policy exists yet
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'calls'
      AND cmd IN ('SELECT', 'ALL')
  ) THEN
    CREATE POLICY "calls_select_own"
      ON public.calls
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;
