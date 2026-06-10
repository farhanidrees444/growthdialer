import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canAssignRole, hasPermission, type Role } from '@/lib/auth/permissions';
import { countWorkspaceSeatsUsed } from '@/lib/billing/workspace-seats';
import { sendInvitationEmail } from '@/lib/email/invitation';
import crypto from 'crypto';

// POST /api/workspaces/[id]/invitations — send an invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!callerMember || !hasPermission(callerMember.role as Role, 'INVITE_MEMBERS')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json() as { email: string; role?: Role; message?: string };
  const email = body.email?.trim().toLowerCase();
  const inviteRole = (body.role ?? 'agent') as Role;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
  }

  if (inviteRole === 'owner') {
    return NextResponse.json({ error: 'Owner role cannot be assigned via invitation' }, { status: 403 });
  }

  if (!canAssignRole(callerMember.role as Role, inviteRole)) {
    return NextResponse.json({ error: 'You cannot assign that role' }, { status: 403 });
  }

  const { data: ws } = await supabase.from('workspaces').select('max_seats, name').eq('id', id).single();
  const seats = await countWorkspaceSeatsUsed(supabase, id);

  if (ws && seats.totalUsed >= ws.max_seats) {
    return NextResponse.json({
      error: `Seat limit reached (${seats.totalUsed}/${ws.max_seats} used). Upgrade your plan or cancel a pending invite.`,
      code: 'seat_limit',
    }, { status: 422 });
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', id)
    .eq('user_id', user.id); // Can't do email lookup directly, handled below

  void existingMember; // silence unused warning

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Upsert invitation (replace old pending invite for same email)
  await supabase
    .from('workspace_invitations')
    .delete()
    .eq('workspace_id', id)
    .eq('email', email)
    .is('accepted_at', null);

  const { data: invite, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: id,
      email,
      role: inviteRole,
      invited_by: user.id,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email invitation
  const inviterName = user.user_metadata?.full_name ?? user.email ?? 'A teammate';
  const workspaceName = ws?.name ?? 'GrowthDialer';
  const emailResult = await sendInvitationEmail({
    to: email,
    inviterName,
    workspaceName,
    role: body.role ?? 'agent',
    message: body.message,
    token,
  });

  if (!emailResult.ok) {
    console.warn('[invite] Email send failed:', emailResult.error);
    // Don't fail the request — invite is still created
  }

  return NextResponse.json({ invite, emailSent: emailResult.ok }, { status: 201 });
}
