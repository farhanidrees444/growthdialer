import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { PricingPage as SharedPricingPage } from "@/components/pricing/pricing-page";
import { MARKETING_SITE } from "@/lib/marketing/navigation";

export const metadata: Metadata = {
  title: "Pricing — Simple plans that scale with you | GrowthDialer",
  description:
    "Starter $49, Growth $79, Pro $119 per seat per month. 20% off annual billing. 7-day free trial, no credit card, no annual lock-in.",
  alternates: { canonical: `${MARKETING_SITE}/pricing` },
  openGraph: {
    title: "GrowthDialer Pricing",
    description:
      "Simple per-seat pricing for AI dialing, recordings, coaching, and team workflows. Start with a 7-day free trial.",
    url: `${MARKETING_SITE}/pricing`,
  },
};

export default function PricingPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <Suspense fallback={null}>
        <SharedPricingPage />
      </Suspense>
      <Footer />
    </div>
  );
}
