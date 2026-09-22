import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, LineChart, Users } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { FinalCta, PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP, MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Customers — Who GrowthDialer Is For | GrowthDialer',
  description:
    'Outbound teams use GrowthDialer for power dialing, AI call summaries, HubSpot logging, and manager coaching. No invented testimonials — see who it’s built for and join early access.',
  alternates: { canonical: `${MARKETING_SITE}/customers` },
};

const USE_CASES = [
  {
    icon: Building2,
    team: 'Boutique SDR agencies',
    tag: 'Multi-workspace',
    story:
      'Agencies run isolated workspaces per client — separate numbers, leads, and call logs — while managers switch accounts from one login.',
    href: '/solutions/agencies',
  },
  {
    icon: Users,
    team: 'In-house SDR pods',
    tag: 'Power dial + HubSpot',
    story:
      'Reps run morning power sessions with auto-advance and disposition sync. Managers review connect rate in analytics instead of shadowing every dial.',
    href: '/solutions/sdr-teams',
  },
  {
    icon: LineChart,
    team: 'Revenue operations',
    tag: 'Clean call data',
    story:
      'RevOps teams standardize eight dispositions across the org. Call duration and recordings land on HubSpot timelines without rep data entry.',
    href: '/solutions/revenue-ops',
  },
];

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'GrowthDialer Customer Stories',
            description: 'Who GrowthDialer is built for and how outbound teams use it.',
            url: `${MARKETING_SITE}/customers`,
          }}
        />
        <PageHero
          eyebrow="Customers"
          title={
            <>
              Real workflows,
              <br />
              not logo walls.
            </>
          }
          lede="We’re onboarding our first production teams now. These are the use cases we built for — detailed stories publish only when customers opt in."
          cta={{ label: 'Start your pilot', href: APP_SIGNUP }}
        />

        {/* Use cases */}
        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Who it’s for"
              title="The floors GrowthDialer was built on."
              align="left"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {USE_CASES.map((c, i) => (
                <Reveal key={c.team} delay={i * 80}>
                  <Link
                    href={c.href}
                    className="pm-card pm-card-hover group flex h-full flex-col p-7"
                  >
                    <div className="flex items-center justify-between">
                      <span className="pm-chip">{c.tag}</span>
                      <c.icon className="h-5 w-5 text-zinc-400" />
                    </div>
                    <h3 className="pm-h-card mt-5">{c.team}</h3>
                    <p className="pm-body mt-3 flex-1 !text-[14.5px]">{c.story}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-violet-700">
                      Explore the solution
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Honest note */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[380px]" />
          <div className="pm-container relative py-20 text-center sm:py-24">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">No fake social proof</p>
              <h2 className="pm-h-section-dark mx-auto max-w-2xl">
                You won’t find invented testimonials here.
              </h2>
              <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
                No “2,400 happy teams.” No five-star badges without a source. We publish a customer
                story only when a real team gives us real numbers — until then, judge us on a 7-day
                trial of your own calls.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-white">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/contact-sales" className="pm-btn pm-btn-ghostlight">
                  Become an early story
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
