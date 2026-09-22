import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Clock3 } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { Faq, RiskBullets } from '@/components/marketing/v2/Sections';
import {
  AiBrief,
  AnalyticsSnap,
  BrowserFrame,
  LiveBadge,
  ParallelDial,
  PowerQueue,
} from '@/components/marketing/v2/Mockups';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: { absolute: 'Product Tour — Walk the GrowthDialer sales floor in 4 minutes' },
  description:
    'A chapter-by-chapter tour of GrowthDialer: load your queue, dial your way, get AI call briefs, and coach from the live floor. 7-day trial, no credit card.',
  alternates: { canonical: `${MARKETING_SITE}/demo` },
  openGraph: {
    title: 'GrowthDialer Product Tour',
    description: 'Four chapters through the real product — the same dialer you open in your trial.',
    url: `${MARKETING_SITE}/demo`,
  },
};

const CHAPTERS = [
  { id: 'chapter-1', num: '01', short: 'Queue', time: '~60 seconds' },
  { id: 'chapter-2', num: '02', short: 'Dial', time: '~60 seconds' },
  { id: 'chapter-3', num: '03', short: 'Brief', time: '~45 seconds' },
  { id: 'chapter-4', num: '04', short: 'Coach', time: '~60 seconds' },
];

const BRIEF_POINTS = [
  'The summary — what was discussed, in three lines',
  'The objection — what almost killed it, and the answer that worked',
  'The next step — owner, deadline, no ambiguity',
  'The disposition — one click from eight honest outcomes',
];

const COACH_POINTS = [
  'Every recording, searchable by transcript',
  'AI briefs on every call — skim in seconds, not hours',
  'Call logs with dispositions your CRM will actually understand',
  'The live floor — see who is talking, who is stuck, right now',
];

const DEMO_FAQS = [
  {
    q: 'Is this a real product or a staged tour?',
    a: 'Real. Start a free trial and you’re in a live workspace with your own leads — the same dialer shown in these chapters.',
  },
  {
    q: 'Where is the video?',
    a: 'There isn’t one, on purpose. A video shows you someone else’s calls. These chapters map the real product, and the fastest way to see it is a 7-day trial with your own leads.',
  },
  {
    q: 'How fast can we be calling?',
    a: 'Most teams run their first power session within ten minutes of sign-up: import a CSV, pick a number, dial.',
  },
  {
    q: 'Do we need our IT team?',
    a: 'No. Calls run in the browser over WebRTC. No desk phones, no installs, no implementation project.',
  },
] as const;

function ChapterKicker({ num, time }: { num: string; time: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-display text-sm font-semibold tracking-[0.18em] text-[#6d28d9]">
        CHAPTER {num}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-950/[0.08] bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500">
        <Clock3 className="h-3 w-3" />
        {time}
      </span>
    </div>
  );
}

function ChapterCta({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6d28d9] transition hover:gap-2.5"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function DemoPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer Product Tour',
          description: 'Chapter-by-chapter tour of the GrowthDialer dialer, AI briefs, and live sales floor.',
          url: `${MARKETING_SITE}/demo`,
        }}
      />
      <main>
        {/* ── Hero: the tour, not a video ─────────────────────────── */}
        <section className="relative overflow-hidden px-5 pb-12 pt-36 sm:pb-16 sm:pt-44 lg:px-8">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="pm-dot-grid pm-fade-hero absolute inset-0 opacity-70" />
            <div className="pm-glow-top absolute inset-x-0 top-0 h-[420px]" />
          </div>
          <div className="pm-container-narrow relative text-center">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered">Product tour · 4 minutes</p>
              <h1 className="pm-h-display">
                Walk the floor
                <br />
                in four minutes.
              </h1>
              <p className="pm-lead mx-auto mt-6 max-w-2xl">
                No video. No 2x speed. Four chapters through the real product — the same
                dialer, briefs, and live floor you open the moment your trial starts.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                  Start your 7-day trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/contact-sales" className="pm-btn pm-btn-secondary">
                  Talk to sales
                </Link>
              </div>
              <RiskBullets className="mt-6 justify-center" />
            </Reveal>
            <Reveal delay={200}>
              <nav aria-label="Tour chapters" className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-2">
                {CHAPTERS.map((c) => (
                  <a
                    key={c.id}
                    href={`#${c.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-950/[0.08] bg-white px-4 py-2 text-[13px] font-semibold text-zinc-600 shadow-sm transition hover:border-[#6d28d9]/40 hover:text-zinc-950"
                  >
                    <span className="text-[#6d28d9]">{c.num}</span> {c.short}
                  </a>
                ))}
              </nav>
            </Reveal>
          </div>
        </section>

        {/* ── Chapter 01 · split ──────────────────────────────────── */}
        <section id="chapter-1" className="pm-section scroll-mt-24">
          <div className="pm-container">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <ChapterKicker num="01" time="~60 seconds" />
                <h2 className="pm-h-section mt-4">Load your queue.</h2>
                <p className="pm-body mt-4 max-w-lg">
                  Import a CSV and your list is a working queue in seconds — not a
                  spreadsheet tab you dread opening. Queue, Hot, and Callbacks tabs keep
                  every rep pointed at the next right call, never at admin.
                </p>
                <ChapterCta label="Start your trial and load a list" href={APP_SIGNUP} />
              </Reveal>
              <Reveal delay={120} variant="scale">
                <BrowserFrame url="app.growthdialer.com/leads" badge={<LiveBadge label="248 leads queued" />}>
                  <PowerQueue />
                </BrowserFrame>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Chapter 02 · full-bleed visual ───────────────────────── */}
        <section id="chapter-2" className="relative scroll-mt-24 overflow-hidden border-y border-zinc-950/[0.06] bg-zinc-50/60">
          <div aria-hidden className="pm-glow-violet pointer-events-none absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 opacity-60" />
          <div className="pm-container relative py-20 sm:py-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <div className="flex justify-center">
                <ChapterKicker num="02" time="~60 seconds" />
              </div>
              <h2 className="pm-h-section mt-4">Dial your way.</h2>
              <p className="pm-body mx-auto mt-4 max-w-xl">
                Power dial with auto-advance when you want rhythm. Five parallel lines
                with voicemail drop when you want volume. One click either way — and
                you are talking before your coffee cools.
              </p>
            </Reveal>
            <Reveal delay={140} variant="scale" className="mx-auto mt-12 max-w-4xl">
              <BrowserFrame url="app.growthdialer.com/dialer/parallel" badge={<LiveBadge label="5 lines · live" />}>
                <ParallelDial />
              </BrowserFrame>
            </Reveal>
            <Reveal delay={200} className="text-center">
              <ChapterCta label="Compare the three dialing modes" href="/features" />
            </Reveal>
          </div>
        </section>

        {/* ── Chapter 03 · dark band ───────────────────────────────── */}
        <section id="chapter-3" className="pm-dark scroll-mt-24">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[420px]" />
          <div className="pm-container relative py-20 sm:py-28">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-semibold tracking-[0.18em] text-violet-300">
                    CHAPTER 03
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                    <Clock3 className="h-3 w-3" />
                    ~45 seconds
                  </span>
                </div>
                <h2 className="pm-h-section-dark mt-4">Hang up — notes are done.</h2>
                <p className="pm-lead-dark mt-4 max-w-lg !text-[1.05rem]">
                  Eight dispositions, one click. The AI writes the rest before your rep
                  reaches for the keyboard — briefs that read like a colleague took
                  notes, not a robot.
                </p>
                <ul className="mt-8 space-y-3.5">
                  {BRIEF_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[15px] text-zinc-200">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/features/ai"
                  className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300 transition hover:gap-2.5"
                >
                  See how the AI brief works <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
              <Reveal delay={120} variant="scale">
                <BrowserFrame
                  url="app.growthdialer.com/calls/rec_8f3k2"
                  badge={<LiveBadge label="Brief ready · 8s after hang-up" />}
                >
                  <AiBrief />
                </BrowserFrame>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Chapter 04 · checklist ───────────────────────────────── */}
        <section id="chapter-4" className="pm-section scroll-mt-24">
          <div className="pm-container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <div className="flex justify-center">
                <ChapterKicker num="04" time="~60 seconds" />
              </div>
              <h2 className="pm-h-section mt-4">Review and coach.</h2>
              <p className="pm-body mx-auto mt-4 max-w-xl">
                Managers stop asking “how did the calls go?” Everything worth knowing
                is already on the floor — recorded, briefed, and logged.
              </p>
            </Reveal>
            <div className="mt-12 grid items-start gap-10 lg:grid-cols-5 lg:gap-14">
              <Reveal className="lg:col-span-3" variant="scale">
                <BrowserFrame url="app.growthdialer.com/analytics" caption={null}>
                  <AnalyticsSnap />
                </BrowserFrame>
              </Reveal>
              <Reveal delay={120} className="lg:col-span-2">
                <ul className="space-y-4">
                  {COACH_POINTS.map((point, i) => (
                    <li key={point} className="flex items-start gap-4 rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-[0_10px_30px_-18px_rgba(9,9,11,0.25)]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6d28d9]/10 font-display text-[13px] font-bold text-[#6d28d9]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="pt-1 text-[15px] leading-relaxed text-zinc-700">{point}</span>
                    </li>
                  ))}
                </ul>
                <ChapterCta label="Open the live sales floor" href="/features/salesfloor" />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <div className="pm-divider">
          <Faq items={DEMO_FAQS} eyebrow="Tour FAQ" title="Before you start the clock." />
        </div>

        {/* ── Tour-specific final CTA ─────────────────────────────── */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[420px]" />
          <div className="pm-container relative py-24 text-center sm:py-32">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">End of tour · 4:00</p>
              <h2 className="pm-h-section-dark mx-auto max-w-3xl">
                That was the slow version.
              </h2>
              <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
                Four minutes of reading — or ten minutes of doing. Start your trial and
                run real calls with your own leads.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-white">
                  Start your 7-day trial — no credit card <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/contact-sales" className="pm-btn pm-btn-ghostlight">
                  Talk to sales
                </Link>
              </div>
              <RiskBullets dark className="mt-8 justify-center" />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
