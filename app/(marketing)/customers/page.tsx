import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata: Metadata = {
  title: "Customers",
  description: "Customer stories from teams using GrowthDialer — coming soon.",
};

export default function CustomersPage() {
  return (
    <MarketingShell>
      <ComingSoon
        title="Customer stories, soon."
        blurb="We're onboarding our first sales teams now. As they ship results with GrowthDialer, their stories will live here — real teams, real numbers, no fluff."
      />
    </MarketingShell>
  );
}
