import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Press Kit | GrowthDialer',
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

export default function PressKitPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="Press Kit"
        title={
          <>
            Facts and assets
            <br />
            <span className="font-semibold">for media coverage.</span>
          </>
        }
        description="GrowthDialer is an AI-powered outbound dialer for B2B sales teams. Use the boilerplate below for articles, podcasts, and partner listings."
      />

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <Reveal>
            <article className="mk-card p-8">
              <h2 className="font-display text-xl font-semibold text-zinc-950">Boilerplate</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-zinc-600">
                GrowthDialer is an AI sales dialer that records, transcribes, and analyzes every outbound
                call. Teams use power dialing, HubSpot logging, and conversation intelligence to turn phone
                conversations into searchable revenue data — without manual note-taking.
              </p>
            </article>
          </Reveal>

          <Reveal delay={60}>
            <article className="mk-card p-8">
              <h2 className="font-display text-xl font-semibold text-zinc-950">Quick facts</h2>
              <dl className="mt-4 space-y-3">
                {FACTS.map((f) => (
                  <div key={f.label} className="flex gap-4 text-[14px]">
                    <dt className="w-24 shrink-0 font-medium text-zinc-500">{f.label}</dt>
                    <dd className="text-zinc-800">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </Reveal>

          <Reveal delay={80}>
            <article className="mk-card p-8">
              <h2 className="font-display text-xl font-semibold text-zinc-950">Brand assets</h2>
              <div className="mt-6 flex flex-wrap items-center gap-8">
                <BrandLogo showText size="xl" />
                <BrandLogo size="lg" variant="mark" />
              </div>
              <ul className="mt-6 space-y-2 text-[14px] text-zinc-600">
                {[
                  ['/brand/wordmark.svg', 'Wordmark (SVG)'],
                  ['/brand/mark.svg', 'Gradient mark (SVG)'],
                  ['/brand/wordmark.png', 'Wordmark (PNG)'],
                  ['/brand/mark.png', 'Gradient mark (PNG)'],
                  ['/brand/icon-dark.png', 'App icon — dark (PNG)'],
                ].map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="font-medium text-[#6D28D9] hover:underline">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>

          <Reveal delay={100}>
            <article className="mk-card p-8">
              <h2 className="font-display text-xl font-semibold text-zinc-950">Media contact</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-zinc-600">
                For press inquiries, logo requests, or executive interviews, reach us through{' '}
                <Link href="/contact-sales" className="font-medium text-[#6D28D9] hover:underline">
                  Contact sales
                </Link>{' '}
                and include &ldquo;Press&rdquo; in the subject line.
              </p>
            </article>
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
