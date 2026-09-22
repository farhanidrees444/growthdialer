import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass, MessagesSquare, Rocket, TriangleAlert } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: { absolute: 'Careers — Join GrowthDialer' },
  description:
    'Small remote-first team building an AI sales dialer. Open roles for engineers and GTM operators who care about product truth and outbound sales craft.',
  alternates: { canonical: `${MARKETING_SITE}/careers` },
};

const ROLES = [
  {
    title: 'Full-stack engineer',
    location: 'Remote · Full-time',
    body: 'Next.js, Postgres, real-time telephony, and dialer UX. You ship end-to-end — schema to pixels — and your code lands in front of real sales reps within days of writing it.',
    expectations: [
      'Own features from design to production, including the bugs',
      'Join customer dial sessions at least monthly — the floor is the spec',
      'Write like someone else has to debug it at 2am',
    ],
  },
  {
    title: 'Founding account executive',
    location: 'Remote · Full-time',
    body: 'Sell what we actually built. You’ll run honest demos of a product that’s still being finished, and your feedback will set what ships next.',
    expectations: [
      'Comfortable saying “that’s not built yet” on a live demo',
      'Work reps through a 7-day trial instead of a slide deck',
      'Feed losses and wins back to product every week',
    ],
  },
];

const LOOKS_LIKE = [
  {
    icon: Rocket,
    title: 'You ship weekly',
    body: 'The changelog is our report card. Every hire owns work that lands in production, not in slide decks.',
  },
  {
    icon: MessagesSquare,
    title: 'You talk to customers',
    body: 'Engineers join dial sessions. GTM sits in on support threads. The floor is the spec.',
  },
  {
    icon: Compass,
    title: 'You say what’s real',
    body: 'We label roadmap items as roadmap and bugs as bugs — internally too. No vanity metrics in all-hands.',
  },
];

const NOT_FOR_YOU = [
  'You need a big team and a playbook to feel productive — here you’ll write both.',
  'You’d rather polish a demo than sit in on a real dial session.',
  '“Good enough” is your default. Our users are on live calls with real money on the line.',
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'GrowthDialer Careers',
            url: `${MARKETING_SITE}/careers`,
          }}
        />
        <PageHero
          eyebrow="Careers"
          title={
            <>
              Small team.
              <br />
              Hard problems.
            </>
          }
          lede="We’re pre-scale — a handful of people, remote-first, building a dialer for teams that live on the phone. Every hire shapes the product directly. That’s the pitch: fewer people, closer to the work, higher bar."
        />

        {/* Open roles */}
        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <SectionHead eyebrow="Open roles" title="Two seats, both close to the product." align="left" />
            <div className="space-y-4">
              {ROLES.map((role, i) => (
                <Reveal key={role.title} delay={i * 70}>
                  <article className="pm-card pm-card-hover p-7 sm:p-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="pm-h-card">{role.title}</h3>
                      <span className="pm-chip">{role.location}</span>
                    </div>
                    <p className="pm-body mt-3 !text-[14.5px]">{role.body}</p>
                    <div className="mt-5 rounded-xl bg-zinc-50/80 p-5">
                      <p className="pm-small font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        What we expect in the first 90 days
                      </p>
                      <ul className="mt-3 space-y-2">
                        {role.expectations.map((e) => (
                          <li key={e} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-zinc-700">
                            <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href="/contact-sales"
                      className="mt-6 inline-flex items-center gap-1 text-[13.5px] font-semibold text-violet-700 hover:underline"
                    >
                      Apply via contact <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* What it's like */}
        <div className="pm-section pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <SectionHead
              eyebrow="Working here"
              title="What a week here actually looks like."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {LOOKS_LIKE.map((w, i) => (
                <Reveal key={w.title} delay={i * 80}>
                  <article className="pm-card h-full p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700">
                      <w.icon className="h-5 w-5" />
                    </span>
                    <h3 className="pm-h-card mt-5">{w.title}</h3>
                    <p className="pm-body mt-3 !text-[14.5px]">{w.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Honest expectations: not for you */}
        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <Reveal>
              <div className="flex items-start gap-4 rounded-2xl border border-zinc-950/[0.10] bg-white p-7 sm:p-8">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                  <TriangleAlert className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="pm-h-card">Who this isn’t for.</h3>
                  <p className="pm-body mt-2 !text-[14.5px]">
                    We’d rather you self-select out now than figure it out in month two.
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {NOT_FOR_YOU.map((n) => (
                      <li key={n} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-zinc-600">
                        <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <p className="pm-body mx-auto mt-10 max-w-xl text-center">
                Don’t see your role? Email{' '}
                <a
                  href="mailto:hello@growthdialer.com"
                  className="font-semibold text-violet-700 hover:underline"
                >
                  hello@growthdialer.com
                </a>{' '}
                with what you’d want to build — two paragraphs, no cover letter theater.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Page-specific closing CTA */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[380px]" />
          <div className="pm-container-narrow relative py-20 text-center sm:py-24">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">Apply</p>
              <h2 className="pm-h-section-dark mx-auto max-w-2xl">
                If that sounded like you, say hello.
              </h2>
              <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
                Tell us the role, link your work, and say what you’d build first. A real person reads every application — and replies within one business day.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/contact-sales" className="pm-btn pm-btn-white">
                  Apply via contact <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:hello@growthdialer.com" className="pm-btn pm-btn-ghostlight">
                  Email hello@growthdialer.com
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
