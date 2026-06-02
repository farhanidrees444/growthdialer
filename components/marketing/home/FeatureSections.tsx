'use client';

import { motion } from 'framer-motion';
import {
  Target, Zap, Brain, Users, BarChart3, ShieldCheck, Check, TrendingUp,
} from 'lucide-react';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

// ── Per-feature animated visuals ───────────────────────────────────────────

function DialerVisual() {
  const modes = ['Browse', 'Focus', 'Power'];
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {modes.map((m, i) => (
          <div
            key={m}
            className={`flex-1 rounded-lg border px-3 py-2 text-center text-[12px] font-medium ${
              i === 1
                ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6]'
                : 'border-white/[0.06] text-zinc-500'
            }`}
          >
            {m}
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

function PowerVisual() {
  const rows = ['Maya Chen', 'Tom Becker', 'Priya N.', 'Diego R.'];
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <motion.div
          key={r}
          initial={{ opacity: 0.4 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.12, ease: EASE_OUT }}
          className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
            i === 1 ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/[0.06]' : 'border-white/[0.06]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-[10px] font-semibold text-zinc-400">
              {r.split(' ').map((w) => w[0]).join('')}
            </span>
            <span className="text-[13px] text-zinc-300">{r}</span>
          </div>
          {i === 1 ? (
            <span className="text-[11px] font-medium text-[#8B5CF6]">Dialing…</span>
          ) : (
            <span className="text-[11px] text-zinc-600">Queued</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function IntelVisual() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2.5">
        <span className="text-xs text-zinc-400">Sentiment</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" /> Positive
        </span>
      </div>
      {['Asked about team pricing', 'Mentioned a Q3 timeline', 'Wants a follow-up demo'].map((t, i) => (
        <motion.div
          key={t}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 + i * 0.12, ease: EASE_OUT }}
          className="flex items-start gap-2.5 text-[13px] text-zinc-300"
        >
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" />
          {t}
        </motion.div>
      ))}
    </div>
  );
}

function LeadsVisual() {
  const leads = [
    { n: 'Acme Co.', s: 'Interested', c: 'text-emerald-400' },
    { n: 'Globex', s: 'Callback', c: 'text-amber-400' },
    { n: 'Initech', s: 'New', c: 'text-zinc-400' },
  ];
  return (
    <div className="space-y-2">
      {leads.map((l) => (
        <div key={l.n} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2.5">
          <span className="text-[13px] text-zinc-300">{l.n}</span>
          <span className={`text-[11px] font-medium ${l.c}`}>{l.s}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [0.45, 0.7, 0.55, 0.85, 0.6, 0.95, 0.75];
  return (
    <div className="flex h-32 items-end justify-between gap-2">
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
  );
}

function HealthVisual() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-zinc-300">+1 (415) 555‑0148</span>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">Healthy</span>
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
      <p className="text-[11px] text-zinc-600">Spam risk: low · monitored continuously</p>
    </div>
  );
}

// ── Feature data ────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Target, eyebrow: 'AI Dialer', title: 'A focused stage for every call.', body: 'Three modes — browse, focus and power — give reps one clean surface to move through leads, with live controls and instant recording.', visual: <DialerVisual /> },
  { icon: Zap, eyebrow: 'Power Dialer', title: 'Work the list, not the dialer.', body: 'Move call to call back-to-back. Disposition, note and advance without breaking rhythm — the queue keeps the next number ready.', visual: <PowerVisual /> },
  { icon: Brain, eyebrow: 'Conversation Intelligence', title: 'The AI listens so you don’t take notes.', body: 'Every recorded call is transcribed and analyzed into a summary, sentiment and intent — ready the moment you hang up.', visual: <IntelVisual /> },
  { icon: Users, eyebrow: 'Smart Leads', title: 'Your pipeline, in one place.', body: 'Import and organize leads, then work them straight from the dialer. Every call links back with full history.', visual: <LeadsVisual /> },
  { icon: BarChart3, eyebrow: 'Analytics', title: 'See what’s actually working.', body: 'Connect rate, talk time, dispositions and sentiment trends — your whole calling operation at a glance.', visual: <AnalyticsVisual /> },
  { icon: ShieldCheck, eyebrow: 'Number Health', title: 'Keep your calls landing.', body: 'Track carrier reputation and spam risk on every number, so your connect rates stay high.', visual: <HealthVisual /> },
];

export function FeatureSections() {
  return (
    <section className="relative px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 lg:gap-28">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const reverse = i % 2 === 1;
          return (
            <div key={f.eyebrow} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
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
                  {f.visual}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
