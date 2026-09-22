'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Brain, Users, BarChart3, ShieldCheck, Clock, Headphones } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Reveal } from '@/components/ui/reveal';
import { useMarketingMotionReduced } from './motion';

const SMALL_CARDS = [
  { icon: Zap, title: 'Power Dialer', body: 'Back-to-back dialing with disposition and notes in rhythm.', col: 'lg:col-span-3' },
  { icon: Users, title: 'Smart Leads', body: 'Import, organize and work your pipeline with full call history.', col: 'lg:col-span-2' },
  { icon: BarChart3, title: 'Analytics', body: 'Connect rate, talk time, dispositions and sentiment trends.', col: 'lg:col-span-3' },
  { icon: ShieldCheck, title: 'Number Health', body: 'Carrier reputation and spam risk on every number you own.', col: 'lg:col-span-5' },
  { icon: Headphones, title: 'Live Coaching', body: 'Manager floor with listen mode and post-call feedback — whisper audio on the roadmap.', col: 'lg:col-span-4' },
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
          className="rounded-xl border border-zinc-950/[0.08] bg-zinc-50 p-3"
        >
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">{l.speaker}</p>
          <p className="mt-1 text-[12px] text-zinc-700">
            {line >= i ? l.text : '…'}
          </p>
        </motion.div>
      ))}
      <motion.div
        initial={false}
        animate={{ opacity: line >= 2 ? 1 : 0 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
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
        <Reveal className="mb-14 max-w-2xl">
          <p className="mk-eyebrow">Platform</p>
          <h2 className="mk-h-section">
            A dialer that does the <span className="font-semibold">listening</span> for you.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <Reveal delay={0} className="lg:col-span-7 lg:row-span-2">
            <article className="mk-card mk-card-hover group relative flex h-full flex-col justify-between overflow-hidden p-6">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#6D28D9]">
                    <Brain className="h-5 w-5" />
                  </span>
                  <span className="mk-chip">AI pipeline</span>
                </div>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-zinc-950">
                  AI Conversation Intelligence
                </h3>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-zinc-600">
                  Every recorded call transcribed and distilled into summary, sentiment and intent — the moment you hang up.
                </p>
              </div>
              <TranscriptDemo />
            </article>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-3 lg:row-span-2">
            <article className="mk-card mk-card-hover group relative h-full overflow-hidden p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#6D28D9]">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-zinc-950">AI Dialer</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
                Three-mode focus stage — browse, preview and live — built for outbound rhythm.
              </p>
              <div className="mt-6 rounded-xl border border-zinc-950/[0.06] bg-zinc-50 p-4">
                <LiveWaveform bars={32} height={40} />
              </div>
            </article>
          </Reveal>

          {SMALL_CARDS.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 60} className={f.col}>
                <article className="mk-card mk-card-hover group relative h-full p-5">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950/[0.04] text-zinc-700 group-hover:text-[#6D28D9]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{f.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{f.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={100}>
          <div className="mk-card mt-8 flex flex-col items-start gap-3 px-6 py-4 sm:flex-row sm:items-center">
            <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
              <Clock className="h-3.5 w-3.5" /> On the roadmap
            </span>
            <div className="flex flex-wrap gap-2">
              {COMING_SOON.map((c) => (
                <span key={c} className="mk-chip">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
