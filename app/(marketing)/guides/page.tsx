import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Guides — Outbound sales playbooks | GrowthDialer',
  description:
    'Practical guides for power dialing, parallel dial strategy, CRM hygiene, and AI call coaching with GrowthDialer.',
  alternates: { canonical: `${MARKETING_SITE}/guides` },
};

const GUIDES = [
  {
    title: 'How parallel dialing works',
    href: '/blog/how-parallel-dialing-works',
    description: 'Line counts, AMD, and when parallel dial beats single-line power dial for B2B.',
    readTime: '16 min',
  },
  {
    title: 'Best AI sales dialers in 2026',
    href: '/blog/best-ai-sales-dialer-2026',
    description: 'Honest comparison of dialer platforms — features, pricing, and fit by team size.',
    readTime: '18 min',
  },
  {
    title: 'HubSpot + dialer setup',
    href: '/integrations',
    description: 'Connect HubSpot, log calls automatically, and keep activity data clean.',
    readTime: '8 min',
  },
];

export default function GuidesPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="Guides"
        title={
          <>
            Playbooks for
            <br />
            <span className="font-medium">outbound that scales.</span>
          </>
        }
        description="Long-form guides from the GrowthDialer team — dialing mechanics, CRM hygiene, and AI workflows that match what the product does today."
      />

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
                  Guide
                </span>
                <span className="text-[11px] text-zinc-600">{g.readTime}</span>
              </div>
              <h2 className="mt-3 font-display text-lg font-medium text-[#F5F5F7] group-hover:text-[#A78BFA]">
                {g.title}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{g.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
