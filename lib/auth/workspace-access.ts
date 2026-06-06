import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasPermission, type Permission, type Role } from '@/lib/auth/permissions';

export const WORKSPACE_ID_HEADER = 'x-workspace-id';

export interface WorkspaceAccess {
  workspaceId: string;
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
 * Resolve the active workspace for an API request and verify membership.
 * Falls back to the user's first active workspace when no ID is sent.
 */
export async function resolveWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null | undefined,
  options?: { permission?: Permission; requireExplicit?: boolean },
): Promise<WorkspaceAccess | NextResponse> {
  const explicitId = workspaceId?.trim() || null;

  if (explicitId) {
    const { data: member, error } = await supabase
      .from('workspace_members')
      .select('id, role, workspace_id')
      .eq('user_id', userId)
      .eq('workspace_id', explicitId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !member) {
      return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 });
    }

    const role = member.role as Role;
    if (options?.permission && !hasPermission(role, options.permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return { workspaceId: member.workspace_id, role, memberId: member.id };
  }

  if (options?.requireExplicit) {
    return NextResponse.json(
      { error: 'workspace_id required', code: 'NO_WORKSPACE' },
      { status: 400 },
    );
  }

  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('id, role, workspace_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !member) {
    return NextResponse.json(
      { error: 'No workspace found', code: 'NO_WORKSPACE' },
      { status: 403 },
    );
  }

  const role = member.role as Role;
  if (options?.permission && !hasPermission(role, options.permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { workspaceId: member.workspace_id, role, memberId: member.id };
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
