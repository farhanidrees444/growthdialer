-- Clean Twilio-native inbound Calls schema.
--
-- Run manually in Supabase SQL Editor before relying on the new tables.
-- This migration intentionally does not drop legacy Telnyx-named columns from
-- shared tables (`calls`, `purchased_numbers`, parallel dial/coaching tables)
-- because those are still used by outbound, recordings, number inventory, and
-- parallel dialer code paths. Drop those only after their Twilio replacements
-- are complete and verified.

CREATE TABLE IF NOT EXISTS public.agent_presence (
  agent_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'offline'
    CHECK (status IN ('online', 'away', 'offline')),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_state TEXT,
  tab_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_presence_workspace_status
  ON public.agent_presence(workspace_id, status, last_heartbeat_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_presence_ringable
  ON public.agent_presence(last_heartbeat_at DESC)
  WHERE status <> 'offline';

ALTER TABLE public.agent_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_presence_own ON public.agent_presence;
CREATE POLICY agent_presence_own ON public.agent_presence
  FOR ALL USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

CREATE TABLE IF NOT EXISTS public.inbound_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_call_sid TEXT UNIQUE,
  twilio_parent_call_sid TEXT,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  owner_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  routed_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ringing'
    CHECK (status IN ('ringing', 'active', 'completed', 'missed', 'voicemail', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  voicemail_recording_url TEXT,
  voicemail_transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbound_calls_workspace_started
  ON public.inbound_calls(workspace_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbound_calls_owner_started
  ON public.inbound_calls(owner_agent_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbound_calls_status_started
  ON public.inbound_calls(status, started_at DESC);

ALTER TABLE public.inbound_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inbound_calls_workspace_select ON public.inbound_calls;
CREATE POLICY inbound_calls_workspace_select ON public.inbound_calls
  FOR SELECT USING (
    owner_agent_id = auth.uid()
    OR routed_agent_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.workspace_members wm
      WHERE wm.workspace_id = inbound_calls.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

-- Webhooks write through service-role server clients. No broad INSERT/UPDATE
-- policy is granted to browser clients.
