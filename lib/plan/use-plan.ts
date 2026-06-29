'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  FEATURE_GATES,
  type BillingCycle,
  type FeatureKey,
  type PlanKey,
  type SubscriptionStatus,
  isFeatureEnabled,
} from './plan-gates';

interface SubscriptionRow {
  plan: PlanKey | string | null;
  billing_cycle: BillingCycle | string | null;
  seats: number | null;
  status: SubscriptionStatus | string | null;
  trial_ends_at: string | null;
}

export interface UsePlanResult {
  plan: PlanKey;
  billingCycle: BillingCycle;
  seats: number;
  status: SubscriptionStatus | 'none';
  trialEndsAt: string | null;
  isTrialing: boolean;
  can: (feature: FeatureKey) => boolean;
}

const CLOSED_PLAN: UsePlanResult = {
  plan: 'trial',
  billingCycle: 'monthly',
  seats: 1,
  status: 'none',
  trialEndsAt: null,
  isTrialing: false,
  can: () => false,
};

function normalizePlan(value: unknown): PlanKey {
  return value === 'starter' || value === 'growth' || value === 'pro' ? value : 'trial';
}

function normalizeCycle(value: unknown): BillingCycle {
  return value === 'annual' ? 'annual' : 'monthly';
}

function normalizeStatus(value: unknown): UsePlanResult['status'] {
  if (
    value === 'trialing'
    || value === 'active'
    || value === 'past_due'
    || value === 'canceled'
    || value === 'incomplete'
    || value === 'incomplete_expired'
    || value === 'unpaid'
  ) {
    return value;
  }
  return 'none';
}

export function usePlan(): UsePlanResult {
  const [row, setRow] = useState<SubscriptionRow | null>(null);
  const [closed, setClosed] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setRow(null);
        setClosed(true);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, billing_cycle, seats, status, trial_ends_at')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setRow(null);
        setClosed(true);
        return;
      }

      setRow(data as SubscriptionRow);
      setClosed(false);
    } catch {
      setRow(null);
      setClosed(true);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });

    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refresh]);

  return useMemo(() => {
    if (closed || !row) return CLOSED_PLAN;

    const plan = normalizePlan(row.plan);
    const status = normalizeStatus(row.status);
    const effectivePlan = status === 'active' || status === 'trialing' ? plan : 'trial';
    const gates = FEATURE_GATES[effectivePlan];

    return {
      plan: effectivePlan,
      billingCycle: normalizeCycle(row.billing_cycle),
      seats: Math.max(1, Number(row.seats ?? 1)),
      status,
      trialEndsAt: row.trial_ends_at,
      isTrialing: status === 'trialing',
      can: (feature: FeatureKey) => {
        if (!gates || !(feature in gates)) return false;
        return isFeatureEnabled(effectivePlan, feature);
      },
    };
  }, [closed, row]);
}
