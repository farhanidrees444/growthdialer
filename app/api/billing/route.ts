import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WORKSPACE_PLANS, type WorkspacePlanId } from '@/lib/billing/workspace-plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: settings } = await supabase
    .from('user_settings')
    .select('plan, plan_status, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const planKey = (settings?.plan as WorkspacePlanId | null) ?? 'free';
  const planDef = WORKSPACE_PLANS[planKey] ?? WORKSPACE_PLANS.free;

  return NextResponse.json({
    account: {
      plan: planKey,
      billing_status: settings?.plan_status ?? 'active',
      stripe_subscription_id: settings?.stripe_subscription_id ?? null,
    },
    plan: planDef,
    canManageBilling: true,
  });
}
