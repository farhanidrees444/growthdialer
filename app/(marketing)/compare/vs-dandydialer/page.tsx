import { Metadata } from "next";
import VsDandyDialerContent from "./VsDandyDialerContent";

export const metadata: Metadata = {
  title: "GrowthDialer vs DandyDialer — Enterprise Features at Startup Pricing",
  description: "Compare GrowthDialer vs DandyDialer and see why sales teams switch from enterprise dialers to GrowthDialer's autonomous AI.",
  keywords: "dandydialer alternative, growthdialer vs dandydialer, enterprise dialer, ai sales automation, startup pricing",
  openGraph: {
    title: "GrowthDialer vs DandyDialer — Enterprise Features at Startup Pricing",
    description: "Why teams adopt GrowthDialer instead of DandyDialer for better AI, broader outreach, and lower cost.",
    type: "website",
  },
};

export default function VsDandyDialerPage() {
  return <VsDandyDialerContent />;
}
