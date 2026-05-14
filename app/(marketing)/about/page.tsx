import { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About GrowthDialer — AI-Powered Sales Dialer",
  description: "Founded in 2024, GrowthDialer is on a mission to democratize AI-powered sales technology. Learn about our story, team, and values.",
  keywords: "about GrowthDialer, sales dialer company, AI sales technology, B2B sales automation",
  openGraph: {
    title: "About GrowthDialer — AI-Powered Sales Dialer",
    description: "Founded in 2024, we're building the future of B2B sales with AI-powered dialers and real-time coaching.",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
