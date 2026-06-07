import Link from 'next/link';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
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
import { APP_SIGNUP } from '@/lib/marketing/navigation';
import { CompetitorLogo, GrowthDialerLogoMark } from './CompetitorLogo';
import { cn } from '@/lib/utils';

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle className="mx-auto h-5 w-5 text-emerald-500" aria-label="Yes" />
    ) : (
      <XCircle className="mx-auto h-5 w-5 text-zinc-600" aria-label="No" />
    );
  }
  return <span className="text-center text-xs font-medium text-zinc-300 sm:text-sm">{value}</span>;
}

type ProgrammaticVsPageProps = {
  competitor: PseoCompetitor;
};

export function ProgrammaticVsPage({ competitor }: ProgrammaticVsPageProps) {
  const rows = getFeatureRows(competitor);
  const valueProps = buildValueProps(competitor);
  const faqs = buildVsFaqs(competitor);
  const related = getRelatedCompetitors(competitor);

  const gdPrice = parsePriceNumber(GROWTHDIALER_PRICE);
  const theirPrice = parsePriceNumber(competitor.priceFrom);
  const maxPrice = Math.max(gdPrice, theirPrice, 1);

  return (
    <div className="bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <section className="relative border-b border-zinc-800/60 px-5 pb-16 pt-32 lg:px-8 lg:pb-20 lg:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(90vw,820px)] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            GrowthDialer vs {competitor.name}
          </p>

          <div className="mb-8 flex items-center justify-center gap-4 sm:gap-6">
            <GrowthDialerLogoMark size={52} />
            <span className="text-sm font-medium text-zinc-600">vs</span>
            <CompetitorLogo domain={competitor.domain} name={competitor.name} size={52} />
          </div>

          <h1 className="font-display text-[clamp(1.75rem,4.5vw,3rem)] font-light leading-[1.08] tracking-tight text-zinc-50">
            {buildVsHeroTitle(competitor)}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-zinc-400">
            {buildVsHeroSubtitle(competitor)}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={APP_SIGNUP}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-6 py-3 text-sm font-semibold text-zinc-200 backdrop-blur-md transition hover:border-zinc-700 hover:bg-zinc-900/60"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Price comparison bars */}
      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
            Starting price comparison
          </h2>
          <div className="space-y-5 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-md">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-violet-300">GrowthDialer</span>
                <span className="tabular-nums text-zinc-300">{GROWTHDIALER_PRICE}/mo</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800/80">
                <div
                  className="h-full rounded-full bg-violet-500/80"
                  style={{ width: `${(gdPrice / maxPrice) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-400">{competitor.name}</span>
                <span className="tabular-nums text-zinc-500">{competitor.priceFrom}/mo</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800/80">
                <div
                  className="h-full rounded-full bg-zinc-600/80"
                  style={{ width: `${(theirPrice / maxPrice) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-center text-[11px] leading-relaxed text-zinc-600">
              Approximate public list pricing — confirm with each vendor. GrowthDialer Starter is free.
            </p>
          </div>
        </div>
      </section>

      {/* Feature checklist table */}
      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center font-display text-xl font-medium text-zinc-100">
            Feature checklist
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <div className="grid grid-cols-3 border-b border-zinc-800/60 bg-zinc-900/50 px-4 py-3 text-center text-xs font-semibold sm:text-sm">
              <span className="text-left text-zinc-500">Feature</span>
              <span className="text-violet-300">GrowthDialer</span>
              <span className="text-zinc-500">{competitor.name}</span>
            </div>
            {rows.map((row, i) => (
              <div
                key={row.feature}
                className={cn(
                  'grid grid-cols-3 items-center px-4 py-3.5 text-sm',
                  i % 2 === 1 && 'bg-zinc-950/40',
                )}
              >
                <span className="pr-2 text-left text-[13px] text-zinc-400 sm:text-sm">
                  {row.feature}
                </span>
                <div className="flex justify-center">
                  <CellValue value={row.growthdialer} />
                </div>
                <div className="flex justify-center">
                  <CellValue value={row.competitor} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {valueProps.map((prop) => (
            <article
              key={prop.title}
              className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-md"
            >
              <h2 className="font-display text-base font-medium text-zinc-100">{prop.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{prop.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center font-display text-xl font-medium text-zinc-100">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md"
              >
                <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-zinc-200 marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                </summary>
                <p className="border-t border-zinc-800/40 px-5 pb-4 pt-3 text-[14px] leading-relaxed text-zinc-500">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related comparisons — internal linking */}
      {related.length > 0 && (
        <section className="border-t border-zinc-800/60 px-5 py-12 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-5 text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
              More comparisons
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/vs/${r.slug}`}
                  className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                >
                  vs {r.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-xl rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-8 text-center backdrop-blur-md">
          <h2 className="font-display text-xl font-medium text-zinc-50">
            Ready to switch from {competitor.name}?
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Start free — no credit card. Upgrade when your team is ready.
          </p>
          <a
            href={APP_SIGNUP}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
