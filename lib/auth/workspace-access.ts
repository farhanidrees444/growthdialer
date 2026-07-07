import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasPermission, type Permission, type Role } from '@/lib/auth/permissions';

/** @deprecated Workspace header is ignored in single-user mode. */
export const WORKSPACE_ID_HEADER = 'x-workspace-id';

export interface WorkspaceAccess {
  /** Always null — workspace tenancy removed. */
  workspaceId: null;
  userId: string;
  role: Role;
  memberId: string;
}

export function isWorkspaceError(
  result: WorkspaceAccess | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

function workspaceIdFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const id = (body as { workspace_id?: unknown }).workspace_id;
  if (typeof id === 'string' && id.trim()) return id.trim();
  return null;
}

/** @deprecated Ignored in single-user mode. */
export function getWorkspaceIdFromRequest(
  request: NextRequest,
  body?: unknown,
): string | null {
  const header = request.headers.get(WORKSPACE_ID_HEADER);
  if (header?.trim()) return header.trim();

  const query = request.nextUrl.searchParams.get('workspace_id');
  if (query?.trim()) return query.trim();

  return workspaceIdFromBody(body);
}

/**
 * Single-user access: authenticated user is always owner of their own data.
 * Workspace membership is no longer required.
 */
export async function resolveWorkspaceAccess(
  _supabase: SupabaseClient,
  userId: string,
  _workspaceId: string | null | undefined,
  options?: { permission?: Permission; requireExplicit?: boolean },
): Promise<WorkspaceAccess | NextResponse> {
  if (options?.requireExplicit) {
    return NextResponse.json(
      { error: 'workspace_id is no longer used', code: 'WORKSPACE_REMOVED' },
      { status: 400 },
    );
  }

  const role: Role = 'owner';
  if (options?.permission && !hasPermission(role, options.permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return {
    workspaceId: null,
    userId,
    role,
    memberId: userId,
  };
}

export async function requireWorkspaceFromRequest(
  request: NextRequest,
  supabase: SupabaseClient,
  userId: string,
  options?: { permission?: Permission; body?: unknown },
): Promise<WorkspaceAccess | NextResponse> {
  const workspaceId = getWorkspaceIdFromRequest(request, options?.body);
  return resolveWorkspaceAccess(supabase, userId, workspaceId, {
    permission: options?.permission,
  });
}
