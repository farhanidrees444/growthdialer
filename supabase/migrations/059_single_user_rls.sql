-- Single-user mode: scope data by user_id without workspace membership.
-- Run in Supabase SQL Editor after prior migrations.

-- Leads
DROP POLICY IF EXISTS "leads_user_select" ON public.leads;
CREATE POLICY "leads_user_select" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "leads_user_insert" ON public.leads;
CREATE POLICY "leads_user_insert" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "leads_user_update" ON public.leads;
CREATE POLICY "leads_user_update" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Calls (insert/update — select already has calls_select_own)
DROP POLICY IF EXISTS "calls_user_insert" ON public.calls;
CREATE POLICY "calls_user_insert" ON public.calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "calls_user_update" ON public.calls;
CREATE POLICY "calls_user_update" ON public.calls
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sequences
DROP POLICY IF EXISTS "sequences_user_all" ON public.sequences;
CREATE POLICY "sequences_user_all" ON public.sequences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Workspace dispositions → readable by owner user when workspace_id is null
DROP POLICY IF EXISTS "dispositions_user_select" ON public.workspace_dispositions;
CREATE POLICY "dispositions_user_select" ON public.workspace_dispositions
  FOR SELECT USING (
    workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_dispositions.workspace_id AND w.owner_id = auth.uid()
    )
  );

COMMENT ON POLICY "leads_user_select" ON public.leads IS
  'Single-user mode: users read their own leads without workspace membership.';
