'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  Radio,
  Brain,
  Sparkles,
  Check,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { LottiePulse } from './LottiePulse';
import { useMounted } from '@/hooks/use-mounted';
import { EASE_OUT, reveal, revealContainer } from '@/components/marketing/live-floor/motion';

/* ─────────────────────────────────────────────────────────────────────────
   The Live Floor's looping product demo: one call, end to end, on repeat.
   A small stage machine advances on a timer while the dashboard morphs to
   match. SSR-safe — the first paint always renders stage 0 (deterministic),
   and reduced-motion users get a settled "summary ready" view with no timers.
   ───────────────────────────────────────────────────────────────────────── */

type StageKey = 'dialing' | 'connected' | 'listening' | 'summary' | 'synced';

const STAGES: { key: StageKey; label: string; icon: typeof Phone; dwell: number }[] = [
  { key: 'dialing', label: 'Dial', icon: Phone, dwell: 1900 },
  { key: 'connected', label: 'Connect', icon: PhoneCall, dwell: 2600 },
  { key: 'listening', label: 'AI listens', icon: Radio, dwell: 4200 },
  { key: 'summary', label: 'Summarize', icon: Brain, dwell: 4200 },
  { key: 'synced', label: 'Sync', icon: CheckCircle2, dwell: 2600 },
];

const CONTACTS = [
  { name: 'Jordan at Acme Co.', phone: '+1 (415) 555-0117', summary: ['Evaluating for a 12-seat team', 'Wants pricing + a short demo', 'Follow up Thursday'] },
  { name: 'Priya at Northwind', phone: '+1 (628) 555-0184', summary: ['Switching from a legacy dialer', 'Needs CRM + calendar sync', 'Loop in RevOps next week'] },
  { name: 'Marcus at Globex', phone: '+1 (917) 555-0143', summary: ['Running a 30-day pilot', 'Cares about call quality + AI notes', 'Send security one-pager'] },
];

const TRANSCRIPT = [
  { who: 'AI', text: 'Detecting intent — buying signals trending up.' },
  { who: 'Rep', text: '“Walk me through how the AI summary works.”' },
  { who: 'AI', text: 'Logging objection: pricing for a 12-seat team.' },
];

const STATUS: Record<StageKey, { label: string; tone: string }> = {
  dialing: { label: 'Dialing', tone: '#A78BFA' },
  connected: { label: 'Live session', tone: '#06B6D4' },
  listening: { label: 'Listening', tone: '#06B6D4' },
  summary: { label: 'Analyzing', tone: '#A78BFA' },
  synced: { label: 'Wrapped', tone: '#34D399' },
};

function fmtClock(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function DashboardPreview() {
  const prefersReduced = useReducedMotion();
  const mounted = useMounted();
  const reduce = mounted && !!prefersReduced;

  // Stage machine — deterministic initial value for SSR.
  const [stageIndex, setStageIndex] = useState(0);
  const [loop, setLoop] = useState(0);
  const stage = reduce ? STAGES[3] : STAGES[stageIndex];
  const isLive = stage.key === 'connected' || stage.key === 'listening';
  const contact = CONTACTS[loop % CONTACTS.length];

  // Advance stages on a timer; bump the loop counter when a cycle completes.
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => {
      setStageIndex((i) => {
        const next = (i + 1) % STAGES.length;
        if (next === 0) setLoop((l) => l + 1);
        return next;
      });
    }, STAGES[stageIndex].dwell);
    return () => clearTimeout(t);
  }, [stageIndex, reduce]);

  // Call timer — runs while the call is active, freezes after.
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (reduce) {
      setSeconds(137);
      return;
    }
    if (stage.key === 'dialing') {
      setSeconds(0);
      return;
    }
    if (!isLive) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [stage.key, isLive, reduce]);

  const callsBase = 47 + loop;

  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[min(92vw,960px)] -translate-x-1/2 rounded-full opacity-[0.08] blur-[140px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
        variants={revealContainer}
        className="relative mx-auto max-w-2xl text-center"
      >
        <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Product preview
        </motion.p>
        <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
          One call, <span className="font-medium">end to end</span>.
        </motion.h2>
        <motion.p variants={reveal} className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-zinc-400">
          Watch the floor work on a loop — the dialer connects, the AI listens,
          insights materialize, and everything syncs the moment you hang up.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: EASE_OUT }}
        className="relative mx-auto mt-12 max-w-5xl"
      >
        {/* ── Stage pipeline ── */}
        <StagePipeline activeKey={stage.key} reduce={reduce} />

        {/* ── Dashboard ── */}
        <div className="relative mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0A0A0D]/90 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <Spotlight />

          {/* Top bar */}
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#8B5CF6,#06B6D4)' }}>
                <Phone className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-sm font-medium text-[#F5F5F7]">Dialer</span>
            </div>
            <StatusPill stageKey={stage.key} />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            {/* ── Active call card ── */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#06B6D4]/10 text-[#06B6D4]">
                    <Phone className="h-4 w-4" />
                    {isLive && (
                      <span className="absolute inset-0 grid place-items-center">
                        <LottiePulse size={56} />
                      </span>
                    )}
                  </span>
                  <div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={contact.name}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.4, ease: EASE_OUT }}
                        className="text-sm font-medium text-[#F5F5F7]"
                      >
                        {contact.name}
                      </motion.p>
                    </AnimatePresence>
                    <p className="font-mono text-xs tabular-nums text-zinc-500">
                      {stage.key === 'dialing'
                        ? `Dialing · ${contact.phone}`
                        : `Connected · ${fmtClock(seconds)}`}
                    </p>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={stage.key === 'dialing' ? 'ring' : stage.key === 'synced' ? 'done' : 'rec'}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      background: `${STATUS[stage.key].tone}1a`,
                      color: STATUS[stage.key].tone,
                    }}
                  >
                    {stage.key === 'dialing' ? 'Ringing' : stage.key === 'synced' ? 'Saved' : 'Recording'}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Waveform / ringing state */}
              <div className="grid h-[72px] place-items-center">
                {stage.key === 'dialing' ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={reduce ? undefined : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-500"
                  >
                    Connecting…
                  </motion.p>
                ) : (
                  <LiveWaveform bars={48} height={72} speed={stage.key === 'listening' ? 1.3 : 1} />
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ['Talk', stage.key === 'dialing' ? '0:00' : fmtClock(seconds)],
                  ['Disposition', stage.key === 'synced' ? 'Qualified' : '—'],
                  ['Sentiment', stage.key === 'dialing' ? '—' : 'Positive'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-white/[0.05] bg-black/30 px-2 py-2 text-center">
                    <p className="text-[11px] tabular-nums text-[#F5F5F7]">{v}</p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">{k}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Side column ── */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Activity, label: 'Calls today', value: callsBase },
                  { icon: Clock, label: 'Talk time', value: '1h 12m' },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                      <Icon className="mb-2 h-4 w-4 text-zinc-500" />
                      <p className="font-display text-2xl font-light tabular-nums text-[#F5F5F7]">{m.value}</p>
                      <p className="text-[11px] text-zinc-600">{m.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Morphing insight panel */}
              <div className="relative min-h-[188px] overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <AnimatePresence mode="wait">
                  <InsightPanel key={stage.key} stageKey={stage.key} contact={contact} reduce={reduce} />
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ── Stage pipeline header ── */
function StagePipeline({ activeKey, reduce }: { activeKey: StageKey; reduce: boolean }) {
  const activeIndex = STAGES.findIndex((s) => s.key === activeKey);
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 backdrop-blur-xl sm:px-5">
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{
                  borderColor: isActive ? 'rgba(6,182,212,0.6)' : isDone ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#06B6D4' : isDone ? '#34D399' : '#71717a',
                  scale: isActive ? 1.06 : 1,
                }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border bg-black/30"
              >
                {isActive && !reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-xl"
                    style={{ boxShadow: '0 0 0 0 rgba(6,182,212,0.4)' }}
                    animate={{ boxShadow: ['0 0 0 0 rgba(6,182,212,0.35)', '0 0 0 8px rgba(6,182,212,0)'] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                <Icon className="h-3.5 w-3.5" />
              </motion.span>
              <span
                className={`hidden text-[12px] font-medium tracking-tight transition-colors sm:block ${
                  isActive ? 'text-[#F5F5F7]' : isDone ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="relative h-px flex-1 overflow-hidden bg-white/[0.06]">
                <motion.span
                  className="absolute inset-y-0 left-0"
                  style={{ background: 'linear-gradient(to right,#06B6D4,#8B5CF6)' }}
                  animate={{ width: i < activeIndex ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Status pill (top bar) ── */
function StatusPill({ stageKey }: { stageKey: StageKey }) {
  const { label, tone } = STATUS[stageKey];
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: `${tone}1a`, color: tone }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: tone }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      </span>
      {label}
    </span>
  );
}

/* ── Morphing insight panel ── */
function InsightPanel({
  stageKey,
  contact,
  reduce,
}: {
  stageKey: StageKey;
  contact: (typeof CONTACTS)[number];
  reduce: boolean;
}) {
  const common = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.4, ease: EASE_OUT },
  } as const;

  if (stageKey === 'dialing') {
    return (
      <motion.div {...common} className="flex h-full flex-col justify-center">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" /> AI summary
        </p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border border-white/10" />
              <motion.span
                className="h-2.5 rounded-full bg-white/[0.05]"
                style={{ width: `${70 - i * 12}%` }}
                animate={reduce ? undefined : { opacity: [0.4, 0.8, 0.4] }}
                transition={reduce ? undefined : { duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-zinc-600">Waiting for the call to connect…</p>
      </motion.div>
    );
  }

  if (stageKey === 'connected' || stageKey === 'listening') {
    return (
      <motion.div {...common} className="h-full">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          <Radio className="h-3.5 w-3.5 text-[#06B6D4]" /> Live transcript
        </p>
        <ul className="space-y-2.5">
          {TRANSCRIPT.map((line, i) => (
            <motion.li
              key={line.text}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : 0.2 + i * 0.5, ease: EASE_OUT }}
              className="flex items-start gap-2 text-[13px] leading-relaxed"
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${line.who === 'AI' ? 'bg-[#8B5CF6]' : 'bg-[#06B6D4]'}`}
              />
              <span className="text-zinc-300">{line.text}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    );
  }

  if (stageKey === 'summary') {
    return (
      <motion.div {...common} className="h-full">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" /> AI summary
        </p>
        <div className="mb-3 flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2">
          <span className="text-xs text-zinc-400">Sentiment</span>
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" /> Positive
          </span>
        </div>
        <ul className="space-y-2">
          {contact.summary.map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : 0.2 + i * 0.35, ease: EASE_OUT }}
              className="flex items-start gap-2 text-[13px] leading-relaxed text-zinc-300"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" />
              {t}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    );
  }

  // synced
  return (
    <motion.div {...common} className="flex h-full flex-col">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Wrapped up
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-3"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/15 text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[13px] font-medium text-[#F5F5F7]">Call logged &amp; analyzed</p>
          <p className="text-[11px] text-zinc-500">Notes, sentiment, and next steps saved.</p>
        </div>
      </motion.div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
        <span className="text-[12px] text-zinc-400">Next in queue</span>
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#06B6D4]">
          Auto-dial <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.div>
  );
}
