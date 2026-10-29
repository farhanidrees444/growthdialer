import { hasSubscriptionAccess } from '@/lib/billing/catalog';
import { isWhopSelected, whopReady, whopSandbox } from '@/lib/billing/whop';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isBillingEnabled } from '@/lib/billing/billing-flag';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, billing_cycle, seats, status, trial_ends_at, current_period_end, whop_intent_id, billing_provider, cancel_at_period_end, whop_sandbox')
    .eq('user_id', user.id)

    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[SUBSCRIPTION-STATUS] Lookup failed', error);
    return NextResponse.json({ error: 'Could not load subscription status' }, { status: 500 });
  }

  return NextResponse.json({
    status: data?.status ?? 'none',
    provider: isWhopSelected() ? 'whop' : 'legacy',
    plan: data?.plan ?? 'trial',
    billingCycle: data?.billing_cycle ?? 'monthly',
    seats: data?.seats ?? 1,
    trialEndsAt: data?.trial_ends_at ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
    active: data?.billing_provider === 'whop' ? data.whop_sandbox === whopSandbox() && hasSubscriptionAccess(data.status, data.current_period_end) : data?.status === 'active' || data?.status === 'trialing',
    checkoutConfirmed: !!data?.whop_intent_id && data.whop_intent_id === request.nextUrl.searchParams.get('intent'),
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    checkoutAvailable: whopReady(),
    billingEnabled: isBillingEnabled(),
  });
}
