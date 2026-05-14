import { Metadata } from "next";
import SalesfloorContent from "./SalesfloorContent";

export const metadata: Metadata = {
  title: "Salesfloor — Team Collaboration Features | GrowthDialer",
  description: "Live call monitoring, team coaching, and collaborative selling features. Watch live calls, provide real-time coaching, and improve team performance together.",
  keywords: "sales team collaboration, live call monitoring, sales coaching, team performance",
  openGraph: {
    title: "Salesfloor — Team Collaboration Features | GrowthDialer",
    description: "Transform your sales team with live call monitoring and real-time coaching capabilities.",
    type: "website",
  },
};

export default function SalesfloorPage() {
  return <SalesfloorContent />;
}
