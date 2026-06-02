'use client';

import { motion } from 'framer-motion';
import { CountUp } from './CountUp';
import { reveal, revealContainer } from '@/components/marketing/live-floor/motion';

// Honest capability facts only — no usage stats, no fabricated counts.
const STATS = [
  { value: <CountUp to={50} suffix="+" />, label: 'Countries you can dial' },
  { value: <CountUp to={3} />, label: 'AI Dialer modes' },
  { value: <CountUp to={100} suffix="%" />, label: 'Calls recorded & analyzed' },
  { value: <span className="tabular-nums">Seconds</span>, label: 'To an AI call summary' },
];

export function StatsStrip() {
  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[min(90vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealContainer}
        className="relative mx-auto grid max-w-5xl grid-cols-2 gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl lg:grid-cols-4 lg:gap-6"
      >
        {STATS.map((s, i) => (
          <motion.div key={i} variants={reveal} className="text-center">
            <p className="font-display text-[clamp(2rem,4vw,3rem)] font-light tracking-tight text-foreground">
              {s.value}
            </p>
            <p className="mt-1.5 text-[13px] text-muted-foreground/70">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
