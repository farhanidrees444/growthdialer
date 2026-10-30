export const BILLING_CATALOG = {
  starter: {
    name: "Starter",
    monthly: 49,
    annual: 39,
    annualBilled: 468,
    description: "A focused calling workspace for independent sales reps.",
  },
  growth: {
    name: "Growth",
    monthly: 79,
    annual: 63,
    annualBilled: 756,
    description: "Call intelligence and coaching for a growing sales floor.",
  },
  pro: {
    name: "Pro",
    monthly: 119,
    annual: 95,
    annualBilled: 1140,
    description: "Advanced visibility and controls for high-volume teams.",
  },
} as const;
export type BillingPlan = keyof typeof BILLING_CATALOG;
export type BillingCycle = "monthly" | "annual";
export function parsePurchase(value: unknown) {
  const v = value as Record<string, unknown> | null;
  if (
    !v ||
    typeof v.plan !== "string" ||
    typeof v.cycle !== "string" ||
    !Object.hasOwn(BILLING_CATALOG, v.plan) ||
    !["monthly", "annual"].includes(v.cycle)
  )
    throw new Error("Invalid selection");
  const seats = Number(v.seats);
  if (!Number.isInteger(seats) || seats < 1 || seats > 500)
    throw new Error("Invalid seats");
  return { plan: v.plan as BillingPlan, cycle: v.cycle as BillingCycle, seats };
}
export function purchaseTotal(
  plan: BillingPlan,
  cycle: BillingCycle,
  seats: number,
) {
  return (
    (cycle === "annual"
      ? BILLING_CATALOG[plan].annualBilled
      : BILLING_CATALOG[plan].monthly) * seats
  );
}
export function hasSubscriptionAccess(
  status: string,
  periodEnd: string | null,
  now = Date.now(),
) {
  return (
    ["active", "trialing"].includes(status) &&
    !!periodEnd &&
    Date.parse(periodEnd) > now
  );
}
