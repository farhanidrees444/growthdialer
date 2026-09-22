import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BrainCircuit, Plug2, Users } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  HowItWorks,
  PricingTeaser,
  SectionHead,
  StackBand,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import {
  ChapterNav,
  CoachingStrip,
  DeliverabilityRail,
  DialingBento,
  FeaturePageCta,
  FloorplanHero,
  IntelligenceBand,
  VoiceAgentRoadmap,
} from '@/components/marketing/pages/features-floorplan';

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
    a: 'Almost. Dialing, recordings, transcripts, AI briefs, analytics, and the coaching listen mode are live. Whisper/barge coaching audio is coming soon, and native CRM integrations are waitlist-only. We label each one on the site.',
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
        <FloorplanHero />
        <ChapterNav />
        <DialingBento />
        <IntelligenceBand />
        <DeliverabilityRail />
        <CoachingStrip />
        <VoiceAgentRoadmap />

        <div className="pm-section-tight pm-divider bg-zinc-50/60">
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
        <FeaturePageCta
          eyebrow="Get started"
          title="Walk the whole floor. Free for 7 days."
          lede="Dialing, briefs, coaching, and number health — live today, in your browser. No credit card, no phone system."
          secondary={{ label: 'See pricing', href: '/pricing' }}
        />
      </main>
      <Footer />
    </div>
  );
}
