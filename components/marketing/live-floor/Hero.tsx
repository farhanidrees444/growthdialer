'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Phone, Sparkles, Activity, CheckCircle2 } from 'lucide-react';
import { StaticWaveform } from './LiveWaveform';
import { Reveal } from '@/components/ui/reveal';
import { EASE_OUT } from './motion';

function CallMockup() {
  return (
    <div className="mk-browser">
      {/* Browser chrome */}
      <div className="flex items-center justify-between border-b border-zinc-950/[0.08] bg-zinc-50/60 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        </div>
        <span className="rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700">
          Live call · AI listening
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {/* Active call card */}
          <div className="rounded-2xl border border-zinc-950/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(9,9,11,0.05)]">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#6D28D9]">
                <Phone className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-950">Maya Patel · RevOps</p>
                <p className="text-xs text-zinc-500">Connected · recording on</p>
              </div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-zinc-950">03:18</p>
            </div>
            <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2">
              <StaticWaveform bars={48} height={40} color="#7C3AED" barWidth={2.5} gap={2.5} />
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Calls today', value: '84', icon: Activity },
              { label: 'Connects', value: '31', icon: CheckCircle2 },
              { label: 'AI summaries', value: '19', icon: Sparkles },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-zinc-950/[0.08] bg-white p-4">
                <Icon className="mb-3 h-4 w-4 text-[#6D28D9]" />
                <p className="font-display text-2xl font-semibold tabular-nums text-zinc-950">{value}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="rounded-2xl border border-zinc-950/[0.08] bg-white p-4">
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Weekly connect rate</p>
            <div className="flex h-24 items-end gap-2">
              {[32, 54, 44, 68, 71, 58, 82].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.65, delay: 0.75 + i * 0.045, ease: EASE_OUT }}
                  className="flex-1 rounded-t-lg bg-gradient-to-t from-[#7C3AED]/25 to-[#7C3AED]"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* AI summary */}
          <div className="rounded-2xl border border-emerald-600/15 bg-emerald-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">AI summary</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-700">
              <li>• Prospect asked for team pricing and onboarding timeline.</li>
              <li>• Buying signal: replacing spreadsheet call tracking.</li>
              <li>• Next step: send 12-seat annual proposal.</li>
            </ul>
          </div>
          {/* Transcript */}
          <div className="rounded-2xl border border-zinc-950/[0.08] bg-zinc-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Transcript stream</p>
            <div className="mt-3 space-y-2">
              {['Rep: What would make switching worth it?', 'Buyer: Faster call notes and coaching.', 'AI: Positive intent · pricing'].map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.16, duration: 0.45, ease: EASE_OUT }}
                  className="rounded-xl border border-zinc-950/[0.06] bg-white px-3 py-2 text-xs text-zinc-600"
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-28 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
      {/* Resend signature backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mk-dot-grid mk-fade-grid absolute inset-0" />
        <div className="mk-light-rays absolute inset-x-0 top-0 h-[560px] opacity-80" />
        <div className="mk-glow-brand absolute left-1/2 top-0 h-[480px] w-[min(92vw,860px)] -translate-x-1/2" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal>
          <a
            href="/features/ai"
            className="mk-chip mx-auto mb-6 !py-1.5 transition-colors hover:border-zinc-950/20"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            New: AI call briefs and summaries are live
          </a>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mk-h-display">
            Every sales call,
            <br />
            turned into pipeline.
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p className="mk-lead mx-auto mt-6 max-w-2xl">
            Call from your browser, power-dial through lists, and let every conversation
            transcribe and summarize itself. The dialer for outbound teams that hate paperwork.
          </p>
        </Reveal>

        <Reveal delay={220}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="https://app.growthdialer.com/signup" className="mk-btn mk-btn-primary">
              Start free
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/demo" className="mk-btn mk-btn-secondary">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/[0.06]">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Watch 2-min demo
            </a>
          </div>
        </Reveal>
      </div>

      <Reveal delay={180} variant="scale" className="relative mx-auto mt-14 max-w-6xl">
        <CallMockup />
        <p className="mt-4 text-center text-[12px] text-zinc-400">
          Illustrative product preview with sample data.
        </p>
      </Reveal>
    </section>
  );
}
