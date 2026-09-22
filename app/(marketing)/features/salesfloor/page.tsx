import type { Metadata } from 'next';
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
  AnalyticsSnap,
  BrowserFrame,
  LiveBadge,
  NumberHealth,
  PowerQueue,
  TranscriptStream,
} from '@/components/marketing/v2/Mockups';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Salesfloor — Live Coaching & Team Visibility',
  description:
    'The GrowthDialer salesfloor: listen to live calls, leave post-call feedback, and review team performance from real call data. Whisper and barge coaching coming soon.',
  alternates: { canonical: `${MARKETING_SITE}/features/salesfloor` },
  openGraph: {
    title: 'GrowthDialer Salesfloor',
    description: 'Live call monitoring, coaching feedback, and team analytics for sales managers.',
    url: `${MARKETING_SITE}/features/salesfloor`,
  },
};

const SALESFLOOR_ROWS: FeatureRow[] = [
  {
    eyebrow: 'Live floor',
    title: 'Every rep, one glance.',
    body: 'See who’s on a call, who’s in wrap-up, and who’s idle — live. Jump into any conversation the moment it matters.',
    bullets: [
      'Real-time rep status across the team',
      'Listen to any live call with one click',
      'Jump between calls without dropping the floor view',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/salesfloor" badge={<LiveBadge label="6 reps dialing · live" />}>
        <TranscriptStream />
      </BrowserFrame>
    ),
  },
  {
    eyebrow: 'Coaching',
    title: 'Feedback that lands, tied to the moment.',
    body: 'Leave structured feedback after hang-up — linked to the transcript and the exact minute it matters. Whisper and barge audio are coming soon.',
    bullets: [
      'Post-call feedback tied to the transcript',
      'AI briefs give managers the context before they listen',
      'Whisper and barge coaching — coming soon',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/coaching" badge={<LiveBadge label="Listen mode · live" />}>
        <PowerQueue />
      </BrowserFrame>
    ),
    flip: true,
  },
  {
    eyebrow: 'Team analytics',
    title: 'Coach from evidence, not anecdotes.',
    body: 'Connect rate, talk time, sentiment, and dispositions — per rep, per day. Know exactly who needs help with what, and prove it.',
    bullets: [
      'Connect rate and talk-time trends per rep',
      'Leaderboards that update in real time',
      'Disposition breakdowns that show where deals stall',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/analytics" caption={null}>
        <AnalyticsSnap />
      </BrowserFrame>
    ),
  },
  {
    eyebrow: 'Number health',
    title: 'Protect the floor’s connect rate.',
    body: 'Every number the team dials from is scored for spam risk and reputation — continuously. Rotate a number before it costs you connects.',
    bullets: [
      'Spam-risk score on every team number',
      'Carrier reputation monitoring, always on',
      'Rotation guidance before deliverability drops',
    ],
    visual: (
      <BrowserFrame url="app.growthdialer.com/numbers" caption={null}>
        <NumberHealth />
      </BrowserFrame>
    ),
    flip: true,
  },
];

const SALESFLOOR_FAQS = [
  {
    q: 'Can managers really listen live?',
    a: 'Yes — managers on Growth and Pro open the salesfloor, see who’s on a call, and listen in one click. Post-call feedback is tied to the transcript so coaching lands on specifics.',
  },
  {
    q: 'What’s coming to coaching?',
    a: 'Whisper and barge audio — coaching a rep mid-call without the prospect hearing — is coming soon. Today you get listen mode, takeover, and structured post-call feedback.',
  },
  {
    q: 'Does the salesfloor work for remote teams?',
    a: 'Yes. It’s all in the browser — no office, no desk phones. Managers coach from anywhere, and reps dial from anywhere.',
  },
] as const;

export default function SalesfloorPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Salesfloor"
          title={
            <>
              The floor, from
              <br />
              anywhere.
            </>
          }
          lede="Live call monitoring, coaching feedback, and team analytics — managers run the room without standing in it."
          cta={{ label: 'Start free trial', href: APP_SIGNUP }}
        />

        <FeatureGroup
          eyebrow="For managers"
          title="Run the room from evidence."
          lede="Listen live today, whisper and barge on the roadmap — and analytics that show exactly where coaching pays off."
          rows={SALESFLOOR_ROWS}
        />

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
