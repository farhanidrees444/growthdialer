import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookMarked, Gauge, Scale } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP, MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Guides — Outbound sales playbooks',
  description:
    'Practical guides for power dialing, parallel dial strategy, CRM hygiene, and AI call coaching with GrowthDialer.',
  alternates: { canonical: `${MARKETING_SITE}/guides` },
};

const GUIDES = [
  {
    icon: Gauge,
    title: 'How parallel dialing works',
    href: '/blog/how-parallel-dialing-works',
    description:
      'Line counts and AMD, explained — and when parallel dial beats single-line power dial for B2B teams.',
    readTime: '16 min',
  },
  {
    icon: Scale,
    title: 'Best AI sales dialers in 2026',
    href: '/blog/best-ai-sales-dialer-2026',
    description: 'Honest comparison of dialer platforms — features, pricing, and fit by team size.',
    readTime: '18 min',
  },
  {
    icon: BookMarked,
    title: 'HubSpot + dialer setup',
    href: '/integrations',
    description: 'Connect HubSpot, log calls automatically, and keep activity data clean.',
    readTime: '8 min',
  },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Guides"
          title={
            <>
              Playbooks for
              <br />
              outbound that scales.
            </>
          }
          lede="Playbooks from the GrowthDialer team: dialing mechanics, CRM hygiene, and AI call workflows — all written against what the product actually does today."
        />

        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Start here"
              title="Read the floor before you run it."
              lede="Three deep reads. No filler — every guide maps back to a live feature or a real integration."
              align="left"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDES.map((g, i) => (
                <Reveal key={g.href} delay={i * 80}>
                  <Link
                    href={g.href}
                    className="pm-card pm-card-hover group flex h-full flex-col p-7"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 text-violet-700">
                        <g.icon className="h-5 w-5" />
                      </span>
                      <span className="pm-caption">{g.readTime} read</span>
                    </div>
                    <p className="pm-caption mt-5 !font-semibold !uppercase !tracking-[0.14em] !text-violet-700">
                      Guide
                    </p>
                    <h2 className="pm-h-card mt-2">{g.title}</h2>
                    <p className="pm-body mt-3 flex-1 !text-[14.5px]">{g.description}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-violet-700">
                      Read the guide
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Page-specific closing CTA */}
        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <Reveal>
              <div className="pm-card p-8 text-center sm:p-10">
                <p className="pm-eyebrow pm-eyebrow-centered">Go live</p>
                <h2 className="pm-h-section mt-3">Put the playbooks to work.</h2>
                <p className="pm-body mx-auto mt-4 max-w-md">
                  Start a free trial and run the parallel-dial playbook against your own list — 7
                  days, no credit card.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a href={APP_SIGNUP} className="pm-btn pm-btn-primary w-full sm:w-auto">
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link href="/blog" className="pm-btn pm-btn-secondary w-full sm:w-auto">
                    Browse the blog
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
