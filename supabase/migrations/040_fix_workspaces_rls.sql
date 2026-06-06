-- Fix infinite recursion on workspaces RLS (cross-table loop with workspace_members).
-- workspaces SELECT queried workspace_members; workspace_members SELECT queried workspaces.

DROP POLICY IF EXISTS "Members can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners and admins can update workspace" ON workspaces;

CREATE POLICY "workspaces_select"
  ON workspaces FOR SELECT
  USING (
    owner_id = auth.uid()
    OR public.auth_user_is_active_workspace_member(id)
  );

CREATE POLICY "workspaces_update"
  ON workspaces FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR public.auth_user_is_workspace_admin(id)
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.auth_user_is_workspace_admin(id)
  );

-- Remove workspaces subquery from workspace_members SELECT (was part of the recursion loop)
DROP POLICY IF EXISTS "workspace_members_select" ON workspace_members;

CREATE POLICY "workspace_members_select"
  ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.auth_user_is_active_workspace_member(workspace_id)
  );
