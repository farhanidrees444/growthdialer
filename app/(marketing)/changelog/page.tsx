import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Product updates from GrowthDialer — coming soon.",
};

export default function ChangelogPage() {
  return (
    <MarketingShell>
      <ComingSoon
        title="Shipping in the open, soon."
        blurb="We'll post every meaningful update here as GrowthDialer evolves — new features, improvements and fixes. No vanity version numbers, just what changed and why."
      />
    </MarketingShell>
  );
}
