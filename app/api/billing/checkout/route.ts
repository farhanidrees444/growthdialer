import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  WORKSPACE_PLANS,
  type WorkspacePlanId,
  stripeReadyForWorkspacePlan,
} from '@/lib/billing/workspace-plans';
import { stripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { plan?: WorkspacePlanId };
  const plan = body.plan ?? 'pro';
  const planDef = WORKSPACE_PLANS[plan];

  if (!planDef) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  if (plan === 'enterprise' || plan === 'free') {
    return NextResponse.json({ url: '/contact-sales' });
  }

  if (!isStripeConfigured() || !stripeReadyForWorkspacePlan(plan)) {
    return NextResponse.json(
      { error: 'Billing is not configured on this deployment. Contact support to upgrade.' },
      { status: 503 },
    );
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: settings?.stripe_customer_id ?? undefined,
      customer_email: settings?.stripe_customer_id ? undefined : user.email ?? undefined,
      line_items: [{ price: planDef.stripePriceId!, quantity: 1 }],
      success_url: `${appUrl}/settings?tab=billing&upgraded=true`,
      cancel_url: `${appUrl}/settings?tab=billing`,
      metadata: {
        plan,
        userId: user.id,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: { plan, userId: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Billing error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
