import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, Mail } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Press Kit — Brand Assets & Company Info',
  description:
    'GrowthDialer brand assets, company description, and media contact for journalists and partners.',
  alternates: { canonical: `${MARKETING_SITE}/press-kit` },
};

const FACTS = [
  { label: 'Product', value: 'AI sales dialer with conversation intelligence' },
  { label: 'Founded', value: '2024' },
  { label: 'HQ', value: 'Remote-first' },
  { label: 'Website', value: 'growthdialer.com' },
  { label: 'App', value: 'app.growthdialer.com' },
];

const ASSETS = [
  ['/brand/wordmark.svg', 'Wordmark (SVG)'],
  ['/brand/mark.svg', 'Gradient mark (SVG)'],
  ['/brand/wordmark.png', 'Wordmark (PNG)'],
  ['/brand/mark.png', 'Gradient mark (PNG)'],
  ['/brand/icon-dark.png', 'App icon — dark (PNG)'],
] as const;

export default function PressKitPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Press Kit"
          title={
            <>
              Facts and assets
              <br />
              for media coverage.
            </>
          }
          lede="GrowthDialer is an AI-powered outbound dialer for B2B sales teams. Use the boilerplate below for articles, podcasts, and partner listings."
        />

        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <SectionHead
              eyebrow="Media resources"
              title="Copy, facts, assets."
              align="left"
            />
            <div className="space-y-4">
              <Reveal>
                <article className="pm-card p-7">
                  <h2 className="pm-h-card !text-[1.25rem]">Boilerplate</h2>
                  <p className="pm-body mt-4 !text-[14.5px]">
                    GrowthDialer is an AI sales dialer that records, transcribes, and analyzes
                    every outbound call. Teams use power dialing, HubSpot logging, and conversation
                    intelligence to turn phone conversations into searchable revenue data — without
                    manual note-taking.
                  </p>
                </article>
              </Reveal>

              <Reveal delay={60}>
                <article className="pm-card p-7">
                  <h2 className="pm-h-card !text-[1.25rem]">Quick facts</h2>
                  <dl className="mt-5 space-y-3">
                    {FACTS.map((f) => (
                      <div
                        key={f.label}
                        className="flex gap-4 border-b border-zinc-950/[0.05] pb-3 text-[14px] last:border-0 last:pb-0"
                      >
                        <dt className="w-24 shrink-0 font-medium text-zinc-500">{f.label}</dt>
                        <dd className="font-medium text-zinc-800">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </Reveal>

              <Reveal delay={80}>
                <article className="pm-card p-7">
                  <h2 className="pm-h-card !text-[1.25rem]">Brand assets</h2>
                  <div className="mt-6 flex flex-wrap items-center gap-10 rounded-xl bg-zinc-50/80 px-6 py-8">
                    <BrandLogo showText size="xl" wordmarkTone="onLight" />
                    <BrandLogo size="lg" variant="mark" />
                  </div>
                  <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                    {ASSETS.map(([href, label]) => (
                      <li key={href}>
                        <a
                          href={href}
                          className="pm-card pm-card-hover flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-zinc-800"
                        >
                          <Download className="h-4 w-4 text-violet-700" />
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>

              <Reveal delay={100}>
                <article className="pm-card p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 text-violet-700">
                      <Mail className="h-5 w-5" />
                    </span>
                    <h2 className="pm-h-card !text-[1.25rem]">Media contact</h2>
                  </div>
                  <p className="pm-body mt-4 !text-[14.5px]">
                    For press inquiries, logo requests, or executive interviews, reach us through{' '}
                    <Link
                      href="/contact-sales"
                      className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:underline"
                    >
                      contact <ArrowRight className="h-3.5 w-3.5" />
                    </Link>{' '}
                    and include &ldquo;Press&rdquo; in the subject line.
                  </p>
                </article>
              </Reveal>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
