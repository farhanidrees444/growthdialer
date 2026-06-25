-- Advanced Coaching: scoring, notes, reports, badges, and realtime active calls.
-- Safe to run after workspace/calls migrations.

CREATE TABLE IF NOT EXISTS public.active_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL UNIQUE REFERENCES public.calls(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  from_number TEXT,
  to_number TEXT,
  prospect_name TEXT,
  prospect_company TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ai_sentiment_score NUMERIC(5, 2),
  talk_listen_ratio NUMERIC(5, 2),
  conference_sid TEXT,
  agent_participant_sid TEXT,
  prospect_participant_sid TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.call_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL UNIQUE REFERENCES public.calls(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INT NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  rubric_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary TEXT NOT NULL DEFAULT '',
  key_moments JSONB NOT NULL DEFAULT '[]'::jsonb,
  coachable_moments JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  transcript_source TEXT,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coaching_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  visible_to_agent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(call_id, coach_id)
);

CREATE TABLE IF NOT EXISTS public.coaching_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
  drill JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT NOT NULL DEFAULT '',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, agent_id, week_start)
);

CREATE TABLE IF NOT EXISTS public.leaderboard_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('top_closer', 'most_improved', 'best_opener')),
  badge_label TEXT NOT NULL,
  metric_value NUMERIC(10, 2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, agent_id, week_start, badge_type)
);

ALTER TABLE public.coaching_sessions
  ADD COLUMN IF NOT EXISTS twilio_conference_sid TEXT,
  ADD COLUMN IF NOT EXISTS coach_participant_sid TEXT,
  ADD COLUMN IF NOT EXISTS agent_participant_sid TEXT,
  ADD COLUMN IF NOT EXISTS prospect_participant_sid TEXT;

CREATE INDEX IF NOT EXISTS idx_active_calls_workspace_updated
  ON public.active_calls(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_calls_agent
  ON public.active_calls(agent_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_scores_workspace_agent_scored
  ON public.call_scores(workspace_id, agent_id, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_scores_call
  ON public.call_scores(call_id);
CREATE INDEX IF NOT EXISTS idx_call_scores_total
  ON public.call_scores(workspace_id, total_score DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_notes_agent_created
  ON public.coaching_notes(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_notes_workspace_created
  ON public.coaching_notes(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_reports_agent_week
  ON public.coaching_reports(agent_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_reports_workspace_week
  ON public.coaching_reports(workspace_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_badges_workspace_week
  ON public.leaderboard_badges(workspace_id, week_start DESC, badge_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_badges_agent_week
  ON public.leaderboard_badges(agent_id, week_start DESC);

ALTER TABLE public.active_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_badges ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

DROP POLICY IF EXISTS active_calls_read_scoped ON public.active_calls;
CREATE POLICY active_calls_read_scoped ON public.active_calls
  FOR SELECT USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = active_calls.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS active_calls_service_write ON public.active_calls;
CREATE POLICY active_calls_service_write ON public.active_calls
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS call_scores_read_scoped ON public.call_scores;
CREATE POLICY call_scores_read_scoped ON public.call_scores
  FOR SELECT USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = call_scores.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS call_scores_service_write ON public.call_scores;
CREATE POLICY call_scores_service_write ON public.call_scores
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS coaching_notes_read_scoped ON public.coaching_notes;
CREATE POLICY coaching_notes_read_scoped ON public.coaching_notes
  FOR SELECT USING (
    (agent_id = auth.uid() AND visible_to_agent)
    OR coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = coaching_notes.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS coaching_notes_manager_insert ON public.coaching_notes;
CREATE POLICY coaching_notes_manager_insert ON public.coaching_notes
  FOR INSERT WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = coaching_notes.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS coaching_notes_manager_update ON public.coaching_notes;
CREATE POLICY coaching_notes_manager_update ON public.coaching_notes
  FOR UPDATE USING (
    coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = coaching_notes.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = coaching_notes.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS coaching_notes_service_write ON public.coaching_notes;
CREATE POLICY coaching_notes_service_write ON public.coaching_notes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS coaching_reports_read_scoped ON public.coaching_reports;
CREATE POLICY coaching_reports_read_scoped ON public.coaching_reports
  FOR SELECT USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = coaching_reports.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS coaching_reports_service_write ON public.coaching_reports;
CREATE POLICY coaching_reports_service_write ON public.coaching_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS leaderboard_badges_read_scoped ON public.leaderboard_badges;
CREATE POLICY leaderboard_badges_read_scoped ON public.leaderboard_badges
  FOR SELECT USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = leaderboard_badges.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS leaderboard_badges_service_write ON public.leaderboard_badges;
CREATE POLICY leaderboard_badges_service_write ON public.leaderboard_badges
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION private.sync_active_call_from_calls()
RETURNS TRIGGER AS $$
DECLARE
  lead_record RECORD;
  sentiment_score NUMERIC(5, 2);
BEGIN
  IF NEW.workspace_id IS NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.lead_id IS NOT NULL THEN
    SELECT first_name, last_name, company INTO lead_record
    FROM public.leads
    WHERE id = NEW.lead_id;
  END IF;

  sentiment_score := CASE
    WHEN NEW.ai_sentiment_score IS NULL THEN NULL
    WHEN NEW.ai_sentiment_score <= 1 THEN round(((NEW.ai_sentiment_score + 1) * 50)::numeric, 2)
    ELSE round(NEW.ai_sentiment_score::numeric, 2)
  END;

  IF NEW.status IN ('ringing', 'answered', 'active') AND NEW.ended_at IS NULL THEN
    INSERT INTO public.active_calls (
      call_id,
      workspace_id,
      agent_id,
      lead_id,
      from_number,
      to_number,
      prospect_name,
      prospect_company,
      status,
      started_at,
      answered_at,
      ai_sentiment_score,
      updated_at,
      last_event_at
    )
    VALUES (
      NEW.id,
      NEW.workspace_id,
      NEW.user_id,
      NEW.lead_id,
      NEW.from_number,
      NEW.to_number,
      trim(coalesce(lead_record.first_name, '') || ' ' || coalesce(lead_record.last_name, '')),
      lead_record.company,
      NEW.status,
      NEW.started_at,
      NEW.answered_at,
      sentiment_score,
      now(),
      now()
    )
    ON CONFLICT (call_id) DO UPDATE SET
      workspace_id = EXCLUDED.workspace_id,
      agent_id = EXCLUDED.agent_id,
      lead_id = EXCLUDED.lead_id,
      from_number = EXCLUDED.from_number,
      to_number = EXCLUDED.to_number,
      prospect_name = EXCLUDED.prospect_name,
      prospect_company = EXCLUDED.prospect_company,
      status = EXCLUDED.status,
      started_at = EXCLUDED.started_at,
      answered_at = EXCLUDED.answered_at,
      ai_sentiment_score = EXCLUDED.ai_sentiment_score,
      updated_at = now(),
      last_event_at = now();
  ELSE
    DELETE FROM public.active_calls WHERE call_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS calls_sync_active_call ON public.calls;
CREATE TRIGGER calls_sync_active_call
  AFTER INSERT OR UPDATE OF status, ended_at, answered_at, started_at, ai_sentiment_score, lead_id
  ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_active_call_from_calls();

INSERT INTO public.active_calls (
  call_id,
  workspace_id,
  agent_id,
  lead_id,
  from_number,
  to_number,
  prospect_name,
  prospect_company,
  status,
  started_at,
  answered_at,
  ai_sentiment_score
)
SELECT
  c.id,
  c.workspace_id,
  c.user_id,
  c.lead_id,
  c.from_number,
  c.to_number,
  trim(coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')),
  l.company,
  c.status,
  c.started_at,
  c.answered_at,
  CASE
    WHEN c.ai_sentiment_score IS NULL THEN NULL
    WHEN c.ai_sentiment_score <= 1 THEN round(((c.ai_sentiment_score + 1) * 50)::numeric, 2)
    ELSE round(c.ai_sentiment_score::numeric, 2)
  END
FROM public.calls c
LEFT JOIN public.leads l ON l.id = c.lead_id
WHERE c.workspace_id IS NOT NULL
  AND c.user_id IS NOT NULL
  AND c.status IN ('ringing', 'answered', 'active')
  AND c.ended_at IS NULL
ON CONFLICT (call_id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'active_calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.active_calls;
  END IF;
END $$;

ALTER TABLE public.active_calls REPLICA IDENTITY FULL;
