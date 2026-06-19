'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { SiteFooter } from './SiteFooter';
import { ShimmerButton } from './ShimmerButton';
import { EASE_OUT } from './motion';

const APP_SIGNUP = 'https://app.growthdialer.com/signup';

export function FinalCTA() {
  return (
    <>
      <section className="relative overflow-hidden px-5 py-28 lg:px-8 lg:py-36">
        <div aria-hidden className="pointer-events-none absolute inset-0 marketing-grid-deep opacity-25" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[min(95vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.14] blur-[130px]"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 65%)' }}
        />
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            aria-hidden
            className="pointer-events-none absolute rounded-full blur-[120px]"
            style={{
              width: 200 + i * 80,
              height: 200 + i * 80,
              background: i % 2 ? 'rgba(99,102,241,0.12)' : 'rgba(124,58,237,0.15)',
              left: `${20 + i * 25}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{ y: [0, -16, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="marketing-glass relative mx-auto max-w-3xl rounded-[2rem] px-6 py-14 text-center sm:px-10"
        >
          <div className="mb-8 flex justify-center">
            <LiveWaveform bars={28} height={36} barWidth={2.5} gap={3} />
          </div>
          <h2 className="font-display text-[clamp(2.4rem,5.5vw,3.75rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]">
            Bring every call
            <br />
            <span className="font-medium marketing-shimmer-text">back into focus.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-zinc-400">
            Start with a real web dialer, then layer recordings, AI summaries, coaching and analytics as your team grows.
          </p>
          <div className="mt-10 flex justify-center">
            <ShimmerButton href={APP_SIGNUP} size="lg">
              Start Free Today
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </ShimmerButton>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </>
  );
}
