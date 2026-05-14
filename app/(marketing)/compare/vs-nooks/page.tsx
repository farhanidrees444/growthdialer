import { Metadata } from "next";
import VsNooksContent from "./VsNooksContent";

export const metadata: Metadata = {
  title: "GrowthDialer vs Nooks — 10x Cheaper AI Outreach",
  description: "Compare GrowthDialer vs Nooks and learn why teams choose GrowthDialer for modern AI outreach at 10x lower cost.",
  keywords: "nooks alternative, growthdialer vs nooks, sales automation pricing, ai outreach platform, nooks comparison",
  openGraph: {
    title: "GrowthDialer vs Nooks — 10x Cheaper AI Outreach",
    description: "See how GrowthDialer beats Nooks with autonomous AI and a lower price point.",
    type: "website",
  },
};

export default function VsNooksPage() {
  return <VsNooksContent />;
}
