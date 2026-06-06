'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Brain, Users, BarChart3, ShieldCheck, Clock, Headphones } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Spotlight } from './Spotlight';
import { InViewReveal } from './Reveal';
import { reveal, revealContainer, useMarketingMotionReduced } from './motion';

const SMALL_CARDS = [
  { icon: Zap, title: 'Power Dialer', body: 'Back-to-back dialing with disposition and notes in rhythm.', col: 'lg:col-span-3' },
  { icon: Users, title: 'Smart Leads', body: 'Import, organize and work your pipeline with full call history.', col: 'lg:col-span-2' },
  { icon: BarChart3, title: 'Analytics', body: 'Connect rate, talk time, dispositions and sentiment trends.', col: 'lg:col-span-3' },
  { icon: ShieldCheck, title: 'Number Health', body: 'Carrier reputation and spam risk on every number you own.', col: 'lg:col-span-5' },
  { icon: Headphones, title: 'Live Coaching', body: 'Manager floor with whisper mode while reps stay on calls.', col: 'lg:col-span-4' },
];

const COMING_SOON = ['CRM sync (beyond HubSpot)', 'AI voice agent'];

function TranscriptDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useMarketingMotionReduced();
  const [active, setActive] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting),
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active || reduce) return;
    const id = setInterval(() => setLine((l) => (l >= 2 ? 0 : l + 1)), 2800);
    return () => clearInterval(id);
  }, [active, reduce]);

  const lines = [
    { speaker: 'Rep', text: "What's your current process for follow-ups?" },
    { speaker: 'Prospect', text: '…that actually solves the problem for us.' },
  ];

  return (
    <div ref={ref} className="mt-6 space-y-3">
      {lines.map((l, i) => (
        <motion.div
          key={l.speaker}
          initial={false}
          animate={{ opacity: line >= i ? 1 : 0.25 }}
          className="rounded-xl border border-white/[0.05] bg-black/30 p-3"
        >
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">{l.speaker}</p>
          <p className="mt-1 text-[12px] text-zinc-400">
            {line >= i ? l.text : '…'}
          </p>
        </motion.div>
      ))}
      <motion.div
        initial={false}
        animate={{ opacity: line >= 2 ? 1 : 0 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400"
      >
        Positive sentiment
      </motion.div>
      <LiveWaveform bars={36} height={36} barWidth={2} gap={2} />
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <InViewReveal variants={revealContainer} className="mb-14 max-w-2xl">
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            Platform
          </motion.p>
          <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            A dialer that does the <span className="font-medium">listening</span> for you.
          </motion.h2>
        </InViewReveal>

        <InViewReveal variants={revealContainer} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <motion.article
            variants={reveal}
            whileHover={{ y: -4 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F0F12] p-6 transition-colors hover:border-[#7C3AED]/30 hover:bg-[#16161A] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(124,58,237,0.15)] lg:col-span-7 lg:row-span-2"
          >
            <Spotlight />
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#A78BFA]">
                  <Brain className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                  Whisper + Gemini
                </span>
              </div>
              <h3 className="font-display text-2xl font-medium tracking-tight text-[#F5F5F7]">
                AI Conversation Intelligence
              </h3>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-zinc-400">
                Every recorded call transcribed and distilled into summary, sentiment and intent — the moment you hang up.
              </p>
            </div>
            <TranscriptDemo />
          </motion.article>

          <motion.article
            variants={reveal}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F0F12] p-6 transition-colors hover:border-[#7C3AED]/30 hover:bg-[#16161A] lg:col-span-3 lg:row-span-2"
          >
            <Spotlight />
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#A78BFA]">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-medium text-[#F5F5F7]">AI Dialer</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">
              Three-mode focus stage — browse, preview and live — built for outbound rhythm.
            </p>
            <div className="mt-6 rounded-xl border border-white/[0.05] bg-black/30 p-4">
              <LiveWaveform bars={32} height={40} />
            </div>
          </motion.article>

          {SMALL_CARDS.map((f) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                variants={reveal}
                whileHover={{ y: -4 }}
                className={`group relative rounded-2xl border border-white/[0.06] bg-[#0F0F12] p-5 transition-colors hover:border-[#7C3AED]/30 hover:bg-[#16161A] ${f.col}`}
              >
                <Spotlight />
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-300 group-hover:text-[#A78BFA]">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-[15px] font-medium text-[#F5F5F7]">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{f.body}</p>
              </motion.article>
            );
          })}
        </InViewReveal>

        <InViewReveal
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
          className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-white/[0.06] bg-[#0F0F12]/50 px-6 py-4 sm:flex-row sm:items-center"
        >
          <span className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.15em] text-zinc-500">
            <Clock className="h-3.5 w-3.5" /> On the roadmap
          </span>
          <div className="flex flex-wrap gap-2">
            {COMING_SOON.map((c) => (
              <span key={c} className="rounded-full border border-white/[0.08] px-3 py-1 text-[12px] text-zinc-400">
                {c}
              </span>
            ))}
          </div>
        </InViewReveal>
      </div>
    </section>
  );
}
