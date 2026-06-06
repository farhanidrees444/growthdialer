import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { AiProductPillars } from '@/components/marketing/home/AiProductPillars';
import { EarlyAccess } from '@/components/marketing/home/EarlyAccess';
import { APP_SIGNUP } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'AI Platform — Conversation Intelligence, Coaching & Voice Agents',
  description:
    'GrowthDialer AI pillars: conversation intelligence and call briefs live today, manager coaching on Team plans, and AI voice agents on the roadmap.',
  alternates: { canonical: 'https://growthdialer.com/features/ai' },
  openGraph: {
    title: 'GrowthDialer AI Platform',
    description: 'AI that works before, during, and after every sales call.',
    url: 'https://growthdialer.com/features/ai',
  },
};

const SECTIONS = [
  {
    id: 'conversation-intelligence',
    title: 'Conversation Intelligence',
    body: 'Calls are transcribed and analyzed automatically — bullet summaries, sentiment scores, detected intent, and keywords linked to the lead and recording.',
  },
  {
    id: 'call-brief',
    title: 'AI Call Brief',
    body: 'The dialer surfaces company context, prior notes, and a suggested opener before each call so reps sound prepared without digging through tabs.',
  },
  {
    id: 'coaching',
    title: 'Live Coaching',
    body: 'Managers on Pro and Team plans use the live coaching floor to monitor active calls, switch listen / whisper / barge modes, and leave structured feedback.',
  },
  {
    id: 'voice-agent',
    title: 'AI Voice Agent (roadmap)',
    body: 'Inbound AI receptionist that answers, qualifies, and routes calls — the next pillar for teams who want 24/7 coverage without hiring overnight staff.',
  },
];

export default function AiFeaturesPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="AI platform"
        title={
          <>
            AI that earns its seat
            <br />
            <span className="font-medium">on every call.</span>
          </>
        }
        description="We ship AI where it removes work — prep, notes, coaching, and eventually inbound coverage. No black-box promises; each pillar is labeled live or roadmap."
      >
        <a
          href={APP_SIGNUP}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7C3AED]"
        >
          Try it free
          <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/features/salesfloor"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"
        >
          Live coaching floor
        </Link>
      </MarketingPageHero>

      <AiProductPillars />

      <section className="px-5 pb-8 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10">
          {SECTIONS.map((s) => (
            <article key={s.id} id={s.id} className="scroll-mt-28 border-t border-white/[0.06] pt-8">
              <h2 className="font-display text-2xl font-medium text-white">{s.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <EarlyAccess />
    </MarketingShell>
  );
}
