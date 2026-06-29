import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PricingPage as SharedPricingPage } from "@/components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing - Simple plans that scale with you",
  description:
    "GrowthDialer pricing for AI dialing, recordings, coaching, and team workflows. Start with a 7-day free trial.",
  alternates: { canonical: "https://growthdialer.com/pricing" },
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <Suspense fallback={null}>
        <SharedPricingPage />
      </Suspense>
    </MarketingShell>
  );
}
