import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, billing_cycle, seats, status, trial_ends_at, current_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[SUBSCRIPTION-STATUS] Lookup failed', error);
    return NextResponse.json({ error: 'Could not load subscription status' }, { status: 500 });
  }

  return NextResponse.json({
    status: data?.status ?? 'none',
    plan: data?.plan ?? 'trial',
    billingCycle: data?.billing_cycle ?? 'monthly',
    seats: data?.seats ?? 1,
    trialEndsAt: data?.trial_ends_at ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
    active: data?.status === 'active' || data?.status === 'trialing',
  });
}
