import type { Metadata } from "next";
import { whopReady } from "@/lib/billing/whop";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { PricingPage } from "@/components/pricing/pricing-page";
import { MARKETING_SITE } from "@/lib/marketing/navigation";
export const metadata: Metadata = {
  title: "Pricing — A plan for every sales floor",
  description:
    "Starter $49, Growth $79, Pro $119 per seat per month. Clear monthly or annual subscriptions. Calling and messaging usage may cost extra.",
  openGraph: { title: "GrowthDialer pricing", description: "Clear monthly or annual plans for your sales floor. Starter $49, Growth $79, Pro $119 per seat monthly.", url: `${MARKETING_SITE}/pricing`, images: [{ url: "/billing/conversation-sculpture.webp", width: 1672, height: 941, alt: "GrowthDialer — a clearer signal" }] },
  alternates: { canonical: `${MARKETING_SITE}/pricing` },
};
export default function Pricing() {
  return (
    <>
      <Navbar signupLabel="Create account" />
      <Suspense fallback={<div className="min-h-screen" />}>
        <PricingPage checkoutAvailable={whopReady()} />
      </Suspense>
      <Footer signupLabel="Create account" />
    </>
  );
}
