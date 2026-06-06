import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs Nooks — AI Sales Platform Comparison',
  description:
    'Compare GrowthDialer and Nooks on parallel dialing, AI coaching, pricing, and time-to-value for outbound SDR teams.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-nooks` },
};

export default function VsNooksPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs Nooks',
          url: `${MARKETING_SITE}/compare/vs-nooks`,
        }}
      />
      <ComparePage
        competitor="Nooks"
        badge="GrowthDialer vs Nooks"
        title={
          <>
            Nooks built the virtual salesfloor.
            <br />
            <span className="font-medium">GrowthDialer ships it without the enterprise tax.</span>
          </>
        }
        subtitle="Nooks combines parallel dial with live floor energy. GrowthDialer delivers power and parallel modes, AI summaries, and coaching — with Starter free and Pro at $49/mo."
        priceGrowthdialer="$49"
        priceCompetitor="$800+"
        rows={[
          { feature: 'Parallel dialing (10+ lines)', growthdialer: true, competitor: true },
          { feature: 'Live team salesfloor', growthdialer: true, competitor: true },
          { feature: 'AI call coaching', growthdialer: true, competitor: true },
          { feature: 'AI voicemail detection', growthdialer: true, competitor: true },
          { feature: 'CRM call logging', growthdialer: true, competitor: true },
          { feature: 'Free tier', growthdialer: true, competitor: false },
          { feature: 'Self-serve signup', growthdialer: true, competitor: false },
        ]}
        reasons={[
          {
            title: 'Fraction of the seat cost',
            description:
              'Nooks pricing targets large outbound orgs. GrowthDialer lets a five-person pod run production dial blocks on Pro before procurement gets involved.',
          },
          {
            title: 'Parallel + power in one product',
            description:
              'Switch between manual focus dials and multi-line sessions without separate SKUs or add-ons.',
          },
          {
            title: 'Call Logs for every rep',
            description:
              'Inbound and outbound history with connect stats — managers audit activity without joining the floor live.',
          },
        ]}
      />
    </MarketingShell>
  );
}
