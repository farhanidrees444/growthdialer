'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { Phone, Radio, Ear, Sparkles, BarChart3, Check, TrendingUp } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Spotlight } from './Spotlight';
import { EASE_OUT } from './motion';

const STAGES = [
  { id: 'dial',    label: 'Dial',        icon: Phone,     desc: 'You start the call from the AI Dialer or Power Dialer.' },
  { id: 'connect', label: 'Connect',     icon: Radio,     desc: 'The prospect picks up. Recording begins automatically.' },
  { id: 'listen',  label: 'AI listens',  icon: Ear,       desc: 'Whisper transcribes the conversation as it happens.' },
  { id: 'analyze', label: 'AI analyzes', icon: Sparkles,  desc: 'Gemini distills a summary, sentiment and next steps.' },
  { id: 'log',     label: 'Logged',      icon: BarChart3, desc: 'Everything lands in Analytics — searchable, forever.' },
] as const;

export function CallLifecycle() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  // Weighted, spring-smoothed progress for the narrative rail
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 25 });
  const [stage, setStage] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Map 0→1 across the 5 stages with a little headroom at the ends
    const idx = Math.min(STAGES.length - 1, Math.max(0, Math.floor(v * STAGES.length * 0.999)));
    setStage(idx);
  });

  return (
    <section ref={ref} className="relative" style={{ height: '300vh' }}>
      {/* Sticky stage */}
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden px-5 lg:px-8">
        {/* Scroll-progress beam — the scroll itself drives the narrative */}
        <motion.div
          aria-hidden
          style={{ scaleX: progress }}
          className="absolute left-0 top-0 h-px w-full origin-left bg-gradient-to-r from-[hsl(258,90%,66%)] via-[hsl(186,100%,42%)] to-[hsl(258,90%,66%)']"
        />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          {/* ── Left: narrative rail ── */}
          <div>
            <p className="mb-8 text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
              The life of one call
            </p>
            <ol className="space-y-1">
              {STAGES.map((s, i) => {
                const active = i === stage;
                const done = i < stage;
                const Icon = s.icon;
                return (
                  <li key={s.id} className="relative">
                    <div className="flex items-start gap-4 py-3">
                      <div className="relative flex flex-col items-center">
                        <motion.span
                          className="flex h-9 w-9 items-center justify-center rounded-full border"
                          animate={{
                            borderColor: active ? 'hsl(186, 100%, 42%)'' : done ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)',
                            backgroundColor: active ? 'rgba(6,182,212,0.12)' : 'rgba(0,0,0,0)',
                            scale: active ? 1 : 0.94,
                          }}
                          transition={{ duration: 0.5, ease: EASE_OUT }}
                        >
                          {done ? (
                            <Check className="h-4 w-4 text-[hsl(258,90%,66%)']" />
                          ) : (
                            <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground/60'}`} />
                          )}
                        </motion.span>
                        {i < STAGES.length - 1 && (
                          <span className="my-1 h-8 w-px bg-white/[0.08]" />
                        )}
                      </div>
                      <div className="pt-1.5">
                        <motion.p
                          animate={{ color: active || done ? 'hsl(200, 7%, 96%)' : '#71717a' }}
                          className="text-[15px] font-medium"
                        >
                          {s.label}
                        </motion.p>
                        <AnimatePresence mode="wait">
                          {active && (
                            <motion.p
                              key={s.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4, ease: EASE_OUT }}
                              className="overflow-hidden text-sm leading-relaxed text-muted-foreground/70"
                            >
                              <span className="block pt-1">{s.desc}</span>
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ── Right: evolving call surface ── */}
          <div className="relative flex h-[420px] items-center justify-center sm:h-[460px]">
            <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0C0C0F]/80 p-6 backdrop-blur-xl">
              <Spotlight color="hsl(186,100%,42%)'" />
              <AnimatePresence mode="wait">
                <StageVisual key={STAGES[stage].id} stage={stage} />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StageVisual({ stage }: { stage: number }) {
  const common = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.5, ease: EASE_OUT },
  };

  if (stage === 0) {
    return (
      <motion.div {...common} className="flex flex-col items-center justify-center py-10 text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-zinc-700"
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            />
          ))}
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground/90">
            <Phone className="h-5 w-5" />
          </span>
        </div>
        <p className="text-sm font-medium text-foreground">Dialing prospect…</p>
        <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground/60">+1 (415) 555‑0117</p>
      </motion.div>
    );
  }

  if (stage === 1) {
    return (
      <motion.div {...common} className="py-6">
        <div className="mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Radio className="h-4 w-4" />
            </span>
            Connected
          </span>
          <span className="font-mono text-xs tabular-nums text-primary">00:03</span>
        </div>
        <LiveWaveform bars={48} height={96} />
        <p className="mt-6 text-center text-xs text-muted-foreground/60">Recording started automatically</p>
      </motion.div>
    );
  }

  if (stage === 2) {
    const lines = [
      'Thanks for taking the call —',
      'we help teams follow up faster.',
      'How are you handling that today?',
    ];
    return (
      <motion.div {...common} className="py-4">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          <Ear className="h-3.5 w-3.5 text-primary" /> Transcribing live
        </p>
        <div className="space-y-2.5">
          {lines.map((l, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.35, ease: EASE_OUT }}
              className="text-[13px] leading-relaxed text-muted-foreground"
            >
              {l}
            </motion.p>
          ))}
        </div>
        <div className="mt-4">
          <LiveWaveform bars={40} height={32} barWidth={2} gap={2} />
        </div>
      </motion.div>
    );
  }

  if (stage === 3) {
    return (
      <motion.div {...common} className="py-4">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(258,90%,66%)']" /> AI summary
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Sentiment</span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" /> Positive
            </span>
          </div>
          {['Interested in team plan (12 seats)'Wants pricing sent over'Follow up Thursday'].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease: EASE_OUT }}
              className="flex items-start gap-2.5 text-[13px] text-muted-foreground/90"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(258,90%,66%)']" />
              {t}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...common} className="flex flex-col items-center justify-center py-10 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/10 text-[hsl(258,90%,66%)']">
        <BarChart3 className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-foreground">Logged to Analytics</p>
      <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-muted-foreground/70">
        Disposition, duration, transcript and AI insights — searchable across
        every call you make.
      </p>
      <div className="mt-6 grid w-full grid-cols-3 gap-2">
        {[['Calls'1'], ['Sentiment'+'], ['Talk time'2:14']].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-white/[0.05] bg-white/[0.02] py-2">
            <p className="font-mono text-sm tabular-nums text-foreground">{v}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{k}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
