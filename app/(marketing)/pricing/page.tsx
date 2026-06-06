import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Plans } from "@/components/marketing/pricing/Plans";
import { ComparisonTable } from "@/components/marketing/pricing/ComparisonTable";
import { PricingFAQ } from "@/components/marketing/pricing/PricingFAQ";
import { PricingCTA } from "@/components/marketing/pricing/PricingCTA";

export const metadata: Metadata = {
  title: "Pricing — Simple plans that scale with you",
  description:
    "GrowthDialer pricing. Starter is free (1 seat). Pro $49/workspace/mo (3 seats), Team $99/workspace/mo (10 seats). AI Dialer, coaching and conversation intelligence on Pro.",
  alternates: { canonical: "https://growthdialer.com/pricing" },
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <Plans />
      <ComparisonTable />
      <PricingFAQ />
      <PricingCTA />
    </MarketingShell>
  );
}
