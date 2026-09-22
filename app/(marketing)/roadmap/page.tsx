import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, FlaskConical, Rocket, Sparkles, Timer } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero, SectionHead, RiskBullets } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import {
  BETA_TODAY,
  IN_PROGRESS,
  LIVE_TODAY,
  ROADMAP_NOT_LIVE,
} from '@/lib/marketing/honest-copy';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Roadmap — What Ships Next',
  description:
    'GrowthDialer product roadmap: what’s live today, what’s in development (including the AI voice agent), and what’s planned. Labeled honestly, updated as we ship.',
  alternates: { canonical: `${MARKETING_SITE}/roadmap` },
};

const AI_RECEPTIONIST = 'Autonomous AI voice agents (inbound receptionist)';
const LATER = ROADMAP_NOT_LIVE.filter((item) => item !== AI_RECEPTIONIST);

const COLUMNS = [
  {
    eyebrow: 'Now',
    title: 'Live today',
    icon: Rocket,
    accent: 'bg-emerald-500/10 text-emerald-700',
    tick: 'text-emerald-600',
    items: LIVE_TODAY,
  },
  {
    eyebrow: 'Now',
    title: 'Built-in beta',
    icon: FlaskConical,
    accent: 'bg-cyan-500/10 text-cyan-700',
    tick: 'text-cyan-600',
    note: 'In the product, improving as call volume grows.',
    items: BETA_TODAY,
  },
  {
    eyebrow: 'Next',
    title: 'In development',
    icon: Timer,
    accent: 'bg-violet-600/10 text-violet-700',
    tick: 'text-violet-600',
    featured: AI_RECEPTIONIST,
    items: IN_PROGRESS,
  },
] as const;

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'GrowthDialer Roadmap',
            url: `${MARKETING_SITE}/roadmap`,
          }}
        />
        <PageHero
          eyebrow="Roadmap"
          title={
            <>
              What is live.
              <br />
              What is next.
            </>
          }
          lede="We ship in the open. Live features match the product today — in-development and planned items stay labeled until they land in your workspace."
        />

        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Honest labels"
              title="Three columns, three promises."
              lede="An item only moves columns when it ships. Every move posts to the changelog."
              align="left"
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {COLUMNS.map((col, ci) => (
                <Reveal key={col.title} delay={ci * 80}>
                  <article className="pm-card flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em]',
                          col.accent
                        )}
                      >
                        <col.icon className="h-3.5 w-3.5" />
                        {col.eyebrow}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {col.items.length} items
                      </span>
                    </div>
                    <h2 className="pm-h-card mt-4 !text-[1.5rem]">{col.title}</h2>
                    {'note' in col && col.note && (
                      <p className="pm-small mt-1.5">{col.note}</p>
                    )}
                    {'featured' in col && col.featured && (
                      <div className="mt-6 rounded-xl border border-violet-600/25 bg-violet-600/[0.06] p-5">
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          <Sparkles className="h-3 w-3" />
                          In development
                        </p>
                        <p className="mt-3 text-[15px] font-semibold leading-snug text-zinc-950">
                          {col.featured}
                        </p>
                        <p className="pm-small mt-2 !text-zinc-600">
                          An AI receptionist that answers inbound calls, qualifies, and books
                          meetings. It is not live — it’s what we’re building next.
                        </p>
                      </div>
                    )}
                    <ul className="mt-6 space-y-3 border-t border-zinc-950/[0.06] pt-6">
                      {col.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-[14px] leading-relaxed text-zinc-700"
                        >
                          <Check
                            className={cn('mt-0.5 h-4 w-4 shrink-0', col.tick)}
                            strokeWidth={3}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>

            {/* Later */}
            <Reveal delay={100}>
              <div className="pm-card mt-4 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="pm-h-card !text-[1.5rem]">
                    <span className="pm-small mr-3 font-bold uppercase tracking-[0.1em] !text-zinc-400">
                      Later
                    </span>
                    Planned — not scheduled
                  </h2>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {LATER.length} items
                  </span>
                </div>
                <ul className="mt-6 grid gap-x-10 gap-y-3 border-t border-zinc-950/[0.06] pt-6 sm:grid-cols-2">
                  {LATER.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[14px] leading-relaxed text-zinc-600"
                    >
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <p className="pm-body mx-auto mt-10 max-w-2xl text-center">
                Shipped updates also post to{' '}
                <Link
                  href="/changelog"
                  className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:underline"
                >
                  the changelog <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                . Join the integration waitlist from your workspace Integrations tab.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Page-specific closing CTA */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[380px]" />
          <div className="pm-container relative py-20 text-center sm:py-24">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">Prove it</p>
              <h2 className="pm-h-section-dark mx-auto max-w-2xl">
                Don’t take our roadmap’s word for it.
              </h2>
              <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
                Every item that leaves a column above lands in the changelog — then in your
                workspace. Try what’s live today on a 7-day free trial, no credit card.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-white w-full sm:w-auto">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/changelog" className="pm-btn pm-btn-ghostlight w-full sm:w-auto">
                  Read the changelog
                </Link>
              </div>
              <RiskBullets dark className="mt-8 justify-center" />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
