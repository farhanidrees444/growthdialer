import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs Orum — AI Dialer Comparison',
  description:
    'Compare GrowthDialer vs Orum: power dialing, AI call intelligence, conversation coaching, and workspace pricing.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-orum` },
  openGraph: {
    title: 'GrowthDialer vs Orum',
    description: 'Outbound AI dialer comparison for B2B sales teams.',
    url: `${MARKETING_SITE}/compare/vs-orum`,
  },
};

export default function VsOrumPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs Orum',
          url: `${MARKETING_SITE}/compare/vs-orum`,
        }}
      />
      <ComparePage
        competitor="Orum"
        badge="GrowthDialer vs Orum"
        title={
          <>
            Orum raised the bar on AI dialers.
            <br />
            <span className="font-medium">GrowthDialer matches the stack at workspace pricing.</span>
          </>
        }
        subtitle="Both platforms target outbound teams with parallel dial and conversation intelligence. GrowthDialer adds a free Starter tier and transparent Pro pricing at $49/workspace."
        priceGrowthdialer="$49"
        priceCompetitor="$650+"
        rows={[
          { feature: 'Parallel dialing', growthdialer: true, competitor: true },
          { feature: 'AI call coaching', growthdialer: true, competitor: true },
          { feature: 'Voicemail detection (AMD)', growthdialer: true, competitor: true },
          { feature: 'AI call summaries', growthdialer: true, competitor: true },
          { feature: 'HubSpot integration', growthdialer: true, competitor: true },
          { feature: 'Free tier', growthdialer: true, competitor: false },
          { feature: 'Live team salesfloor', growthdialer: true, competitor: true },
        ]}
        reasons={[
          {
            title: 'Economics that scale with headcount',
            description:
              'Orum pricing often starts north of $650/seat. GrowthDialer Pro covers three seats for $49/mo — validate the workflow before you expand.',
          },
          {
            title: 'Same-day setup',
            description:
              'Connect HubSpot, import a CSV, and run a power session without a multi-week implementation project.',
          },
          {
            title: 'Honest roadmap labels',
            description:
              'Live features (dialer, recordings, HubSpot) stay separate from waitlist integrations — no demo-only checkboxes.',
          },
        ]}
      />
    </MarketingShell>
  );
}
