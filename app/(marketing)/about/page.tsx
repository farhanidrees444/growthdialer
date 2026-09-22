import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GitBranch, MessageSquareText, PackageCheck, Phone, Bot, FileText, PlugZap } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero, PositioningStrip, SectionHead } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';

export const metadata: Metadata = {
  title: 'About — Building the Dialer That Understands Every Call',
  description:
    'GrowthDialer is an early-stage team building an AI sales dialer that turns every call into searchable revenue intelligence. Our beliefs: the call is the data, software does the busywork, honest by default.',
  alternates: { canonical: 'https://growthdialer.com/about' },
};

const BELIEFS = [
  {
    title: 'The call is the data.',
    body: 'A thirty-minute conversation holds more truth than a CRM record ever will. Reps shouldn’t lose that insight to bad notes or forgotten follow-ups — every call should become a clean, searchable record the moment it ends.',
  },
  {
    title: 'Software should do the busywork.',
    body: 'Dialing, recording, transcribing, summarizing, logging — the tool handles the mechanical half of selling so the rep can focus on the only part that matters: the human on the line.',
  },
  {
    title: 'Honest by default.',
    body: 'We ship what works, say what’s real, and label what’s coming. No vanity metrics, no invented logos, no roadmap dressed up as a feature.',
  },
];

const LIVE_PILLARS = [
  {
    icon: Phone,
    title: 'The dialer itself',
    body: 'Manual, power, and parallel dialing — up to five lines at once — with auto-advance and eight standard dispositions.',
  },
  {
    icon: FileText,
    title: 'Call intelligence',
    body: 'Every call recorded, transcribed, and summarized automatically. The conversation becomes a record nobody has to write.',
  },
  {
    icon: PlugZap,
    title: 'HubSpot, live today',
    body: 'Calls, recordings, and dispositions land on the HubSpot timeline without rep data entry. One integration, working in production.',
  },
];

const PRINCIPLES = [
  {
    icon: PackageCheck,
    title: 'Ship what works',
    body: 'If a feature is in your workspace, it works. If it’s coming, it says so. You’ll never demo something that doesn’t exist.',
  },
  {
    icon: MessageSquareText,
    title: 'Talk to customers weekly',
    body: 'The roadmap is written from sales floors, not brainstorms. We sit in on dial sessions and fix what slows reps down.',
  },
  {
    icon: GitBranch,
    title: 'Ship in the open',
    body: 'Every release lands on the changelog; everything ahead sits on the roadmap. “Live” and “in development” never share a label.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="About"
          title="The call is the data."
          lede="GrowthDialer is an early-stage team building an AI sales dialer. Most outbound tools stop at the recording — leaving reps to take notes, guess at sentiment, and forget the follow-up. We’re building the dialer that understands every call, so the software remembers and the rep sells."
        />

        <PositioningStrip line="All-in-one platforms treat calling as a checkbox. Multichannel tools own the inbox. GrowthDialer owns the call." />

        {/* Editorial manifesto block */}
        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <Reveal>
              <p className="pm-h-section !text-[clamp(1.5rem,3.4vw,2.4rem)] !font-medium !leading-[1.35] !tracking-[-0.01em] text-zinc-900">
                We started GrowthDialer because we watched good reps lose good conversations —{' '}
                <span className="text-violet-700">a perfect objection handle, a competitor named in passing, a callback promised and forgotten</span>{' '}
                — all of it evaporating into a CRM note that says “good call.”
              </p>
              <p className="pm-body mt-7 max-w-2xl">
                The industry’s answer has been more fields to fill in. Our answer is a dialer that listens: three dialing modes, every call captured and understood, the next steps noted before the rep forgets them. That’s the product we’re building, one shipped week at a time.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="pm-divider" />

        {/* Beliefs — numbered editorial rows */}
        <div className="pm-section">
          <div className="pm-container">
            <SectionHead
              eyebrow="What we believe"
              title="Three things we won’t negotiate."
              align="left"
            />
            <div className="divide-y divide-zinc-950/[0.08] border-y border-zinc-950/[0.08]">
              {BELIEFS.map((b, i) => (
                <Reveal key={b.title} delay={i * 60}>
                  <div className="grid gap-3 py-9 sm:grid-cols-[88px_1fr] sm:gap-8">
                    <span className="pm-h-display !text-[clamp(2rem,4vw,2.75rem)] !leading-none text-violet-600/80">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="max-w-2xl">
                      <h3 className="pm-h-card !text-[1.35rem]">{b.title}</h3>
                      <p className="pm-body mt-3">{b.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* What we're building now */}
        <div className="pm-section pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <SectionHead
              eyebrow="What we’re building now"
              title="Live today. Labeled honestly."
              lede="Everything below is the current state of the product — what works now, and what’s still being built."
              align="left"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {LIVE_PILLARS.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <article className="pm-card pm-card-hover h-full p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700">
                      <p.icon className="h-5 w-5" />
                    </span>
                    <div className="mt-5 flex items-center gap-3">
                      <h3 className="pm-h-card">{p.title}</h3>
                      <span className="pm-chip !border-emerald-600/25 !bg-emerald-50 !text-emerald-700">
                        Live
                      </span>
                    </div>
                    <p className="pm-body mt-3 !text-[14.5px]">{p.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
            {/* AI receptionist — clearly in development */}
            <Reveal delay={120}>
              <article className="mt-4 flex flex-col gap-5 rounded-2xl border border-dashed border-zinc-950/[0.16] bg-white p-7 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950/[0.05] text-zinc-500">
                  <Bot className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="pm-h-card">AI receptionist</h3>
                    <span className="pm-chip !border-amber-600/25 !bg-amber-50 !text-amber-700">
                      In development
                    </span>
                  </div>
                  <p className="pm-body mt-2 !text-[14.5px]">
                    An AI that answers inbound calls when your team can’t — qualifying, booking, and logging everything. It’s on the roadmap, not in the product. We’ll label it “live” the week it ships.
                  </p>
                </div>
                <Link href="/roadmap" className="pm-btn pm-btn-secondary shrink-0">
                  Follow the roadmap <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            </Reveal>
          </div>
        </div>

        {/* How we work */}
        <div className="pm-section">
          <div className="pm-container">
            <SectionHead
              eyebrow="How we work"
              title="Small team, public roadmap."
              lede="We’d rather earn your trust with shipped work than rent it with marketing. Here’s what that looks like in practice."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <article className="pm-card h-full p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700">
                      <p.icon className="h-5 w-5" />
                    </span>
                    <h3 className="pm-h-card mt-5">{p.title}</h3>
                    <p className="pm-body mt-3 !text-[14.5px]">{p.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Page-specific closing CTA */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[380px]" />
          <div className="pm-container-narrow relative py-20 text-center sm:py-24">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">Hold us to it</p>
              <h2 className="pm-h-section-dark mx-auto max-w-2xl">
                Judge us on the work, not the words.
              </h2>
              <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
                Start a 7-day trial and put your own calls through the dialer — no credit card. Or read the changelog and see what a “small team, public roadmap” actually ships.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-white">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/changelog" className="pm-btn pm-btn-ghostlight">
                  Read the changelog
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
