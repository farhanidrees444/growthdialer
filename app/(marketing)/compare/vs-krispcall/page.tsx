import { Metadata } from "next";
import VsKrispCallContent from "./VsKrispCallContent";

export const metadata: Metadata = {
  title: "GrowthDialer vs KrispCall — Same price, 10x AI power",
  description: "Compare GrowthDialer vs KrispCall and see how modern autonomous AI beats legacy voice-only dialers at the same or lower price.",
  keywords: "krispcall alternative, growthdialer vs krispcall, ai dialer comparison, sales AI pricing, voice sales automation",
  openGraph: {
    title: "GrowthDialer vs KrispCall — Same price, 10x AI power",
    description: "Why teams switch from KrispCall to GrowthDialer for more powerful autonomous sales AI.",
    type: "website",
  },
};

export default function VsKrispCallPage() {
  return <VsKrispCallContent />;
}
