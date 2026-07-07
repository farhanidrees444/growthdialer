'use client';

import {
  createContext, useCallback, useContext, type ReactNode,
} from 'react';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { hasPermission, type Permission, type Role } from '@/lib/auth/permissions';

/** @deprecated Workspace tenancy removed — types kept for gradual migration. */
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

/** @deprecated */
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
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

interface WorkspaceContextValue {
  currentWorkspace: Workspace | null;
  currentRole: Role | null;
  currentMemberId: string | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  loading: boolean;
  membersLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  inviteMember: (email: string, role: Role, message?: string) => Promise<{ ok: boolean; error?: string }>;
  removeMember: (userId: string) => Promise<{ ok: boolean; error?: string }>;
  updateMemberRole: (userId: string, role: Role) => Promise<{ ok: boolean; error?: string }>;
  cancelInvitation: (inviteId: string) => Promise<{ ok: boolean; error?: string }>;
  can: (permission: Permission) => boolean;
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const REMOVED = { ok: false as const, error: 'Team workspaces are no longer supported' };

/**
 * Lightweight provider for single-user mode.
 * Replaces multi-workspace tenancy — each user owns their own data via user_id.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const session = useSupabaseSession();
  const userId = session?.user?.id ?? null;
  const role: Role = 'owner';

  const can = useCallback(
    (permission: Permission) => hasPermission(role, permission),
    [],
  );

  const apiFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, credentials: init?.credentials ?? 'same-origin' }),
    [],
  );

  const noopAsync = useCallback(async () => undefined, []);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace: null,
        currentRole: role,
        currentMemberId: userId,
        workspaces: [],
        members: [],
        loading: false,
        membersLoading: false,
        setCurrentWorkspace: noopAsync,
        refreshWorkspaces: noopAsync,
        refreshMembers: noopAsync,
        inviteMember: async () => REMOVED,
        removeMember: async () => REMOVED,
        updateMemberRole: async () => REMOVED,
        cancelInvitation: async () => REMOVED,
        can,
        apiFetch,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return ctx;
}
