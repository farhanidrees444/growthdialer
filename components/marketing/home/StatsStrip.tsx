'use client';

import { motion } from 'framer-motion';
import { CountUp } from './CountUp';
import { reveal, revealContainer } from '@/components/marketing/live-floor/motion';
import { MARKETING_STATS } from '@/lib/marketing/honest-copy';

const STATS = MARKETING_STATS;

export function StatsStrip() {
  return (
    <motion.section
      className="relative overflow-hidden px-5 py-16 lg:px-8 lg:py-20"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35, margin: '-10%' }}
      variants={revealContainer}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-beam absolute top-1/2 h-px w-[200%] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#8B5CF6]/40 to-transparent opacity-[0.04]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[min(90vw,800px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: 'radial-gradient(circle at 42% 48%, #8B5CF6 0%, #06B6D4 38%, transparent 70%)' }}
      />
      <motion.div
        variants={revealContainer}
        className="marketing-glass relative mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] lg:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            variants={reveal}
            className="bg-[#0F0F12]/80 px-6 py-10 text-center transition-colors hover:bg-[#16161A]"
          >
            <p className="font-display text-[clamp(2.5rem,4vw,4rem)] font-light tracking-tight text-[#F5F5F7]">
              <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-[14px] text-zinc-500">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
