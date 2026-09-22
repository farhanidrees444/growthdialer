import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { CHANGELOG } from '@/lib/marketing/changelog-data';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Changelog — Product updates',
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ChangelogPage() {
  const newest = CHANGELOG[0];
  const oldest = CHANGELOG[CHANGELOG.length - 1];

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
            <SectionHead
              eyebrow="Release log"
              title="Reverse-chronological. No padding."
              lede={`${CHANGELOG.length} releases — v${newest.version} down to v${oldest.version}.`}
              align="left"
            />
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
                      <div className="pm-card pm-card-hover p-7 sm:p-8">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <time
                            dateTime={entry.date}
                            className="pm-small font-medium !text-zinc-500"
                          >
                            {formatDate(entry.date)}
                          </time>
                          <span className="rounded-full bg-violet-600/10 px-2.5 py-0.5 font-mono text-[12px] font-semibold text-violet-700">
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
                        <h2 className="pm-h-card mt-4 !text-[1.4rem]">{entry.title}</h2>
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

            {/* Page-specific closing CTA */}
            <Reveal delay={80}>
              <section className="mt-14 rounded-[1.4rem] border border-violet-600/20 bg-violet-600/[0.05] p-8 text-center sm:p-10">
                <p className="pm-eyebrow pm-eyebrow-centered">What’s next</p>
                <h2 className="pm-h-card mx-auto mt-4 max-w-xl !text-[1.75rem] leading-tight">
                  This log is history. The roadmap is what’s shipping.
                </h2>
                <p className="pm-body mx-auto mt-3 max-w-lg">
                  In development and planned work stays labeled until it lands in your
                  workspace — or try what’s live today on a 7-day free trial.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/roadmap" className="pm-btn pm-btn-primary w-full sm:w-auto">
                    See the roadmap <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href={APP_SIGNUP} className="pm-btn pm-btn-secondary w-full sm:w-auto">
                    Start free trial
                  </a>
                </div>
              </section>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
