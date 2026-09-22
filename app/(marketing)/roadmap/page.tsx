import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { BETA_TODAY, IN_PROGRESS, LIVE_TODAY, ROADMAP_NOT_LIVE } from '@/lib/marketing/honest-copy';

export const metadata: Metadata = {
  title: 'Roadmap — What ships next | GrowthDialer',
  description:
    'GrowthDialer product roadmap: live today (dialer, power dial, HubSpot), built-in AI pipeline, in progress, and planned integrations. Updated honestly.',
  alternates: { canonical: `${MARKETING_SITE}/roadmap` },
};

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
            <span className="font-semibold">What is next.</span>
          </>
        }
        description="We ship in the open. Live features match the product today — waitlist and roadmap items stay labeled until they land in your workspace."
      />

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Live today', items: LIVE_TODAY, accent: 'text-emerald-700' },
            { title: 'Built-in', items: BETA_TODAY, accent: 'text-cyan-700' },
            { title: 'In progress', items: IN_PROGRESS, accent: 'text-[#6D28D9]' },
            { title: 'Roadmap', items: ROADMAP_NOT_LIVE, accent: 'text-zinc-500' },
          ].map((col, ci) => (
            <Reveal key={col.title} delay={ci * 60}>
              <article className="mk-card h-full p-6">
                <h2 className={`font-display text-lg font-semibold ${col.accent}`}>{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item} className="text-[14px] leading-relaxed text-zinc-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-[14px] text-zinc-500">
          Shipped updates also post to{' '}
          <Link href="/changelog" className="font-medium text-[#6D28D9] hover:underline">
            Changelog
          </Link>
          . Join the integration waitlist from your workspace Integrations tab.
        </p>
      </section>
    </MarketingShell>
  );
}
