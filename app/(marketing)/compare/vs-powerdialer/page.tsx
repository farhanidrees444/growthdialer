import { Metadata } from "next";
import VsPowerDialerContent from "./VsPowerDialerContent";

export const metadata: Metadata = {
  title: "GrowthDialer vs PowerDialer — Built for 2026, not 2015",
  description: "Compare GrowthDialer vs PowerDialer and see why modern autonomous AI outperforms legacy dialer platforms.",
  keywords: "powerdialer alternative, growthdialer vs powerdialer, modern sales dialer, ai enabled calling, powerdialer comparison",
  openGraph: {
    title: "GrowthDialer vs PowerDialer — Built for 2026, not 2015",
    description: "Why teams upgrade from PowerDialer to GrowthDialer for autonomous AI and modern workflow.",
    type: "website",
  },
};

export default function VsPowerDialerPage() {
  return <VsPowerDialerContent />;
}
