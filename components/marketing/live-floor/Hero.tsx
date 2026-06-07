'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Phone, Check, TrendingUp, Play, Shield, Calendar } from 'lucide-react';
import { StaticWaveform } from './LiveWaveform';
import { ShimmerButton } from './ShimmerButton';
import { TypewriterRotator } from './TypewriterRotator';
import { useMarketingMotionReduced, EASE_OUT } from './motion';

function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="fixed left-0 right-0 top-16 z-40 flex h-9 items-center justify-center gap-2 border-b border-[#7C3AED]/10 bg-[#7C3AED]/[0.08] px-4 text-[13px]"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>
      <span className="text-zinc-300">
        <span className="font-medium text-[#F5F5F7]">Live</span>
        <span className="mx-2 text-zinc-600">·</span>
        New: AI Call Briefs are here
      </span>
      <a href="/features/ai" className="font-medium text-[#A78BFA] hover:text-[#C4B5FD]">
        Learn more →
      </a>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-4 text-zinc-500 hover:text-zinc-300"
        aria-label="Dismiss announcement"
      >
        ×
      </button>
    </motion.div>
  );
}

export function Hero() {
  const reduce = useMarketingMotionReduced();

  return (
    <>
      <AnnouncementBar />
      <section className="relative min-h-[92vh] overflow-hidden px-5 pb-16 pt-36 lg:px-8 lg:pb-20 lg:pt-44">
        {/* Static glow — no blur filter (expensive during scroll) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[480px] w-[min(92vw,860px)] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(124,58,237,0.14) 0%, transparent 72%)',
          }}
        />

        <div className="relative z-[2] mx-auto flex max-w-7xl flex-col items-center gap-14 text-center lg:gap-16">
          <motion.div
            className="max-w-3xl"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,4.75rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]">
              Every call,{' '}
              <span className="font-semibold text-[#A78BFA]">understood</span>
              <br className="hidden sm:block" />
              {' '}
              the moment it ends.
            </h1>

            <TypewriterRotator />

            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-400">
              GrowthDialer records, transcribes and analyzes every conversation — turning raw calls
              into summaries, sentiment and next steps.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ShimmerButton href="https://app.growthdialer.com/signup">
                Start Free — No Card
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ShimmerButton>
              <ShimmerButton href="/demo" variant="ghost">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08]">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                Watch 2-min demo
              </ShimmerButton>
            </div>

            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-zinc-500" />
                Built for growing sales teams
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-zinc-500" />
                SOC 2 in progress
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                No annual lock-in
              </span>
            </p>
          </motion.div>

          <HeroMockup />
        </div>
      </section>
    </>
  );
}

function HeroMockup() {
  const reduce = useMarketingMotionReduced();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.12 }}
      className="relative w-full max-w-2xl"
    >
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0C0C0F]/95 p-6 shadow-[0_32px_64px_rgba(0,0,0,0.55)]">
        <div className="mb-5 flex items-center gap-1.5 border-b border-white/[0.05] pb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[11px] text-zinc-600">GrowthDialer — Live call</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#A78BFA]">
              <Phone className="h-4 w-4" />
            </span>
            <div className="text-left">
              <p className="text-sm font-medium text-[#F5F5F7]">Jordan at Acme Co.</p>
              <p className="font-mono text-xs tabular-nums text-zinc-500">Connected 2:17</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Recording
          </span>
        </div>
        <div className="my-6">
          <StaticWaveform bars={40} height={64} barWidth={2.5} gap={2.5} />
        </div>
        <div className="space-y-2 rounded-xl border border-white/[0.05] bg-black/30 p-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Transcribing</p>
          <p className="text-[13px] leading-relaxed text-zinc-400">
            &ldquo;…that actually solves the follow-up problem for us. Can you send pricing for a team
            of twelve?&rdquo;
            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-[#7C3AED] opacity-80" />
          </p>
        </div>
        <div className="mt-3 text-left">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" /> AI insights
          </p>
          <AiInsights />
        </div>
      </div>
    </motion.div>
  );
}

const INSIGHTS = [
  { icon: TrendingUp, label: 'Positive sentiment', tone: 'text-emerald-400' },
  { icon: Check, label: 'Evaluating 12-seat team', tone: 'text-[#A78BFA]' },
  { icon: Check, label: 'Follow up Thursday', tone: 'text-[#A78BFA]' },
];

function AiInsights() {
  return (
    <div className="space-y-1.5">
      {INSIGHTS.map((ins) => {
        const Icon = ins.icon;
        return (
          <div
            key={ins.label}
            className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${ins.tone}`} />
            <span className="text-[13px] text-zinc-300">{ins.label}</span>
          </div>
        );
      })}
    </div>
  );
}
