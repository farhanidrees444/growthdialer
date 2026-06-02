import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { FeatureSections } from "@/components/marketing/home/FeatureSections";
import { StatsStrip } from "@/components/marketing/home/StatsStrip";
import { EarlyAccess } from "@/components/marketing/home/EarlyAccess";

export const metadata: Metadata = {
  title: "Features — AI Dialer, Power Dialer & Conversation Intelligence",
  description:
    "Everything GrowthDialer does today: AI Dialer, Power Dialer, AI conversation intelligence, smart leads, analytics and number-health monitoring.",
  alternates: { canonical: "https://growthdialer.com/features" },
};

export default function FeaturesPage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative px-5 pt-36 lg:px-8 lg:pt-44">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-8 h-[420px] w-[min(90vw,820px)] -translate-x-1/2 rounded-full opacity-[0.09] blur-[120px]"
          style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">Features</p>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.75rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]">
            A dialer that does the <span className="font-medium">listening</span> for you.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-zinc-400">
            Everything below is live today. Make calls, record them, and let the
            AI turn each conversation into summaries, sentiment and next steps.
          </p>
        </div>
      </section>

      <FeatureSections />
      <StatsStrip />
      <EarlyAccess />
    </MarketingShell>
  );
}
