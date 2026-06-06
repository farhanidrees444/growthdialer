import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Careers — Join GrowthDialer',
  description:
    "Small team building an AI sales dialer. We are hiring engineers and GTM operators who care about product truth and outbound sales craft.",
  alternates: { canonical: `${MARKETING_SITE}/careers` },
};

const ROLES = [
  {
    title: 'Full-stack engineer',
    location: 'Remote · Full-time',
    body: 'Next.js, Supabase, Telnyx, real-time dialer UX. You ship end-to-end — schema to pixels.',
  },
  {
    title: 'Founding account executive',
    location: 'Remote · Full-time',
    body: 'Sell what we actually built. Early customers, honest demos, tight feedback loop with product.',
  },
];

export default function CareersPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer Careers',
          url: `${MARKETING_SITE}/careers`,
        }}
      />
      <MarketingPageHero
        eyebrow="Careers"
        title={
          <>
            Small team.
            <br />
            <span className="font-medium">Hard problems.</span>
          </>
        }
        description="We're pre-scale — every hire shapes the product. If you like shipping fast and talking to customers weekly, say hello."
      />

      <section className="mx-auto max-w-3xl px-5 pb-20 lg:px-8">
        <div className="space-y-4">
          {ROLES.map((role) => (
            <article
              key={role.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-medium text-[#F5F5F7]">{role.title}</h2>
                <span className="text-[13px] text-zinc-500">{role.location}</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">{role.body}</p>
              <Link
                href="/contact-sales"
                className="mt-4 inline-block text-[13px] font-medium text-[#A78BFA] hover:underline"
              >
                Apply via contact →
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-[14px] text-zinc-500">
          Don't see your role? Email{' '}
          <a href="mailto:hello@growthdialer.com" className="text-[#A78BFA] hover:underline">
            hello@growthdialer.com
          </a>{' '}
          with what you'd want to build.
        </p>
      </section>
    </MarketingShell>
  );
}
