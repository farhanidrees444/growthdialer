import type { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs RingDNA — Conversation intelligence comparison',
  description:
    'Compare GrowthDialer and RingDNA (HubSpot Sales Hub): AI call summaries, power dialing, pricing, and CRM logging for outbound teams.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-ringdna` },
  openGraph: {
    title: 'GrowthDialer vs RingDNA',
    description: 'Modern AI dialer vs legacy conversation intelligence.',
    url: `${MARKETING_SITE}/compare/vs-ringdna`,
  },
};

export default function VsRingDnaPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs RingDNA',
          url: `${MARKETING_SITE}/compare/vs-ringdna`,
        }}
      />
      <ComparePage
        competitor="RingDNA"
        badge="GrowthDialer vs RingDNA"
        title={
          <>
            RingDNA pioneered call intel.
            <br />
            <span className="font-medium">GrowthDialer ships the full dialer.</span>
          </>
        }
        subtitle="RingDNA (now part of HubSpot Sales Hub) focuses on conversation analytics for existing calls. GrowthDialer is the dialer, recorder, and AI pipeline in one workspace — with HubSpot logging live today."
        priceGrowthdialer="$49"
        priceCompetitor="HubSpot bundle"
        rows={[
          { feature: 'Built-in power dialer', growthdialer: true, competitor: false },
          { feature: 'Parallel dial (2–10 lines)', growthdialer: true, competitor: false },
          { feature: 'AI call summaries', growthdialer: true, competitor: true },
          { feature: 'Live coaching floor', growthdialer: true, competitor: true },
          { feature: 'HubSpot call logging', growthdialer: true, competitor: true },
          { feature: 'Free tier', growthdialer: true, competitor: false },
          { feature: 'Standalone dialer UX', growthdialer: true, competitor: false },
        ]}
        reasons={[
          {
            title: 'Dial and analyze in one tab',
            description:
              'RingDNA assumes calls happen elsewhere. GrowthDialer owns the queue, the dial, the recording, and the AI summary — no bolt-on recorder.',
          },
          {
            title: 'Workspace pricing, not enterprise-only',
            description:
              'Pro at $49/mo covers a small team with AI briefs. RingDNA typically bundles with HubSpot Sales Hub tiers.',
          },
          {
            title: 'Outbound-first workflows',
            description:
              'Power dial sessions, parallel AMD, and disposition-driven queue advance are native — not retrofitted onto a coaching dashboard.',
          },
        ]}
      />
    </MarketingShell>
  );
}
