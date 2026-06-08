'use client';

import { motion } from 'framer-motion';
import { CountUp } from './CountUp';
import { InViewReveal } from '@/components/marketing/live-floor/Reveal';
import { reveal, revealContainer } from '@/components/marketing/live-floor/motion';
import { MARKETING_STATS } from '@/lib/marketing/honest-copy';

const STATS = MARKETING_STATS;

export function StatsStrip() {
  return (
    <section className="relative overflow-hidden px-5 py-20 lg:px-8 lg:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-beam absolute top-1/2 h-px w-[200%] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#7C3AED]/40 to-transparent opacity-[0.04]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[min(90vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
      />
      <InViewReveal
        variants={revealContainer}
        className="relative mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] lg:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            variants={reveal}
            className="bg-[#0F0F12] px-6 py-10 text-center"
          >
            <p className="font-display text-[clamp(2.5rem,4vw,4rem)] font-light tracking-tight text-[#F5F5F7]">
              <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-[14px] text-zinc-500">{s.label}</p>
          </motion.div>
        ))}
      </InViewReveal>
    </section>
  );
}
