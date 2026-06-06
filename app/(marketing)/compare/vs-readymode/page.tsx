import type { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs ReadyMode — Cloud Dialer Comparison',
  description:
    'Compare GrowthDialer and ReadyMode for predictive dialing, AI call analysis, and modern browser-based outbound sales.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-readymode` },
  openGraph: {
    title: 'GrowthDialer vs ReadyMode',
    url: `${MARKETING_SITE}/compare/vs-readymode`,
  },
};

export default function VsReadyModePage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs ReadyMode',
          url: `${MARKETING_SITE}/compare/vs-readymode`,
        }}
      />
      <ComparePage
        competitor="ReadyMode"
        badge="GrowthDialer vs ReadyMode"
        title={
          <>
            ReadyMode predicts connects.
            <br />
            <span className="font-medium">GrowthDialer analyzes conversations.</span>
          </>
        }
        subtitle="ReadyMode is a veteran predictive dialer for high-volume call centers. GrowthDialer targets B2B teams that need quality recordings, AI summaries, and CRM hygiene over raw dial volume."
        priceGrowthdialer="$49"
        priceCompetitor="$89+"
        rows={[
          { feature: 'Predictive / power dialing', growthdialer: true, competitor: true },
          { feature: 'AI call summaries', growthdialer: true, competitor: false },
          { feature: 'Sentiment + intent detection', growthdialer: true, competitor: false },
          { feature: 'Browser-based (no softphone install)', growthdialer: true, competitor: false },
          { feature: 'B2B lead pipeline', growthdialer: true, competitor: 'Call center' },
          { feature: 'HubSpot integration', growthdialer: true, competitor: 'Limited' },
        ]}
        reasons={[
          {
            title: 'Quality over raw attempts',
            description:
              'B2B outbound punishes bad notes and missed follow-ups more than dial count. AI analysis catches what predictive metrics miss.',
          },
          {
            title: 'Modern rep experience',
            description:
              'WebRTC in the browser — reps onboard in one session without IT installing a softphone.',
          },
          {
            title: 'Transparent roadmap',
            description:
              'Parallel dial enhancements ship in the open. We label waitlist integrations instead of implying they are live.',
          },
        ]}
      />
    </MarketingShell>
  );
}
