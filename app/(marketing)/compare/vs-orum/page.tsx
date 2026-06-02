import { Metadata } from "next";
import VsOrumContent from "./VsOrumContent";

export const metadata: Metadata = {
  title: "GrowthDialer vs Orum — 88% Cheaper for AI Sales",
  description: "Compare GrowthDialer vs Orum and learn why teams switch to GrowthDialer for better autonomous AI at 88% lower cost.",
  keywords: "orum alternative, growthdialer vs orum, orum pricing, sales ai comparison, affordable ai sales",
  openGraph: {
    title: "GrowthDialer vs Orum — 88% Cheaper for AI Sales",
    description: "See why teams move from Orum's premium pricing to GrowthDialer's autonomous AI and save 88%.",
    type: "website",
  },
};

export default function VsOrumPage() {
  return <VsOrumContent />;
}
