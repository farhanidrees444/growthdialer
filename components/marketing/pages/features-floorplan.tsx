/*
 * Page-local sections for /features ("The floor plan").
 * Owned by the features-cluster agent — do not edit from other agents.
 */
'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CircleDot,
  Disc3,
  FileText,
  MousePointerClick,
  PhoneCall,
  Radio,
  ShieldCheck,
  Voicemail,
  Waves,
} from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { SectionHead } from '@/components/marketing/v2/Sections';
import {
  AiBrief,
  BrowserFrame,
  ClickToCall,
  ComplianceCard,
  LiveBadge,
  NumberHealth,
  ParallelDial,
  PowerQueue,
  TranscriptStream,
  Waveform,
} from '@/components/marketing/v2/Mockups';
import { Aurora, Counter, Magnetic, Noise, Tilt3D } from '@/components/marketing/v2/motion';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { cn } from '@/lib/utils';

/* ── Shared: page-specific final CTA band (FinalCta in v2 has no props) ── */
export function FeaturePageCta({
  eyebrow,
  title,
  lede,
  primaryLabel = 'Start free trial',
  secondary,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  primaryLabel?: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="pm-dark">
      <div aria-hidden className="pm-dark-grid absolute inset-0" />
      <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[420px]" />
      <Aurora dark className="opacity-70" />
      <Noise className="mx-noise-light" opacity={0.06} />
      <div className="pm-container relative py-24 text-center sm:py-32">
        <Reveal>
          <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">{eyebrow}</p>
          <h2 className="pm-h-section-dark mx-auto max-w-3xl">{title}</h2>
          <p className="pm-lead-dark mx-auto mt-5 max-w-xl">{lede}</p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic strength={14} className="w-full sm:w-auto">
              <a href={APP_SIGNUP} className="pm-btn pm-btn-white w-full sm:w-auto">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </a>
            </Magnetic>
            {secondary && (
              <Link href={secondary.href} className="pm-btn pm-btn-ghostlight w-full sm:w-auto">
                {secondary.label}
              </Link>
            )}
          </div>
          <p className="mt-8 text-[13.5px] text-zinc-500">7-day free trial · No credit card · Cancel anytime</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Shared: honest status dot ── */
export function StatusDot({ status, dark = false }: { status: 'live' | 'built-in' | 'soon' | 'dev'; dark?: boolean }) {
  const tones = {
    live: dark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-500/10 text-emerald-700',
    'built-in': dark ? 'bg-[#8b5cf6]/15 text-violet-300' : 'bg-[#6d28d9]/10 text-[#6d28d9]',
    soon: dark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-500/10 text-amber-700',
    dev: dark ? 'bg-white/10 text-zinc-300' : 'bg-zinc-950/[0.06] text-zinc-500',
  };
  const dots = {
    live: 'bg-emerald-500',
    'built-in': dark ? 'bg-[#8b5cf6]' : 'bg-[#6d28d9]',
    soon: 'bg-amber-500',
    dev: dark ? 'bg-zinc-400' : 'bg-zinc-400',
  };
  const label = status === 'live' ? 'Live' : status === 'built-in' ? 'Built in' : status === 'soon' ? 'Coming soon' : 'In development';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]',
        tones[status]
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dots[status], status === 'live' && 'pm-pulse-dot')} />
      {label}
    </span>
  );
}

/* ══ PAGE 1 — /features ═══════════════════════════════════════════ */

/* ── Hero: the floor plan ── */
export function FloorplanHero() {
  const pillars = [
    { n: 'Dialing', d: 'Power, parallel, click-to-call', status: 'live' as const },
    { n: 'Intelligence', d: 'Briefs, transcripts, analytics', status: 'live' as const },
    { n: 'Coaching', d: 'Listen mode + post-call feedback', status: 'live' as const },
    { n: 'Voice agents', d: 'Inbound AI receptionist', status: 'dev' as const },
  ];
  return (
    <section className="relative overflow-hidden px-5 pb-14 pt-36 sm:pb-16 sm:pt-44 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Aurora />
        <Noise />
        <div className="pm-dot-grid pm-fade-hero absolute inset-0 opacity-70" />
        <div className="pm-glow-top absolute inset-x-0 top-0 h-[420px]" />
      </div>
      <div className="pm-container relative">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="pm-eyebrow pm-eyebrow-centered">Features · The floor plan</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="pm-h-display">Every part of the call, under one roof.</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="pm-lead mx-auto mt-6 max-w-2xl">
              Dialing, intelligence, coaching, and number health — one calling layer for your team.
              Every capability below is labeled exactly as it ships.
            </p>
          </Reveal>
        </div>

        <Reveal delay={240} className="mx-auto mt-10 max-w-3xl">
          <div className="pm-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-950/[0.07] px-6 py-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">Platform map</p>
              <p className="text-[12px] font-semibold text-zinc-500">Four pillars · Three live — one in development</p>
            </div>
            <ul className="divide-y divide-zinc-950/[0.06]">
              {pillars.map((p, i) => (
                <li key={p.n}>
                  <a href={`#${p.n === 'Coaching' ? 'coaching-strip' : p.n === 'Voice agents' ? 'roadmap' : p.n === 'Dialing' ? 'dialing' : 'intelligence'}`} className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-950/[0.02]">
                    <span className="pm-step-num !text-[1.6rem]" aria-hidden>
                      0{i + 1}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15.5px] font-semibold text-zinc-950">{p.n}</span>
                      <span className="block text-[13.5px] text-zinc-500">{p.d}</span>
                    </span>
                    <StatusDot status={p.status} />
                    <ArrowRight className="h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-1 group-hover:text-[#6d28d9]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={320} className="mt-9 text-center">
          <Magnetic strength={14} className="inline-block">
            <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
              Start free trial <ArrowRight className="h-4 w-4" />
            </a>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Sticky chapter nav ── */
const CHAPTERS = [
  { href: '#dialing', label: '01 · Dialing', status: 'live' as const },
  { href: '#intelligence', label: '02 · Intelligence', status: 'live' as const },
  { href: '#deliverability', label: '03 · Deliverability', status: 'live' as const },
];

export function ChapterNav() {
  return (
    <div className="sticky top-[92px] z-40 border-b border-zinc-950/[0.07] bg-white/85 backdrop-blur-xl">
      <div className="pm-container flex items-center gap-2 overflow-x-auto py-3">
        <span className="mr-1 hidden shrink-0 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 sm:block">
          Chapters
        </span>
        {CHAPTERS.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="group flex shrink-0 items-center gap-2.5 rounded-full border border-zinc-950/[0.08] px-4 py-2 text-[13.5px] font-semibold text-zinc-600 transition-colors hover:border-[#6d28d9]/40 hover:text-zinc-950"
          >
            {c.label}
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                c.status === 'live' ? 'bg-emerald-500 pm-pulse-dot' : 'bg-zinc-300'
              )}
            />
          </a>
        ))}
        <a
          href={APP_SIGNUP}
          className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#6d28d9] sm:inline-flex"
        >
          Start free trial <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

/* ── Chapter 01 · Dialing — bento grid ── */
export function DialingBento() {
  return (
    <section id="dialing" className="pm-section scroll-mt-32">
      <div className="pm-container">
        <SectionHead
          align="left"
          eyebrow="Chapter 01 · Dialing"
          title="Three ways to call. One rhythm."
          lede="Pick the mode that fits the moment — the workflow underneath never changes. Dispositions, notes, and logging happen between rings, not after hours."
        />
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-6">
          {/* Power dialer — hero cell */}
          <Reveal className="lg:col-span-4">
            <article className="pm-card group flex h-full flex-col overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6d28d9]/10 text-[#6d28d9]">
                  <PhoneCall className="h-5 w-5" />
                </span>
                <StatusDot status="live" />
              </div>
              <h3 className="pm-h-card mt-5">Power dialer</h3>
              <p className="pm-body mt-3 max-w-md">Back-to-back calls with zero dead air. The next number loads the second you disposition — your rep never touches a phone keypad.</p>
              <ul className="mt-5 space-y-2.5">
                {['One-click dispositions keep the rhythm unbroken', 'Every call logged automatically — no manual entry', 'Local presence dialing lifts pickup rates'].map((b) => (
                  <li key={b} className="pm-tick !text-[14px]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Tilt3D maxX={7} maxY={10} className="mt-7 flex-1">
                <BrowserFrame url="app.growthdialer.com/dialer" badge={<LiveBadge label="Power session · live" />}>
                  <PowerQueue />
                </BrowserFrame>
              </Tilt3D>
            </article>
          </Reveal>

          {/* Parallel dialer — tall cell */}
          <Reveal delay={100} className="lg:col-span-2">
            <article className="pm-card flex h-full flex-col overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6d28d9]/10 text-[#6d28d9]">
                  <Waves className="h-5 w-5" />
                </span>
                <StatusDot status="live" />
              </div>
              <h3 className="pm-h-card mt-5">Parallel dialer</h3>
              <p className="pm-h-display mt-2 !text-[3.2rem] text-[#6d28d9]">
                <Counter to={5} />
              </p>
              <p className="pm-body mt-1">lines, one conversation. On Pro, five prospects ring at once — AI answering-machine detection drops your voicemail and moves on. You only ever talk to humans.</p>
              <div className="mt-6 flex-1 rounded-2xl border border-zinc-950/[0.07] bg-zinc-50/70 p-5">
                <BrowserFrame url="app.growthdialer.com/dialer/parallel" badge={<LiveBadge label="Multi-line · live" />} caption={null}>
                  <ParallelDial />
                </BrowserFrame>
              </div>
            </article>
          </Reveal>

          {/* Click-to-call */}
          <Reveal className="lg:col-span-3">
            <article className="pm-card flex h-full flex-col overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6d28d9]/10 text-[#6d28d9]">
                  <MousePointerClick className="h-5 w-5" />
                </span>
                <StatusDot status="live" />
              </div>
              <h3 className="pm-h-card mt-5">Click-to-call</h3>
              <p className="pm-body mt-3">Your browser is the phone. No desk phone, no softphone app — click any number in your lead list and you’re talking in seconds over WebRTC, with recording on every call.</p>
              <div className="mt-6 flex-1">
                <BrowserFrame url="app.growthdialer.com/leads" caption={null}>
                  <ClickToCall />
                </BrowserFrame>
              </div>
            </article>
          </Reveal>

          {/* Dispositions stat cell */}
          <Reveal delay={100} className="lg:col-span-3">
            <article className="relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#6d28d9]/20 bg-gradient-to-br from-[#6d28d9]/[0.07] via-white to-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
              <div className="pm-glow-violet pointer-events-none absolute inset-0" aria-hidden />
              <div className="relative">
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#6d28d9]">Dispositions</p>
                <p className="pm-stat-num mt-4">
                  <Counter to={8} prefix="0" />
                </p>
                <p className="pm-body mt-3 max-w-sm">One-click outcomes end every call — connected, voicemail, callback, DNC, and more. The next number is already ringing before the note is finished.</p>
                <p className="pm-caption mt-6 !text-left">Every disposition is written to the lead timeline automatically.</p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Chapter 02 · Intelligence — dark editorial band ── */
export function IntelligenceBand() {
  const points = [
    {
      icon: Disc3,
      title: 'Transcribed as it happens',
      body: 'Every recorded call becomes searchable text, linked to the lead and the recording.',
    },
    {
      icon: Radio,
      title: 'Buying signals, flagged',
      body: 'Budget talk, timelines, competitor mentions — surfaced the moment they occur.',
    },
    {
      icon: FileText,
      title: 'Scorecards that write themselves',
      body: 'Talk time, sentiment, and topic trends per rep — the patterns your top performers already know.',
    },
  ];
  return (
    <section id="intelligence" className="pm-dark scroll-mt-24">
      <div aria-hidden className="pm-dark-grid absolute inset-0" />
      <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[520px]" />
      <div className="pm-container relative py-24 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="pm-eyebrow !text-violet-300">Chapter 02 · Intelligence</p>
            <h2 className="pm-h-section-dark mt-4">Hang up. Your notes are already written.</h2>
            <p className="pm-lead-dark mt-5 max-w-lg">
              Every recorded call is distilled into a 30-second brief — summary, objections, next steps —
              ready before your rep reaches for the keyboard. Briefs live on the lead timeline, with the
              recording attached, so nothing depends on memory.
            </p>
            <div className="mt-10 space-y-6">
              {points.map((p, i) => (
                <Reveal key={p.title} delay={i * 90}>
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-violet-300">
                      <p.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[16px] font-semibold text-white">{p.title}</h3>
                      <p className="mt-1 text-[14.5px] leading-relaxed text-zinc-400">{p.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={200}>
              <Link href="/features/ai" className="mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-violet-300 transition-colors hover:text-violet-200">
                Read the intelligence issue <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </Reveal>
          <Reveal delay={120} variant="scale">
            <Tilt3D maxX={7} maxY={10}>
              <div className="rounded-[1.6rem] border border-white/10 bg-white p-2 shadow-[0_40px_120px_-40px_rgba(124,58,237,0.45)]">
                <BrowserFrame url="app.growthdialer.com/calls/rec_8f3k2" badge={<LiveBadge label="Brief ready · 8s after hang-up" />}>
                  <AiBrief />
                </BrowserFrame>
              </div>
            </Tilt3D>
            <p className="mt-5 text-center text-[12.5px] text-zinc-500">Live transcription, as the manager sees it:</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <TranscriptStream />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Chapter 03 · Deliverability — horizontal telemetry rail ── */
export function DeliverabilityRail() {
  return (
    <section id="deliverability" className="pm-section scroll-mt-32 bg-zinc-50/60">
      <div className="pm-container">
        <SectionHead
          align="left"
          eyebrow="Chapter 03 · Deliverability"
          title="Protect every number you dial from."
          lede="Spam-risk scoring, reputation monitoring, and compliance records run continuously in the background. Scroll the rail — this is what always-on looks like."
        />
      </div>
      <Reveal>
        <div className="overflow-x-auto pb-4 [scrollbar-width:thin]">
          <div className="flex w-max snap-x snap-mandatory gap-5 px-5 sm:px-8 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            <article className="pm-card w-[86vw] max-w-[520px] shrink-0 snap-start overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[480px]">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">Number health</p>
                <StatusDot status="live" />
              </div>
              <h3 className="pm-h-card mt-3">Know a number is dying before it costs you connects.</h3>
              <div className="mt-5">
                <NumberHealth />
              </div>
            </article>
            <article className="pm-card w-[86vw] max-w-[520px] shrink-0 snap-start overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[480px]">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">DNC & records</p>
                <StatusDot status="live" />
              </div>
              <h3 className="pm-h-card mt-3">Every call, on the record.</h3>
              <p className="pm-body mt-3">DNC flags remove leads from every queue instantly. Recordings, dispositions, and consent records live on the lead timeline.</p>
              <div className="mt-5">
                <BrowserFrame url="app.growthdialer.com/leads/lead-4821" caption={null}>
                  <ComplianceCard />
                </BrowserFrame>
              </div>
            </article>
            <article className="pm-card w-[86vw] max-w-[380px] shrink-0 snap-start p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[380px]">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">Recording vault</p>
                <StatusDot status="live" />
              </div>
              <h3 className="pm-h-card mt-3">Automatic on every browser call.</h3>
              <ul className="mt-5 space-y-3">
                {[
                  { icon: Disc3, t: 'Recording starts with the dial', d: 'Consent controls built in — no toggle-hunting.' },
                  { icon: Voicemail, t: 'Voicemail drops, logged', d: 'AI answering-machine detection leaves your message and moves on.' },
                  { icon: ShieldCheck, t: 'Searchable by lead', d: 'Find any call by lead, rep, date, or disposition.' },
                ].map((r) => (
                  <li key={r.t} className="flex gap-3.5 rounded-2xl border border-zinc-950/[0.06] bg-zinc-50/70 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6d28d9]/10 text-[#6d28d9]">
                      <r.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-[14.5px] font-semibold text-zinc-950">{r.t}</span>
                      <span className="block text-[13.5px] text-zinc-500">{r.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="flex w-[86vw] max-w-[380px] shrink-0 snap-start flex-col justify-between rounded-[1.4rem] bg-zinc-950 p-7 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[380px]">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">Spam-risk watch</p>
                  <span className="pm-pulse-dot h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <h3 className="mt-3 font-display text-[1.55rem] font-semibold leading-tight tracking-[-0.02em]">Always on. Always watching.</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-zinc-400">Carrier reputation monitoring scores every number you own — continuously. Rotate a number before deliverability drops, not after.</p>
              </div>
              <div className="mt-8">
                <Waveform bars={36} color="#8b5cf6" />
                <p className="pm-caption mt-3 !text-left !text-zinc-500">Live reputation signal · illustrative</p>
              </div>
            </article>
          </div>
        </div>
      </Reveal>
      <div className="pm-container">
        <p className="pm-caption mt-2 flex items-center gap-2 !text-left sm:justify-end">
          <CircleDot className="h-3.5 w-3.5" /> Scroll the rail — four instruments, one always-on system
        </p>
      </div>
    </section>
  );
}

/* ── Coaching strip (chapter 04 · compact, reuses salesfloor depth) ── */
export function CoachingStrip() {
  return (
    <section id="coaching-strip" className="pm-section scroll-mt-32">
      <div className="pm-container">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="scale">
            <div className="mx-visual">
              <BrowserFrame url="app.growthdialer.com/salesfloor" badge={<LiveBadge label="Manager listening · live" />}>
                <TranscriptStream />
              </BrowserFrame>
            </div>
          </Reveal>
          <Reveal>
            <div className="flex items-center gap-3">
              <p className="pm-eyebrow !mb-0">Chapter 04 · Coaching</p>
              <StatusDot status="live" />
            </div>
            <h2 className="pm-h-section mt-4">Coach the call, not the recording.</h2>
            <p className="pm-body mt-4 max-w-lg">
              Managers listen live, read the transcript as it forms, and leave structured feedback after
              hang-up — tied to the exact minute it matters. Whisper and barge audio are coming soon.
            </p>
            <ul className="mt-6 space-y-3">
              {['Listen to any live call from the salesfloor', 'Post-call feedback tied to the transcript', 'Take over a call mid-conversation when it counts'].map((b, i) => (
                <Reveal as="li" key={b} delay={i * 70} className="pm-tick">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {b}
                </Reveal>
              ))}
            </ul>
            <Link href="/features/salesfloor" className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[#6d28d9] transition-colors hover:text-zinc-950">
              Step onto the salesfloor <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Voice agent roadmap card (honest "one in development" pillar) ── */
export function VoiceAgentRoadmap() {
  return (
    <section id="roadmap" className="pm-section-tight scroll-mt-32">
      <div className="pm-container-narrow">
        <Reveal>
          <div className="pm-card relative overflow-hidden p-8 text-center sm:p-12">
            <div className="pm-glow-violet pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative">
              <StatusDot status="dev" />
              <h2 className="pm-h-group mt-5">AI Voice Agent</h2>
              <p className="pm-body mx-auto mt-4 max-w-xl">
                The fourth pillar: an inbound AI receptionist that answers, qualifies, and routes calls —
                24/7 coverage without hiring overnight staff. It’s in active development, and we won’t
                sell it until it’s ready.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic strength={14}>
                  <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </a>
                </Magnetic>
                <Link href="/contact-sales" className="pm-btn pm-btn-secondary">
                  Talk to sales
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
