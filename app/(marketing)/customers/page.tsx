import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP, MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Case Studies — How teams use GrowthDialer',
  description:
    'Outbound sales teams use GrowthDialer for power dialing, AI call analysis, HubSpot logging, and manager coaching. Early adopter stories as they ship.',
  alternates: { canonical: `${MARKETING_SITE}/customers` },
};

const USE_CASES = [
  {
    team: 'Boutique SDR agencies',
    tag: 'Multi-workspace',
    story:
      'Agencies run isolated workspaces per client — separate numbers, leads, and call logs — while managers switch accounts from one login.',
    href: '/solutions/agencies',
  },
  {
    team: 'In-house SDR pods',
    tag: 'Power dial + HubSpot',
    story:
      'Reps run morning power sessions with auto-advance and disposition sync. Managers review connect rate in analytics instead of shadowing every dial.',
    href: '/solutions/sdr-teams',
  },
  {
    team: 'Revenue operations',
    tag: 'Clean call data',
    story:
      'RevOps teams standardize eight dispositions across the org. Call duration and recordings land on HubSpot timelines without rep data entry.',
    href: '/solutions/revenue-ops',
  },
];

export default function CustomersPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'GrowthDialer Customer Stories',
          description: 'How outbound teams use GrowthDialer.',
          url: `${MARKETING_SITE}/customers`,
        }}
      />
      <MarketingPageHero
        eyebrow="Case studies"
        title={
          <>
            Real workflows,
            <br />
            <span className="font-semibold">not logo walls.</span>
          </>
        }
        description="We're onboarding our first production teams now. These are the use cases we built for — detailed stories publish as customers opt in."
      >
        <a href={APP_SIGNUP} className="mk-btn mk-btn-primary">
          Start your pilot <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/contact-sales" className="mk-btn mk-btn-secondary">
          Share your story
        </Link>
      </MarketingPageHero>

      <section className="mx-auto max-w-5xl px-5 pb-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {USE_CASES.map((c, i) => (
            <Reveal key={c.team} delay={(i % 3) * 70}>
              <Link
                href={c.href}
                className="mk-card mk-card-hover group block h-full p-6"
              >
                <span className="mk-chip !text-[#6D28D9]">{c.tag}</span>
                <h2 className="mt-3 font-display text-lg font-semibold text-zinc-950">
                  {c.team}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{c.story}</p>
                <span className="mt-4 inline-block text-[13px] font-medium text-[#6D28D9]">
                  Explore the solution →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xl text-center text-[14px] text-zinc-500">
          Want to be featured when we publish full case studies?{' '}
          <Link href="/contact-sales" className="font-medium text-[#6D28D9] hover:underline">
            Contact us
          </Link>{' '}
          with your team size and stack.
        </p>
      </section>
    </MarketingShell>
  );
}
