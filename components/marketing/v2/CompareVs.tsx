'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, Minus, Scale } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { Faq, SectionHead } from '@/components/marketing/v2/Sections';
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
import { buildVsFaqs } from '@/lib/marketing/pseo-content';

/* ── Types ─────────────────────────────────────────────── */

export type CompareVerdict = {
  /** Gracious "pick the competitor" line — their genuine strength */
  pickThem: string;
  /** "Pick GrowthDialer" line — verified facts only */
  pickUs: string;
};

/* ── Verified GrowthDialer facts (the only claims allowed here) ── */

const GD_WINS = [
  {
    title: 'Up to 5 parallel lines on Pro',
    body: 'Run cold lists at real volume without losing the human on the call.',
  },
  {
    title: '3 dialing modes in one dialer',
    body: 'Manual, power, and parallel — switch per list, not per contract.',
  },
  {
    title: 'AI brief before every dial',
    body: 'Company context, past notes, and a one-line opener inside the dialer.',
  },
  {
    title: '8 dispositions built in',
    body: 'Clean data out of every session — coach from truth, not vibes.',
  },
  {
    title: '7-day free trial',
    body: 'No credit card, monthly billing. Judge it on your own calls.',
  },
];

const CTA_LINES: Record<PseoCompetitor['category'], string> = {
  voip: 'Outgrowing a phone system for outbound? Run a real dial session on your own list.',
  'parallel-dialer':
    'Compare connect quality, not just connect counts — run the 7-day trial on your own list.',
  'power-dialer':
    'Keep your power-dial motion; add AI summaries, pre-call briefs, and a coaching floor.',
  'conversation-intelligence':
    'Intelligence included with the dialer — not a separate SKU. Try it free for 7 days.',
};

function defaultVerdict(competitor: PseoCompetitor): CompareVerdict {
  const { name, knownFor, category } = competitor;
  const pickThemByCategory: Record<PseoCompetitor['category'], string> = {
    voip: `Pick ${name} if you need a full business phone system — voice, video, messaging — and outbound dialing is a side feature, not the job.`,
    'parallel-dialer': `Pick ${name} if your floor already runs on it and your team is hitting its numbers. ${name} is a proven specialist in ${knownFor} — churn for churn's sake is a bad trade.`,
    'power-dialer': `Pick ${name} if you want ${knownFor} and your team is settled on a simple, established workflow.`,
    'conversation-intelligence': `Pick ${name} if conversation intelligence is your core purchase and you already live inside ${knownFor}.`,
  };
  return {
    pickThem: pickThemByCategory[category],
    pickUs: `Pick GrowthDialer if you want power + parallel dial (up to 5 lines) with AI summaries, call briefs, and a live coaching floor included — from ${GROWTHDIALER_PRICE}/workspace/mo, 7-day free trial, no credit card.`,
  };
}

/* ── Small pieces ──────────────────────────────────────── */

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={3} aria-label="Yes" />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-zinc-300" aria-label="No" />
    );
  }
  return (
    <span className="text-center text-xs font-medium text-zinc-600 sm:text-sm">{value}</span>
  );
}

function Breadcrumb({ competitorName }: { competitorName: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-2 text-[13px] text-zinc-500">
      <Link href="/" className="hover:text-violet-700">
        Home
      </Link>
      <span aria-hidden className="text-zinc-300">
        /
      </span>
      <span className="text-zinc-700">vs {competitorName}</span>
    </nav>
  );
}

/* ── Template ──────────────────────────────────────────── */

export function CompareVsTemplate({
  competitor,
  basePath,
  verdict,
}: {
  competitor: PseoCompetitor;
  basePath: 'compare' | 'vs';
  verdict?: CompareVerdict;
}) {
  const rows = getFeatureRows(competitor);
  const related = getRelatedCompetitors(competitor);
  const v = verdict ?? defaultVerdict(competitor);

  const faqs = [
    ...buildVsFaqs(competitor).map((f) => ({ q: f.question, a: f.answer })),
    {
      q: `Should we switch from ${competitor.name} to GrowthDialer?`,
      a: `If your team wants AI summaries, pre-call briefs, and a coaching floor bundled with power and parallel dial — and you're comfortable with HubSpot as the live CRM connector while others stay waitlist-only — run the 7-day trial on your own list and judge it there. If ${competitor.knownFor} is your core need and you're happy, stay.`,
    },
    {
      q: 'How honest is this comparison?',
      a: "We wrote it from public product information and labeled what we're unsure about. We don't invent competitor prices or features, and we say when the other vendor is the better pick. If you spot an error, tell us — we'd rather fix it than win on it.",
    },
  ];

  const gdPrice = parsePriceNumber(GROWTHDIALER_PRICE);
  const customPrice = competitor.priceModel === 'custom';
  const theirPrice = customPrice ? 0 : parsePriceNumber(competitor.priceFrom);
  const maxPrice = Math.max(gdPrice, theirPrice, 1);

  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        {/* ── Editorial header ─────────────────────────── */}
        <header className="pm-container pt-36 sm:pt-44">
          <Reveal>
            <Breadcrumb competitorName={competitor.name} />
            <p className="pm-eyebrow">The honest comparison</p>
            <h1 className="pm-h-display mt-5 max-w-3xl">
              GrowthDialer vs {competitor.name}
            </h1>
            <p className="pm-lead mt-6 max-w-2xl">{competitor.positioning}</p>
            <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-zinc-500">
              We built this page from public product information — and we&apos;ll tell you when{' '}
              {competitor.name} is the better pick. Where we&apos;re unsure, we say so.
            </p>
          </Reveal>
        </header>

        {/* ── Verdict: who should pick whom ────────────── */}
        <section className="pm-section-tight">
          <div className="pm-container-narrow">
            <SectionHead
              eyebrow="The verdict"
              title="Who should pick whom."
              align="left"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Reveal>
                <article className="flex h-full flex-col rounded-3xl border border-zinc-950/[0.08] bg-white p-7 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950/[0.05]">
                      <Scale className="h-5 w-5 text-zinc-600" />
                    </span>
                    <h2 className="font-display text-[1.15rem] font-semibold tracking-tight text-zinc-950">
                      Pick {competitor.name} if…
                    </h2>
                  </div>
                  <p className="pm-body mt-4 flex-1 !text-[15px]">{v.pickThem}</p>
                  <p className="pm-caption mt-5 border-t border-zinc-950/[0.06] pt-4">
                    No hard feelings — the wrong tool costs more than the subscription.
                  </p>
                </article>
              </Reveal>
              <Reveal delay={90}>
                <article className="flex h-full flex-col rounded-3xl border border-violet-600/25 bg-violet-600/[0.04] p-7 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/15">
                      <Check className="h-5 w-5 text-violet-700" strokeWidth={3} />
                    </span>
                    <h2 className="font-display text-[1.15rem] font-semibold tracking-tight text-zinc-950">
                      Pick GrowthDialer if…
                    </h2>
                  </div>
                  <p className="pm-body mt-4 flex-1 !text-[15px]">{v.pickUs}</p>
                  <a
                    href={APP_SIGNUP}
                    className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet-700 hover:underline"
                  >
                    Start the 7-day trial <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Criteria table ───────────────────────────── */}
        <section className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container-narrow">
            <SectionHead eyebrow="Criteria" title="Checklist, not marketing." align="left" />
            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-zinc-950/[0.08] bg-white">
                <div className="grid grid-cols-3 border-b border-zinc-950/[0.08] bg-zinc-50/70 px-4 py-4 text-center text-xs font-semibold sm:px-5 sm:text-sm">
                  <span className="text-left text-zinc-500">Capability</span>
                  <span className="text-violet-700">GrowthDialer</span>
                  <span className="text-zinc-500">{competitor.name}</span>
                </div>
                {rows.map((row, i) => (
                  <div
                    key={row.feature}
                    className={cn(
                      'grid grid-cols-3 items-center px-4 py-3.5 sm:px-5',
                      i % 2 === 1 && 'bg-zinc-50/50'
                    )}
                  >
                    <span className="pr-2 text-left text-[13px] text-zinc-600 sm:text-sm">
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
            </Reveal>
            <p className="pm-caption mt-5">
              Based on public product information. We don&apos;t invent competitor claims —
              verify before you buy.
            </p>
          </div>
        </section>

        {/* ── Where GrowthDialer wins (verified facts) ─── */}
        <section className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Where GrowthDialer wins"
              title="Facts you can verify in a trial."
              lede="Nothing here requires trusting our marketing — every line below is testable in the product today."
              align="left"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GD_WINS.map((win, i) => (
                <Reveal key={win.title} delay={(i % 3) * 70}>
                  <article className="pm-card pm-card-hover h-full p-7">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/10 font-display text-[15px] font-bold text-violet-700">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="pm-h-card mt-4">{win.title}</h3>
                    <p className="pm-body mt-2.5 !text-[14.5px]">{win.body}</p>
                  </article>
                </Reveal>
              ))}
              <Reveal delay={120}>
                <a
                  href={APP_SIGNUP}
                  className="group flex h-full min-h-[180px] flex-col justify-between rounded-3xl bg-zinc-950 p-7 text-white transition-shadow hover:shadow-[0_24px_64px_-24px_rgba(9,9,11,0.5)]"
                >
                  <p className="font-display text-[1.25rem] font-semibold leading-snug tracking-tight">
                    Verify all five on your own calls.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-violet-300">
                    Start free
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </a>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Pricing, honestly ─────────────────────────── */}
        <section className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container-narrow">
            <SectionHead
              eyebrow="Pricing"
              title="Starting price, side by side."
              align="left"
            />
            <Reveal>
              <div className="rounded-2xl border border-zinc-950/[0.08] bg-white p-7 sm:p-8">
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-violet-700">GrowthDialer</span>
                      <span className="tabular-nums font-semibold text-zinc-950">
                        {GROWTHDIALER_PRICE}/workspace/mo
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-950/[0.06]">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{ width: `${(gdPrice / maxPrice) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-500">{competitor.name}</span>
                      <span className="tabular-nums text-zinc-500">
                        {customPrice
                          ? 'Custom — vendor-quoted'
                          : `${competitor.priceFrom}/seat/mo`}
                      </span>
                    </div>
                    {!customPrice && (
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-950/[0.06]">
                        <div
                          className="h-full rounded-full bg-zinc-400"
                          style={{ width: `${(theirPrice / maxPrice) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <p className="pm-caption mt-6 border-t border-zinc-950/[0.06] pt-5 text-center">
                  GrowthDialer: 7-day free trial, no credit card, monthly billing — workspace
                  pricing, not per-seat compounding. Competitor pricing is approximate public
                  list — confirm with {competitor.name} before buying.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────── */}
        <Faq
          items={faqs}
          eyebrow="FAQ"
          title={`${competitor.name} vs GrowthDialer, answered honestly.`}
        />

        {/* ── Keep comparing ───────────────────────────── */}
        {related.length > 0 && (
          <section className="pm-section-tight pm-divider bg-zinc-50/60">
            <div className="pm-container-narrow">
              <SectionHead eyebrow="Keep comparing" title="More head-to-heads." />
              <Reveal>
                <div className="flex flex-wrap justify-center gap-2">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={basePath === 'compare' ? `/compare/vs-${r.slug}` : `/vs/${r.slug}`}
                      className="pm-chip transition hover:border-violet-600/40 hover:text-violet-700"
                    >
                      vs {r.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ── Page-specific CTA ────────────────────────── */}
        <section className="pm-section-tight">
          <div className="pm-container-narrow">
            <Reveal>
              <div className="overflow-hidden rounded-3xl bg-zinc-950 p-8 text-center text-white sm:p-12">
                <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">
                  GrowthDialer vs {competitor.name}
                </p>
                <h2 className="mx-auto mt-4 max-w-xl font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-semibold leading-[1.12] tracking-tight">
                  Try the dialer this comparison is about.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-300">
                  {CTA_LINES[competitor.category]}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href={APP_SIGNUP}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-violet-500"
                  >
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                  >
                    See pricing
                  </Link>
                </div>
                <p className="mt-5 text-[12.5px] text-zinc-400">
                  7-day free trial · No credit card · Cancel anytime
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Fine print ───────────────────────────────── */}
        <section className="px-5 pb-16 lg:px-8">
          <p className="mx-auto max-w-2xl text-center text-[12px] leading-relaxed text-zinc-500">
            Competitor features and pricing reflect public information as of April 2026 — verify
            with each vendor before purchasing. GrowthDialer facts on this page — 5 parallel
            lines, 3 dialing modes, 8 dispositions, AI briefs, 7-day trial — are shipped in the
            product today.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
