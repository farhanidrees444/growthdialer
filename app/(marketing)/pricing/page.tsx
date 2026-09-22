import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { PricingPage as SharedPricingPage } from "@/components/pricing/pricing-page";
import { RiskBullets } from "@/components/marketing/v2/Sections";
import { Reveal } from "@/components/ui/reveal";
import { Counter } from "@/components/marketing/v2/motion";
import { MARKETING_SITE } from "@/lib/marketing/navigation";

export const metadata: Metadata = {
  title: "Pricing — Simple plans that scale with you",
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

const ON_EVERY_PLAN: ReactNode[] = [
  "Unlimited calls — dial all day, every plan",
  "Recordings and transcripts included",
  <>
    <Counter to={5} suffix="-line" /> parallel dialing — no add-on fee
  </>,
];

const NEVER_ON_INVOICE = [
  "No per-minute billing surprises",
  "No seat minimums — start with one",
  "No annual lock-in — monthly is monthly",
];

const UPFRONT_ANSWERS = [
  {
    q: "What does 5-line parallel dialing cost extra?",
    a: "Nothing. Parallel dialing is part of the dialer, not an add-on line item.",
  },
  {
    q: "What happens when my trial ends?",
    a: "Nothing is charged — we never took your card. Pick a plan when you're ready to keep dialing.",
  },
];

/**
 * Page-level premium framing only ("the honest contract" pattern). The plan
 * cards, prices, billing toggle, comparison table, FAQ and final CTA are owned
 * by SharedPricingPage (components/pricing/pricing-page.tsx) — plans, prices
 * and logic untouched. This wrapper adds the editorial layer: a confident
 * hero, the principles-based contract strip (principles, never competitor
 * prices), the annual-billing truth, and trial reassurance.
 */
function HonestContractHero() {
  return (
    <div className="border-b border-zinc-950/[0.06] bg-zinc-50/60 pt-28 sm:pt-32">
      <div className="pm-container py-12 sm:py-16">
        <Reveal delay={0} className="text-center">
          <p className="pm-eyebrow pm-eyebrow-centered">
            <ShieldCheck className="mr-2 inline h-3.5 w-3.5 text-[#6d28d9]" />
            Pricing · The honest contract
          </p>
        </Reveal>
        <Reveal delay={80} className="text-center">
          <h1 className="pm-h-display mx-auto mt-5 max-w-3xl">
            Priced like a tool, <span className="text-[#6d28d9]">not a tax.</span>
          </h1>
        </Reveal>
        <Reveal delay={160} className="text-center">
          <p className="pm-lead mx-auto mt-6 max-w-2xl">
            One price per seat. The dialer, recordings, and transcripts on every
            plan — no per-minute metering, no seat minimums, no annual lock-in.
            Annual prices are per month, billed annually, and the <Counter to={20} suffix="%" /> saving is
            printed right on the card.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <RiskBullets className="mt-7 justify-center" />
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
          <Reveal delay={120} className="h-full">
            <div className="h-full rounded-2xl border border-zinc-950/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                On every plan
              </p>
              <ul className="mt-4 space-y-3">
                {ON_EVERY_PLAN.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={200} className="h-full">
            <div className="h-full rounded-2xl border border-zinc-950/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Never on your invoice
              </p>
              <ul className="mt-4 space-y-3">
                {NEVER_ON_INVOICE.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-950/[0.05] text-zinc-400">
                      <X className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <div className="mx-auto mt-10 max-w-3xl text-left">
            <p className="pm-eyebrow">Two questions, answered up front</p>
            <div className="mt-4 divide-y divide-zinc-950/[0.07] rounded-2xl border border-zinc-950/[0.08] bg-white">
              {UPFRONT_ANSWERS.map((item) => (
                <div key={item.q} className="px-6 py-5">
                  <p className="text-[15px] font-semibold text-zinc-950">{item.q}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <HonestContractHero />
      <Suspense fallback={null}>
        <SharedPricingPage />
      </Suspense>
      <Footer />
    </div>
  );
}
