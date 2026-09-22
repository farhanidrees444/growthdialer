import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FlaskConical, Rocket, Timer } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { FinalCta, PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
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
    items: LIVE_TODAY,
  },
  {
    eyebrow: 'Now',
    title: 'Built-in beta',
    icon: FlaskConical,
    accent: 'bg-cyan-500/10 text-cyan-700',
    note: 'In the product, improving as call volume grows.',
    items: BETA_TODAY,
  },
  {
    eyebrow: 'Next',
    title: 'In development',
    icon: Timer,
    accent: 'bg-violet-600/10 text-violet-700',
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
              title="No “coming soon” pretending to be shipped."
              lede="Three columns, three promises. When an item moves from one to the next, it posts to the changelog."
              align="left"
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {COLUMNS.map((col, ci) => (
                <Reveal key={col.title} delay={ci * 80}>
                  <article className="pm-card flex h-full flex-col p-7">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em]',
                          col.accent
                        )}
                      >
                        <col.icon className="h-3.5 w-3.5" />
                        {col.eyebrow}
                      </span>
                    </div>
                    <h2 className="pm-h-card mt-4 !text-[1.35rem]">{col.title}</h2>
                    {'note' in col && col.note && (
                      <p className="pm-small mt-1">{col.note}</p>
                    )}
                    {'featured' in col && col.featured && (
                      <div className="mt-5 rounded-xl border border-violet-600/20 bg-violet-600/[0.05] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">
                          In development
                        </p>
                        <p className="mt-1.5 text-[14px] font-semibold leading-snug text-zinc-950">
                          {col.featured}
                        </p>
                        <p className="pm-small mt-2 !text-zinc-600">
                          An AI receptionist that answers inbound calls, qualifies, and books
                          meetings. It is not live — it’s what we’re building next.
                        </p>
                      </div>
                    )}
                    <ul className="mt-5 space-y-2.5 border-t border-zinc-950/[0.06] pt-5">
                      {col.items.map((item) => (
                        <li
                          key={item}
                          className="text-[14px] leading-relaxed text-zinc-600"
                        >
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
              <div className="pm-card mt-4 p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="pm-h-card !text-[1.35rem]">
                    <span className="pm-small mr-3 font-bold uppercase tracking-[0.1em] !text-zinc-400">
                      Later
                    </span>
                    Planned — not scheduled
                  </h2>
                </div>
                <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {LATER.map((item) => (
                    <li key={item} className="text-[14px] leading-relaxed text-zinc-600">
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

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
