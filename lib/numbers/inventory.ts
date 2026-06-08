import { averageComputedHealth, type NumberHealthAction, type NumberHealthTier } from '@/lib/numbers/health';

export type NumberFilter = 'all' | 'needs_check' | 'at_risk' | 'expiring';

export type PurchasedNumberRecord = {
  id: string;
  phone_number: string;
  label: string | null;
  is_default: boolean;
  status: string;
  monthly_cost: number;
  billing_status: string | null;
  next_billing_date: string | null;
  stripe_subscription_id: string | null;
  spam_status: string | null;
  stats?: {
    total_calls: number;
    connected: number;
    connect_rate: number;
    last_used: string | null;
  };
  computed_health?: number | null;
  reputation_score?: number | null;
  health_label?: string;
  health_tier?: NumberHealthTier;
  health_insight?: string;
  action_required?: NumberHealthAction;
  has_call_data?: boolean;
  has_reputation_check?: boolean;
};

export function daysUntilBilling(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function isExpiringSoon(num: PurchasedNumberRecord): boolean {
  if (!num.next_billing_date || num.stripe_subscription_id) return false;
  const d = daysUntilBilling(num.next_billing_date);
  return d !== null && d <= 7 && d >= 0;
}

export function filterNumbers(numbers: PurchasedNumberRecord[], filter: NumberFilter): PurchasedNumberRecord[] {
  switch (filter) {
    case 'needs_check':
      return numbers.filter((n) => !n.has_reputation_check);
    case 'at_risk':
      return numbers.filter(
        (n) =>
          n.health_tier === 'at_risk' ||
          n.health_tier === 'critical' ||
          n.spam_status === 'flagged' ||
          n.spam_status === 'blocked',
      );
    case 'expiring':
      return numbers.filter(isExpiringSoon);
    default:
      return numbers;
  }
}

export function portfolioStats(numbers: PurchasedNumberRecord[]) {
  const active = numbers.filter((n) => n.status !== 'released');
  return {
    count: active.length,
    needsCheck: active.filter((n) => !n.has_reputation_check).length,
    atRisk: active.filter(
      (n) =>
        n.health_tier === 'at_risk' ||
        n.health_tier === 'critical' ||
        n.spam_status === 'flagged' ||
        n.spam_status === 'blocked',
    ).length,
    expiring: active.filter(isExpiringSoon).length,
    avgHealth: averageComputedHealth(active),
    scoredCount: active.filter((n) => n.computed_health !== null && n.computed_health !== undefined).length,
  };
}
