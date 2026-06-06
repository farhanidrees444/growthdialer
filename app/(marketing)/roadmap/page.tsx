import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Roadmap — What ships next | GrowthDialer',
  description:
    'GrowthDialer product roadmap: live today (dialer, recordings, HubSpot), in progress, and planned integrations. Updated honestly.',
  alternates: { canonical: `${MARKETING_SITE}/roadmap` },
};

const LIVE = [
  'WebRTC dialer + power dialer',
  'Call recording, transcription, AI summaries',
  'HubSpot call logging',
  'Workspace teams + role-based access',
  'Analytics dashboard + call logs',
];

const IN_PROGRESS = [
  'Salesforce + Pipedrive CRM connectors',
  'Webhook event API for call.completed',
  'Power queue filter parity with dialer UI',
  'Sequences builder (multi-step cadences)',
];

const PLANNED = [
  'AI inbound voice agent',
  'Live coaching audio bridge (manager whisper mode)',
  'Slack + Zapier automation triggers',
  'Enterprise SSO (SAML)',
];

export default function RoadmapPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer Roadmap',
          url: `${MARKETING_SITE}/roadmap`,
        }}
      />
      <MarketingPageHero
        eyebrow="Roadmap"
        title={
          <>
            What is live.
            <br />
            <span className="font-medium">What is next.</span>
          </>
        }
        description="We ship in the open. Live features match the product today — waitlist items stay labeled until they land in your workspace."
      />

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { title: 'Live today', items: LIVE, accent: 'text-emerald-400' },
            { title: 'In progress', items: IN_PROGRESS, accent: 'text-[#A78BFA]' },
            { title: 'Planned', items: PLANNED, accent: 'text-zinc-500' },
          ].map((col) => (
            <article
              key={col.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
            >
              <h2 className={`font-display text-lg font-medium ${col.accent}`}>{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item} className="text-[14px] leading-relaxed text-zinc-400">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-[14px] text-zinc-500">
          Shipped updates also post to{' '}
          <Link href="/changelog" className="text-[#A78BFA] hover:underline">
            Changelog
          </Link>
          . Join the integration waitlist from your workspace Integrations tab.
        </p>
      </section>
    </MarketingShell>
  );
}
