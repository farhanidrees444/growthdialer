import type { Metadata } from "next";
import { MotionShell } from "@/components/marketing/live-floor/MotionShell";
import { Nav } from "@/components/marketing/live-floor/Nav";
import { Grain } from "@/components/marketing/live-floor/Grain";
import { SiteFooter } from "@/components/marketing/live-floor/SiteFooter";
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
    <MotionShell>
      <div className="relative min-h-screen overflow-x-clip bg-[#08080A] text-[#F5F5F7] antialiased">
        <Grain />
        <Nav />
        <main className="relative z-[2]">
          <Plans />
          <ComparisonTable />
          <PricingFAQ />
          <PricingCTA />
        </main>
        <SiteFooter />
      </div>
    </MotionShell>
  );
}
