/** Preserve pre-rollout access until an existing customer starts a provider subscription. */
export function isGrandfatheredBillingAccess(
  createdAt: string | null | undefined,
  hasProviderSubscription: boolean,
  cutoff = process.env.BILLING_ACCESS_GRANDFATHERED_BEFORE,
): boolean {
  if (hasProviderSubscription || !createdAt || !cutoff) return false;
  const created = Date.parse(createdAt);
  const before = Date.parse(cutoff);
  return Number.isFinite(created) && Number.isFinite(before) && created < before;
}
