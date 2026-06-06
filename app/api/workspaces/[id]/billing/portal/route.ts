import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Role } from '@/lib/auth/permissions';
import { stripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(
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

  if (!caller || !hasPermission(caller.role as Role, 'MANAGE_BILLING')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
  }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', id)
    .single();

  if (!ws?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription for this workspace' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: ws.stripe_customer_id,
      return_url: `${appUrl}/settings?tab=billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Portal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
