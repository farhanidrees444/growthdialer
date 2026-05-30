import Stripe from "stripe";

// We do NOT instantiate at module load with a placeholder key — that hides
// missing-key bugs in production and makes every Stripe call return 401
// with no clear cause. Instead, export a lazy getter that throws a clear
// error when callers actually try to use Stripe without a real key.
const STRIPE_API_VERSION = "2026-03-25.dahlia";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key.includes("placeholder")) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Set it in Vercel → Settings → Environment Variables.",
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION, typescript: true });
  }
  return _stripe;
}

// Proxy keeps the old `stripe.<method>(...)` call style working everywhere
// without changing every consumer. The getter throws only when used.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const real = getStripe() as unknown as Record<string | symbol, unknown>;
    const value = real[prop as string];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return !!key && !key.includes("placeholder");
}

export const PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    monthlyPrice: 49,
    annualPrice: 39,
    description: "For solo reps just getting started",
    features: [
      "3 parallel lines",
      "500 dials / month",
      "Local presence (50 area codes)",
      "CRM sync",
      "Basic analytics",
      "Email support",
    ],
  },
  growth: {
    name: "Growth",
    priceId: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
    monthlyPrice: 99,
    annualPrice: 79,
    description: "For growing teams that need to scale fast",
    features: [
      "10 parallel lines",
      "Unlimited dials",
      "Local presence (300+ area codes)",
      "All CRM integrations",
      "AI call coaching",
      "AI voicemail drop",
      "Spam number protection",
      "Advanced analytics",
      "Priority support",
    ],
    popular: true,
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
    monthlyPrice: null,
    annualPrice: null,
    description: "For large teams needing custom limits",
    features: [
      "Unlimited parallel lines",
      "Unlimited dials",
      "Custom CNAM & area codes",
      "SSO & advanced security",
      "Dedicated success manager",
      "Custom integrations",
      "SLA guarantee",
      "Custom contracts",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
