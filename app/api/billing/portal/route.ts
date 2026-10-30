import { billingAppUrl, getWhop, isWhopSelected, whopReady, whopSandbox } from '@/lib/billing/whop';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { isBillingEnabled } from '@/lib/billing/billing-flag';

export async function POST(request: NextRequest) {
  // Billing bypass: checkout/portal disabled until BILLING_ENABLED=true.
  if (!isBillingEnabled()) {
    return NextResponse.json({ error: 'Billing is temporarily unavailable', billingEnabled: false }, { status: 410 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (isWhopSelected()) {
    if (!whopReady()) return NextResponse.json({ error: 'Billing is not available yet' }, { status: 503 });
    if (request.headers.get('origin') !== billingAppUrl(request.headers.get('origin') || undefined)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    const { data, error } = await supabase.from('subscriptions').select('whop_membership_id, whop_sandbox').eq('user_id', user.id).maybeSingle();
    if (error || !data?.whop_membership_id || data.whop_sandbox !== whopSandbox()) return NextResponse.json({ error: 'No subscription to manage' }, { status: 404 });
    try {
      const membership = await getWhop().memberships.retrieve({ id: data.whop_membership_id });
      if (membership.account.id !== process.env.WHOP_COMPANY_ID || !membership.manage_url) throw new Error('Unavailable');
      const url = new URL(membership.manage_url);
      if (url.protocol !== 'https:' || url.hostname !== (whopSandbox() ? 'sandbox.whop.com' : 'whop.com')) throw new Error('Invalid URL');
      return NextResponse.json({ url: url.toString() });
    } catch { return NextResponse.json({ error: 'Could not open billing management' }, { status: 502 }); }
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!settings?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account on file' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: settings.stripe_customer_id,
      return_url: `${appUrl}/settings?tab=billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Billing portal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
