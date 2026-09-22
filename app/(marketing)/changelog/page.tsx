import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { CHANGELOG } from '@/lib/marketing/changelog-data';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Changelog — Product updates | GrowthDialer',
  description:
    'Shipping log for GrowthDialer: dialer improvements, HubSpot integration, Call Logs, parallel dial, and workspace features.',
  alternates: { canonical: `${MARKETING_SITE}/changelog` },
};

const TAG_STYLE: Record<string, string> = {
  feature: 'bg-violet-600/10 text-violet-700',
  fix: 'bg-amber-500/10 text-amber-700',
  integration: 'bg-emerald-500/10 text-emerald-700',
  infra: 'bg-cyan-500/10 text-cyan-700',
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'GrowthDialer Changelog',
            url: `${MARKETING_SITE}/changelog`,
          }}
        />
        <PageHero
          eyebrow="Changelog"
          title={
            <>
              Shipped updates,
              <br />
              not slide decks.
            </>
          }
          lede="Every entry maps to code in production. For what’s next, see the roadmap."
        />

        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <div className="relative">
              <div
                aria-hidden
                className="absolute bottom-4 left-[7px] top-2 hidden w-px bg-zinc-950/[0.08] sm:block"
              />
              <div className="space-y-6">
                {CHANGELOG.map((entry, i) => (
                  <Reveal key={entry.version} delay={Math.min(i, 3) * 60}>
                    <article className="relative sm:pl-10">
                      <span
                        aria-hidden
                        className="absolute left-0 top-6 hidden h-[15px] w-[15px] rounded-full border-[3px] border-white bg-violet-600 shadow-[0_0_0_1px_rgba(9,9,11,0.1)] sm:block"
                      />
                      <div className="pm-card pm-card-hover p-7">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <time
                            dateTime={entry.date}
                            className="pm-small font-medium !text-zinc-500"
                          >
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </time>
                          <span className="font-mono text-[12px] text-zinc-400">
                            v{entry.version}
                          </span>
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]',
                                TAG_STYLE[tag]
                              )}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h2 className="pm-h-card mt-4 !text-[1.3rem]">{entry.title}</h2>
                        <p className="pm-body mt-2 !text-[14.5px]">{entry.summary}</p>
                        <ul className="mt-5 space-y-2.5 border-t border-zinc-950/[0.06] pt-5">
                          {entry.items.map((item) => (
                            <li key={item} className="pm-tick">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal delay={80}>
              <p className="pm-body mt-12 text-center">
                Upcoming work lives on the{' '}
                <Link href="/roadmap" className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:underline">
                  roadmap <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
