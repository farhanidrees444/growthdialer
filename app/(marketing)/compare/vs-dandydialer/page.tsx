import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs DandyDialer — Parallel Dial Comparison',
  description:
    'Compare GrowthDialer and DandyDialer on parallel dialing, AI coaching, CRM sync, and pricing for outbound teams.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-dandydialer` },
};

export default function VsDandyDialerPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs DandyDialer',
          url: `${MARKETING_SITE}/compare/vs-dandydialer`,
        }}
      />
      <ComparePage
        competitor="DandyDialer"
        badge="GrowthDialer vs DandyDialer"
        title={
          <>
            Both dial in parallel.
            <br />
            <span className="font-medium">GrowthDialer adds the intelligence layer.</span>
          </>
        }
        subtitle="DandyDialer targets high-velocity parallel dial. GrowthDialer matches parallel and power modes and layers AI briefs, summaries, and a live coaching floor — at workspace pricing."
        priceGrowthdialer="$49"
        priceCompetitor="$249+"
        rows={[
          { feature: 'Parallel dialing', growthdialer: true, competitor: true },
          { feature: 'AI pre-call briefs', growthdialer: true, competitor: false },
          { feature: 'AI call summaries', growthdialer: true, competitor: false },
          { feature: 'Live coaching floor', growthdialer: true, competitor: false },
          { feature: 'HubSpot + Salesforce sync', growthdialer: true, competitor: true },
          { feature: 'AMD + VM drop', growthdialer: true, competitor: true },
          { feature: 'Free tier', growthdialer: true, competitor: false },
        ]}
        reasons={[
          {
            title: 'Enterprise features without enterprise minimums',
            description:
              'DandyDialer enterprise tiers add up fast. GrowthDialer Pro starts at $49/mo for three seats with AI included.',
          },
          {
            title: 'Full funnel in one login',
            description:
              'SDRs power-dial, AEs manual-dial from lead detail, managers coach on the salesfloor — same workspace.',
          },
          {
            title: 'Transparent product status',
            description:
              'Roadmap and changelog say what is live vs waitlist — no demo-only features in production.',
          },
        ]}
      />
    </MarketingShell>
  );
}
