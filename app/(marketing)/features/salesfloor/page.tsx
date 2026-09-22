import type { Metadata } from 'next';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { Faq, PricingTeaser } from '@/components/marketing/v2/Sections';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { FeaturePageCta } from '@/components/marketing/pages/features-floorplan';
import { CoachingDepth, FloorBoard, FloorDay, SalesfloorHero } from '@/components/marketing/pages/features-salesfloor';

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
        <SalesfloorHero />
        <FloorBoard />
        <FloorDay />
        <CoachingDepth />
        <PricingTeaser />
        <div className="pm-divider">
          <Faq items={SALESFLOOR_FAQS} eyebrow="FAQ" title="Salesfloor, answered." />
        </div>
        <FeaturePageCta
          eyebrow="The manager’s view"
          title="Step onto the floor."
          lede="Listen live, coach from the transcript, and see the whole team in one glance — free for 7 days, no credit card."
          secondary={{ label: 'See pricing', href: '/pricing' }}
        />
      </main>
      <Footer />
    </div>
  );
}
