/** Accept real UTC instants, including Auth's microsecond precision. */
function utcInstant(value: string | null | undefined): number {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(?:Z|\+00:00)$/);
  if (!match) return NaN;
  const normalized = `${match[1]}.${(match[2] || "").padEnd(3, "0").slice(0, 3)}Z`;
  const instant = Date.parse(normalized);
  return Number.isFinite(instant) && new Date(instant).toISOString() === normalized ? instant : NaN;
}

/** Preserve confirmed pre-rollout accounts until they start a provider subscription. */
export function isGrandfatheredBillingAccess(
  createdAt: string | null | undefined,
  hasProviderSubscription: boolean,
  confirmedAt: string | null | undefined,
  cutoff = process.env.BILLING_ACCESS_GRANDFATHERED_BEFORE,
): boolean {
  if (hasProviderSubscription || !Number.isFinite(utcInstant(confirmedAt))) return false;
  const created = utcInstant(createdAt);
  const before = utcInstant(cutoff);
  return Number.isFinite(created) && Number.isFinite(before) && created < before;
}
