import { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import SalesfloorContent from "./SalesfloorContent";
import { MARKETING_SITE } from "@/lib/marketing/navigation";

export const metadata: Metadata = {
  title: "Salesfloor — Live coaching & team dialer | GrowthDialer",
  description: "Live call monitoring, manager coaching modes, and team performance visibility on the GrowthDialer sales floor.",
  alternates: { canonical: `${MARKETING_SITE}/features/salesfloor` },
  openGraph: {
    title: "GrowthDialer Salesfloor",
    url: `${MARKETING_SITE}/features/salesfloor`,
  },
};

export default function SalesfloorPage() {
  return (
    <MarketingShell>
      <SalesfloorContent />
    </MarketingShell>
  );
}
