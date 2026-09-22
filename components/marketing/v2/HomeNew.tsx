'use client';

/**
 * Homepage enhancement sections (2026-09-23).
 * New content sections built strictly on the existing pm-* design system:
 * trust strip, problem→solution, intent roadmap, AI agents (coming soon),
 * omnichannel roadmap, why-GrowthDialer, live-vs-roadmap.
 *
 * Rules: one H1 stays on the page (these use H2 via SectionHead);
 * roadmap items are never presented as live; no fake companies, people,
 * logos, or statistics; all loops are transform/opacity, pause off-screen,
 * and freeze under prefers-reduced-motion.
 */
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUp,
  Bot,
  Check,
  Mail,
  MessageSquare,
  Mic,
  Phone,
  PhoneCall,
  Plug2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/ui/reveal';
import { SectionHead } from './Sections';
import { Marquee, useCycle, useIsCoarsePointer } from './motion';

/* ══ 1 · Trust / platform capability strip ═══════════════ */
const CAPABILITIES = [
  'Power Dialing',
  'Parallel Dialing',
  'AI Call Intelligence',
  'Call Recording',
  'Live Coaching',
  'Number Health',
];

export function TrustStrip() {
  const coarse = useIsCoarsePointer();
  return (
    <section aria-label="Platform capabilities" className="pm-section-tight pm-divider bg-white">
      <div className="pm-container">
        <SectionHead
          eyebrow="Built for modern outbound"
          title="Everything your reps need to turn calls into pipeline."
          className="!mb-10 sm:!mb-12"
        />
        <Reveal delay={120}>
          <Marquee
            items={CAPABILITIES}
            duration={coarse ? 54 : 36}
            label="GrowthDialer platform capabilities"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ══ 2 · Problem → solution workflow ═════════════════════ */
const OLD_STEPS = [
  'Find the next number',
  'Dial manually',
  'Wait through voicemail',
  'Write notes',
  'Update CRM',
  'Schedule follow-up',
  'Repeat',
];
const NEW_STEPS = [
  'Queue ready',
  'Power or parallel dial',
  'Connect with humans',
  'Conversation captured',
  'AI creates call brief',
  'Outcome logged',
  'Next call',
];

function WorkflowPanel({
  label,
  steps,
  active,
  tone,
}: {
  label: string;
  steps: string[];
  active: number;
  tone: 'old' | 'new';
}) {
  const isNew = tone === 'new';
  return (
    <div
      className={cn(
        'h-full rounded-[1.4rem] border p-6 sm:p-8',
        isNew
          ? 'border-[#6d28d9]/25 bg-white shadow-[0_24px_64px_-32px_rgba(109,40,217,0.35)]'
          : 'border-zinc-950/[0.07] bg-zinc-50/70'
      )}
    >
      <p
        className={cn(
          'font-mono text-[11px] font-semibold uppercase tracking-[0.2em]',
          isNew ? 'text-[#6d28d9]' : 'text-zinc-400'
        )}
      >
        {label}
      </p>
      <ol className="mt-6 space-y-1">
        {steps.map((s, i) => {
          const isActive = i === active;
          return (
            <li
              key={s}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] transition-all duration-500',
                isActive
                  ? isNew
                    ? 'bg-[#6d28d9]/[0.07] font-semibold text-zinc-950'
                    : 'bg-zinc-950/[0.05] font-semibold text-zinc-900'
                  : 'text-zinc-400'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-all duration-500',
                  isActive
                    ? isNew
                      ? 'bg-[#6d28d9] text-white'
                      : 'bg-zinc-900 text-white'
                    : 'bg-zinc-950/[0.06] text-zinc-400'
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              {s}
              {isActive && isNew && (
                <span className="pm-pulse-dot ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#6d28d9]" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ProblemSolution() {
  const { step, ref, reduced } = useCycle(OLD_STEPS.length, 1400);
  const active = reduced ? -1 : step;
  return (
    <section className="pm-section pm-divider bg-white">
      <div ref={ref} className="pm-container">
        <SectionHead
          eyebrow="Why GrowthDialer"
          title={
            <>
              Your reps were hired to sell.
              <br className="hidden sm:block" /> Not dial numbers and write notes.
            </>
          }
          lede="GrowthDialer removes the repetitive work around every conversation so your team can spend more time talking to prospects."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal className="h-full">
            <WorkflowPanel label="Traditional workflow" steps={OLD_STEPS} active={active} tone="old" />
          </Reveal>
          <Reveal delay={120} className="h-full">
            <WorkflowPanel label="With GrowthDialer" steps={NEW_STEPS} active={active} tone="new" />
          </Reveal>
        </div>
        {!reduced && (
          <div
            className="mx-auto mt-8 h-1 max-w-md overflow-hidden rounded-full bg-zinc-950/[0.07]"
            role="progressbar"
            aria-label="Workflow comparison cycle"
            aria-valuemin={1}
            aria-valuemax={OLD_STEPS.length}
            aria-valuenow={step + 1}
          >
            <div
              className="h-full rounded-full bg-[#6d28d9] transition-all duration-500 ease-linear"
              style={{ width: `${((step + 1) / OLD_STEPS.length) * 100}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ══ 3 · AI sales intelligence — ROADMAP ══════════════════ */
const INTENT_CARDS = [
  {
    title: 'Intent Signals',
    body: 'Surface signals from conversations and engagement that suggest real buying interest.',
  },
  {
    title: 'AI Lead Prioritization',
    body: 'Help reps focus on higher-priority opportunities instead of treating every lead the same.',
  },
  {
    title: 'Conversation Memory',
    body: 'Carry context, objections, and next steps forward so every new conversation starts informed.',
  },
  {
    title: 'Next Best Action',
    body: 'Turn conversation intelligence into a clear recommended follow-up.',
  },
];

/* Abstract sample queue — no company or person names, ever. */
const QUEUE_SEED = [
  { id: 'Lead 4821', meta: 'SaaS · Decision maker', intent: 'Warm', note: 'Follow-up due' },
  { id: 'Lead 7734', meta: 'Services · Team lead', intent: 'Medium', note: 'Engaged' },
  { id: 'Lead 2098', meta: 'Fintech · Manager', intent: 'Medium', note: 'Viewed pricing' },
];

function IntentQueue() {
  /* 6 phases × 2s = 12s loop */
  const { step: phase, ref, reduced } = useCycle(6, 2000);
  const p = reduced ? -1 : phase;
  const showNew = p >= 0;
  const analyzing = p === 1;
  const scored = p >= 2;
  const prioritized = p >= 3;
  const actionShown = p >= 4;

  const intentBadge = (intent: string) => (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em]',
        intent === 'High'
          ? 'bg-[#6d28d9]/10 text-[#6d28d9]'
          : intent === 'Warm'
            ? 'bg-amber-500/10 text-amber-700'
            : 'bg-zinc-950/[0.05] text-zinc-500'
      )}
    >
      {intent}
    </span>
  );

  return (
    <div ref={ref} className="overflow-hidden rounded-[1.4rem] border border-zinc-950/[0.08] bg-white shadow-[0_32px_64px_-32px_rgba(9,9,11,0.25)]">
      <div className="flex items-center justify-between border-b border-zinc-950/[0.06] px-5 py-4">
        <p className="text-[13px] font-semibold text-zinc-900">Priority queue</p>
        <span className="rounded-full border border-dashed border-zinc-950/20 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-400">
          Roadmap preview
        </span>
      </div>
      <ul className="space-y-2 p-4 sm:p-5">
        {QUEUE_SEED.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-950/[0.06] bg-zinc-50/60 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-zinc-900">{r.id}</p>
              <p className="truncate text-[12px] text-zinc-500">{r.meta} · {r.note}</p>
            </div>
            {intentBadge(r.intent)}
          </li>
        ))}

        {/* the animated lead: enters → analyzed → scored → prioritized */}
        <li
          className={cn(
            'rounded-xl border px-4 py-3 transition-all duration-700',
            showNew ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
            prioritized
              ? 'border-[#6d28d9]/40 bg-[#6d28d9]/[0.05] shadow-[0_16px_40px_-20px_rgba(109,40,217,0.5)]'
              : 'border-zinc-950/[0.06] bg-white'
          )}
          aria-hidden={!showNew}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[13.5px] font-semibold text-zinc-900">
                Lead 9156
                {prioritized && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#6d28d9] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                    <ArrowUp className="h-3 w-3" aria-hidden /> Priority #1
                  </span>
                )}
              </p>
              <p className="truncate text-[12px] text-zinc-500">
                {analyzing ? 'Analyzing conversation signals…' : 'Logistics · Owner · Pricing discussed'}
              </p>
            </div>
            {analyzing ? (
              <span className="pm-pulse-dot h-2 w-2 rounded-full bg-[#6d28d9]" aria-label="Analyzing" />
            ) : (
              intentBadge(scored ? 'High' : 'New')
            )}
          </div>
          <div
            className={cn(
              'grid transition-all duration-500',
              actionShown ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className="overflow-hidden">
              <p className="flex items-center gap-2 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-[12.5px] font-medium text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Recommended: call now — pricing discussed, budget confirmed
              </p>
            </div>
          </div>
        </li>
      </ul>
      <p className="border-t border-zinc-950/[0.06] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-zinc-400">
        {reduced ? 'Sample visualization' : `Live simulation · phase ${phase + 1} of 6`}
      </p>
    </div>
  );
}

export function IntentRoadmap() {
  return (
    <section className="pm-section pm-divider bg-zinc-50/60">
      <div className="pm-container">
        <SectionHead
          eyebrow="Sales intelligence · Roadmap"
          title="Know who deserves the next call."
          lede="GrowthDialer's intelligence layer is being designed to help teams recognize buying signals, prioritize conversations, and surface the prospects that deserve attention first."
        />
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="grid gap-4 sm:grid-cols-2">
            {INTENT_CARDS.map((c, i) => (
              <Reveal key={c.title} delay={i * 80} className="h-full">
                <article className="pm-lift h-full rounded-[1.4rem] border border-zinc-950/[0.07] bg-white p-6">
                  <h3 className="pm-h-card">{c.title}</h3>
                  <p className="pm-body mt-3 !text-[14px]">{c.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal delay={140} variant="scale">
            <IntentQueue />
          </Reveal>
        </div>
        <Reveal delay={200}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-[13.5px] text-zinc-500">
            Sales intelligence is on the roadmap — not live today.{' '}
            <Link href="/roadmap" className="font-semibold text-[#6d28d9] underline-offset-4 hover:underline">
              Follow the build <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ══ 4 · AI voice agents — COMING SOON ════════════════════ */
const AGENT_CARDS = [
  {
    title: 'AI Sales Agent',
    body: 'Designed for qualification, follow-up, and repetitive outbound conversations.',
    status: 'Coming soon',
  },
  {
    title: 'AI Receptionist',
    body: 'Designed to answer inbound calls when your team is unavailable and route conversations intelligently.',
    status: 'Coming soon',
  },
  {
    title: 'Human Handoff',
    body: 'Designed to transfer qualified or complex conversations to the right human rep.',
    status: 'Roadmap',
  },
];

function VoiceLoop() {
  /* 5 phases × 2.2s = 11s loop */
  const { step: phase, ref, reduced } = useCycle(5, 2200);
  const p = reduced ? 4 : phase;
  const bars = 24;

  return (
    <div ref={ref} className="overflow-hidden rounded-[1.4rem] border border-zinc-950/[0.08] bg-white shadow-[0_32px_64px_-32px_rgba(9,9,11,0.25)]">
      <div className="flex items-center justify-between border-b border-zinc-950/[0.06] px-5 py-4">
        <p className="flex items-center gap-2.5 text-[13px] font-semibold text-zinc-900">
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', p >= 0 && !reduced ? 'bg-[#6d28d9] text-white' : 'bg-zinc-950/[0.06] text-zinc-400')}>
            <PhoneCall className="h-3.5 w-3.5" aria-hidden />
          </span>
          Inbound call · sample
        </p>
        <span className="rounded-full border border-dashed border-zinc-950/20 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-400">
          Coming soon
        </span>
      </div>

      {/* waveform */}
      <div className="border-b border-zinc-950/[0.06] px-5 py-5" aria-hidden>
        <div className="flex h-12 items-center justify-center gap-1">
          {Array.from({ length: bars }).map((_, i) => (
            <span
              key={i}
              className={cn('pm-wave-bar w-1 rounded-full', p >= 1 ? 'bg-[#6d28d9]' : 'bg-zinc-950/[0.1]')}
              style={{ animationDelay: `${(i % 8) * 0.12}s`, animationPlayState: p >= 1 && !reduced ? 'running' : 'paused' }}
            />
          ))}
        </div>
      </div>

      {/* transcript */}
      <div className="space-y-2.5 p-5">
        <div className={cn('transition-all duration-500', p >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')}>
          <p className="rounded-xl rounded-tl-sm bg-[#6d28d9]/[0.07] px-4 py-2.5 text-[13px] text-zinc-700">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6d28d9]">AI&nbsp;·&nbsp;</span>
            Thanks for calling — are you looking to speed up your outbound?
          </p>
        </div>
        <div className={cn('transition-all delay-300 duration-500', p >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')}>
          <p className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-zinc-950/[0.05] px-4 py-2.5 text-[13px] text-zinc-700">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-zinc-400">Caller&nbsp;·&nbsp;</span>
            Yes — we need more qualified meetings per week.
          </p>
        </div>
        <div className={cn('grid transition-all duration-500', p >= 3 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
          <div className="overflow-hidden">
            <p className="flex items-center gap-2 rounded-lg bg-amber-500/[0.1] px-3 py-2 text-[12.5px] font-medium text-amber-800">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Qualification signal detected — high intent
            </p>
          </div>
        </div>
        <div className={cn('grid transition-all duration-500', p >= 4 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
          <div className="overflow-hidden">
            <p className="flex items-center gap-2 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-[12.5px] font-medium text-emerald-800">
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Handing off to your AE — full context attached
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiAgents() {
  return (
    <section className="pm-section pm-divider bg-white">
      <div className="pm-container">
        <SectionHead
          eyebrow="AI voice · Coming soon"
          title="Human reps when it matters. AI when it doesn't."
          lede="GrowthDialer is expanding toward AI-assisted voice workflows that can handle repetitive conversations while keeping humans in control of important opportunities."
        />
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal delay={140} variant="scale" className="order-2 lg:order-1">
            <VoiceLoop />
          </Reveal>
          <div className="order-1 grid gap-4 lg:order-2">
            {AGENT_CARDS.map((c, i) => (
              <Reveal key={c.title} delay={i * 80} className="h-full">
                <article className="pm-lift flex h-full flex-col rounded-[1.4rem] border border-zinc-950/[0.07] bg-white p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="pm-h-card">{c.title}</h3>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]',
                        c.status === 'Roadmap'
                          ? 'bg-zinc-950/[0.05] text-zinc-500'
                          : 'border border-dashed border-[#6d28d9]/40 bg-[#6d28d9]/[0.06] text-[#6d28d9]'
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="pm-body mt-3 !text-[14px]">{c.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={200}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-[13.5px] text-zinc-500">
            Autonomous AI calling is not live — these workflows are in development, with humans always in control of handoff.{' '}
            <Link href="/roadmap" className="font-semibold text-[#6d28d9] underline-offset-4 hover:underline">
              See the roadmap <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ══ 5 · Omnichannel — ROADMAP ════════════════════════════ */
const CHANNELS = [
  { name: 'Voice', icon: Phone },
  { name: 'SMS', icon: MessageSquare },
  { name: 'Email', icon: Mail },
  { name: 'AI', icon: Bot },
  { name: 'CRM', icon: Plug2 },
];
const FLOW_STEPS = [
  'Call attempted',
  'No answer',
  'Follow-up triggered',
  'Prospect responds',
  'Intent detected',
  'Rep notified',
];

function ChannelFlow() {
  /* 6 phases × 1.8s ≈ 11s loop */
  const { step: phase, ref, reduced } = useCycle(FLOW_STEPS.length, 1800);
  const p = reduced ? 5 : phase;
  const activeNode = Math.min(CHANNELS.length - 1, Math.floor((p / FLOW_STEPS.length) * CHANNELS.length));

  return (
    <div ref={ref} className="relative overflow-hidden rounded-[1.6rem] bg-zinc-950 p-6 text-white sm:p-10">
      <div aria-hidden className="pm-dark-grid absolute inset-0 opacity-60" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Connected outreach
          </p>
          <span className="rounded-full border border-dashed border-white/20 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            Roadmap
          </span>
        </div>

        {/* nodes */}
        <div className="mt-8 flex items-start justify-between gap-1 sm:gap-2" role="list" aria-label="Outreach channels">
          {CHANNELS.map((c, i) => {
            const Icon = c.icon;
            const isActive = i === activeNode;
            const isPast = i < activeNode;
            return (
              <div key={c.name} role="listitem" className="relative flex flex-1 flex-col items-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute right-1/2 top-6 h-px w-full -translate-y-1/2 bg-white/10 sm:top-7"
                  >
                    <span
                      className={cn(
                        'block h-full bg-[#8b5cf6] transition-all duration-700',
                        i <= activeNode ? 'w-full opacity-80' : 'w-0 opacity-0'
                      )}
                    />
                  </span>
                )}
                <span
                  className={cn(
                    'relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500 sm:h-14 sm:w-14',
                    isActive
                      ? 'border-[#8b5cf6]/60 bg-[#6d28d9] text-white shadow-[0_0_28px_-4px_rgba(139,92,246,0.7)]'
                      : isPast
                        ? 'border-white/20 bg-white/[0.08] text-zinc-200'
                        : 'border-white/10 bg-white/[0.03] text-zinc-500'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {isActive && !reduced && (
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#8b5cf6]">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#8b5cf6] opacity-60" />
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-500 sm:text-[11px]',
                    isActive ? 'text-white' : 'text-zinc-500'
                  )}
                >
                  {c.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* current flow step */}
        <div className="mt-8 flex min-h-[52px] items-center justify-center" aria-live="polite">
          <p key={p} className="pm-fade-step rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-[14px] font-medium text-zinc-200">
            <span className="mr-2 font-mono text-[11px] text-[#a78bfa]">{String(p + 1).padStart(2, '0')}</span>
            {FLOW_STEPS[p]}
          </p>
        </div>
        <p className="mt-4 text-center text-[13px] text-zinc-500">
          One prospect. One conversation history. Every touchpoint connected.
        </p>
      </div>
    </div>
  );
}

export function Omnichannel() {
  return (
    <section className="pm-section pm-divider bg-white">
      <div className="pm-container">
        <SectionHead
          eyebrow="Connected outreach · Roadmap"
          title="One prospect. One conversation history."
          lede="The GrowthDialer roadmap extends beyond calls toward connected sales communication — one place to understand what happened, and what should happen next."
        />
        <Reveal variant="scale">
          <ChannelFlow />
        </Reveal>
      </div>
    </section>
  );
}

/* ══ 6 · Why GrowthDialer — before / during / after ═══════ */
const PILLARS = [
  {
    stage: 'Before the call',
    title: 'Walk in prepared',
    body: 'Lead context, history, and preparation — the brief is ready before you dial.',
    chip: 'Context loaded',
  },
  {
    stage: 'During the call',
    title: 'Stay in the conversation',
    body: 'Fast dialing, recording, and live intelligence while you talk.',
    chip: 'Live transcript',
  },
  {
    stage: 'After the call',
    title: 'Never write notes again',
    body: 'Transcripts, summaries, outcomes, and next steps — filed automatically.',
    chip: 'AI brief ready',
  },
];

export function WhyGrowthDialer() {
  /* 3 phases × 2.4s ≈ 7s loop */
  const { step: phase, ref, reduced } = useCycle(PILLARS.length, 2400);
  const p = reduced ? 2 : phase;

  return (
    <section className="pm-section pm-divider bg-zinc-50/60">
      <div ref={ref} className="pm-container">
        <SectionHead
          eyebrow="Built differently"
          title="Calling isn't a checkbox. It's the workflow."
          lede="GrowthDialer is built around the conversation itself — before the call, while you're talking, and after you hang up."
        />
        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-4">
            {PILLARS.map((pl, i) => {
              const isActive = i === p;
              const isPast = i < p;
              return (
                <Reveal key={pl.stage} delay={i * 80} className="h-full">
                  <article
                    className={cn(
                      'h-full rounded-[1.4rem] border p-6 transition-all duration-500 sm:p-7',
                      isActive
                        ? 'border-[#6d28d9]/30 bg-white shadow-[0_24px_56px_-28px_rgba(109,40,217,0.45)]'
                        : 'border-zinc-950/[0.07] bg-white/60'
                    )}
                  >
                    <p
                      className={cn(
                        'font-mono text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-500',
                        isActive ? 'text-[#6d28d9]' : 'text-zinc-400'
                      )}
                    >
                      {pl.stage}
                    </p>
                    <h3 className="pm-h-card mt-3">{pl.title}</h3>
                    <p className="pm-body mt-2 !text-[14px]">{pl.body}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>

          {/* the accumulating prospect record */}
          <Reveal delay={140} className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-zinc-950/[0.08] bg-white shadow-[0_32px_64px_-32px_rgba(9,9,11,0.25)]">
              <div className="flex items-center justify-between border-b border-zinc-950/[0.06] px-5 py-4 sm:px-6">
                <p className="text-[13px] font-semibold text-zinc-900">Prospect record</p>
                <span className="pm-chip !gap-1.5 !text-[11px]">
                  <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  Live
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3 p-5 sm:p-6">
                {PILLARS.map((pl, i) => {
                  const shown = reduced ? true : i <= p;
                  return (
                    <div
                      key={pl.chip}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-500',
                        shown
                          ? 'translate-y-0 border-[#6d28d9]/25 bg-[#6d28d9]/[0.05] opacity-100'
                          : 'translate-y-2 border-zinc-950/[0.05] bg-zinc-50/50 opacity-40'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-500',
                          shown ? 'bg-[#6d28d9] text-white' : 'bg-zinc-950/[0.06] text-zinc-400'
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                      </span>
                      <div>
                        <p className="text-[13.5px] font-semibold text-zinc-900">{pl.chip}</p>
                        <p className="text-[12px] text-zinc-500">{pl.stage}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="border-t border-zinc-950/[0.06] px-5 py-3.5 text-[12.5px] text-zinc-500 sm:px-6">
                Every call enriches the record — nothing is typed twice.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ══ 7 · Live today vs roadmap ═══════════════════════════ */
const LIVE_ITEMS = [
  'Browser-based calling',
  'Power Dialer',
  'Parallel Dialer',
  'Call Recording',
  'AI Transcription',
  'AI Call Summaries',
  'Conversation Intelligence',
  'Lead Management',
  'Analytics',
  'Number Health',
  'HubSpot Integration',
];
const ROADMAP_ITEMS = [
  { name: 'AI Voice Agents', status: 'In development' },
  { name: 'AI Receptionist', status: 'In development' },
  { name: 'Advanced Buyer Intent', status: 'Roadmap' },
  { name: 'Expanded CRM Integrations', status: 'Roadmap' },
  { name: 'Connected Multichannel Outreach', status: 'Roadmap' },
  { name: 'Advanced Workflow Automation', status: 'Roadmap' },
];

export function LiveRoadmap() {
  return (
    <section className="pm-section pm-divider bg-white">
      <div className="pm-container">
        <SectionHead
          eyebrow="Product direction"
          title="Useful today. Building toward the complete AI sales communication layer."
          lede={
            <>
              Transparent about what you can use now — and what comes next.{' '}
              <Link href="/features" className="font-semibold text-[#6d28d9] underline-offset-4 hover:underline">
                Tour the live platform
              </Link>
              {' '}or{' '}
              <Link href="/roadmap" className="font-semibold text-[#6d28d9] underline-offset-4 hover:underline">
                follow the roadmap
              </Link>
              .
            </>
          }
        />
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {/* live */}
          <Reveal className="h-full">
            <article className="h-full rounded-[1.4rem] border border-emerald-600/20 bg-emerald-500/[0.03] p-6 sm:p-8">
              <p className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                <span className="pm-pulse-dot h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Live today
              </p>
              <ul className="mt-6 space-y-1">
                {LIVE_ITEMS.map((item, i) => (
                  <Reveal key={item} delay={i * 40}>
                    <li className="flex items-center gap-3 rounded-lg px-2 py-2 text-[14.5px] font-medium text-zinc-800">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} aria-hidden />
                      {item}
                    </li>
                  </Reveal>
                ))}
              </ul>
            </article>
          </Reveal>
          {/* roadmap */}
          <Reveal delay={120} className="h-full">
            <article className="h-full rounded-[1.4rem] border border-dashed border-zinc-950/[0.15] bg-zinc-50/60 p-6 sm:p-8">
              <p className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-zinc-300" aria-hidden />
                Roadmap
              </p>
              <ul className="mt-6 space-y-1">
                {ROADMAP_ITEMS.map((item, i) => (
                  <Reveal key={item.name} delay={i * 40}>
                    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-[14.5px] font-medium text-zinc-600">
                      <span className="flex items-center gap-3">
                        <Mic className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                        {item.name}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]',
                          item.status === 'In development'
                            ? 'bg-[#6d28d9]/[0.08] text-[#6d28d9]'
                            : 'bg-zinc-950/[0.05] text-zinc-500'
                        )}
                      >
                        {item.status}
                      </span>
                    </li>
                  </Reveal>
                ))}
              </ul>
              <Link
                href="/roadmap"
                className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6d28d9] underline-offset-4 hover:underline"
              >
                See what we’re building next <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
