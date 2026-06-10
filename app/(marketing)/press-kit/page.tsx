import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
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
            <span className="font-medium">for media coverage.</span>
          </>
        }
        description="GrowthDialer is an AI-powered outbound dialer for B2B sales teams. Use the boilerplate below for articles, podcasts, and partner listings."
      />

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
            <h2 className="font-display text-xl font-medium text-[#F5F5F7]">Boilerplate</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
              GrowthDialer is an AI sales dialer that records, transcribes, and analyzes every outbound
              call. Teams use power dialing, HubSpot logging, and conversation intelligence to turn phone
              conversations into searchable revenue data — without manual note-taking.
            </p>
          </article>

          <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
            <h2 className="font-display text-xl font-medium text-[#F5F5F7]">Quick facts</h2>
            <dl className="mt-4 space-y-3">
              {FACTS.map((f) => (
                <div key={f.label} className="flex gap-4 text-[14px]">
                  <dt className="w-24 shrink-0 font-medium text-zinc-500">{f.label}</dt>
                  <dd className="text-zinc-300">{f.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
            <h2 className="font-display text-xl font-medium text-[#F5F5F7]">Brand assets</h2>
            <div className="mt-6 flex flex-wrap items-center gap-8">
              <BrandLogo showText size="xl" />
              <BrandLogo size="lg" variant="mark" />
            </div>
            <ul className="mt-6 space-y-2 text-[14px] text-zinc-400">
              <li>
                <a href="/brand/wordmark.svg" className="text-[#A78BFA] hover:underline">
                  Wordmark (SVG)
                </a>
              </li>
              <li>
                <a href="/brand/mark.svg" className="text-[#A78BFA] hover:underline">
                  Gradient mark (SVG)
                </a>
              </li>
              <li>
                <a href="/brand/wordmark.png" className="text-[#A78BFA] hover:underline">
                  Wordmark (PNG)
                </a>
              </li>
              <li>
                <a href="/brand/mark.png" className="text-[#A78BFA] hover:underline">
                  Gradient mark (PNG)
                </a>
              </li>
              <li>
                <a href="/brand/icon-dark.png" className="text-[#A78BFA] hover:underline">
                  App icon — dark (PNG)
                </a>
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
            <h2 className="font-display text-xl font-medium text-[#F5F5F7]">Media contact</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
              For press inquiries, logo requests, or executive interviews, reach us through{' '}
              <Link href="/contact-sales" className="text-[#A78BFA] hover:underline">
                Contact sales
              </Link>{' '}
              and include &ldquo;Press&rdquo; in the subject line.
            </p>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
