import { Metadata } from "next";
import FeaturesContent from "./FeaturesContent";

export const metadata: Metadata = {
  title: "GrowthDialer Features — AI Sales Dialer",
  description: "Discover all GrowthDialer features: AI-powered parallel dialing, real-time coaching, CRM integrations, and advanced analytics for B2B sales teams.",
  keywords: "sales dialer features, AI dialer, parallel dialing, sales automation, CRM integration",
  openGraph: {
    title: "GrowthDialer Features — AI Sales Dialer",
    description: "Complete feature overview of the AI-powered sales dialer that helps teams book 3x more meetings.",
    type: "website",
  },
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
