-- Workspace-scoped calls access for team members (OR'd with existing user_id policies)

DROP POLICY IF EXISTS "workspace_members_select_calls" ON calls;
CREATE POLICY "workspace_members_select_calls"
  ON calls FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calls.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "workspace_members_insert_calls" ON calls;
CREATE POLICY "workspace_members_insert_calls"
  ON calls FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calls.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager', 'agent')
    )
  );

DROP POLICY IF EXISTS "workspace_members_update_calls" ON calls;
CREATE POLICY "workspace_members_update_calls"
  ON calls FOR UPDATE
  USING (
    workspace_id IS NOT NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM workspace_members wm
        WHERE wm.workspace_id = calls.workspace_id
          AND wm.user_id = auth.uid()
          AND wm.status = 'active'
          AND wm.role IN ('owner', 'admin', 'manager')
      )
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calls.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

CREATE INDEX IF NOT EXISTS idx_calls_workspace_started
  ON calls (workspace_id, started_at DESC NULLS LAST)
  WHERE workspace_id IS NOT NULL;
