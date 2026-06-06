import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ComparePage } from '@/components/marketing/ComparePage';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'GrowthDialer vs PhoneBurner — Power Dialer Comparison',
  description:
    'Compare GrowthDialer and PhoneBurner: AI summaries, parallel dial, conversation intelligence, and pricing for outbound sales teams.',
  alternates: { canonical: `${MARKETING_SITE}/compare/vs-phoneburner` },
};

export default function VsPhoneBurnerPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer vs PhoneBurner',
          url: `${MARKETING_SITE}/compare/vs-phoneburner`,
        }}
      />
      <ComparePage
        competitor="PhoneBurner"
        badge="GrowthDialer vs PhoneBurner"
        title={
          <>
            PhoneBurner automates the dial.
            <br />
            <span className="font-medium">GrowthDialer automates the follow-through.</span>
          </>
        }
        subtitle="PhoneBurner is a reliable power dialer from an earlier era of outbound. GrowthDialer adds AI transcription, summaries, parallel lines, and HubSpot logging in a modern browser dialer."
        priceGrowthdialer="$49"
        priceCompetitor="$149+"
        rows={[
          { feature: 'Power dialing', growthdialer: true, competitor: true },
          { feature: 'Parallel dialing', growthdialer: true, competitor: false },
          { feature: 'AI call summaries', growthdialer: true, competitor: false },
          { feature: 'Conversation intelligence', growthdialer: true, competitor: false },
          { feature: 'Browser WebRTC dialer', growthdialer: true, competitor: false },
          { feature: 'HubSpot logging', growthdialer: true, competitor: true },
          { feature: 'Free tier', growthdialer: true, competitor: false },
        ]}
        reasons={[
          {
            title: 'Intelligence after every call',
            description:
              'PhoneBurner stops at connection metrics. GrowthDialer transcribes, summarizes, and tags sentiment so coaches review async.',
          },
          {
            title: 'Ten lines, not one',
            description:
              'Parallel mode with AMD and auto voicemail drop on losers — reps talk to humans, not ring trees.',
          },
          {
            title: 'No desktop installer',
            description:
              'Reps dial from Chrome with a headset. IT ships a URL, not another fat client.',
          },
        ]}
      />
    </MarketingShell>
  );
}
