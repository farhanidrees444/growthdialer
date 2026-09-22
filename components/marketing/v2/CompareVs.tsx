'use client';

import Link from 'next/link';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FinalCta,
  PageHero,
  SectionHead,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import type { PseoCompetitor } from '@/lib/marketing/pseo-competitors';
import {
  GROWTHDIALER_PRICE,
  getFeatureRows,
  getRelatedCompetitors,
  parsePriceNumber,
} from '@/lib/marketing/pseo-competitors';
import {
  buildValueProps,
  buildVsFaqs,
  buildVsHeroSubtitle,
  buildVsHeroTitle,
} from '@/lib/marketing/pseo-content';

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={3} aria-label="Yes" />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-zinc-300" aria-label="No" />
    );
  }
  return <span className="text-center text-xs font-medium text-zinc-600 sm:text-sm">{value}</span>;
}

export function CompareVsTemplate({ competitor, basePath }: { competitor: PseoCompetitor; basePath: 'compare' | 'vs' }) {
  const rows = getFeatureRows(competitor);
  const valueProps = buildValueProps(competitor);
  const faqs = buildVsFaqs(competitor).map((f) => ({ q: f.question, a: f.answer }));
  const related = getRelatedCompetitors(competitor);

  const gdPrice = parsePriceNumber(GROWTHDIALER_PRICE);
  const theirPrice = parsePriceNumber(competitor.priceFrom);
  const maxPrice = Math.max(gdPrice, theirPrice, 1);

  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow={`GrowthDialer vs ${competitor.name}`}
          title={buildVsHeroTitle(competitor)}
          lede={buildVsHeroSubtitle(competitor)}
          cta={{ label: 'Start free trial', href: APP_SIGNUP }}
        />

        {/* Price comparison */}
        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <SectionHead eyebrow="Pricing" title="Starting price, side by side." />
            <Reveal>
              <div className="pm-card space-y-6 p-8">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#6d28d9]">GrowthDialer</span>
                    <span className="tabular-nums font-semibold text-zinc-950">{GROWTHDIALER_PRICE}/seat/mo</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-950/[0.06]">
                    <div className="h-full rounded-full bg-[#6d28d9]" style={{ width: `${(gdPrice / maxPrice) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-500">{competitor.name}</span>
                    <span className="tabular-nums text-zinc-500">{competitor.priceFrom}/seat/mo</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-950/[0.06]">
                    <div className="h-full rounded-full bg-zinc-400" style={{ width: `${(theirPrice / maxPrice) * 100}%` }} />
                  </div>
                </div>
                <p className="pm-caption text-center">
                  Approximate public list pricing — confirm with each vendor. GrowthDialer: 7-day free trial,
                  no credit card, no annual lock-in.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Feature table */}
        <div className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container-narrow">
            <SectionHead eyebrow="Features" title="Checklist, not marketing." />
            <Reveal>
              <div className="pm-card overflow-hidden !p-0">
                <div className="grid grid-cols-3 border-b border-zinc-950/[0.08] bg-zinc-50/70 px-5 py-4 text-center text-xs font-semibold text-zinc-950 sm:text-sm">
                  <span className="text-left text-zinc-500">Feature</span>
                  <span className="text-[#6d28d9]">GrowthDialer</span>
                  <span className="text-zinc-500">{competitor.name}</span>
                </div>
                {rows.map((row, i) => (
                  <div
                    key={row.feature}
                    className={cn('grid grid-cols-3 items-center px-5 py-3.5 text-sm', i % 2 === 1 && 'bg-zinc-50/50')}
                  >
                    <span className="pr-2 text-left text-[13px] text-zinc-600 sm:text-sm">{row.feature}</span>
                    <div className="flex justify-center">
                      <CellValue value={row.growthdialer} />
                    </div>
                    <div className="flex justify-center">
                      <CellValue value={row.competitor} />
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <p className="pm-caption mt-5 text-center">
              Based on public product information. We don’t invent competitor claims — verify before you buy.
            </p>
          </div>
        </div>

        {/* Value props */}
        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead eyebrow={`Why switch from ${competitor.name}`} title="What changes with GrowthDialer." />
            <div className="grid gap-4 sm:grid-cols-2">
              {valueProps.map((prop, i) => (
                <Reveal key={prop.title} delay={(i % 2) * 80}>
                  <article className="pm-card pm-card-hover h-full p-7">
                    <h3 className="pm-h-card">{prop.title}</h3>
                    <p className="pm-body mt-3 !text-[14.5px]">{prop.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="pm-section-tight pm-divider bg-zinc-50/60">
            <div className="pm-container-narrow">
              <SectionHead eyebrow="Keep comparing" title="More head-to-heads." />
              <Reveal>
                <div className="flex flex-wrap justify-center gap-2">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={basePath === 'compare' ? `/compare/vs-${r.slug}` : `/vs/${r.slug}`}
                      className="pm-chip transition hover:border-zinc-950/25"
                    >
                      vs {r.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className={cn(related.length > 0 && 'pm-divider')}>
          <Faq
            items={faqs}
            eyebrow="FAQ"
            title={`${competitor.name} vs GrowthDialer, answered.`}
          />
        </div>

        {/* Switch CTA */}
        <div className="pm-section-tight pm-divider">
          <div className="pm-container-narrow text-center">
            <Reveal>
              <h2 className="pm-h-section">Ready to switch from {competitor.name}?</h2>
              <p className="pm-lead mx-auto mt-5 max-w-xl">
                Import your list, run a power session, and judge the AI briefs on your own calls.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/pricing" className="pm-btn pm-btn-secondary">
                  See pricing
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
