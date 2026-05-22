import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/auth/permissions';

// POST /api/invitations/[token]/accept — accept a workspace invitation
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to accept an invitation' }, { status: 401 });
  }

  // Find the invitation
  const { data: invite } = await supabase
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, expires_at, accepted_at')
    .eq('token', token)
    .single();

  if (!invite) return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ error: 'Invitation already accepted' }, { status: 409 });
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
  }

  // Verify the invitee's email matches
  const userEmail = user.email?.toLowerCase();
  if (invite.email.toLowerCase() !== userEmail) {
    return NextResponse.json(
      { error: `This invitation was sent to ${invite.email}. Please sign in with that email.` },
      { status: 403 },
    );
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .single();

  if (!existing) {
    const { error: insertErr } = await supabase.from('workspace_members').insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role as Role,
      status: 'active',
      invited_by: null,
      invited_at: invite.accepted_at,
      joined_at: new Date().toISOString(),
    });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  } else {
    // Already a member — update role if invitation role is higher
    await supabase
      .from('workspace_members')
      .update({ status: 'active', role: invite.role, joined_at: new Date().toISOString() })
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user.id);
  }

  // Mark invitation accepted
  await supabase
    .from('workspace_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  // Return workspace info for redirect
  const { data: ws } = await supabase.from('workspaces').select('id, name, slug').eq('id', invite.workspace_id).single();
  return NextResponse.json({ ok: true, workspace: ws });
}

// GET /api/invitations/[token]/accept — peek at invitation details (for the pre-fill UI)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from('workspace_invitations')
    .select('email, role, expires_at, accepted_at, workspace_id')
    .eq('token', token)
    .single();

  if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ error: 'Already accepted' }, { status: 409 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 410 });

  const { data: ws } = await supabase.from('workspaces').select('name').eq('id', invite.workspace_id).single();
  return NextResponse.json({ email: invite.email, role: invite.role, workspace_name: ws?.name ?? '' });
}
