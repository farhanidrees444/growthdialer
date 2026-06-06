import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Role } from '@/lib/auth/permissions';
import { WORKSPACE_PLANS } from '@/lib/billing/workspace-plans';
import { countWorkspaceSeatsUsed } from '@/lib/billing/workspace-seats';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!caller || !hasPermission(caller.role as Role, 'VIEW_BILLING')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: ws, error } = await supabase
    .from('workspaces')
    .select('id, name, plan, max_seats, stripe_customer_id, stripe_subscription_id, billing_status, owner_id')
    .eq('id', id)
    .single();

  if (error || !ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

  const seats = await countWorkspaceSeatsUsed(supabase, id);
  const planDef = WORKSPACE_PLANS[ws.plan as keyof typeof WORKSPACE_PLANS] ?? WORKSPACE_PLANS.free;

  return NextResponse.json({
    workspace: ws,
    plan: planDef,
    seats,
    canManageBilling: hasPermission(caller.role as Role, 'MANAGE_BILLING'),
  });
}
