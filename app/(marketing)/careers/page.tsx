import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass, MessagesSquare, Rocket } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { FinalCta, PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Careers — Join GrowthDialer | GrowthDialer',
  description:
    'Small remote-first team building an AI sales dialer. Open roles for engineers and GTM operators who care about product truth and outbound sales craft.',
  alternates: { canonical: `${MARKETING_SITE}/careers` },
};

const ROLES = [
  {
    title: 'Full-stack engineer',
    location: 'Remote · Full-time',
    body: 'Next.js, Postgres, real-time telephony, and dialer UX. You ship end-to-end — schema to pixels.',
  },
  {
    title: 'Founding account executive',
    location: 'Remote · Full-time',
    body: 'Sell what we actually built. Early customers, honest demos, tight feedback loop with product.',
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
          lede="We’re pre-scale — every hire shapes the product. If you like shipping fast and talking to customers weekly, say hello."
        />

        {/* Open roles */}
        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <SectionHead eyebrow="Open roles" title="Two seats, both close to the product." align="left" />
            <div className="space-y-4">
              {ROLES.map((role, i) => (
                <Reveal key={role.title} delay={i * 70}>
                  <article className="pm-card pm-card-hover p-7">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="pm-h-card">{role.title}</h3>
                      <span className="pm-chip">{role.location}</span>
                    </div>
                    <p className="pm-body mt-3 !text-[14.5px]">{role.body}</p>
                    <Link
                      href="/contact-sales"
                      className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-violet-700 hover:underline"
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
                  <article className="pm-card h-full p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700">
                      <w.icon className="h-5 w-5" />
                    </span>
                    <h3 className="pm-h-card mt-5">{w.title}</h3>
                    <p className="pm-body mt-3 !text-[14.5px]">{w.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal delay={120}>
              <p className="pm-body mx-auto mt-10 max-w-xl text-center">
                Don’t see your role? Email{' '}
                <a
                  href="mailto:hello@growthdialer.com"
                  className="font-semibold text-violet-700 hover:underline"
                >
                  hello@growthdialer.com
                </a>{' '}
                with what you’d want to build.
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
