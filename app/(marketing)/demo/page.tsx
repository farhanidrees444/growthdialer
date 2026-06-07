import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
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
    body: 'Manual one-off calls, power dial with auto-advance, or parallel lines with AMD and voicemail drop on losers.',
    href: '/features/ai',
  },
  {
    title: 'Log every outcome',
    body: 'Eight dispositions, notes, and HubSpot timeline sync — no double entry after hang-up.',
    href: '/integrations',
  },
  {
    title: 'Review and coach',
    body: 'Recordings, AI summaries, Call Logs, and the live salesfloor for managers who review async.',
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
            <span className="font-medium">your reps will actually use.</span>
          </>
        }
        description="No sandbox smoke-and-mirrors — create a free workspace and run real calls with your leads. This page maps the flow before you sign up."
      >
        <a
          href={APP_SIGNUP}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7C3AED]"
        >
          <Play className="h-4 w-4" />
          Start free demo
        </a>
        <Link
          href="/contact-sales"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"
        >
          Talk to sales
        </Link>
      </MarketingPageHero>

      <section className="mx-auto max-w-5xl px-5 pb-20 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_STEPS.map((step, i) => (
            <Link
              key={step.title}
              href={step.href}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#A78BFA]">
                Step {i + 1}
              </span>
              <h2 className="mt-2 font-display text-lg font-medium text-[#F5F5F7] group-hover:text-[#A78BFA]">
                {step.title}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{step.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-zinc-400 group-hover:text-[#F5F5F7]">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center backdrop-blur-xl">
          <p className="text-[15px] leading-relaxed text-zinc-400">
            Starter is free — one seat, full dialer, recordings, and analytics. Pro ($49/mo) adds AI
            briefs and coaching. Most teams are calling within ten minutes of sign-up.
          </p>
          <a
            href={APP_SIGNUP}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7C3AED]"
          >
            Open live demo workspace <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
