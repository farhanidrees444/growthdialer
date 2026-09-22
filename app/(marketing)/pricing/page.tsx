import type { Metadata } from "next";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { PricingPage as SharedPricingPage } from "@/components/pricing/pricing-page";
import { Reveal } from "@/components/ui/reveal";
import { DashboardVisual } from "@/components/marketing/visuals";
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

const PROOF_POINTS = [
  "3 dialing modes — AI-assisted, power, and parallel",
  "8 dispositions, recordings, and AI summaries on every plan",
  "Live coaching floor on Growth and Pro",
  "7-day free trial — no credit card, cancel anytime",
] as const;

export default function PricingPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <Suspense fallback={null}>
        <SharedPricingPage />
      </Suspense>

      {/* Product proof — an illustrated look at what the money buys */}
      <section className="pm-section-tight pm-divider">
        <div className="pm-container grid items-center gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-14">
          <Reveal>
            <p className="pm-eyebrow">What the money buys</p>
            <h2 className="pm-h-section mt-4">See what the money buys.</h2>
            <ul className="mt-6 space-y-3">
              {PROOF_POINTS.map((point) => (
                <li key={point} className="pm-tick">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <figure className="pm-browser">
              <div className="pm-browser-bar">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                </span>
                <span className="text-[12.5px] font-medium text-zinc-500">GrowthDialer dashboard</span>
              </div>
              <DashboardVisual badges={false} />
              <figcaption className="border-t border-zinc-950/[0.07] bg-zinc-50/70 px-5 py-3.5 text-[12.5px] text-zinc-500">
                Illustrated preview of the command-center dashboard.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
