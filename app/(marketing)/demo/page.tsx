import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FinalCta,
  PageHero,
  RiskBullets,
  SectionHead,
} from '@/components/marketing/v2/Sections';
import {
  AiBrief,
  AnalyticsSnap,
  BrowserFrame,
  LiveBadge,
  ParallelDial,
  PowerQueue,
} from '@/components/marketing/v2/Mockups';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Product Demo — See GrowthDialer in action',
  description:
    'Walk through the AI Dialer, power dial sessions, call recordings, AI summaries, and team analytics. Start free — 7-day trial, no credit card.',
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
    visual: (
      <BrowserFrame url="app.growthdialer.com/leads" badge={<LiveBadge label="248 leads queued" />}>
        <PowerQueue />
      </BrowserFrame>
    ),
  },
  {
    title: 'Dial your way',
    body: 'Power dial with auto-advance, or parallel lines with voicemail drop. One click and you’re talking.',
    href: '/features',
    visual: (
      <BrowserFrame url="app.growthdialer.com/dialer/parallel" badge={<LiveBadge label="5 lines · live" />}>
        <ParallelDial />
      </BrowserFrame>
    ),
  },
  {
    title: 'Hang up — notes are done',
    body: 'Eight dispositions, and the AI writes the summary: key points, objections, next steps. No typing after the call.',
    href: '/features/ai',
    visual: (
      <BrowserFrame url="app.growthdialer.com/calls/rec_8f3k2" badge={<LiveBadge label="Brief ready · 8s after hang-up" />}>
        <AiBrief />
      </BrowserFrame>
    ),
  },
  {
    title: 'Review and coach',
    body: 'Recordings, AI summaries, call logs, and the live sales floor for managers who review async.',
    href: '/features/salesfloor',
    visual: (
      <BrowserFrame url="app.growthdialer.com/analytics" caption={null}>
        <AnalyticsSnap />
      </BrowserFrame>
    ),
  },
];

const DEMO_FAQS = [
  {
    q: 'Is this a real product or a staged demo?',
    a: 'Real. Start a free trial and you’re in a live workspace with your own leads — the same dialer shown here.',
  },
  {
    q: 'How fast can we be calling?',
    a: 'Most teams run their first power session within ten minutes of sign-up: import a CSV, pick a number, dial.',
  },
  {
    q: 'Do we need our IT team?',
    a: 'No. Calls run in the browser over WebRTC. No desk phones, no installs, no implementation project.',
  },
] as const;

export default function DemoPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer Product Demo',
          description: 'Interactive overview of GrowthDialer dialer, AI, and integrations.',
          url: `${MARKETING_SITE}/demo`,
        }}
      />
      <main>
        <PageHero
          eyebrow="Demo"
          title={
            <>
              See the dialer
              <br />
              your reps will actually use.
            </>
          }
          lede="No sandbox smoke-and-mirrors — start a free trial and run real calls with your leads. This page maps the flow first."
        />
        <div className="pm-container-narrow -mt-4 pb-8 text-center">
          <Reveal delay={160}>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                <Play className="h-4 w-4" /> Start free demo
              </a>
              <Link href="/contact-sales" className="pm-btn pm-btn-secondary">
                Talk to sales
              </Link>
            </div>
            <RiskBullets className="mt-6 justify-center" />
          </Reveal>
        </div>

        <div className="pm-section">
          <div className="pm-container">
            <SectionHead eyebrow="The tour" title="Four steps. Ten minutes." />
            <div className="space-y-20 sm:space-y-28">
              {DEMO_STEPS.map((step, i) => (
                <div key={step.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <Reveal className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <p className="pm-eyebrow !mb-3">Step {i + 1}</p>
                    <h3 className="pm-h-group">{step.title}</h3>
                    <p className="pm-body mt-4 max-w-lg">{step.body}</p>
                    <Link
                      href={step.href}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-950"
                    >
                      Learn more <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Reveal>
                  <Reveal delay={120} variant="scale" className={i % 2 === 1 ? 'lg:order-1' : ''}>
                    {step.visual}
                  </Reveal>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pm-divider">
          <Faq items={DEMO_FAQS} eyebrow="FAQ" title="Before you click start." />
        </div>
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
