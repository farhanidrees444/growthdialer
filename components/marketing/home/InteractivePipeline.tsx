'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, PhoneCall, Mic, FileText, Sparkles, BarChart3, Check, TrendingUp,
} from 'lucide-react';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { useMarketingMotionReduced, EASE_OUT } from '@/components/marketing/live-floor/motion';

const NODES = [
  { icon: Upload, label: 'Lead Import' },
  { icon: PhoneCall, label: 'AI / Power Dialer' },
  { icon: Mic, label: 'Recording' },
  { icon: FileText, label: 'Transcription' },
  { icon: Sparkles, label: 'Summary & Sentiment' },
  { icon: BarChart3, label: 'Analytics' },
];

const TABS = [
  { id: 'connect', label: 'Connect', litTo: 2, blurb: 'Import a list, dial from the AI or Power Dialer, and recording starts the moment the prospect answers.' },
  { id: 'listen', label: 'Listen', litTo: 3, blurb: 'Calls are transcribed in real time — no bot on the line, no manual notes.' },
  { id: 'summarize', label: 'Summarize', litTo: 5, blurb: 'AI turns each transcript into a summary, sentiment score, and intent, then logs it to analytics.' },
] as const;

export function InteractivePipeline() {
  const [tab, setTab] = useState(0);
  const reduce = useMarketingMotionReduced();
  const litTo = TABS[tab].litTo;
  const fillPct = (litTo / (NODES.length - 1)) * 100;

  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24" aria-label="The life of one call">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">The life of one call</p>
          <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Dialed, heard, <span className="font-medium">understood</span>.
          </h2>
        </div>

        {/* Tab switcher with layoutId highlight */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-xl" role="tablist" aria-label="Call phase">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className="relative rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/40"
              >
                {tab === i && (
                  <motion.span
                    layoutId="pipeline-tab"
                    className="absolute inset-0 rounded-full bg-[#8B5CF6]"
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                )}
                <span className={`relative z-10 ${tab === i ? 'text-white' : 'text-zinc-400'}`}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SVG-style circuit pipeline */}
        <div className="relative">
          {/* Track */}
          <div className="absolute left-0 right-0 top-6 h-px bg-white/[0.08]" aria-hidden />
          {/* Lit fill toward active stage */}
          <motion.div
            aria-hidden
            className="absolute left-0 top-6 h-px"
            style={{ background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' }}
            initial={false}
            animate={{ width: `${fillPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          />
          {/* Travelling pulse at the leading edge */}
          {!reduce && (
            <motion.span
              aria-hidden
              className="absolute top-6 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#06B6D4]"
              style={{ boxShadow: '0 0 10px #06B6D4' }}
              initial={false}
              animate={{ left: `${fillPct}%`, opacity: [0.4, 1, 0.4] }}
              transition={{ left: { type: 'spring', stiffness: 120, damping: 22 }, opacity: { duration: 1.4, repeat: Infinity } }}
            />
          )}

          <div className="relative flex justify-between">
            {NODES.map((n, i) => {
              const Icon = n.icon;
              const lit = i <= litTo;
              return (
                <div key={n.label} className="flex w-[16%] flex-col items-center gap-2 text-center">
                  <motion.span
                    className="flex h-12 w-12 items-center justify-center rounded-xl border backdrop-blur-xl"
                    animate={{
                      borderColor: lit ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)',
                      backgroundColor: lit ? 'rgba(139,92,246,0.10)' : 'rgba(255,255,255,0.02)',
                    }}
                    transition={{ duration: 0.4, ease: EASE_OUT }}
                  >
                    <Icon className={`h-4 w-4 transition-colors ${lit ? 'text-[#8B5CF6]' : 'text-zinc-600'}`} />
                  </motion.span>
                  <span className={`hidden text-[11px] leading-tight transition-colors sm:block ${lit ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {n.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Swapping panel */}
        <div className="relative mt-10 min-h-[200px] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
          <p className="mb-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">{TABS[tab].blurb}</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={TABS[tab].id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              {tab === 0 && <ConnectPanel />}
              {tab === 1 && <ListenPanel />}
              {tab === 2 && <SummarizePanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ConnectPanel() {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/30 p-5" aria-hidden>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium text-[#06B6D4]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" /> Connected · Jordan at Acme Co.
        </span>
        <span className="font-mono text-xs tabular-nums text-zinc-600">2:17</span>
      </div>
      <LiveWaveform bars={52} height={48} barWidth={2.5} gap={2.5} />
    </div>
  );
}

function ListenPanel() {
  const lines = [
    '“We need to cut our follow-up time in half.”',
    '“Can you send pricing for a team of twelve?”',
    '“Thursday works for a quick demo.”',
  ];
  return (
    <div className="space-y-2" aria-hidden>
      {lines.map((l, i) => (
        <motion.p
          key={l}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 + i * 0.18, ease: EASE_OUT }}
          className="text-[14px] leading-relaxed text-zinc-300"
        >
          {l}
        </motion.p>
      ))}
    </div>
  );
}

function SummarizePanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
      <div className="space-y-2">
        {['Evaluating for a 12-seat team', 'Wants pricing + a short demo', 'Follow up Thursday'].map((t, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.12, ease: EASE_OUT }}
            className="flex items-start gap-2.5 text-[13px] text-zinc-300"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" /> {t}
          </motion.div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2">
          <span className="text-xs text-zinc-400">Sentiment</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" /> Positive
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2">
          <span className="text-xs text-zinc-400">Intent</span>
          <span className="text-xs font-medium text-[#8B5CF6]">Pricing + demo</span>
        </div>
      </div>
    </div>
  );
}
