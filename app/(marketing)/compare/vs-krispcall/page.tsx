import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs KrispCall — Business Phone vs Sales Dialer',
  description:
    'Compare GrowthDialer and KrispCall for outbound sales: parallel dial, AI intelligence, and revenue-team workflows.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-krispcall` },
};

export default function VsKrispCallPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs KrispCall',
          url: `${MARKETING_SITE}/compare/vs-krispcall`,
        }}
      />
      <ComparePage
        competitor="KrispCall"
        badge="GrowthDialer vs KrispCall"
        title={
          <>
            KrispCall is a business phone.
            <br />
            <span className="font-medium">GrowthDialer is a revenue dialer.</span>
          </>
        }
        subtitle="KrispCall covers general business telephony. GrowthDialer is purpose-built for outbound SDR and AE workflows — queues, power dial, dispositions, and AI on every recorded call."
        priceGrowthdialer="$49"
        priceCompetitor="$79+"
        rows={[
          { feature: 'Outbound power dialer', growthdialer: true, competitor: false },
          { feature: 'Parallel dialing', growthdialer: true, competitor: false },
          { feature: 'Lead queue + dispositions', growthdialer: true, competitor: false },
          { feature: 'AI call summaries', growthdialer: true, competitor: false },
          { feature: 'Multi-number business phone', growthdialer: true, competitor: true },
          { feature: 'CRM integrations', growthdialer: true, competitor: true },
          { feature: 'Free tier', growthdialer: true, competitor: false },
        ]}
        reasons={[
          {
            title: 'Salesfloor-native UX',
            description:
              'Hot leads, callbacks, and session stats live in the dialer — not a generic phone app with a CRM sidebar.',
          },
          {
            title: 'Ten conversations per hour, not one',
            description:
              'Parallel AMD connects reps only to humans while losers get voicemail drop automatically.',
          },
          {
            title: 'Managers review calls, not minutes',
            description:
              'Recording library with AI summaries beats call-minute reports for coaching and QA.',
          },
        ]}
      />
    </MarketingShell>
  );
}
