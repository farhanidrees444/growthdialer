import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FinalCta,
  PricingTeaser,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { RealShot } from '../_components/real-shot';
import { cn } from '@/lib/utils';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'AI Platform — Call Analysis, AI Memory & Voice Agents | GrowthDialer',
  description:
    'GrowthDialer AI: post-call analysis live today, per-lead AI memory, coaching listen mode — and the AI voice agent in development. Labeled honestly.',
  alternates: { canonical: `${MARKETING_SITE}/features/ai` },
  openGraph: {
    title: 'GrowthDialer AI Platform',
    description: 'AI that works after every sales call — labeled live or in development, honestly.',
    url: `${MARKETING_SITE}/features/ai`,
  },
};

function StatusBadge({ status }: { status: 'live' | 'in development' }) {
  return (
    <span
      className={cn(
        'mb-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]',
        status === 'live' && 'bg-emerald-100 text-emerald-800',
        status === 'in development' && 'bg-zinc-950/[0.06] text-zinc-600',
      )}
    >
      {status === 'live' ? 'Live today' : 'In development'}
    </span>
  );
}

const AI_FAQS = [
  {
    q: 'Which AI features are live today?',
    a: 'Post-call analysis (bullet summary, sentiment, objections, buying signals, next steps, suggested disposition), transcription on recorded calls, per-lead AI memory across calls, coaching listen mode, and call takeover. Whisper and barge coaching are on the roadmap; the AI voice agent is in development.',
  },
  {
    q: 'Is the AI voice agent available?',
    a: 'Not yet. The inbound AI receptionist — answers, qualifies, and routes calls — is in active development. Today you get call analysis, transcription, sentiment, and coaching intelligence on every recorded call.',
  },
  {
    q: 'Do I have to trust the AI blindly?',
    a: 'No. Every analysis links back to the transcript and recording it was written from. Reps read the brief; managers can always verify against the source.',
  },
  {
    q: 'Does AI work on unrecorded calls?',
    a: 'No. Transcription, summaries, and sentiment need a recording to work from. Playback, transcripts, and AI analysis appear for calls over 30 seconds; recording is automatic on browser calls.',
  },
] as const;

export default function AiFeaturesPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        {/* Compact dark hero — left-aligned, with an honest status legend */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-glow absolute inset-0" />
          <div className="pm-container relative py-16 sm:py-20">
            <Reveal>
              <p className="pm-eyebrow !text-white/60">AI platform</p>
              <h1 className="pm-h-section-dark mt-4 max-w-2xl">AI that does the paperwork.</h1>
              <p className="pm-lead-dark mt-5 max-w-2xl">
                We ship AI where it removes work — analysis after the call, memory across calls.
                Everything on this page is labeled with exactly where it stands.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5" aria-label="Feature status legend">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-300">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live today
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[12px] font-semibold text-zinc-300">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  In development
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Post-call analysis */}
        <section className="pm-section">
          <div className="pm-container">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <StatusBadge status="live" />
                <h2 className="pm-h-group">The call, analyzed the second it ends.</h2>
                <p className="pm-body mt-5">
                  When a call is recorded, it is transcribed and analyzed into a bullet summary,
                  sentiment score, talking points, objections, buying signals, next steps, and a
                  suggested disposition. A memory is saved on the lead — preferences, objections,
                  interests, facts — so the next call starts with context instead of cold.
                </p>
                <ul className="mt-7 space-y-3.5">
                  {[
                    'Bullet summary, sentiment, objections, buying signals, next steps',
                    'Suggested disposition proposes the right outcome for the rep',
                    'Per-lead AI memory carries context across every future call',
                    'Every analysis links back to the transcript and recording it came from',
                  ].map((t) => (
                    <li key={t} className="pm-tick">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6d28d9]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={120}>
                <RealShot
                  shot="dashboardBanner"
                  alt="The real GrowthDialer dashboard with the AI SUMMARIES status card showing analysis runs automatically after calls"
                  caption="The dashboard's AI SUMMARIES status card — call analysis runs automatically after recorded calls."
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* AI scoring in the dialer */}
        <section className="pm-section pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal className="lg:order-2">
                <StatusBadge status="live" />
                <h2 className="pm-h-group">Scoring, right where you dial.</h2>
                <p className="pm-body mt-5">
                  An AI scoring toggle sits in the dialer header, next to the Manual, Power, and
                  Parallel mode tabs. Reps see the Queue, Hot, and Callbacks tabs under it and dial
                  straight through — the intelligence layer never leaves the workflow.
                </p>
                <ul className="mt-7 space-y-3.5">
                  {[
                    'AI scoring toggle in the dialer header, always one glance away',
                    'Scoring feeds the Queue, Hot, and Callbacks tab order',
                    'No separate AI tool to open, learn, or pay for',
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
                  shot="dialerBanner"
                  alt="The real GrowthDialer AI Dialer showing the AI scoring toggle and Manual, Power, and Parallel mode tabs"
                  caption="The dialer header with the AI scoring toggle and the three dialing modes."
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Voice agent — roadmap */}
        <section className="pm-section-tight">
          <div className="pm-container-narrow">
            <Reveal>
              <div className="pm-card p-8 text-center sm:p-12">
                <StatusBadge status="in development" />
                <h2 className="pm-h-group">AI Voice Agent</h2>
                <p className="pm-body mx-auto mt-4 max-w-xl">
                  An inbound AI receptionist that answers, qualifies, and routes calls — 24/7
                  coverage without hiring overnight staff. In active development now; this panel will
                  show the real thing when it ships.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link href="/contact-sales" className="pm-btn pm-btn-secondary">
                    Talk to sales
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <PricingTeaser />
        <div className="pm-divider">
          <Faq items={AI_FAQS} eyebrow="AI FAQ" title="Honest answers about the AI." />
        </div>
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
