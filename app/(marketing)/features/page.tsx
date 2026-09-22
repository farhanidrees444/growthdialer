import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BrainCircuit, Plug2, Users } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FeatureGroup,
  FinalCta,
  HowItWorks,
  PageHero,
  PricingTeaser,
  SectionHead,
  StackBand,
  type FeatureRow,
} from '@/components/marketing/v2/Sections';
import {
  AiBrief,
  AnalyticsSnap,
  BrowserFrame,
  ClickToCall,
  ComplianceCard,
  LiveBadge,
  NumberHealth,
  ParallelDial,
  PowerQueue,
  TranscriptStream,
} from '@/components/marketing/v2/Mockups';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Features — AI Dialer, Power Dialer & Conversation Intelligence',
  description:
    'Everything GrowthDialer does today: power and parallel dialing, AI call briefs, conversation intelligence, live coaching floor, and number-health monitoring.',
  alternates: { canonical: `${MARKETING_SITE}/features` },
  openGraph: {
    title: 'GrowthDialer Features',
    description: 'Dialing, intelligence, coaching, and deliverability — one calling layer for your team.',
    url: `${MARKETING_SITE}/features`,
  },
};

const DIALING_ROWS: FeatureRow[] = [
  {
    eyebrow: 'Power dialer',
    title: 'Back-to-back calls. Zero dead air.',
    body: 'The next number loads the second you disposition. Notes, follow-ups, and logging happen between rings — not after hours.',
    bullets: [
      'One-click dispositions keep the rhythm unbroken',
      'Every call logged automatically — no manual entry',
      'Local presence dialing lifts pickup rates',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/dialer" badge={<LiveBadge label="Power session · live" />}>
        <PowerQueue />
      </BrowserFrame>
    ),
  },
  {
    eyebrow: 'Parallel dialer',
    title: 'Five lines. One conversation.',
    body: 'Dial multiple prospects at once on Pro. Answering-machine detection drops your voicemail and moves on — you only ever talk to humans.',
    bullets: [
      'AI answering-machine detection on every line',
      'Automatic voicemail drop, zero effort',
      'Connects you the instant a real person picks up',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/dialer/parallel" badge={<LiveBadge label="Multi-line · live" />}>
        <ParallelDial />
      </BrowserFrame>
    ),
    flip: true,
  },
  {
    eyebrow: 'Click-to-call',
    title: 'Your browser is the phone.',
    body: 'No desk phone. No softphone app. Click any number — in your lead list, anywhere — and you’re talking in seconds.',
    bullets: [
      'WebRTC calling built into the browser',
      'Recording on every call, automatically',
      'Bring your own numbers or buy local ones in-app',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/leads" caption={null}>
        <ClickToCall />
      </BrowserFrame>
    ),
  },
];

const INTEL_ROWS: FeatureRow[] = [
  {
    eyebrow: 'AI call briefs',
    title: 'Hang up. Your notes are already written.',
    body: 'Every recorded call is transcribed and distilled into a 30-second brief — summary, objections, next steps — ready before your rep reaches for the keyboard.',
    bullets: [
      'Key points, objections, and follow-ups extracted automatically',
      'Buying signals flagged the moment they happen',
      'Briefs stored on the lead timeline with the recording attached',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/calls/rec_8f3k2" badge={<LiveBadge label="Brief ready · 8s after hang-up" />}>
        <AiBrief />
      </BrowserFrame>
    ),
  },
  {
    eyebrow: 'Conversation analytics',
    title: 'See what “great” sounds like.',
    body: 'Connect rate, talk time, sentiment, and topics — tracked across every rep and every call. Find the patterns your top performers already know.',
    bullets: [
      'Talk-time, sentiment, and keyword trends per rep',
      'Call scorecards that write themselves',
      'Leaderboards that update in real time',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/analytics" caption={null}>
        <AnalyticsSnap />
      </BrowserFrame>
    ),
    flip: true,
  },
];

const COACHING_ROWS: FeatureRow[] = [
  {
    eyebrow: 'Live coaching floor',
    title: 'Coach the call, not the recording.',
    body: 'Managers listen live, read the transcript as it forms, and leave structured feedback after hang-up. Whisper and barge audio are coming soon.',
    bullets: [
      'Listen to any live call from the salesfloor',
      'Post-call feedback tied to the transcript',
      'Whisper and barge coaching — coming soon',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/salesfloor" badge={<LiveBadge label="Manager listening · live" />}>
        <TranscriptStream />
      </BrowserFrame>
    ),
  },
  {
    eyebrow: 'Records & audit',
    title: 'Every call, on the record.',
    body: 'Calls, recordings, dispositions, and DNC flags are logged automatically — the audit trail your compliance review wants, without the spreadsheet.',
    bullets: [
      'DNC flags remove leads from every queue instantly',
      'Recordings stored with transcripts, searchable by lead',
      'Full disposition history on each lead’s timeline',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/leads/maya-patel" caption={null}>
        <ComplianceCard />
      </BrowserFrame>
    ),
    flip: true,
  },
];

const SUBPAGES = [
  {
    icon: BrainCircuit,
    title: 'AI platform',
    body: 'Call briefs live today, conversation intelligence built in, coaching listen mode — and the AI voice agent roadmap.',
    href: '/features/ai',
  },
  {
    icon: Users,
    title: 'Salesfloor',
    body: 'Live call monitoring, manager coaching modes, leaderboards, and team performance visibility.',
    href: '/features/salesfloor',
  },
  {
    icon: Plug2,
    title: 'Integrations',
    body: 'Native CRM integrations are in development — join the waitlist and we’ll notify you when yours ships.',
    href: '/integrations',
  },
];

const FEATURES_FAQS = [
  {
    q: 'Is everything on this page live today?',
    a: 'Almost. Dialing, recordings, transcripts, AI briefs, analytics, and the coaching listen mode are live. Sequences are coming soon, whisper/barge coaching audio is on the roadmap, and native CRM integrations are waitlist-only. We label each one on the site.',
  },
  {
    q: 'How does the AI work — is it a black box?',
    a: 'No. The AI call brief shows you the transcript it was written from. Summaries, sentiment, and next steps are generated per recorded call, and every brief links back to the recording it came from.',
  },
  {
    q: 'Do I need a phone system to use GrowthDialer?',
    a: 'No. Calls run in your browser over WebRTC. Bring your own numbers or buy local ones in-app — every number gets spam-risk and reputation scoring.',
  },
  {
    q: 'What about compliance?',
    a: 'Recording consent controls, DNC flagging, and a full audit trail are built in: flagged leads leave every queue instantly, and every call, recording, and disposition is logged on the lead timeline. Spam-risk scoring watches every number you own.',
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Features"
          title={
            <>
              Every part of the call,
              <br />
              covered.
            </>
          }
          lede="Dialing, intelligence, coaching, and number health — one calling layer for your team. Labeled honestly: live today, coming soon, or roadmap."
          cta={{ label: 'Start free trial', href: APP_SIGNUP }}
        />

        <FeatureGroup
          eyebrow="Dialing"
          title="Dial at the speed of your list."
          lede="Three ways to call, one rhythm. Pick the mode that fits the moment — the workflow never changes."
          rows={DIALING_ROWS}
        />

        <div className="pm-divider bg-zinc-50/60">
          <FeatureGroup
            eyebrow="Intelligence"
            title="Every call, understood."
            lede="Transcription, summaries, and analytics run on every conversation — automatically."
            rows={INTEL_ROWS}
          />
        </div>

        <FeatureGroup
          eyebrow="Coaching & records"
          title="Manage the floor from evidence."
          lede="Live listening today, whisper and barge on the roadmap — and an audit trail that writes itself."
          rows={COACHING_ROWS}
        />

        <div className="pm-section pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <SectionHead eyebrow="Go deeper" title="Explore each surface." />
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

        <StackBand />
        <HowItWorks />
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
