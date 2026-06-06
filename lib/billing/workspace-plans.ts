export type WorkspacePlanId = 'free' | 'pro' | 'team' | 'enterprise';

export interface WorkspacePlanDefinition {
  id: WorkspacePlanId;
  label: string;
  max_seats: number;
  monthlyPrice: number | null;
  stripePriceId: string | null;
  description: string;
}

export const WORKSPACE_PLANS: Record<WorkspacePlanId, WorkspacePlanDefinition> = {
  free: {
    id: 'free',
    label: 'Starter',
    max_seats: 1,
    monthlyPrice: 0,
    stripePriceId: null,
    description: 'Solo rep — power dialer, recordings, lead import',
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    max_seats: 3,
    monthlyPrice: 49,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID
      ?? process.env.STRIPE_STARTER_PRICE_ID
      ?? '',
    description: 'Small team — AI briefs, coaching, team analytics',
  },
  team: {
    id: 'team',
    label: 'Team',
    max_seats: 10,
    monthlyPrice: 99,
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID
      ?? process.env.STRIPE_GROWTH_PRICE_ID
      ?? '',
    description: 'Scale outbound — full coaching suite, manager views',
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    max_seats: 999,
    monthlyPrice: null,
    stripePriceId: null,
    description: 'Custom limits, SSO, dedicated support',
  },
};

export function getWorkspacePlanLimits(plan: string | null | undefined) {
  const key = (plan ?? 'free') as WorkspacePlanId;
  const def = WORKSPACE_PLANS[key] ?? WORKSPACE_PLANS.free;
  return { plan: def.id, max_seats: def.max_seats };
}

export function isBillableWorkspacePlan(plan: WorkspacePlanId): boolean {
  const def = WORKSPACE_PLANS[plan];
  return !!def.stripePriceId?.trim();
}

export function stripeReadyForWorkspacePlan(plan: WorkspacePlanId): boolean {
  const priceId = WORKSPACE_PLANS[plan]?.stripePriceId?.trim();
  return !!priceId && !priceId.includes('placeholder');
}
