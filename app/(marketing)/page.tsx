import type { Metadata } from 'next';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { Hero } from '@/components/marketing/v2/Hero';
import {
  CapabilityMarquee,
  DarkIntelligence,
  DeliverabilityBand,
  Faq,
  FinalCta,
  HowItWorks,
  ModesBento,
  PersonaCards,
  PositioningStrip,
  PricingTeaser,
  ProofBand,
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
import {
  AiAgents,
  IntentRoadmap,
  LiveRoadmap,
  Omnichannel,
  ProblemSolution,
  TrustStrip,
  WhyGrowthDialer,
} from '@/components/marketing/v2/HomeNew';
import { POSITIONING } from '@/components/marketing/v2/copy';

export const metadata: Metadata = {
  title: { absolute: 'GrowthDialer — The AI Dialer for Teams That Close on Calls' },
  description:
    'Power and parallel dialing, automatic transcripts, and AI-written call briefs. The voice-first sales dialer for outbound teams. Start free — 7-day trial, no credit card.',
  alternates: { canonical: 'https://growthdialer.com' },
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
    body: 'Dial up to five prospects at once. Answering-machine detection drops your voicemail and moves on — you only ever talk to humans.',
    bullets: [
      'AI answering-machine detection on every line',
      'Automatic voicemail drop, zero effort',
      'Connects you the instant a real person picks up',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/dialer/parallel" badge={<LiveBadge label="5 lines · live" />}>
        <ParallelDial />
      </BrowserFrame>
    ),
    flip: true,
  },
  {
    eyebrow: 'Click-to-call',
    title: 'Your browser is the phone.',
    body: 'No desk phone. No softphone app. Click any number — in your lead list, your CRM, anywhere — and you’re talking in seconds.',
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
    title: 'A 30-second brief after every call.',
    body: 'Every recorded call is transcribed and distilled into a 30-second brief — summary, objections, next steps — ready before your rep reaches for the keyboard.',
    bullets: [
      'Key points, objections, and follow-ups extracted automatically',
      'Buying signals flagged the moment they happen',
      'Briefs sync to your CRM with the recording attached',
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
  {
    eyebrow: 'Live coaching',
    title: 'Coach the call, not the recording.',
    body: 'Managers listen live, read the AI brief as it forms, and take over a call mid-conversation when a deal needs saving.',
    bullets: [
      'Listen to any live call from the salesfloor',
      'Take over a call without dropping the prospect',
      'Post-call feedback tied to the transcript',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/salesfloor" badge={<LiveBadge label="Manager listening · live" />}>
        <TranscriptStream />
      </BrowserFrame>
    ),
  },
];

const NUMBER_ROWS: FeatureRow[] = [
  {
    eyebrow: 'Number health',
    title: 'Know before the carriers decide.',
    body: 'Every number you own is scored for spam risk and reputation — continuously. Rotate a number before it starts hurting your connect rate, not after.',
    bullets: [
      'Spam-risk score on every number you own',
      'Carrier reputation monitoring, always on',
      'Rotation guidance before deliverability drops',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/numbers" caption={null}>
        <NumberHealth />
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
      <BrowserFrame url="app.growthdialer.com/leads/rec_8f3k2" caption={null}>
        <ComplianceCard />
      </BrowserFrame>
    ),
    flip: true,
  },
];

export default function LandingPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <Hero />
        <ProofBand />
        <CapabilityMarquee />
        <TrustStrip />
        <ProblemSolution />
        <PositioningStrip line={POSITIONING.line} />
        <ModesBento
          eyebrow="Dialing"
          title="Dial at the speed of your list."
          lede="Three ways to call, one rhythm. Pick the mode that fits the moment — the workflow never changes."
          rows={DIALING_ROWS}
        />
        <DarkIntelligence
          eyebrow="Intelligence"
          title="The call writes its own notes."
          lede="Transcription, summaries, and analytics run on every conversation — automatically. Your CRM has never been this honest."
          rows={INTEL_ROWS}
        />
        <IntentRoadmap />
        <AiAgents />
        <Omnichannel />
        <StackBand />
        <PersonaCards />
        <DeliverabilityBand
          eyebrow="Deliverability"
          title="Numbers that stay out of spam."
          lede="Connect rate is a deliverability game. We watch every number like it's our own."
          rows={NUMBER_ROWS}
        />
        <HowItWorks />
        <WhyGrowthDialer />
        <LiveRoadmap />
        <PricingTeaser />
        <div className="pm-divider">
          <Faq title="Fair questions. Straight answers." />
        </div>
        <FinalCta
          title="Put your list on five lines."
          lede="Start your 7-day trial — every call transcribed, briefed, and logged. No credit card, no sales call required."
        />
      </main>
      <Footer />
    </div>
  );
}
