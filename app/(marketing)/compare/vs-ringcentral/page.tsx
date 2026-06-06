import type { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs RingCentral (RingDNA) — Sales Dialer Comparison',
  description:
    'GrowthDialer vs RingCentral and RingDNA: purpose-built outbound dialer with AI analysis versus enterprise phone system add-ons.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-ringcentral` },
  openGraph: {
    title: 'GrowthDialer vs RingCentral',
    description: 'Outbound-first AI dialer vs RingCentral sales engagement modules.',
    url: `${MARKETING_SITE}/compare/vs-ringcentral`,
  },
};

export default function VsRingCentralPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs RingCentral',
          url: `${MARKETING_SITE}/compare/vs-ringcentral`,
        }}
      />
      <ComparePage
        competitor="RingCentral"
        badge="GrowthDialer vs RingCentral"
        title={
          <>
            RingCentral runs the phone system.
            <br />
            <span className="font-medium">GrowthDialer runs outbound.</span>
          </>
        }
        subtitle="RingCentral (and RingDNA) excel at enterprise telephony and engagement suites. GrowthDialer is a focused browser dialer with AI conversation intelligence — no desk phone required."
        priceGrowthdialer="$49"
        priceCompetitor="$100+"
        rows={[
          { feature: 'Browser WebRTC dialing', growthdialer: true, competitor: true },
          { feature: 'Power dialer queue', growthdialer: true, competitor: true },
          { feature: 'AI transcription + summaries', growthdialer: true, competitor: 'Add-on' },
          { feature: 'Disposition-driven CRM sync', growthdialer: true, competitor: true },
          { feature: 'Minutes to first call', growthdialer: '< 10 min', competitor: 'Days–weeks' },
          { feature: 'Workspace pricing (not per-line fees)', growthdialer: true, competitor: false },
        ]}
        reasons={[
          {
            title: 'Outbound-first UX',
            description:
              'Reps live in a dialer queue — not a general UC admin portal. Dispositions, power dial, and recordings are the default view.',
          },
          {
            title: 'Faster rollout for small teams',
            description:
              'No hardware procurement or IT ticket queue. Buy a number, import CSV, dial from Chrome.',
          },
          {
            title: 'Honest AI scope',
            description:
              'We ship transcription and summaries today. We do not claim full autonomous SDR replacement until voice agents are live.',
          },
        ]}
      />
    </MarketingShell>
  );
}
