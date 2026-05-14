import { Metadata } from "next";
import IntegrationsContent from "./IntegrationsContent";

export const metadata: Metadata = {
  title: "GrowthDialer Integrations — Connect Your Sales Stack",
  description: "Seamlessly integrate GrowthDialer with 15+ CRM, communication, and productivity tools. Sync contacts, log calls, and automate your sales workflow.",
  keywords: "CRM integrations, sales tools, Salesforce, HubSpot, Slack, Zapier",
  openGraph: {
    title: "GrowthDialer Integrations — Connect Your Sales Stack",
    description: "15+ native integrations to connect GrowthDialer with your existing sales tools and workflow.",
    type: "website",
  },
};

export default function IntegrationsPage() {
  return <IntegrationsContent />;
}
