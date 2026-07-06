/** Shared billing / expiry helpers for purchased phone numbers. */

export type NumberBillingFields = {
  status: string;
  next_billing_date?: string | null;
  stripe_subscription_id?: string | null;
  purchased_at?: string | null;
};

export const NUMBER_BILLING_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export function daysUntilBilling(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - nowMs) / 86_400_000);
}

export function hasActiveSubscription(row: NumberBillingFields): boolean {
  return Boolean(row.stripe_subscription_id?.trim());
}

/** Prepaid lines expire when next_billing_date passes and there is no Stripe subscription. */
export function isNumberExpired(
  row: NumberBillingFields,
  nowMs: number = Date.now(),
): boolean {
  if (row.status === 'released') return true;
  if (hasActiveSubscription(row)) return false;
  if (!row.next_billing_date) return false;
  return new Date(row.next_billing_date).getTime() < nowMs;
}

export function isNumberCallable(
  row: NumberBillingFields,
  nowMs: number = Date.now(),
): boolean {
  return row.status === 'active' && !isNumberExpired(row, nowMs);
}

export function isExpiringWithinDays(
  row: NumberBillingFields,
  withinDays: number,
  nowMs: number = Date.now(),
): boolean {
  if (hasActiveSubscription(row) || isNumberExpired(row, nowMs)) return false;
  const days = daysUntilBilling(row.next_billing_date, nowMs);
  return days !== null && days >= 0 && days <= withinDays;
}

export function formatDaysRemaining(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  const days = daysUntilBilling(iso, nowMs);
  if (days === null) return null;
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function extendBillingDate(
  current: string | null | undefined,
  nowMs: number = Date.now(),
): string {
  const baseMs = current
    ? Math.max(nowMs, new Date(current).getTime())
    : nowMs;
  return new Date(baseMs + NUMBER_BILLING_PERIOD_MS).toISOString();
}

export function withBillingMeta<T extends NumberBillingFields>(
  row: T,
  nowMs: number = Date.now(),
): T & {
  days_remaining: number | null;
  is_expired: boolean;
  is_callable: boolean;
  days_label: string | null;
} {
  const days = daysUntilBilling(row.next_billing_date, nowMs);
  const expired = isNumberExpired(row, nowMs);
  return {
    ...row,
    days_remaining: days,
    is_expired: expired,
    is_callable: isNumberCallable(row, nowMs),
    days_label: hasActiveSubscription(row)
      ? 'Subscription'
      : formatDaysRemaining(row.next_billing_date, nowMs),
  };
}
