import { Metadata } from "next";
import VsPhoneBurnerContent from "./VsPhoneBurnerContent";

export const metadata: Metadata = {
  title: "GrowthDialer vs PhoneBurner — Modern AI for outbound teams",
  description: "Compare GrowthDialer vs PhoneBurner and discover the benefits of modern autonomous AI over legacy dialer workflows.",
  keywords: "phoneburner alternative, growthdialer vs phoneburner, modern dialer, ai outbound sales, phoneburner comparison",
  openGraph: {
    title: "GrowthDialer vs PhoneBurner — Modern AI for outbound teams",
    description: "Why outbound teams upgrade from PhoneBurner to GrowthDialer for autonomous AI and better results.",
    type: "website",
  },
};

export default function VsPhoneBurnerPage() {
  return <VsPhoneBurnerContent />;
}
