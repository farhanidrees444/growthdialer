'use client';

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { hasPermission, type Permission, type Role } from '@/lib/auth/permissions';
import { workspaceFetch } from '@/lib/workspace/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  max_seats: number;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  billing_status?: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: Role;
  status: 'active' | 'invited' | 'suspended';
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  last_active_at: string | null;
  // Joined from auth.users via API
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

interface WorkspaceContextValue {
  // Current state
  currentWorkspace: Workspace | null;
  currentRole: Role | null;
  currentMemberId: string | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  loading: boolean;
  membersLoading: boolean;

  // Actions
  setCurrentWorkspace: (workspace: Workspace) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  inviteMember: (email: string, role: Role, message?: string) => Promise<{ ok: boolean; error?: string }>;
  removeMember: (userId: string) => Promise<{ ok: boolean; error?: string }>;
  updateMemberRole: (userId: string, role: Role) => Promise<{ ok: boolean; error?: string }>;
  cancelInvitation: (inviteId: string) => Promise<{ ok: boolean; error?: string }>;

  // Permission helper
  can: (permission: Permission) => boolean;

  /** fetch() with X-Workspace-Id header for workspace-scoped APIs */
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = 'gd-current-workspace';
const SNAPSHOT_KEY = 'gd-workspace-snapshot';

interface WorkspaceSnapshot {
  workspaces: Workspace[];
  workspace: Workspace;
  role: Role;
  memberId: string | null;
}

function getSavedWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function readWorkspaceSnapshot(): WorkspaceSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkspaceSnapshot;
  } catch {
    return null;
  }
}

function writeWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch { /* ignore */ }
}

function saveWorkspaceId(id: string) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const session = useSupabaseSession();
  const userId = session?.user?.id ?? null;
  const cachedSnapshot = readWorkspaceSnapshot();

  const [workspaces, setWorkspaces] = useState<Workspace[]>(cachedSnapshot?.workspaces ?? []);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(
    cachedSnapshot?.workspace ?? null,
  );
  const [currentRole, setCurrentRole] = useState<Role | null>(cachedSnapshot?.role ?? null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(
    cachedSnapshot?.memberId ?? null,
  );
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const loadedRef = useRef(false);

  // Load workspaces for the current user
  const refreshWorkspaces = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data: memberRows } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, status, id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!memberRows?.length) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setCurrentRole(null);
      setCurrentMemberId(null);
      setLoading(false);
      return;
    }

    const wsIds = memberRows.map((m) => m.workspace_id);
    const { data: wsRows } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', wsIds)
      .order('created_at', { ascending: true });

    const wsList = (wsRows ?? []) as Workspace[];
    setWorkspaces(wsList);

    // Pick the saved workspace or first
    const savedId = getSavedWorkspaceId();
    const target = wsList.find((w) => w.id === savedId) ?? wsList[0] ?? null;
    if (target) {
      const membership = memberRows.find((m) => m.workspace_id === target.id);
      setCurrentWorkspaceState(target);
      setCurrentRole((membership?.role as Role) ?? null);
      setCurrentMemberId(membership?.id ?? null);
      saveWorkspaceId(target.id);
      writeWorkspaceSnapshot({
        workspaces: wsList,
        workspace: target,
        role: (membership?.role as Role) ?? null,
        memberId: membership?.id ?? null,
      });
    }
    setLoading(false);
  }, [userId]);

  // Load members of current workspace
  const refreshMembers = useCallback(async () => {
    if (!currentWorkspace) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
    } catch { /* silent */ } finally {
      setMembersLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (!userId || loadedRef.current) return;
    loadedRef.current = true;
    refreshWorkspaces();
  }, [userId, refreshWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) refreshMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  const setCurrentWorkspace = useCallback(async (ws: Workspace) => {
    const supabase = createClient();
    if (!userId) return;
    const { data } = await supabase
      .from('workspace_members')
      .select('role, id')
      .eq('workspace_id', ws.id)
      .eq('user_id', userId)
      .single();
    setCurrentWorkspaceState(ws);
    setCurrentRole((data?.role as Role) ?? null);
    setCurrentMemberId(data?.id ?? null);
    saveWorkspaceId(ws.id);
    setWorkspaces((prev) => {
      const next = prev.some((w) => w.id === ws.id) ? prev : [...prev, ws];
      writeWorkspaceSnapshot({
        workspaces: next,
        workspace: ws,
        role: (data?.role as Role) ?? null,
        memberId: data?.id ?? null,
      });
      return next;
    });
  }, [userId]);

  const inviteMember = useCallback(async (email: string, role: Role, message?: string) => {
    if (!currentWorkspace) return { ok: false, error: 'No workspace selected' };
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, message }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? 'Invitation failed' };
      await refreshMembers();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [currentWorkspace, refreshMembers]);

  const removeMember = useCallback(async (targetUserId: string) => {
    if (!currentWorkspace) return { ok: false, error: 'No workspace selected' };
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/members/${targetUserId}`,
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? 'Remove failed' };
      await refreshMembers();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [currentWorkspace, refreshMembers]);

  const updateMemberRole = useCallback(async (targetUserId: string, role: Role) => {
    if (!currentWorkspace) return { ok: false, error: 'No workspace selected' };
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/members/${targetUserId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        },
      );
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? 'Role update failed' };
      await refreshMembers();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [currentWorkspace, refreshMembers]);

  const cancelInvitation = useCallback(async (inviteId: string) => {
    if (!currentWorkspace) return { ok: false, error: 'No workspace selected' };
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/invitations/${inviteId}`,
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? 'Cancel failed' };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [currentWorkspace]);

  const can = useCallback((permission: Permission): boolean => {
    if (!currentRole) return false;
    return hasPermission(currentRole, permission);
  }, [currentRole]);

  const apiFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) =>
      workspaceFetch(input, { ...init, workspaceId: currentWorkspace?.id }),
    [currentWorkspace?.id],
  );

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace, currentRole, currentMemberId,
      workspaces, members, loading, membersLoading,
      setCurrentWorkspace, refreshWorkspaces, refreshMembers,
      inviteMember, removeMember, updateMemberRole, cancelInvitation, can, apiFetch,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return ctx;
}
