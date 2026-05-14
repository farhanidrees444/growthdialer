import { Metadata } from "next";
import CustomersContent from "./CustomersContent";

export const metadata: Metadata = {
  title: "Customer Success Stories — GrowthDialer",
  description: "Read real testimonials from B2B sales teams who've increased their connect rates by 41% and booked 3x more meetings with GrowthDialer.",
  keywords: "customer testimonials, sales success stories, B2B sales results",
  openGraph: {
    title: "Customer Success Stories — GrowthDialer",
    description: "Real results from real sales teams using GrowthDialer's AI-powered dialer.",
    type: "website",
  },
};

export default function CustomersPage() {
  return <CustomersContent />;
}
