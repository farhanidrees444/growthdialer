import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasPermission } from '@/lib/auth/permissions';
import type { WorkspaceAccess } from '@/lib/auth/workspace-access';

export interface CallRow {
  id: string;
  user_id: string;
  workspace_id: string | null;
  telnyx_call_id?: string | null;
  lead_id?: string | null;
  disposition?: string | null;
  direction?: string | null;
  status?: string | null;
  answered_at?: string | null;
}

export type CallLookup = { id?: string; telnyxCallId?: string };

export function isCallAccessError(
  result: CallRow | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

export function callBelongsToWorkspace(
  call: { workspace_id: string | null; user_id: string },
  workspaceId: string,
  userId: string,
): boolean {
  if (call.workspace_id) return call.workspace_id === workspaceId;
  return call.user_id === userId;
}

export function canViewTeamCalls(access: WorkspaceAccess): boolean {
  return (
    hasPermission(access.role, 'VIEW_ALL_CALLS')
    || hasPermission(access.role, 'VIEW_TEAM_ANALYTICS')
    || hasPermission(access.role, 'VIEW_ALL_RECORDINGS')
  );
}

/** PostgREST OR filter: own calls in workspace + legacy rows without workspace_id */
export function ownCallsOrFilter(workspaceId: string, userId: string): string {
  return `and(workspace_id.eq.${workspaceId},user_id.eq.${userId}),and(workspace_id.is.null,user_id.eq.${userId})`;
}

export async function findCall(
  supabase: SupabaseClient,
  lookup: CallLookup,
): Promise<CallRow | null> {
  if (!lookup.id && !lookup.telnyxCallId) return null;

  let query = supabase
    .from('calls')
    .select('id, user_id, workspace_id, telnyx_call_id, lead_id, disposition, direction, status, answered_at');

  if (lookup.id && lookup.telnyxCallId) {
    query = query.or(`id.eq.${lookup.id},telnyx_call_id.eq.${lookup.telnyxCallId}`);
  } else if (lookup.id) {
    query = query.eq('id', lookup.id);
  } else {
    query = query.eq('telnyx_call_id', lookup.telnyxCallId!);
  }

  const { data } = await query.maybeSingle();
  return (data as CallRow | null) ?? null;
}

export async function requireCallAccess(
  supabase: SupabaseClient,
  lookup: CallLookup,
  access: WorkspaceAccess,
  userId: string,
  mode: 'read' | 'control',
): Promise<CallRow | NextResponse> {
  const call = await findCall(supabase, lookup);
  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  if (!callBelongsToWorkspace(call, access.workspaceId, userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (mode === 'control') {
    if (call.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return call;
  }

  if (canViewTeamCalls(access)) return call;
  if (call.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return call;
}
