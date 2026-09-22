import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock3, Ear, PhoneCall, TrendingUp } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FinalCta,
  PricingTeaser,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { CoachingVisual, VisualFigure } from '@/components/marketing/visuals';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Salesfloor — Live Coaching & Team Metrics | GrowthDialer',
  description:
    'The GrowthDialer salesfloor: live coaching listen mode, call takeover, team metrics, and number health — illustrated feature by feature.',
  alternates: { canonical: `${MARKETING_SITE}/features/salesfloor` },
  openGraph: {
    title: 'GrowthDialer Salesfloor',
    description: 'Live call coaching, team metrics, and number health — illustrated, honestly labeled.',
    url: `${MARKETING_SITE}/features/salesfloor`,
  },
};

const DASHBOARD_STATS = [
  { icon: PhoneCall, label: 'Calls today', note: 'Per rep, per team' },
  { icon: TrendingUp, label: 'Connect rate', note: 'Who is getting through' },
  { icon: Clock3, label: 'Talk time', note: 'Conversation depth' },
  { icon: Ear, label: 'Meetings booked', note: 'Outcomes, not dials' },
];

const COACHING_MODES = [
  { mode: 'Listen', status: 'Live today', live: true, body: 'Hear any active call without interrupting it.' },
  { mode: 'Takeover', status: 'Live today', live: true, body: 'Join the call and take the conversation over.' },
  { mode: 'Whisper', status: 'On the roadmap', live: false, body: 'Coach the rep mid-call — the prospect never hears you.' },
  { mode: 'Barge', status: 'On the roadmap', live: false, body: 'Step into the call so everyone hears you.' },
];

const SALESFLOOR_FAQS = [
  {
    q: 'Can managers really listen live?',
    a: 'Yes. Managers open the salesfloor, see who is on a call, and listen in one click. Post-call feedback is tied to the transcript so coaching lands on specifics. Call takeover is live today.',
  },
  {
    q: 'What is coming to coaching?',
    a: 'Whisper and barge audio — coaching a rep mid-call without the prospect hearing (whisper), or stepping in so everyone hears you (barge). Listen mode and takeover are live now.',
  },
  {
    q: 'Does the salesfloor work for remote teams?',
    a: 'Yes. It is all in the browser — no office, no desk phones. Managers coach from anywhere, and reps dial from anywhere.',
  },
  {
    q: 'How does number health work?',
    a: 'Every number the team dials from is scored for spam risk and reputation and graded from healthy to critical. Flagged numbers get rotation guidance before they cost you connects.',
  },
] as const;

export default function SalesfloorPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        {/* Hero — light, left-aligned, with the dashboard's real metric strip */}
        <section className="px-5 pb-14 pt-36 sm:pb-16 sm:pt-44 lg:px-8">
          <div className="pm-container">
            <Reveal>
              <p className="pm-eyebrow">Salesfloor</p>
              <h1 className="pm-h-display mt-4 max-w-3xl !text-[clamp(2.4rem,5vw,3.9rem)]">
                Run the floor from evidence.
              </h1>
              <p className="pm-lead mt-6 max-w-2xl">
                Listen live, take over when it matters, and read the numbers that tell you who needs
                coaching. Everything below is illustrated from the real product — and every coaching
                mode is labeled with exactly where it stands.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/features" className="pm-btn pm-btn-secondary">
                  All features
                </Link>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {DASHBOARD_STATS.map((s) => (
                  <div key={s.label} className="pm-card p-5">
                    <s.icon className="h-5 w-5 text-[#6d28d9]" />
                    <p className="mt-3 text-[15px] font-bold text-zinc-950">{s.label}</p>
                    <p className="mt-1 text-[12.5px] text-zinc-500">{s.note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12.5px] text-zinc-400">
                What the dashboard tracks — live on your workspace from the first call.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Manager dashboard — illustrated metrics */}
        <section className="pm-section pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <p className="pm-eyebrow">Team metrics</p>
                <h2 className="pm-h-group mt-4">The dashboard your managers open first.</h2>
                <p className="pm-body mt-5">
                  Calls today, connect rate, talk time, meetings booked — per rep, per day, live.
                  The Leaderboard and Coaching sections sit in the team nav, and the activation path
                  gets every new workspace dialing: claim a caller ID, import leads, first call.
                </p>
                <ul className="mt-7 space-y-3.5">
                  {[
                    'Metric cards that fill in from your first real call',
                    'Leaderboard and Coaching sections in the team nav',
                    'AI SUMMARIES card: post-call analysis runs automatically',
                  ].map((t) => (
                    <li key={t} className="pm-tick">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6d28d9]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={120}>
                <VisualFigure caption="Illustrated preview of the salesfloor — live rep rows with listen and take-over coaching actions. Whisper and barge are on the roadmap.">
                  <CoachingVisual />
                </VisualFigure>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Live coaching — dark editorial panel, honest mode map */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-0" />
          <div className="pm-container relative py-16 sm:py-24">
            <Reveal className="max-w-2xl">
              <p className="pm-eyebrow !text-white/60">Live coaching</p>
              <h2 className="pm-h-section-dark mt-4">Four modes. Two live, two on the way.</h2>
              <p className="pm-lead-dark mt-5">
                Managers coach the call, not the recording — but only in the modes that actually
                shipped. No asterisks, no fine print: the map below is the current state of the
                product.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {COACHING_MODES.map((m, i) => (
                <Reveal key={m.mode} delay={i * 80}>
                  <div className="pm-card-dark h-full p-6">
                    <span
                      className={
                        m.live
                          ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-300'
                          : 'inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-400'
                      }
                    >
                      <span
                        aria-hidden
                        className={m.live ? 'h-1.5 w-1.5 rounded-full bg-emerald-400' : 'h-1.5 w-1.5 rounded-full bg-zinc-500'}
                      />
                      {m.status}
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-white">{m.mode}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">{m.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Number health — light, text-led with honest tier chips */}
        <section className="pm-section">
          <div className="pm-container-narrow">
            <Reveal className="text-center">
              <p className="pm-eyebrow pm-eyebrow-centered">Number health</p>
              <h2 className="pm-h-group">Protect the floor&apos;s connect rate.</h2>
              <p className="pm-body mx-auto mt-5 max-w-xl">
                Every number the team dials from is scored for spam risk and reputation, graded from
                healthy to critical — and flagged numbers get rotation guidance before they cost you
                connects.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                {['Healthy', 'Good', 'Watch', 'At risk', 'Critical'].map((tier, i) => (
                  <span
                    key={tier}
                    className={
                      i < 2
                        ? 'rounded-full bg-emerald-100 px-4 py-1.5 text-[13px] font-semibold text-emerald-800'
                        : i === 2
                          ? 'rounded-full bg-amber-100 px-4 py-1.5 text-[13px] font-semibold text-amber-800'
                          : 'rounded-full bg-red-100 px-4 py-1.5 text-[13px] font-semibold text-red-800'
                    }
                  >
                    {tier}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-center text-[12.5px] text-zinc-400">
                The real health grades a number can hold — scored continuously, calm by default.
              </p>
            </Reveal>
          </div>
        </section>

        <PricingTeaser />
        <div className="pm-divider">
          <Faq items={SALESFLOOR_FAQS} eyebrow="FAQ" title="Salesfloor, answered." />
        </div>
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
