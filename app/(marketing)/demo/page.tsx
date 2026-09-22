import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FinalCta,
  RiskBullets,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { RealShot } from '../features/_components/real-shot';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Product Demo — See GrowthDialer in action | GrowthDialer',
  description:
    'Walk through the real GrowthDialer UI: the dialer, queue, AI summaries, and team metrics. Every screenshot is the actual product. Start free — 7-day trial, no credit card.',
  alternates: { canonical: `${MARKETING_SITE}/demo` },
  openGraph: {
    title: 'GrowthDialer Demo',
    description: 'The real product UI: dial, record, analyze, and review — in four steps.',
    url: `${MARKETING_SITE}/demo`,
  },
};

const DEMO_STEPS = [
  {
    title: 'Load your queue',
    body: 'Import a CSV or add leads manually. Queue, Hot, and Callbacks tabs keep reps focused on the right calls — and the dialer prompts you to claim a caller ID before outbound.',
    href: '/features',
    shot: 'dialerMain' as const,
    alt: 'The real GrowthDialer AI Dialer showing Queue, Hot, and Callbacks tabs with an empty queue and Import CSV prompt',
    caption:
      'A fresh account\u2019s queue — Queue, Hot, and Callbacks tabs with Import CSV and Claim caller ID prompts. Your leads fill this view.',
  },
  {
    title: 'Dial your way',
    body: 'Manual, Power, and Parallel modes sit in the tab bar — switch without losing the queue. One click and you\u2019re talking; 8 one-click dispositions close out every call.',
    href: '/features',
    shot: 'dialerBanner' as const,
    alt: 'The real GrowthDialer dialer header with Manual, Power, and Parallel mode tabs and the AI scoring toggle',
    caption: 'The same dialer\u2019s header — Manual, Power, and Parallel mode tabs with the AI scoring toggle.',
  },
  {
    title: 'Hang up — notes are done',
    body: 'The AI SUMMARIES card runs automatically after calls: bullet summary, sentiment, objections, buying signals, next steps, and a suggested disposition. Playback, transcripts, and AI analysis appear for calls over 30 seconds.',
    href: '/features/ai',
    shot: 'dashboardBanner' as const,
    alt: 'The real GrowthDialer dashboard showing the AI SUMMARIES status card that runs automatically after calls',
    caption: 'The AI SUMMARIES card on the dashboard — analysis runs automatically after recorded calls.',
  },
  {
    title: 'Review and coach',
    body: 'The dashboard fills with your numbers from the first call: calls today, connect rate, talk time, meetings booked. Managers open the salesfloor to listen live and leave feedback tied to the transcript.',
    href: '/features/salesfloor',
    shot: 'dashboardMain' as const,
    alt: 'The real GrowthDialer dashboard with metric cards for calls today, connect rate, talk time, and meetings booked',
    caption: 'The dashboard\u2019s metric cards — calls today, connect rate, talk time, meetings booked. Real numbers from your first call on.',
  },
];

const DEMO_FAQS = [
  {
    q: 'Is this a real product or a staged demo?',
    a: 'Real. Every screenshot on this page is the actual GrowthDialer UI — fresh account, empty queue and all. Start a free trial and you\u2019re in the same workspace with your own leads.',
  },
  {
    q: 'How fast can we be calling?',
    a: 'Most teams run their first session within ten minutes of sign-up: claim a caller ID, import a CSV, pick a number, dial.',
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
          description: 'A four-step tour of the real GrowthDialer product UI.',
          url: `${MARKETING_SITE}/demo`,
        }}
      />
      <main>
        {/* Dark hero — step index instead of the old template */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-0" />
          <div className="pm-container relative pb-16 pt-36 sm:pb-20 sm:pt-44">
            <Reveal>
              <p className="pm-eyebrow !text-white/60">Demo</p>
              <h1 className="pm-h-section-dark mt-4 max-w-3xl">
                Ten minutes. Four steps. The real product.
              </h1>
              <p className="pm-lead-dark mt-5 max-w-2xl">
                Every screenshot on this page is the actual GrowthDialer UI — fresh account, empty
                queue and all. Walk the flow here, then start a free trial and walk it with your
                own leads.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                  <Play className="h-4 w-4" /> Start free demo
                </a>
                <Link href="/contact-sales" className="pm-btn pm-btn-ghostlight">
                  Talk to sales
                </Link>
              </div>
              <RiskBullets dark className="mt-8" />
            </Reveal>
            <Reveal delay={140}>
              <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {DEMO_STEPS.map((step, i) => (
                  <li key={step.title} className="pm-card-dark flex items-baseline gap-4 p-5">
                    <span
                      aria-hidden
                      className="pm-step-num !text-[2rem]"
                      style={{ WebkitTextStroke: '1px rgba(255,255,255,0.35)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[14.5px] font-semibold text-white">{step.title}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* The tour — real screenshots, alternating rhythm */}
        <div className="pm-section">
          <div className="pm-container">
            <div className="space-y-20 sm:space-y-28">
              {DEMO_STEPS.map((step, i) => (
                <div key={step.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <Reveal className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <p aria-hidden className="pm-step-num">0{i + 1}</p>
                    <h2 className="pm-h-group mt-4">{step.title}</h2>
                    <p className="pm-body mt-4 max-w-lg">{step.body}</p>
                    <Link
                      href={step.href}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-950"
                    >
                      Learn more <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Reveal>
                  <Reveal delay={120} className={i % 2 === 1 ? 'lg:order-1' : ''}>
                    <RealShot shot={step.shot} alt={step.alt} caption={step.caption} />
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
