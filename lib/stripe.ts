import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

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
