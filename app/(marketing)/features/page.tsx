import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BrainCircuit, Plug2, Users } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FinalCta,
  PricingTeaser,
  SectionHead,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { RealShot } from './_components/real-shot';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Features — Real Dialer, AI Summaries & Team Metrics | GrowthDialer',
  description:
    'The real GrowthDialer UI: power and parallel dialing modes, AI call summaries, and the team dashboard. Every screenshot is the actual product.',
  alternates: { canonical: `${MARKETING_SITE}/features` },
  openGraph: {
    title: 'GrowthDialer Features',
    description: 'Dialing, AI summaries, and team metrics — shown as they actually look in the app.',
    url: `${MARKETING_SITE}/features`,
  },
};

const SUBPAGES = [
  {
    icon: BrainCircuit,
    title: 'AI platform',
    body: 'Post-call analysis, per-lead AI memory, and the voice-agent roadmap — every pillar labeled live or in development.',
    href: '/features/ai',
  },
  {
    icon: Users,
    title: 'Salesfloor',
    body: 'Coaching listen mode, call takeover, leaderboards, and the numbers your managers actually read.',
    href: '/features/salesfloor',
  },
  {
    icon: Plug2,
    title: 'Integrations',
    body: 'HubSpot is live today. Every other connector is in development — join the waitlist for yours.',
    href: '/integrations',
  },
];

const FEATURES_FAQS = [
  {
    q: 'Are the screenshots on this page real?',
    a: 'Yes. Every screenshot is the actual GrowthDialer UI — including the empty queue and the 0-of-4 activation path, which is exactly what a fresh account looks like. We would rather show a real empty state than a staged full one.',
  },
  {
    q: 'Is everything on this page live today?',
    a: 'Almost. Dialing, recordings, transcripts, AI summaries, analytics, coaching listen mode, call takeover, and the HubSpot integration are live. Whisper and barge coaching are on the roadmap; every other CRM connector is waitlist-only.',
  },
  {
    q: 'Do I need a phone system to use GrowthDialer?',
    a: 'No. Calls run in your browser over WebRTC — no desk phones, no installs. Claim a caller ID in the app and start dialing from local numbers.',
  },
  {
    q: 'What about compliance?',
    a: 'DNC flags remove leads from every queue instantly — Do Not Call is one of the 8 built-in dispositions. Every call, recording, and disposition is logged on the lead timeline, and every number you own gets spam-risk and reputation scoring.',
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        {/* Editorial hero — left-aligned, no template hero */}
        <section className="px-5 pb-14 pt-36 sm:pb-16 sm:pt-44 lg:px-8">
          <div className="pm-container">
            <Reveal>
              <p className="pm-eyebrow">Features</p>
              <h1 className="pm-h-display mt-4 max-w-3xl !text-[clamp(2.4rem,5vw,3.9rem)]">
                Every screenshot here is the product.
              </h1>
              <p className="pm-lead mt-6 max-w-2xl">
                No staged mockups, no filler slides. This is the actual GrowthDialer UI — the dialer
                your reps open, the dashboard your managers read, the AI that writes the notes.
                Labeled honestly throughout.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/contact-sales" className="pm-btn pm-btn-secondary">
                  Talk to sales
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Dialing deep-dive — full-bleed dark panel, real dialer screenshot */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-0" />
          <div className="pm-container relative py-16 sm:py-24">
            <Reveal>
              <p className="pm-eyebrow !text-white/60">Dialing</p>
              <h2 className="pm-h-section-dark mt-4 max-w-2xl">Three modes. One queue. Zero dead air.</h2>
              <p className="pm-lead-dark mt-5 max-w-2xl">
                Manual, Power, and Parallel — the mode tabs sit at the top of the real dialer, exactly
                as shown. Queue, Hot, and Callbacks tabs keep the next call one click away, and the
                keyboard bar at the bottom keeps reps&apos; hands off the mouse.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
              <Reveal>
                <ul className="space-y-4">
                  {[
                    'Manual, Power, and Parallel modes — switch without losing the queue',
                    'Import a CSV to fill the queue; the dialer prompts you until you do',
                    'Claim a caller ID before outbound — no number, no dialing',
                    '8 one-click dispositions (Interested, Meeting Booked, Callback, Voicemail, Gatekeeper, Not Interested, Wrong Number, Do Not Call) with hotkeys',
                  ].map((t) => (
                    <li key={t} className="pm-tick !text-zinc-300">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6d28d9]" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/features/ai"
                  className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-white"
                >
                  How the AI writes your notes <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
              <Reveal delay={120}>
                <RealShot
                  shot="dialerMain"
                  priority
                  alt="The real GrowthDialer AI Dialer: Manual, Power, and Parallel mode tabs above an empty lead queue"
                  caption="The AI Dialer with Manual, Power, and Parallel mode tabs. This shot is a fresh account, so the queue is empty — Import CSV and Claim caller ID are the first steps."
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* AI summaries — light, image-led on desktop */}
        <section className="pm-section">
          <div className="pm-container">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal className="lg:order-2">
                <p className="pm-eyebrow">AI summaries</p>
                <h2 className="pm-h-group mt-4">Hang up. The notes are already written.</h2>
                <p className="pm-body mt-5">
                  The dashboard&apos;s AI SUMMARIES card runs automatically after calls. Every analyzed
                  call comes back with a bullet summary, sentiment score, talking points, objections,
                  buying signals, next steps, and a suggested disposition — and a memory is saved on
                  the lead so the next call starts smarter.
                </p>
                <ul className="mt-7 space-y-3.5">
                  {[
                    'Summary, sentiment, objections, buying signals, next steps — per call',
                    'Suggested disposition proposes the right outcome automatically',
                    'Playback, transcripts, and AI analysis appear for calls over 30 seconds',
                  ].map((t) => (
                    <li key={t} className="pm-tick">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6d28d9]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={120} className="lg:order-1">
                <RealShot
                  shot="dashboardBanner"
                  alt="The real GrowthDialer dashboard: AI SUMMARIES, Power Dialer, and Inbound status cards above the activation path"
                  caption="The dashboard's AI SUMMARIES status card — analysis runs automatically after calls."
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Dashboard & metrics — light, stacked */}
        <section className="pm-section pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <Reveal className="max-w-2xl">
              <p className="pm-eyebrow">Dashboard</p>
              <h2 className="pm-h-group mt-4">Your day, at a glance.</h2>
              <p className="pm-body mt-5">
                New workspaces open to an activation path — claim a caller ID, import your leads, make
                your first call, verify the outcome — then the dashboard fills with real numbers: calls
                today, connect rate, talk time, meetings booked.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-10">
              <RealShot
                shot="dashboardMain"
                alt="The real GrowthDialer dashboard: activation path checklist and metric cards for calls today, connect rate, talk time, and meetings booked"
                caption="The dashboard on a new workspace: the 0-of-4 activation path, status cards for AI summaries, the power dialer, and inbound — and the metric cards your day fills in."
              />
            </Reveal>
          </div>
        </section>

        {/* Subpages */}
        <div className="pm-section">
          <div className="pm-container">
            <SectionHead eyebrow="Go deeper" title="Where to next." />
            <div className="grid gap-4 md:grid-cols-3">
              {SUBPAGES.map((s, i) => (
                <Reveal key={s.title} delay={i * 80}>
                  <Link href={s.href} className="pm-card pm-card-hover group flex h-full flex-col p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6d28d9]/10 text-[#6d28d9]">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <h3 className="pm-h-card mt-5">{s.title}</h3>
                    <p className="pm-body mt-3 flex-1 !text-[14.5px]">{s.body}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-950">
                      Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <PricingTeaser />
        <div className="pm-divider">
          <Faq items={FEATURES_FAQS} eyebrow="FAQ" title="Straight answers." />
        </div>
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
