-- Fix infinite recursion on workspace_members RLS during workspace creation.
-- Policies that subquery workspace_members from within workspace_members
-- trigger Postgres "infinite recursion detected in policy".

-- ── Security-definer helpers (bypass RLS for membership checks) ───────────────

CREATE OR REPLACE FUNCTION public.auth_user_is_active_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_user_is_workspace_admin(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces w
    WHERE w.id = p_workspace_id
      AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_is_active_workspace_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_is_workspace_admin(uuid) TO authenticated;

-- ── Replace recursive workspace_members policies ─────────────────────────────

DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Users can update own membership" ON workspace_members;

CREATE POLICY "workspace_members_select"
  ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.auth_user_is_active_workspace_member(workspace_id)
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
        AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_insert"
  ON workspace_members FOR INSERT
  WITH CHECK (
    (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.workspaces w
        WHERE w.id = workspace_id
          AND w.owner_id = auth.uid()
      )
    )
    OR public.auth_user_is_workspace_admin(workspace_id)
  );

CREATE POLICY "workspace_members_update_own"
  ON workspace_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspace_members_update_admin"
  ON workspace_members FOR UPDATE
  USING (public.auth_user_is_workspace_admin(workspace_id))
  WITH CHECK (public.auth_user_is_workspace_admin(workspace_id));

CREATE POLICY "workspace_members_delete_admin"
  ON workspace_members FOR DELETE
  USING (public.auth_user_is_workspace_admin(workspace_id));
