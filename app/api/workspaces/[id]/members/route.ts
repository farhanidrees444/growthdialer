import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/workspaces/[id]/members — list members with user info
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify caller is a member
  const { data: caller } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, user_id, role, status, joined_at, last_active_at, invited_at, invited_by')
    .eq('workspace_id', id)
    .order('joined_at', { ascending: true });

  // Enrich with user metadata via service role client
  const userIds = (members ?? []).map((m) => m.user_id);
  const profileMap = new Map<string, { email: string; full_name: string }>();

  const svc = createServiceClient();
  if (svc && userIds.length > 0) {
    const { data: usersResp } = await svc.auth.admin.listUsers({ perPage: 1000 });
    for (const u of usersResp?.users ?? []) {
      if (userIds.includes(u.id)) {
        profileMap.set(u.id, {
          email: u.email ?? '',
          full_name: (u.user_metadata?.full_name as string) ?? u.email?.split('@')[0] ?? 'Unknown',
        });
      }
    }
  }

  const enriched = (members ?? []).map((m) => ({
    ...m,
    email: profileMap.get(m.user_id)?.email ?? null,
    full_name: profileMap.get(m.user_id)?.full_name ?? null,
  }));

  // Also include pending invitations
  const { data: invites } = await supabase
    .from('workspace_invitations')
    .select('id, email, role, created_at, expires_at, accepted_at')
    .eq('workspace_id', id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString());

  return NextResponse.json({ members: enriched, pending_invitations: invites ?? [] });
}
