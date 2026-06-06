-- Workspace-scoped leads access for team members
-- Complements existing user_id policies (policies are OR'd)

DROP POLICY IF EXISTS "workspace_members_select_leads" ON leads;
CREATE POLICY "workspace_members_select_leads"
  ON leads FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = leads.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "workspace_members_insert_leads" ON leads;
CREATE POLICY "workspace_members_insert_leads"
  ON leads FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = leads.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager', 'agent')
    )
  );

DROP POLICY IF EXISTS "workspace_members_update_leads" ON leads;
CREATE POLICY "workspace_members_update_leads"
  ON leads FOR UPDATE
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = leads.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = leads.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

-- Partial unique phone per workspace (active leads only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_phone_unique
  ON leads (workspace_id, phone)
  WHERE deleted_at IS NULL AND workspace_id IS NOT NULL;
