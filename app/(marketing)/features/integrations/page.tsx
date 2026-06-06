import { Metadata } from "next";
import IntegrationsContent from "./IntegrationsContent";

export const metadata: Metadata = {
  title: "Integrations — HubSpot, Salesforce, Slack & More | GrowthDialer",
  description:
    "Connect GrowthDialer to HubSpot (live), Salesforce, Pipedrive, Slack, Zapier, and Calendly. Auto-log calls, dispositions, and recordings from every dial.",
  keywords: "HubSpot dialer integration, Salesforce call logging, sales dialer CRM, Zapier calls, Slack sales alerts",
  alternates: { canonical: 'https://growthdialer.com/features/integrations' },
  openGraph: {
    title: "GrowthDialer Integrations — Connect Your Sales Stack",
    description: "HubSpot is live. CRM and automation integrations for AI power dialing and call intelligence.",
    type: "website",
  },
};

export default function IntegrationsPage() {
  return <IntegrationsContent />;
}
