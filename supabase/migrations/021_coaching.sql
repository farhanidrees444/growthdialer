-- ============================================================
-- Migration 021: Call Coaching (Listen / Whisper / Barge)
-- Run manually in Supabase SQL editor AFTER migration 020
-- ============================================================

-- ── Coaching sessions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id),
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'listen', -- listen, whisper, barge
  telnyx_conference_id TEXT,           -- Telnyx conference room ID
  coach_call_control_id TEXT,          -- Telnyx call control ID for coach leg
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Coaching metrics (aggregated, refreshed periodically) ────
CREATE TABLE IF NOT EXISTS coaching_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_coached_calls INT NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3, 2),
  improvement_score NUMERIC(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, workspace_id, period_start)
);

-- ── Active calls view for coaching dashboard ─────────────────
-- Shows live calls available for coaching within a workspace
CREATE OR REPLACE VIEW active_team_calls AS
SELECT
  c.id                                           AS call_id,
  c.user_id                                      AS agent_id,
  c.lead_id,
  c.from_number,
  c.to_number,
  c.started_at,
  c.telnyx_call_id,
  c.workspace_id,
  EXTRACT(EPOCH FROM (NOW() - c.started_at))::INT AS duration_seconds,
  au.email                                        AS agent_email,
  au.raw_user_meta_data ->> 'full_name'           AS agent_name,
  l.first_name                                    AS lead_first_name,
  l.last_name                                     AS lead_last_name,
  l.company                                       AS lead_company,
  cs.id                                           AS coaching_session_id,
  cs.coach_id,
  cs.mode                                         AS coaching_mode
FROM calls c
JOIN auth.users au ON au.id = c.user_id
LEFT JOIN leads l ON l.id = c.lead_id
LEFT JOIN coaching_sessions cs ON cs.call_id = c.id AND cs.ended_at IS NULL
WHERE
  c.status IN ('in_progress', 'active', 'initiated')
  AND c.ended_at IS NULL;

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_call ON coaching_sessions(call_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_agent ON coaching_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach ON coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_workspace ON coaching_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_active
  ON coaching_sessions(call_id) WHERE ended_at IS NULL;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_metrics ENABLE ROW LEVEL SECURITY;

-- Agents can read their own coaching sessions
-- Managers/admins/owners can read all sessions in their workspace
CREATE POLICY "Read coaching sessions" ON coaching_sessions
  FOR SELECT USING (
    agent_id = auth.uid()
    OR coach_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
    )
  );

-- Only coaches (manager+) can create sessions
CREATE POLICY "Coaches can create sessions" ON coaching_sessions
  FOR INSERT WITH CHECK (
    coach_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
    )
  );

-- Coach can update their own session (mode changes, end, notes, rating)
CREATE POLICY "Coach can update own sessions" ON coaching_sessions
  FOR UPDATE USING (coach_id = auth.uid());

-- Coaching metrics
CREATE POLICY "Read own coaching metrics" ON coaching_metrics
  FOR SELECT USING (
    agent_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
    )
  );

CREATE POLICY "System can upsert coaching metrics" ON coaching_metrics
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
    )
  );
