/*
 * Page-local sections for /features/salesfloor ("The manager's view").
 * Owned by the features-cluster agent — do not edit from other agents.
 */
'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Ear, Hand, MoonStar, Phone, Sunrise, Trophy } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { SectionHead } from '@/components/marketing/v2/Sections';
import { AnalyticsSnap, BrowserFrame, LiveBadge, NumberHealth, TranscriptStream } from '@/components/marketing/v2/Mockups';
import { Aurora, Noise } from '@/components/marketing/v2/motion';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { cn } from '@/lib/utils';
import { StatusDot } from './features-floorplan';

/* ── Hero: the manager's view ── */
export function SalesfloorHero() {
  return (
    <section className="relative overflow-hidden px-5 pb-14 pt-36 sm:pb-16 sm:pt-44 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Aurora />
        <Noise />
        <div className="pm-dot-grid pm-fade-hero absolute inset-0 opacity-70" />
        <div className="pm-glow-top absolute inset-x-0 top-0 h-[420px]" />
      </div>
      <div className="pm-container-narrow relative text-center">
        <Reveal>
          <p className="pm-eyebrow pm-eyebrow-centered">Salesfloor · The manager’s view</p>
          <h1 className="pm-h-display">Run the room from anywhere.</h1>
          <p className="pm-lead mx-auto mt-6 max-w-2xl">
            Live call monitoring, coaching feedback, and team analytics — managers run the floor
            without standing in it. No office required; it’s all in the browser.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
              Start free trial <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/demo" className="pm-btn pm-btn-secondary">
              See it in action
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Floor at a glance: live-ops board ── */
const REPS = [
  { role: 'SDR · East', state: 'On call', detail: 'Connected 04:12', tone: 'emerald' },
  { role: 'Account executive', state: 'On call', detail: 'Connected 01:47', tone: 'emerald' },
  { role: 'SDR · West', state: 'Wrap-up', detail: 'Dispositioning…', tone: 'amber' },
  { role: 'SDR · Central', state: 'Dialing', detail: 'Line 3 of 5', tone: 'violet' },
  { role: 'Account executive', state: 'Wrap-up', detail: 'Brief forming…', tone: 'amber' },
  { role: 'SDR · East', state: 'Idle', detail: 'Next list loads…', tone: 'zinc' },
] as const;

function toneDot(tone: string) {
  return cn(
    'h-2 w-2 rounded-full',
    tone === 'emerald' && 'bg-emerald-500 pm-pulse-dot',
    tone === 'amber' && 'bg-amber-500 pm-pulse-dot',
    tone === 'violet' && 'bg-[#6d28d9] pm-pulse-dot',
    tone === 'zinc' && 'bg-zinc-300'
  );
}

export function FloorBoard() {
  return (
    <section className="pm-section-tight">
      <div className="pm-container">
        <Reveal>
          <div className="overflow-hidden rounded-[1.6rem] border border-zinc-950/[0.09] bg-white shadow-[0_32px_96px_-48px_rgba(9,9,11,0.25)]">
            {/* board header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-950/[0.07] bg-zinc-50/70 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="pm-pulse-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-600">Floor at a glance</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status="live" />
                <span className="hidden text-[12.5px] text-zinc-400 sm:block">Growth & Pro plans</span>
              </div>
            </div>
            {/* rep grid */}
            <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
              {REPS.map((r, i) => (
                <Reveal key={`${r.role}-${i}`} delay={i * 70}>
                  <div className="flex items-center gap-4 rounded-2xl border border-zinc-950/[0.07] bg-white p-4 transition-colors hover:border-[#6d28d9]/30">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950/[0.05] text-zinc-600">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-zinc-950">{r.role}</p>
                      <p className="truncate text-[12.5px] text-zinc-500">{r.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={toneDot(r.tone)} />
                      <span className="text-[12px] font-semibold text-zinc-600">{r.state}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            {/* brief forming strip */}
            <div className="border-t border-zinc-950/[0.07] bg-zinc-50/70 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-zinc-700">
                  <ClipboardCheck className="h-4 w-4 text-[#6d28d9]" /> Live brief forming
                </p>
                <p className="text-[13px] text-zinc-500">Objection detected · “pricing for 12 seats” · sentiment trending positive</p>
                <span className="ml-auto hidden items-center gap-2 text-[12px] font-semibold text-emerald-700 sm:inline-flex">
                  <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" /> Transcribing now
                </span>
              </div>
            </div>
          </div>
        </Reveal>
        <p className="pm-caption mt-4">Illustrative floor preview with sample data — not real reps or calls.</p>
      </div>
    </section>
  );
}

/* ── A day on the floor: timeline ── */
const DAY = [
  {
    time: '08:30',
    icon: Sunrise,
    title: 'Morning huddle, from yesterday’s evidence.',
    body: 'Scorecards are already written: connect rate, talk time, and sentiment per rep. The standup starts with what the data says — not what anyone remembers.',
  },
  {
    time: '10:15',
    icon: Ear,
    title: 'A coaching moment, caught live.',
    body: 'A rep hits a pricing objection. The manager is already listening, reads the brief as it forms, and drops structured feedback after hang-up — tied to the exact minute.',
  },
  {
    time: '13:40',
    icon: Hand,
    title: 'A deal saved mid-call.',
    body: 'An account executive is losing the room. The manager takes over the conversation before it ends — one click, no dropped call, no awkward handoff.',
  },
  {
    time: '17:30',
    icon: MoonStar,
    title: 'End-of-day review, in minutes.',
    body: 'Every disposition, recording, and brief is on the timeline. The floor closes the day knowing exactly where each deal stands — and who needs coaching tomorrow.',
  },
];

export function FloorDay() {
  return (
    <section className="pm-section bg-zinc-50/60">
      <div className="pm-container">
        <SectionHead
          align="left"
          eyebrow="A day on the floor"
          title="The room runs itself. You run the room."
          lede="Four moments from an ordinary Tuesday — each one handled inside the browser, each one on the record."
        />
        <div className="relative mx-auto max-w-3xl">
          <div aria-hidden className="absolute bottom-8 left-[27px] top-8 w-px bg-zinc-950/[0.1] sm:left-[31px]" />
          <ol className="space-y-6 sm:space-y-8">
            {DAY.map((d, i) => (
              <Reveal key={d.time} delay={i * 60} as="li">
                <div className="relative flex gap-5 sm:gap-7">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg sm:h-16 sm:w-16">
                    <d.icon className="h-6 w-6" />
                  </div>
                  <div className="pm-card flex-1 p-6 sm:p-7">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-mono text-[13px] font-bold tabular-nums text-[#6d28d9]">{d.time}</span>
                      <h3 className="pm-h-card">{d.title}</h3>
                    </div>
                    <p className="pm-body mt-3">{d.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
        <p className="pm-caption mt-8">An illustrated day — capabilities shown are live unless labeled otherwise.</p>
      </div>
    </section>
  );
}

/* ── Coaching depth: four manager moves ── */
const MOVES = [
  {
    icon: Ear,
    title: 'Listen live',
    body: 'Open the salesfloor, see who’s on a call, and listen in one click. Jump between calls without dropping the floor view.',
  },
  {
    icon: ClipboardCheck,
    title: 'Read the brief as it forms',
    body: 'The AI brief, buying signals, and sentiment build while the call is still live — context before you ever press play.',
  },
  {
    icon: Hand,
    title: 'Take over mid-call',
    body: 'When a conversation needs a senior voice, step in without dropping the prospect. One click, no awkward handoff.',
  },
  {
    icon: Trophy,
    title: 'Feedback tied to the transcript',
    body: 'Post-call notes land on the exact minute they matter. Leaderboards and disposition breakdowns show where coaching pays off.',
  },
];

export function CoachingDepth() {
  return (
    <section className="pm-section">
      <div className="pm-container">
        <SectionHead
          align="left"
          eyebrow="The manager’s toolkit"
          title="Four moves. Zero shoulder taps."
          lede="Everything a floor manager does — rebuilt for a team that dials from anywhere."
        />
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {MOVES.map((m, i) => (
            <Reveal key={m.title} delay={i * 80}>
              <article className="pm-card pm-card-hover flex h-full gap-5 p-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#6d28d9]/10 text-[#6d28d9]">
                  <m.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="pm-h-card">{m.title}</h3>
                  <p className="pm-body mt-2.5">{m.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="scale">
            <div className="mx-visual">
              <BrowserFrame url="app.growthdialer.com/salesfloor" badge={<LiveBadge label="6 reps dialing · live" />}>
                <TranscriptStream />
              </BrowserFrame>
            </div>
          </Reveal>
          <Reveal>
            <div className="flex items-center gap-3">
              <p className="pm-eyebrow !mb-0">Team analytics</p>
              <StatusDot status="live" />
            </div>
            <h2 className="pm-h-section mt-4">Coach from evidence, not anecdotes.</h2>
            <p className="pm-body mt-4 max-w-lg">
              Connect rate, talk time, sentiment, and dispositions — per rep, per day. Number health
              scoring watches every line the team dials from, so the floor’s connect rate is protected
              before it slips.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <BrowserFrame url="app.growthdialer.com/analytics" caption={null}>
                <AnalyticsSnap />
              </BrowserFrame>
              <BrowserFrame url="app.growthdialer.com/numbers" caption={null}>
                <NumberHealth />
              </BrowserFrame>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-12">
          <div className="flex flex-col items-center justify-between gap-5 rounded-[1.4rem] border border-amber-500/25 bg-amber-50/70 p-7 sm:flex-row sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
                <Ear className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[16.5px] font-semibold text-zinc-950">Whisper & barge coaching — coming soon.</h3>
                <p className="mt-1.5 max-w-xl text-[14.5px] leading-relaxed text-zinc-600">
                  Coach a rep mid-call without the prospect hearing. Today you get listen mode, takeover,
                  and structured post-call feedback.
                </p>
              </div>
            </div>
            <Link href="/features" className="pm-btn pm-btn-secondary shrink-0">
              See the floor plan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
