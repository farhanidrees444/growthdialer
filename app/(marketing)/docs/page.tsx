import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { DOC_SECTIONS } from '@/lib/marketing/docs-data';
import { APP_SIGNUP, MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Documentation — Setup & dialer guides',
  description:
    'GrowthDialer docs: workspace setup, AI Dialer, power dial, lead import, HubSpot integration, recordings, and team roles.',
  alternates: { canonical: `${MARKETING_SITE}/docs` },
};

export default function DocsPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          name: 'GrowthDialer Documentation',
          description: 'Product documentation for GrowthDialer AI sales dialer.',
          url: `${MARKETING_SITE}/docs`,
        }}
      />
      <MarketingPageHero
        eyebrow="Documentation"
        title={
          <>
            Everything you need
            <br />
            <span className="font-semibold">to run your floor.</span>
          </>
        }
        description="Practical guides tied to what ships today — not a wiki of promises. Start free and follow along in your workspace."
      >
        <a href={APP_SIGNUP} className="mk-btn mk-btn-primary">
          Create workspace <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/docs/api" className="mk-btn mk-btn-secondary">
          API reference
        </Link>
      </MarketingPageHero>

      <section className="mx-auto max-w-5xl px-5 pb-20 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {DOC_SECTIONS.map((section, i) => (
            <Reveal key={section.id} delay={(i % 2) * 60}>
              <article id={section.id} className="mk-card mk-card-hover h-full scroll-mt-32 p-6">
                <Link href={section.href} className="group block">
                  <h2 className="font-display text-lg font-semibold text-zinc-950">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{section.description}</p>
                </Link>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {section.topics.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-zinc-950/[0.08] bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-600"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
