import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP, MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Product Demo — See GrowthDialer in action',
  description:
    'Walk through the AI Dialer, power dial sessions, call recordings, HubSpot logging, and team analytics. Start free — no credit card.',
  alternates: { canonical: `${MARKETING_SITE}/demo` },
  openGraph: {
    title: 'GrowthDialer Demo',
    description: 'See how outbound teams dial, record, and analyze calls in one workspace.',
    url: `${MARKETING_SITE}/demo`,
  },
};

const DEMO_STEPS = [
  {
    title: 'Load your queue',
    body: 'Import a CSV or add leads manually. Queue, Hot, and Callbacks tabs keep reps focused on the right calls.',
    href: '/features',
  },
  {
    title: 'Dial your way',
    body: 'Manual one-off calls, power dial with auto-advance, or parallel lines with voicemail drop.',
    href: '/features/ai',
  },
  {
    title: 'Log every outcome',
    body: 'Eight dispositions, notes, and HubSpot timeline sync — no double entry after hang-up.',
    href: '/integrations',
  },
  {
    title: 'Review and coach',
    body: 'Recordings, AI summaries, call logs, and the live sales floor for managers who review async.',
    href: '/features/salesfloor',
  },
];

export default function DemoPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer Product Demo',
          description: 'Interactive overview of GrowthDialer dialer, AI, and integrations.',
          url: `${MARKETING_SITE}/demo`,
        }}
      />
      <MarketingPageHero
        eyebrow="Demo"
        title={
          <>
            See the dialer
            <br />
            <span className="font-semibold">your reps will actually use.</span>
          </>
        }
        description="No sandbox smoke-and-mirrors — create a free workspace and run real calls with your leads. This page maps the flow before you sign up."
      >
        <a href={APP_SIGNUP} className="mk-btn mk-btn-primary">
          <Play className="h-4 w-4" />
          Start free demo
        </a>
        <Link href="/contact-sales" className="mk-btn mk-btn-secondary">
          Talk to sales
        </Link>
      </MarketingPageHero>

      <section className="mx-auto max-w-5xl px-5 pb-20 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_STEPS.map((step, i) => (
            <Reveal key={step.title} delay={(i % 2) * 70}>
              <Link
                href={step.href}
                className="mk-card mk-card-hover group block h-full p-6"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#6D28D9]">
                  Step {i + 1}
                </span>
                <h2 className="mt-2 font-display text-lg font-semibold text-zinc-950">
                  {step.title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{step.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-zinc-950">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mk-card mt-10 p-8 text-center">
            <p className="text-[15px] leading-relaxed text-zinc-600">
              Starter is free — one seat, full dialer, recordings, and analytics. Pro ($49/mo) adds AI
              briefs and coaching. Most teams are calling within ten minutes of sign-up.
            </p>
            <a href={APP_SIGNUP} className="mk-btn mk-btn-primary mt-6">
              Open live demo workspace <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
