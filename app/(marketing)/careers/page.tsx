import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the team building GrowthDialer — roles coming soon.",
};

export default function CareersPage() {
  return (
    <MarketingShell>
      <ComingSoon
        title="We're just getting started."
        blurb="GrowthDialer is an early-stage team. We're not posting roles yet — but if you're excited about AI and sales tooling, reach out at careers@growthdialer.com and tell us what you'd build."
      />
    </MarketingShell>
  );
}
