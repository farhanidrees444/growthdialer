import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs PowerDialer.com — Dialer Comparison',
  description:
    'Compare GrowthDialer and PowerDialer.com on AI coaching, parallel dial, CRM sync, and conversation intelligence.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-powerdialer` },
};

export default function VsPowerDialerPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs PowerDialer',
          url: `${MARKETING_SITE}/compare/vs-powerdialer`,
        }}
      />
      <ComparePage
        competitor="PowerDialer"
        badge="GrowthDialer vs PowerDialer.com"
        title={
          <>
            Faster dialing was the old moat.
            <br />
            <span className="font-medium">AI summaries are the new one.</span>
          </>
        }
        subtitle="PowerDialer.com focuses on multi-line dialing and CRM sync. GrowthDialer pairs parallel and power modes with Whisper transcription, Gemini summaries, and a live coaching floor."
        priceGrowthdialer="$49"
        priceCompetitor="$129+"
        rows={[
          { feature: 'Multi-line / parallel dial', growthdialer: true, competitor: true },
          { feature: 'Real-time AI coaching', growthdialer: true, competitor: false },
          { feature: 'AI call summaries', growthdialer: true, competitor: false },
          { feature: 'Live team salesfloor', growthdialer: true, competitor: false },
          { feature: 'CRM sync', growthdialer: true, competitor: true },
          { feature: 'Call Logs + analytics', growthdialer: true, competitor: true },
          { feature: 'Free tier', growthdialer: true, competitor: false },
        ]}
        reasons={[
          {
            title: 'Pipeline metrics, not just dial counts',
            description:
              'Connect rate, meetings booked, and talk time roll up in Analytics — tied to dispositions reps actually save.',
          },
          {
            title: 'Coaching without shoulder-surfing',
            description:
              'Managers use recordings and AI bullets instead of joining every live dial block.',
          },
          {
            title: 'Built for 2026 workflows',
            description:
              'WebRTC, workspace teams, and HubSpot OAuth — not a legacy desktop dialer with a web dashboard bolted on.',
          },
        ]}
      />
    </MarketingShell>
  );
}
