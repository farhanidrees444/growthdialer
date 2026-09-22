/*
 * Page-local sections for /features/ai ("The intelligence issue").
 * Owned by the features-cluster agent — do not edit from other agents.
 */
'use client';

import Link from 'next/link';
import { ArrowRight, AudioLines, Ban, FileSearch, Link2, ScanSearch, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { SectionHead } from '@/components/marketing/v2/Sections';
import { AiBrief, BrowserFrame, LiveBadge } from '@/components/marketing/v2/Mockups';
import { Aurora, Magnetic, Noise, Tilt3D } from '@/components/marketing/v2/motion';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { cn } from '@/lib/utils';
import { StatusDot } from './features-floorplan';

/* ── The brief, as a living document ── */
function BriefDocument() {
  const lines = [
    { k: 'Summary', v: 'Prospect compared us against their spreadsheet workflow. Wants pricing for 12 seats and a 2-week onboarding plan.' },
    { k: 'Objection', v: '"We tried a dialer before — reps hated the admin." → Answered: dispositions take one click, notes write themselves.' },
    { k: 'Buying signal', v: 'Asked about annual pricing twice and named a decision deadline: Thursday.' },
    { k: 'Next step', v: 'Send annual proposal for 12 seats by Thursday. Owner: rep.' },
  ];
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.05] backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <Sparkles className="h-4 w-4 text-violet-300" /> AI call brief
        </p>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
          <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" /> Written 8s after hang-up
        </span>
      </div>
      <div className="space-y-3 p-6">
        {lines.map((l, i) => (
          <Reveal key={l.k} delay={i * 160}>
            <div className="rounded-xl border border-white/[0.07] bg-zinc-950/60 p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-violet-300">{l.k}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-300">{l.v}</p>
            </div>
          </Reveal>
        ))}
        <Reveal delay={lines.length * 160}>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-zinc-950/60 p-4">
            <Link2 className="h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-[12.5px] text-zinc-400">Written from the transcript — read the source anytime.</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ── Dark editorial hero ── */
export function AiHero() {
  return (
    <section className="pm-dark">
      <div aria-hidden className="pm-dark-grid absolute inset-0" />
      <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[560px]" />
      <Aurora dark className="opacity-80" />
      <Noise className="mx-noise-light" opacity={0.06} />
      <div className="pm-container relative pb-20 pt-36 sm:pb-24 sm:pt-44">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <p className="pm-eyebrow !text-violet-300">AI platform · The intelligence issue</p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="pm-h-section-dark mt-4 !text-[clamp(2.6rem,5.4vw,4.2rem)]">
                AI that earns its seat on every call.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="pm-lead-dark mt-6 max-w-lg">
                We ship AI where it removes work: preparation before the call, analysis after it,
                coaching intelligence for managers. Nothing decorative — every pillar below is labeled
                live, built in, or in development.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Magnetic strength={14} className="w-full sm:w-auto">
                  <a href={APP_SIGNUP} className="pm-btn pm-btn-white w-full sm:w-auto">
                    Try it free <ArrowRight className="h-4 w-4" />
                  </a>
                </Magnetic>
                <Link href="/demo" className="pm-btn pm-btn-ghostlight">
                  See it in action
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-[12.5px] text-zinc-500">Three pillars live — voice agents</span>
                <StatusDot status="dev" dark />
              </div>
            </Reveal>
          </div>
          <Reveal delay={400} variant="scale">
            <Tilt3D maxX={7} maxY={10}>
              <BriefDocument />
            </Tilt3D>
            <p className="mt-4 text-center text-[12.5px] text-zinc-500">
              Illustrative brief with sample call data — not a real customer.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── What the AI actually does: before / during / after ── */
const STAGES = [
  {
    n: '01',
    when: 'Before the call',
    title: 'Walk in knowing the room.',
    body: 'The dialer surfaces company context, prior notes, and a one-line opener tuned to the lead — right where you call from. Prep stops being homework.',
    points: ['Company context pulled before each dial', 'Prior call notes and dispositions at a glance', 'Suggested opener, tuned to the lead'],
  },
  {
    n: '02',
    when: 'During the call',
    title: 'The transcript writes itself.',
    body: 'When a call is recorded, audio is transcribed as it happens — managers can follow along live from the salesfloor, and reps stay in the conversation.',
    points: ['Transcription on every recorded call', 'Sentiment and intent detected in real time', 'Managers follow along from the salesfloor'],
  },
  {
    n: '03',
    when: 'After the call',
    title: 'Hang up. The brief is already written.',
    body: 'A 30-second brief — summary, objections, buying signals, next steps — lands on the lead timeline before the rep reaches for the keyboard.',
    points: ['Key points, objections, and follow-ups extracted', 'Buying signals flagged the moment they happen', 'Brief linked to the transcript and recording'],
  },
];

export function AiStages() {
  return (
    <section className="pm-section bg-white">
      <div className="pm-container">
        <SectionHead
          align="left"
          eyebrow="What the AI actually does"
          title="Three moments. No mystique."
          lede="Transcription, summaries, and sentiment need a recording to work from. Recording is automatic on browser calls, with consent controls built in."
        />
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          {STAGES.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <article className="pm-card pm-card-hover flex h-full flex-col p-7 sm:p-8">
                <div className="flex items-baseline justify-between">
                  <span className="pm-step-num !text-[2.6rem]" aria-hidden>
                    {s.n}
                  </span>
                  <span className="rounded-full bg-[#6d28d9]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d28d9]">
                    {s.when}
                  </span>
                </div>
                <h3 className="pm-h-card mt-5">{s.title}</h3>
                <p className="pm-body mt-3 flex-1">{s.body}</p>
                <ul className="mt-6 space-y-2.5 border-t border-zinc-950/[0.07] pt-6">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-zinc-600">
                      <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#6d28d9]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Honesty panel: what the AI will never do ── */
export function AiHonesty() {
  const items = [
    {
      icon: FileSearch,
      title: 'Never a black box',
      body: 'Every brief links back to the transcript and recording it was written from. Reps read the 30-second version; managers verify against the source.',
    },
    {
      icon: Ban,
      title: 'Never invents numbers',
      body: 'The AI summarizes what was said — it doesn’t generate pipeline figures, forecasts, or scores out of thin air. Anything it flags, you can audit.',
    },
    {
      icon: AudioLines,
      title: 'Never replaces listening',
      body: 'Coaching still happens ear-to-conversation. The AI handles the paperwork so managers spend their time on the parts that need judgment.',
    },
  ];
  return (
    <section className="pm-section-tight bg-zinc-50/60">
      <div className="pm-container">
        <SectionHead
          eyebrow="The fine print, up front"
          title="What the AI will never do."
          lede="Three promises, in writing — because intelligence you can't audit isn't intelligence."
        />
        <div className="mx-auto grid max-w-5xl gap-4 sm:gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 100}>
              <article className="flex h-full flex-col rounded-[1.4rem] border border-zinc-950/[0.08] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                  <it.icon className="h-5 w-5" />
                </span>
                <h3 className="pm-h-card mt-5">{it.title}</h3>
                <p className="pm-body mt-3 flex-1">{it.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Coaching intelligence + voice agent roadmap ── */
export function AiRoadmap() {
  return (
    <section className="pm-section">
      <div className="pm-container">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <article className="pm-card flex h-full flex-col overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-9">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">Coaching intelligence</p>
                <StatusDot status="live" />
              </div>
              <h3 className="pm-h-group mt-4">Managers in the call — without the shoulder tap.</h3>
              <p className="pm-body mt-4 max-w-lg">
                On Growth and Pro, managers monitor active calls in listen mode and leave structured
                feedback after hang-up, tied to the transcript. Whisper and barge audio are coming soon.
              </p>
              <div className="mt-7 flex-1">
                <BrowserFrame url="app.growthdialer.com/calls/rec_8f3k2" badge={<LiveBadge label="Brief ready · 8s after hang-up" />} caption={null}>
                  <AiBrief />
                </BrowserFrame>
              </div>
              <Link href="/features/salesfloor" className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-[#6d28d9] transition-colors hover:text-zinc-950">
                Step onto the salesfloor <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-2">
            <article className="relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-zinc-950/[0.08] bg-zinc-950 p-7 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-9">
              <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[280px]" />
              <div className="relative flex h-full flex-col">
                <StatusDot status="dev" dark />
                <h3 className="pm-h-group mt-5 !text-white">AI Voice Agent</h3>
                <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-zinc-400">
                  The fourth pillar: an inbound AI receptionist that answers, qualifies, and routes
                  calls — 24/7 coverage without hiring overnight staff. In active development now.
                  We’ll announce it when it’s real, not before.
                </p>
                <div className={cn('mt-6 flex items-center gap-2 text-[13px] text-zinc-500')}>
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  Roadmap — not available yet
                </div>
                <Magnetic strength={14} className="w-full">
                  <Link href="/contact-sales" className="pm-btn pm-btn-ghostlight mt-6 w-full">
                    Talk to sales <ArrowRight className="h-4 w-4" />
                  </Link>
                </Magnetic>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
