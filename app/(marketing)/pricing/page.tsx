import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { PricingPage } from "@/components/pricing/pricing-page";
import { MARKETING_SITE } from "@/lib/marketing/navigation";
export const metadata: Metadata = {
  title: "Pricing — A plan for every sales floor",
  description:
    "Starter $49, Growth $79, Pro $119 per seat per month. Clear monthly or annual subscriptions. Calling and messaging usage may cost extra.",
  alternates: { canonical: `${MARKETING_SITE}/pricing` },
};
export default function Pricing() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen" />}>
        <PricingPage />
      </Suspense>
      <Footer />
    </>
  );
}
