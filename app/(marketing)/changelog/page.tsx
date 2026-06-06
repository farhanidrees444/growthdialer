import type { Metadata } from 'next';
import Link from 'next/link';
import { CHANGELOG } from '@/lib/marketing/changelog-data';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Changelog — Product updates',
  description: 'Shipping log for GrowthDialer: dialer improvements, HubSpot integration, Call Logs, parallel dial, and workspace features.',
  alternates: { canonical: `${MARKETING_SITE}/changelog` },
};

const TAG_STYLE: Record<string, string> = {
  feature: 'bg-[#8B5CF6]/15 text-[#A78BFA]',
  fix: 'bg-amber-500/15 text-amber-300',
  integration: 'bg-emerald-500/15 text-emerald-300',
  infra: 'bg-cyan-500/15 text-cyan-300',
};

export default function ChangelogPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer Changelog',
          url: `${MARKETING_SITE}/changelog`,
        }}
      />
      <MarketingPageHero
        eyebrow="Changelog"
        title={
          <>
            Shipped updates,
            <br />
            <span className="font-medium">not slide decks.</span>
          </>
        }
        description="Every entry maps to code in production. For what's next, see the Roadmap."
      />

      <section className="mx-auto max-w-3xl px-5 pb-20 lg:px-8">
        <div className="space-y-6">
          {CHANGELOG.map((entry) => (
            <article
              key={entry.version}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-center gap-3">
                <time dateTime={entry.date} className="text-[13px] text-zinc-500">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span className="font-mono text-[12px] text-zinc-600">v{entry.version}</span>
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', TAG_STYLE[tag])}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="mt-3 font-display text-xl font-medium text-[#F5F5F7]">{entry.title}</h2>
              <p className="mt-2 text-[14px] text-zinc-500">{entry.summary}</p>
              <ul className="mt-4 space-y-2">
                {entry.items.map((item) => (
                  <li key={item} className="text-[14px] leading-relaxed text-zinc-400">
                    — {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-[14px] text-zinc-500">
          Upcoming work lives on the{' '}
          <Link href="/roadmap" className="text-[#A78BFA] hover:underline">
            Roadmap
          </Link>
          .
        </p>
      </section>
    </MarketingShell>
  );
}
