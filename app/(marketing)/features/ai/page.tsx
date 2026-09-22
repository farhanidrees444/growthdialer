import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FeatureGroup,
  FinalCta,
  PageHero,
  PricingTeaser,
  type FeatureRow,
} from '@/components/marketing/v2/Sections';
import {
  AiBrief,
  BrowserFrame,
  LiveBadge,
  ParallelDial,
  TranscriptStream,
} from '@/components/marketing/v2/Mockups';
import { cn } from '@/lib/utils';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'AI Platform — Conversation Intelligence, Coaching & Voice Agents | GrowthDialer',
  description:
    'GrowthDialer AI: call briefs live today, conversation intelligence built in when calls are recorded, coaching listen mode on Pro, and the AI voice agent on the roadmap.',
  alternates: { canonical: `${MARKETING_SITE}/features/ai` },
  openGraph: {
    title: 'GrowthDialer AI Platform',
    description: 'AI that works before, during, and after every sales call — labeled live or roadmap, honestly.',
    url: `${MARKETING_SITE}/features/ai`,
  },
};

function StatusBadge({ status }: { status: 'live' | 'built-in' | 'coming soon' | 'in development' }) {
  return (
    <span
      className={cn(
        'mb-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]',
        status === 'live' && 'bg-emerald-100 text-emerald-800',
        status === 'built-in' && 'bg-[#6d28d9]/10 text-[#6d28d9]',
        status === 'coming soon' && 'bg-amber-100 text-amber-800',
        status === 'in development' && 'bg-zinc-950/[0.06] text-zinc-600',
      )}
    >
      {status === 'live' ? 'Live today' : status === 'built-in' ? 'Built in' : status === 'coming soon' ? 'Coming soon' : 'In development'}
    </span>
  );
}

const AI_ROWS: FeatureRow[] = [
  {
    eyebrow: 'Conversation intelligence',
    title: 'The call, understood while it happens.',
    body: 'When a call is recorded, audio is transcribed and analyzed into a bullet summary, sentiment, detected intent, and keywords — linked to the lead and the recording automatically.',
    bullets: [
      'Transcription on every recorded call',
      'Sentiment, intent, and keyword extraction',
      'Summary linked to the lead timeline',
    ],
    visual: (
      <>
        <StatusBadge status="built-in" />
        <BrowserFrame url="app.growthdialer.com/calls/rec_8f3k2" badge={<LiveBadge label="Brief ready · 8s after hang-up" />}>
          <AiBrief />
        </BrowserFrame>
      </>
    ),
  },
  {
    eyebrow: 'AI call brief',
    title: 'Walk in knowing the room.',
    body: 'Before you dial, the dialer surfaces company context, prior notes, and a one-line opener tailored to the lead — right where you call from.',
    bullets: [
      'Company context pulled before each dial',
      'Prior call notes and dispositions at a glance',
      'Suggested opener, tuned to the lead',
    ],
    visual: (
      <>
        <StatusBadge status="live" />
        <BrowserFrame url="app.growthdialer.com/dialer" badge={<LiveBadge label="Brief loaded · live" />}>
          <ParallelDial />
        </BrowserFrame>
      </>
    ),
    flip: true,
  },
  {
    eyebrow: 'Live coaching',
    title: 'Managers in the call — without the shoulder tap.',
    body: 'On Growth and Pro, managers monitor active calls in listen mode and leave structured feedback after hang-up. Whisper and barge audio are coming soon.',
    bullets: [
      'Listen to live calls from the salesfloor',
      'Structured post-call feedback tied to the transcript',
      'Whisper and barge coaching — coming soon',
    ],
    visual: (
      <>
        <StatusBadge status="live" />
        <BrowserFrame url="app.growthdialer.com/salesfloor" badge={<LiveBadge label="Manager listening · live" />}>
          <TranscriptStream />
        </BrowserFrame>
      </>
    ),
  },
];

const AI_FAQS = [
  {
    q: 'Is the AI voice agent available?',
    a: 'Not yet. The inbound AI receptionist — answers, qualifies, and routes calls — is in active development. Today you get AI call briefs, transcription, summaries, sentiment, and coaching intelligence on every recorded call.',
  },
  {
    q: 'Which AI features are live today?',
    a: 'AI call briefs before each dial, transcription and summaries when calls are recorded, sentiment and keyword analysis, and coaching listen mode for managers. Whisper/barge coaching is coming soon; the voice agent is in development.',
  },
  {
    q: 'Do I have to trust the AI blindly?',
    a: 'No. Every brief links back to the transcript and recording it was written from. Reps read the 30-second brief; managers can always verify against the source.',
  },
  {
    q: 'Does AI work on unrecorded calls?',
    a: 'Transcription, summaries, and sentiment need a recording to work from. Recording is automatic on browser calls, with consent controls built in.',
  },
] as const;

export default function AiFeaturesPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="AI platform"
          title={
            <>
              AI that earns its seat
              <br />
              on every call.
            </>
          }
          lede="We ship AI where it removes work — prep before the call, analysis after, coaching for managers. Every pillar labeled: live today, coming soon, or in development."
          cta={{ label: 'Try it free', href: APP_SIGNUP }}
        />

        <FeatureGroup
          eyebrow="What ships today"
          title="Four pillars. Three live — one in development."
          lede="No black-box promises. Each pillar is labeled with exactly where it stands."
          rows={AI_ROWS}
        />

        {/* Voice agent — roadmap */}
        <div className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container-narrow">
            <div className="pm-card p-8 text-center sm:p-12">
              <StatusBadge status="in development" />
              <h2 className="pm-h-group">AI Voice Agent</h2>
              <p className="pm-body mx-auto mt-4 max-w-xl">
                An inbound AI receptionist that answers, qualifies, and routes calls — 24/7 coverage without
                hiring overnight staff. In active development now.
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
          </div>
        </div>

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
