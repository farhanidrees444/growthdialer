import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata: Metadata = {
  title: "Docs",
  description: "GrowthDialer documentation — coming soon.",
};

export default function DocsPage() {
  return (
    <MarketingShell>
      <ComingSoon
        title="Docs are on the way."
        blurb="We're writing clear, practical documentation to get you calling fast — setup, the AI Dialer, recordings and analytics. In the meantime, create an account and the product walks you through it."
      />
    </MarketingShell>
  );
}
