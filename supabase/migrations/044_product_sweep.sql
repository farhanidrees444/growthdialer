-- Product sweep: custom dispositions, sequences, integrations workspace scope,
-- parallel VM drop, lead callback/meeting columns, realtime publication

-- ─── Lead scheduling columns ───────────────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS callback_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meeting_at TIMESTAMPTZ;

-- ─── Parallel dial: voicemail drop on AMD / losers ───────────────────────────
ALTER TABLE public.parallel_dial_sessions
  ADD COLUMN IF NOT EXISTS vm_drop_enabled BOOLEAN NOT NULL DEFAULT true;

-- ─── Workspace custom dispositions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_dispositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT,
  category TEXT NOT NULL DEFAULT 'neutral'
    CHECK (category IN ('positive', 'neutral', 'negative')),
  lead_status TEXT NOT NULL DEFAULT 'contacted',
  sort_order INT NOT NULL DEFAULT 0,
  hotkey INT CHECK (hotkey IS NULL OR (hotkey >= 1 AND hotkey <= 9)),
  triggers_callback BOOLEAN NOT NULL DEFAULT false,
  triggers_meeting BOOLEAN NOT NULL DEFAULT false,
  sets_dnc BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

CREATE INDEX IF NOT EXISTS idx_workspace_dispositions_ws
  ON public.workspace_dispositions (workspace_id, sort_order)
  WHERE is_active = true;

ALTER TABLE public.workspace_dispositions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_dispositions_select"
  ON public.workspace_dispositions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "workspace_dispositions_manage"
  ON public.workspace_dispositions FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
        AND role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
        AND role IN ('owner', 'admin', 'manager')
    )
  );

-- ─── Sequences (cadences MVP) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL DEFAULT 1,
  step_type TEXT NOT NULL CHECK (step_type IN ('call', 'wait')),
  wait_days INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, step_order)
);

CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  current_step_index INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'removed')),
  next_action_at TIMESTAMPTZ,
  enrolled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_due
  ON public.sequence_enrollments (workspace_id, next_action_at)
  WHERE status = 'active';

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sequences_workspace"
  ON public.sequences FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "sequence_steps_via_sequence"
  ON public.sequence_steps FOR ALL
  USING (
    sequence_id IN (
      SELECT s.id FROM public.sequences s
      JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  )
  WITH CHECK (
    sequence_id IN (
      SELECT s.id FROM public.sequences s
      JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

CREATE POLICY "sequence_enrollments_workspace"
  ON public.sequence_enrollments FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ─── Integrations: workspace-scoped credentials ──────────────────────────────
ALTER TABLE public.integration_credentials
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_integration_creds_workspace
  ON public.integration_credentials (workspace_id, provider)
  WHERE is_active = true;

-- ─── Supabase Realtime for parallel legs ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'parallel_dial_legs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parallel_dial_legs;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'parallel_dial_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parallel_dial_sessions;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
