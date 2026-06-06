-- Parallel dial sessions (multi-line outbound — first connect wins)

CREATE TABLE IF NOT EXISTS public.parallel_dial_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'dialing', 'connected', 'disposition', 'ended')),
  lines_count INT NOT NULL DEFAULT 3 CHECK (lines_count >= 2 AND lines_count <= 10),
  total_batches INT NOT NULL DEFAULT 0,
  total_dialed INT NOT NULL DEFAULT 0,
  total_connects INT NOT NULL DEFAULT 0,
  total_meetings INT NOT NULL DEFAULT 0,
  amd_enabled BOOLEAN NOT NULL DEFAULT false,
  queue_config JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parallel_dial_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.parallel_dial_sessions(id) ON DELETE CASCADE,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_name TEXT,
  phone TEXT NOT NULL,
  telnyx_call_id TEXT,
  status TEXT NOT NULL DEFAULT 'dialing'
    CHECK (status IN ('dialing', 'ringing', 'answered', 'connected', 'no_answer', 'busy', 'failed', 'canceled', 'voicemail')),
  is_winner BOOLEAN NOT NULL DEFAULT false,
  batch_number INT NOT NULL DEFAULT 1,
  hangup_cause TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parallel_dial_sessions_user_active
  ON public.parallel_dial_sessions (user_id, status)
  WHERE status IN ('active', 'paused', 'dialing', 'connected', 'disposition');

CREATE INDEX IF NOT EXISTS idx_parallel_dial_legs_session
  ON public.parallel_dial_legs (session_id, batch_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parallel_dial_legs_telnyx
  ON public.parallel_dial_legs (telnyx_call_id)
  WHERE telnyx_call_id IS NOT NULL;

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS parallel_dial_session_id UUID REFERENCES public.parallel_dial_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS parallel_dial_leg_id UUID REFERENCES public.parallel_dial_legs(id) ON DELETE SET NULL;

ALTER TABLE public.parallel_dial_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parallel_dial_legs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parallel_sessions_workspace_select"
  ON public.parallel_dial_sessions FOR SELECT
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "parallel_sessions_owner_insert"
  ON public.parallel_dial_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "parallel_sessions_owner_update"
  ON public.parallel_dial_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "parallel_legs_via_session"
  ON public.parallel_dial_legs FOR ALL
  USING (
    session_id IN (SELECT id FROM public.parallel_dial_sessions WHERE user_id = auth.uid())
  )
  WITH CHECK (
    session_id IN (SELECT id FROM public.parallel_dial_sessions WHERE user_id = auth.uid())
  );
