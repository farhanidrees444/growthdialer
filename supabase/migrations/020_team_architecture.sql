-- ============================================================
-- Migration 020: Team Architecture (Workspaces + Members)
-- Run manually in Supabase SQL editor
-- ============================================================

-- ── Workspaces ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan TEXT NOT NULL DEFAULT 'free', -- free, pro, team, enterprise
  max_seats INT NOT NULL DEFAULT 5,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Workspace members ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent', -- owner, admin, manager, agent, viewer
  status TEXT NOT NULL DEFAULT 'active', -- active, invited, suspended
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(workspace_id, user_id)
);

-- ── Workspace invitations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Teams within workspace ───────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);

-- ── Add workspace_id to existing tables ──────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE purchased_numbers ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE voicemails ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE power_dial_sessions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- ── Auto-create workspace for every existing user ────────────
-- Creates a "Personal Workspace" for users who have leads/calls but no workspace yet
DO $$
DECLARE
  v_user RECORD;
  v_ws_id UUID;
  v_slug TEXT;
BEGIN
  FOR v_user IN
    SELECT DISTINCT user_id
    FROM (
      SELECT user_id FROM leads WHERE workspace_id IS NULL AND user_id IS NOT NULL
      UNION
      SELECT user_id FROM calls WHERE workspace_id IS NULL AND user_id IS NOT NULL
      UNION
      SELECT user_id FROM purchased_numbers WHERE workspace_id IS NULL AND user_id IS NOT NULL
    ) u
  LOOP
    -- Only create if not already in any workspace
    IF NOT EXISTS (
      SELECT 1 FROM workspace_members WHERE user_id = v_user.user_id
    ) THEN
      v_slug := 'ws-' || LEFT(v_user.user_id::TEXT, 8);

      INSERT INTO workspaces (name, slug, owner_id, plan, max_seats)
      VALUES ('My Workspace', v_slug, v_user.user_id, 'free', 5)
      RETURNING id INTO v_ws_id;

      INSERT INTO workspace_members (workspace_id, user_id, role, status)
      VALUES (v_ws_id, v_user.user_id, 'owner', 'active');

      UPDATE leads SET workspace_id = v_ws_id
        WHERE user_id = v_user.user_id AND workspace_id IS NULL;
      UPDATE calls SET workspace_id = v_ws_id
        WHERE user_id = v_user.user_id AND workspace_id IS NULL;
      UPDATE purchased_numbers SET workspace_id = v_ws_id
        WHERE user_id = v_user.user_id AND workspace_id IS NULL;
      UPDATE voicemails SET workspace_id = v_ws_id
        WHERE user_id = v_user.user_id AND workspace_id IS NULL;
      UPDATE power_dial_sessions SET workspace_id = v_ws_id
        WHERE user_id = v_user.user_id AND workspace_id IS NULL;
      UPDATE user_settings SET workspace_id = v_ws_id
        WHERE user_id = v_user.user_id AND workspace_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calls_workspace ON calls(workspace_id);
CREATE INDEX IF NOT EXISTS idx_teams_workspace ON teams(workspace_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Workspaces: member can read their workspace
CREATE POLICY "Members can view their workspaces" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- Owner/admin can update workspace
CREATE POLICY "Owners and admins can update workspace" ON workspaces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Owner can delete workspace
CREATE POLICY "Owner can delete workspace" ON workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- Anyone authenticated can create a workspace (their first workspace)
CREATE POLICY "Authenticated users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Workspace members: members can read their workspace's members
CREATE POLICY "Members can view workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Owner/admin can manage members
CREATE POLICY "Owners and admins can manage members" ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- Users can manage their own membership record (e.g., accept invite updates joined_at)
CREATE POLICY "Users can update own membership" ON workspace_members
  FOR UPDATE USING (user_id = auth.uid());

-- Invitations: invitee can read by token, members can read all
CREATE POLICY "Members can view invitations" ON workspace_invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage invitations" ON workspace_invitations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- Teams
CREATE POLICY "Members can view teams" ON teams
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND status = 'active'
    )
  );

CREATE POLICY "Members can view team membership" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

CREATE POLICY "Admins can manage team membership" ON team_members
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
        AND wm.status = 'active'
    )
  );

-- ── updated_at trigger for workspaces ────────────────────────
CREATE OR REPLACE FUNCTION update_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();
