import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
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
    metric: '3 workspaces · 12 seats',
    story:
      'Agencies run isolated workspaces per client — separate numbers, leads, and Call Logs — while managers switch accounts from one login.',
    href: '/solutions/agencies',
  },
  {
    team: 'In-house SDR pods',
    metric: 'Power dial + HubSpot',
    story:
      'Reps run morning power sessions with auto-advance and disposition sync. Managers review connect rate in Analytics instead of shadowing every dial.',
    href: '/solutions/sdr-teams',
  },
  {
    team: 'Revenue operations',
    metric: 'Clean call objects',
    story:
      'RevOps standardized eight dispositions across the org. Call duration and recording URLs land on HubSpot timelines without rep data entry.',
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
            <span className="font-medium">not logo walls.</span>
          </>
        }
        description="We're onboarding our first production teams now. These are the use cases we built for — detailed stories publish as customers opt in."
      >
        <a
          href={APP_SIGNUP}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7C3AED]"
        >
          Start your pilot <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/contact-sales"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"
        >
          Share your story
        </Link>
      </MarketingPageHero>

      <section className="mx-auto max-w-5xl px-5 pb-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {USE_CASES.map((c) => (
            <Link
              key={c.team}
              href={c.href}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.12]"
            >
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#A78BFA]">
                {c.metric}
              </p>
              <h2 className="mt-2 font-display text-lg font-medium text-[#F5F5F7] group-hover:text-[#A78BFA]">
                {c.team}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-500">{c.story}</p>
            </Link>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xl text-center text-[14px] text-zinc-500">
          Want to be featured when we publish full case studies?{' '}
          <Link href="/contact-sales" className="text-[#A78BFA] hover:underline">
            Contact us
          </Link>{' '}
          with your team size and stack.
        </p>
      </section>
    </MarketingShell>
  );
}
