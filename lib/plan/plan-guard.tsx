'use client';

import type { ReactNode } from 'react';
import { type FeatureKey } from './plan-gates';
import { usePlan } from './use-plan';

interface PlanGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PlanGate({ feature, children, fallback = null }: PlanGateProps) {
  const { can } = usePlan();

  if (!can(feature)) return <>{fallback}</>;

  return <>{children}</>;
}
