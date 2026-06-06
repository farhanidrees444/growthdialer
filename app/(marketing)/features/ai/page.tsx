import type { Metadata } from 'next';
import Link from 'next/link';
import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { SiteFooter } from '@/components/marketing/live-floor/SiteFooter';
import { AiProductPillars } from '@/components/marketing/home/AiProductPillars';
import { ArrowRight } from 'lucide-react';
import { APP_SIGNUP } from '@/lib/marketing/pricing';

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
    body: 'Whisper transcription plus Gemini analysis produces bullet summaries, sentiment scores, detected intent, and keywords — linked to the lead and recording automatically.',
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
    <MotionShell>
      <div className="relative min-h-screen overflow-x-clip bg-[#08080A] text-[#F5F5F7] antialiased">
        <Grain />
        <Nav />
        <main className="relative z-[2]">
          <section className="relative px-5 pt-36 lg:px-8 lg:pt-44">
            <div className="relative mx-auto max-w-3xl text-center">
              <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">AI platform</p>
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.75rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]">
                AI that earns its seat <span className="font-medium">on every call</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-zinc-400">
                We ship AI where it removes work — prep, notes, coaching, and eventually inbound coverage.
                No black-box promises; each pillar is labeled live or roadmap.
              </p>
              <a
                href={APP_SIGNUP}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7C3AED]"
              >
                Try it free
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </section>

          <AiProductPillars />

          <section className="px-5 pb-20 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-10">
              {SECTIONS.map((s) => (
                <article key={s.id} id={s.id} className="scroll-mt-28 border-t border-white/[0.06] pt-8">
                  <h2 className="font-display text-2xl font-medium text-white">{s.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">{s.body}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </MotionShell>
  );
}
