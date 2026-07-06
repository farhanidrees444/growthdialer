'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  daysUntilBilling,
  formatDaysRemaining,
  hasActiveSubscription,
  isNumberExpired,
  type NumberBillingFields,
} from '@/lib/numbers/billing-lifecycle';

/** Live countdown for prepaid lines — updates every minute without refetching. */
export function useBillingCountdown(row: NumberBillingFields) {
  const subscribed = hasActiveSubscription(row);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (subscribed || !row.next_billing_date) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [row.next_billing_date, subscribed]);

  return useMemo(() => {
    const days = daysUntilBilling(row.next_billing_date, now);
    const expired = isNumberExpired(row, now);
    const expiringSoon = !subscribed && !expired && days !== null && days >= 0 && days <= 7;
    return {
      days,
      expired,
      expiringSoon,
      subscribed,
      label: subscribed ? 'Subscription active' : formatDaysRemaining(row.next_billing_date, now),
      callable: row.status === 'active' && !expired,
    };
  }, [row, now, subscribed]);
}
