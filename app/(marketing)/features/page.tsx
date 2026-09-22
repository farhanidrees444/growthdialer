import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MarketingPageHero } from "@/components/marketing/live-floor/MarketingPageHero";
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
      <MarketingPageHero
        eyebrow="Features"
        title={
          <>
            A dialer that does the <span className="font-semibold">listening</span> for you.
          </>
        }
        description="Everything below is live today. Make calls, record them, and let the AI turn each conversation into summaries, sentiment and next steps."
      />

      <FeatureSections />
      <StatsStrip />
      <EarlyAccess />
    </MarketingShell>
  );
}
