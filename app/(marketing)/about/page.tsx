import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GitBranch, MessageSquareText, PackageCheck } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { FinalCta, PageHero, PositioningStrip, SectionHead } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';

export const metadata: Metadata = {
  title: 'About — Building the Dialer That Understands Every Call',
  description:
    'GrowthDialer is an early-stage team building an AI sales dialer that turns every call into searchable revenue intelligence. Our beliefs: the call is the data, software does the busywork, honest by default.',
  alternates: { canonical: 'https://growthdialer.com/about' },
};

const BELIEFS = [
  {
    title: 'The call is the data.',
    body: 'Reps shouldn’t lose insight to bad notes. Every conversation should become a clean, searchable record automatically.',
  },
  {
    title: 'Software should do the busywork.',
    body: 'Dialing, recording, transcribing, summarizing — the tool handles it so the rep can focus on the human on the line.',
  },
  {
    title: 'Honest by default.',
    body: 'We only ship what works, say what’s real, and mark what’s coming. No vanity metrics, no fake logos.',
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
    body: 'Every release lands on the changelog; everything ahead sits on the roadmap. Live and “in development” never share a label.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="About"
          title={
            <>
              We’re building the dialer that
              <br />
              understands every call.
            </>
          }
          lede="GrowthDialer is an early-stage product. Outbound calling tools stop at the recording — leaving reps to take notes, guess at sentiment, and forget the follow-up. We think the call itself should become structured, searchable data the moment it ends."
        />

        <PositioningStrip line="All-in-one platforms treat calling as a checkbox. Multichannel tools own the inbox. GrowthDialer owns the call." />

        {/* Beliefs */}
        <div className="pm-section">
          <div className="pm-container">
            <SectionHead
              eyebrow="What we believe"
              title="Three things we won’t negotiate."
              align="left"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {BELIEFS.map((b, i) => (
                <Reveal key={b.title} delay={i * 80}>
                  <article className="pm-card pm-card-hover h-full p-7">
                    <h3 className="pm-h-card">{b.title}</h3>
                    <p className="pm-body mt-3">{b.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* How we work */}
        <div className="pm-section pm-divider bg-zinc-50/60">
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
            <Reveal delay={120} className="mt-10 text-center">
              <Link href="/roadmap" className="pm-btn pm-btn-secondary">
                See the roadmap <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
