import type { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs Kixie — AI Dialer vs Power Dialing',
  description:
    'Compare GrowthDialer and Kixie: conversation intelligence, AI summaries, power dialing, and pricing for outbound sales teams.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-kixie` },
  openGraph: {
    title: 'GrowthDialer vs Kixie',
    description: 'AI call intelligence and power dialing without Kixie per-seat add-ons.',
    url: `${MARKETING_SITE}/compare/vs-kixie`,
  },
};

export default function VsKixiePage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs Kixie',
          description: 'Comparison of GrowthDialer and Kixie for outbound sales teams.',
          url: `${MARKETING_SITE}/compare/vs-kixie`,
        }}
      />
      <ComparePage
        competitor="Kixie"
        badge="GrowthDialer vs Kixie"
        title={
          <>
            Kixie dials fast.
            <br />
            <span className="font-medium">GrowthDialer remembers every call.</span>
          </>
        }
        subtitle="Kixie is a solid power dialer with CRM power-ups. GrowthDialer adds AI transcription, summaries, and sentiment on every recorded conversation — with workspace pricing that scales."
        priceGrowthdialer="$49"
        priceCompetitor="$65+"
        rows={[
          { feature: 'Power dialing', growthdialer: true, competitor: true },
          { feature: 'Local presence numbers', growthdialer: true, competitor: true },
          { feature: 'AI call summaries', growthdialer: true, competitor: false },
          { feature: 'Conversation intelligence', growthdialer: true, competitor: false },
          { feature: 'Live coaching floor', growthdialer: true, competitor: false },
          { feature: 'HubSpot call logging', growthdialer: true, competitor: true },
          { feature: 'Free tier', growthdialer: true, competitor: false },
        ]}
        reasons={[
          {
            title: 'Intelligence included, not bolted on',
            description:
              'Kixie charges for power dial and CRM automations separately. GrowthDialer Pro includes AI summaries and analytics in the workspace price.',
          },
          {
            title: 'Built for managers who review calls async',
            description:
              'Recording library, AI bullet summaries, and sentiment tags mean coaches do not need to sit on every live dial.',
          },
          {
            title: 'Start free before you commit seats',
            description:
              'Solo reps validate the dialer on Starter (free) before managers roll out Team workspaces.',
          },
        ]}
      />
    </MarketingShell>
  );
}
