import type { BillingCycle } from './plan-gates';

export type PaidPlan = 'starter' | 'growth' | 'pro';

export const POLAR_API_BASE = 'https://api.polar.sh';

export const POLAR_PRODUCT_ENV: Record<PaidPlan, Record<BillingCycle, string>> = {
  starter: {
    monthly: 'POLAR_PRODUCT_STARTER_MONTHLY',
    annual: 'POLAR_PRODUCT_STARTER_ANNUAL',
  },
  growth: {
    monthly: 'POLAR_PRODUCT_GROWTH_MONTHLY',
    annual: 'POLAR_PRODUCT_GROWTH_ANNUAL',
  },
  pro: {
    monthly: 'POLAR_PRODUCT_PRO_MONTHLY',
    annual: 'POLAR_PRODUCT_PRO_ANNUAL',
  },
};

export function isPaidPlan(value: string | null): value is PaidPlan {
  return value === 'starter' || value === 'growth' || value === 'pro';
}

export function isBillingCycle(value: string | null): value is BillingCycle {
  return value === 'monthly' || value === 'annual';
}

export function getPolarProductId(plan: PaidPlan, cycle: BillingCycle): string | null {
  const key = POLAR_PRODUCT_ENV[plan][cycle];
  return process.env[key]?.trim() || null;
}

export function polarHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
