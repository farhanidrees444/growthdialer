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
