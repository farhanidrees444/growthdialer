'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Target, Zap, Brain, Users, BarChart3, ShieldCheck, Check, TrendingUp, Phone,
} from 'lucide-react';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { CountUp } from './CountUp';
import { useMarketingMotionReduced, EASE_OUT } from '@/components/marketing/live-floor/motion';

/**
 * Cycles an index 0..length-1 every `ms`, but ONLY while the element is in
 * view and the user hasn't requested reduced motion — so offscreen sections
 * run no timers (smooth 60fps) and reduced-motion users get a static state.
 */
function useCycle(length: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-15%' });
  const reduce = useMarketingMotionReduced();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => setI((x) => (x + 1) % length), ms);
    return () => clearInterval(id);
  }, [inView, reduce, length, ms]);
  return { ref, i: reduce ? 0 : i };
}

// ── AI Dialer — animated 3-mode switch + live waveform ──────────────────────
function DialerVisual() {
  const modes = ['Browse', 'Focus', 'Power'];
  const { ref, i } = useCycle(modes.length, 1900);
  return (
    <div ref={ref} className="space-y-4" aria-hidden>
      <div className="relative flex gap-2">
        {modes.map((m, idx) => (
          <div key={m} className="relative flex-1 rounded-lg px-3 py-2 text-center text-[12px] font-medium">
            {i === idx && (
              <motion.span
                layoutId="dialer-mode"
                className="absolute inset-0 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className={`relative ${i === idx ? 'text-[#8B5CF6]' : 'text-zinc-500'}`}>{m}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/[0.05] bg-black/30 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#06B6D4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" /> On call
          </span>
          <span className="font-mono text-[11px] tabular-nums text-zinc-600">01:24</span>
        </div>
        <LiveWaveform bars={44} height={44} barWidth={2.5} gap={2.5} />
      </div>
    </div>
  );
}

// ── Power Dialer — auto-advancing call queue ────────────────────────────────
function PowerVisual() {
  const rows = ['Maya Chen', 'Tom Becker', 'Priya Nair', 'Diego Ruiz', 'Sam Okafor'];
  const { ref, i: active } = useCycle(rows.length, 1500);
  return (
    <div ref={ref} className="space-y-2" aria-hidden>
      {rows.map((r, idx) => {
        const done = idx < active;
        const isActive = idx === active;
        return (
          <div
            key={r}
            className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors duration-300 ${
              isActive ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/[0.06]' : 'border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.05] text-zinc-400'
              }`}>
                {done ? <Check className="h-3 w-3" /> : r.split(' ').map((w) => w[0]).join('')}
              </span>
              <span className={`text-[13px] ${isActive ? 'text-[#F5F5F7]' : 'text-zinc-400'}`}>{r}</span>
            </div>
            {isActive ? (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8B5CF6]">
                <Phone className="h-3 w-3" /> Dialing…
              </span>
            ) : done ? (
              <span className="text-[11px] text-emerald-400/70">Connected</span>
            ) : (
              <span className="text-[11px] text-zinc-600">Queued</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Conversation Intelligence — transcript streams → summary materializes ───
function IntelVisual() {
  const lines = [
    '“…we need to cut follow-up time.”',
    '“Can you send team pricing?”',
    '“Let’s book a demo Thursday.”',
  ];
  const { ref, i } = useCycle(lines.length, 1600);
  return (
    <div ref={ref} className="space-y-3" aria-hidden>
      {/* Streaming transcript */}
      <div className="rounded-xl border border-white/[0.05] bg-black/30 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
          <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" /> Transcribing
        </p>
        <div className="h-5 overflow-hidden">
          <motion.p
            key={i}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="text-[13px] leading-5 text-zinc-300"
          >
            {lines[i]}
          </motion.p>
        </div>
      </div>
      {/* Summary materializing */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
        <span className="text-xs text-zinc-400">Sentiment</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" /> Positive
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
        <span className="text-xs text-zinc-400">Intent</span>
        <span className="text-xs font-medium text-[#8B5CF6]">Pricing + demo</span>
      </div>
    </div>
  );
}

// ── Smart Leads — pipeline with dispositions ────────────────────────────────
function LeadsVisual() {
  const leads = [
    { n: 'Acme Co.', s: 'Interested', c: 'text-emerald-400' },
    { n: 'Globex', s: 'Callback', c: 'text-amber-400' },
    { n: 'Initech', s: 'Meeting booked', c: 'text-[#8B5CF6]' },
    { n: 'Umbrella', s: 'New', c: 'text-zinc-400' },
  ];
  return (
    <div className="space-y-2" aria-hidden>
      {leads.map((l, idx) => (
        <motion.div
          key={l.n}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: idx * 0.1, ease: EASE_OUT }}
          className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-[10px] font-semibold text-zinc-400">
              {l.n[0]}
            </span>
            <span className="text-[13px] text-zinc-300">{l.n}</span>
          </div>
          <span className={`text-[11px] font-medium ${l.c}`}>{l.s}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Analytics — animated bars + count-up connect rate ───────────────────────
function AnalyticsVisual() {
  const bars = [0.45, 0.7, 0.55, 0.85, 0.6, 0.95, 0.75];
  return (
    <div aria-hidden>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="font-display text-3xl font-light tracking-tight text-[#F5F5F7]">
            <CountUp to={68} suffix="%" />
          </p>
          <p className="text-[11px] text-zinc-600">Connect rate</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
          <TrendingUp className="h-3 w-3" /> Trending up
        </span>
      </div>
      <div className="flex h-28 items-end justify-between gap-2">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.07, ease: EASE_OUT }}
            className="flex-1 rounded-t-md"
            style={{ background: i === 5 ? 'linear-gradient(to top,#8B5CF6,#06B6D4)' : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Number Health & Spam Monitoring — animated meter ────────────────────────
function HealthVisual() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] tabular-nums text-zinc-300">+1 (415) 555‑0148</span>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">Healthy</span>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-zinc-600">
          <span>Reputation</span>
          <span className="tabular-nums text-zinc-400"><CountUp to={92} suffix="/100" /></span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '92%' }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE_OUT }}
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2">
        <span className="text-xs text-zinc-400">Spam risk</span>
        <span className="text-xs font-medium text-emerald-400">Low</span>
      </div>
    </div>
  );
}

// ── Feature data ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Target, eyebrow: 'AI Dialer', title: 'A focused stage for every call.', body: 'Three modes — browse, focus and power — give reps one clean surface to move through leads, with live controls and instant recording.', Visual: DialerVisual },
  { icon: Zap, eyebrow: 'Power Dialer', title: 'Work the list, not the dialer.', body: 'Move call to call back-to-back. The queue auto-advances, dispositions in a tap, and you never lose your rhythm.', Visual: PowerVisual },
  { icon: Brain, eyebrow: 'Conversation Intelligence', title: 'The AI listens so you don’t take notes.', body: 'When recording saves, each call is transcribed and distilled into a summary, sentiment, and intent — linked to the lead without manual notes.', Visual: IntelVisual },
  { icon: Users, eyebrow: 'Smart Leads', title: 'Your pipeline, in one place.', body: 'Import and organize leads, then work them straight from the dialer. Every call links back with full history and disposition.', Visual: LeadsVisual },
  { icon: BarChart3, eyebrow: 'Analytics', title: 'See what’s actually working.', body: 'Connect rate, talk time, dispositions and sentiment trends — your whole calling operation at a glance.', Visual: AnalyticsVisual },
  { icon: ShieldCheck, eyebrow: 'Number Health', title: 'Keep your calls landing.', body: 'Track carrier reputation and spam risk on every number, continuously, so your connect rates stay high.', Visual: HealthVisual },
];

export function FeatureSections() {
  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24" aria-label="Features in depth">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 lg:gap-24">
        {FEATURES.map((f, idx) => {
          const Icon = f.icon;
          const Visual = f.Visual;
          const reverse = idx % 2 === 1;
          return (
            <article key={f.eyebrow} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              {/* Copy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
                className={reverse ? 'lg:order-2' : ''}
              >
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1 pl-1.5 pr-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6]">
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-[12px] font-medium text-zinc-400">{f.eyebrow}</span>
                </div>
                <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-light leading-[1.1] tracking-tight text-[#F5F5F7]">
                  {f.title}
                </h3>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">{f.body}</p>
              </motion.div>

              {/* Visual */}
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, ease: EASE_OUT }}
                className={reverse ? 'lg:order-1' : ''}
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
                  <Spotlight />
                  <Visual />
                </div>
              </motion.div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
