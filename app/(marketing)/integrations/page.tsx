import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MarketingIntegrationsMarketplace } from '@/components/integrations/MarketingIntegrationsMarketplace';

export const metadata: Metadata = {
  title: 'Integrations Marketplace — CRMs, AI Voice, Zapier & More',
  description:
    'Connect HubSpot, Salesforce, Vapi, Bland AI, Retell, Smartlead, Instantly, Zapier, and custom webhooks to GrowthDialer. One enterprise integration hub.',
  alternates: { canonical: 'https://growthdialer.com/integrations' },
  openGraph: {
    title: 'GrowthDialer Integrations Marketplace',
    description:
      '100+ connectors for CRMs, AI voice agents, outbound sequencers, and automations.',
    type: 'website',
  },
};

export default function IntegrationsMarketingPage() {
  return (
    <Suspense fallback={null}>
      <MarketingIntegrationsMarketplace />
    </Suspense>
  );
}
