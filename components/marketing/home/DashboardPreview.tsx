'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Phone, TrendingUp, Check, Activity, Clock, Sparkles } from 'lucide-react';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { LottiePulse } from './LottiePulse';
import { EASE_OUT, reveal, revealContainer } from '@/components/marketing/live-floor/motion';

function useTicker(start: number, stepMs: number, inc: number, reduce: boolean | null) {
  const [v, setV] = useState(start);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setV((x) => x + inc), stepMs);
    return () => clearInterval(id);
  }, [stepMs, inc, reduce]);
  return v;
}

function fmtClock(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;

export function DashboardPreview() {
  const reduce = useReducedMotion();
  const seconds = useTicker(132, 1000, 1, reduce);
  const calls = useTicker(47, 4200, 1, reduce);

  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[460px] w-[min(92vw,900px)] -translate-x-1/2 rounded-full opacity-[0.07] blur-[130px]"
        style={{ background: 'radial-gradient(circle, hsl(258,90%,66%) 0%, transparent 70%)'' }}
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
        variants={revealContainer}
        className="relative mx-auto max-w-2xl text-center"
      >
        <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
          Product preview
        </motion.p>
        <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-foreground">
          Your floor, <span className="font-medium">live</span>.
        </motion.h2>
        <motion.p variants={reveal} className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          A look at the dialer in motion — calls connect, the AI listens, and
          insights land the moment you hang up.
        </motion.p>
      </motion.div>

      {/* Dashboard mock */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: EASE_OUT }}
        className="relative mx-auto mt-14 max-w-5xl"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0A0A0D]/90 p-3 backdrop-blur-xl shadow-2xl shadow-black/60">
          <Spotlight />
          {/* Top bar */}
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,hsl(258,90%,66%),hsl(186,100%,42%))'' }}>
                <Phone className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-sm font-medium text-foreground">Dialer</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Live session
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            {/* Active call card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                    <span className="absolute inset-0 grid place-items-center">
                      <LottiePulse size={56} />
                    </span>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Jordan at Acme Co.</p>
                    <p className="font-mono text-xs tabular-nums text-muted-foreground/70">Connected · {fmtClock(seconds)}</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">Recording</span>
              </div>
              <LiveWaveform bars={48} height={72} />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[['Talk', fmtClock(seconds)], ['Disposition'—'], ['Sentiment'Positive']].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-white/[0.05] bg-black/30 px-2 py-2 text-center">
                    <p className="text-[11px] tabular-nums text-foreground">{v}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{k}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Side column: metrics + AI summary materializing */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Activity, label: 'Calls today', value: calls },
                  { icon: Clock, label: 'Talk time', value: '1h 12m' },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                      <Icon className="mb-2 h-4 w-4 text-muted-foreground/70" />
                      <p className="font-display text-2xl font-light tabular-nums text-foreground">{m.value}</p>
                      <p className="text-[11px] text-muted-foreground/60">{m.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* AI summary materializing */}
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(258,90%,66%)']" /> AI summary
                </p>
                <div className="mb-3 flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Sentiment</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" /> Positive
                  </span>
                </div>
                <ul className="space-y-2">
                  {['Evaluating for a 12-seat team'Wants pricing + a short demo'Follow up Thursday'].map((t, i) => (
                    <motion.li
                      key={t}
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.25, ease: EASE_OUT }}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground/90"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(258,90%,66%)']" />
                      {t}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
