'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Spotlight } from './Spotlight';
import { EASE_OUT, SPRING } from './motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-12 pt-32 lg:px-8 lg:pb-16 lg:pt-40">
      {/* Ambient violet glow — single, restrained */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[min(90vw,900px)] -translate-x-1/2 rounded-full opacity-[0.10] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* ── Left: editorial copy ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1.5 pl-2 pr-3.5 backdrop-blur-xl"
          >
            <span className="flex h-5 items-center gap-1.5 rounded-full bg-[#06B6D4]/10 px-2 text-[11px] font-medium text-[#06B6D4]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06B6D4] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#06B6D4]" />
              </span>
              Live
            </span>
            <span className="text-[13px] text-zinc-400">AI Sales Dialer</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.06 }}
            className="font-display text-[clamp(2.6rem,6vw,4.75rem)] font-light leading-[0.98] tracking-tight text-[#F5F5F7]"
          >
            Every call,
            <br />
            <span className="font-medium">understood</span> the
            <br />
            moment it ends.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.16 }}
            className="mt-7 max-w-md text-[17px] leading-relaxed text-zinc-400"
          >
            GrowthDialer is the AI dialer that records, transcribes and analyzes
            every conversation — turning raw calls into summaries, sentiment and
            next steps without a single note.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.26 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="https://app.growthdialer.com/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 text-sm font-medium text-white transition-all hover:bg-[#7C3AED] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A]"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="https://app.growthdialer.com/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-6 text-sm font-medium text-zinc-300 transition-all hover:border-white/[0.16] hover:text-[#F5F5F7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Log in
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 0.4 }}
            className="mt-5 text-[13px] text-zinc-600"
          >
            No credit card required · Built for outbound teams
          </motion.p>
        </div>

        {/* ── Right: the living call card (border-beam) ── */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...SPRING, delay: 0.34 }}
          className="relative"
        >
          <BorderBeamCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#06B6D4]/10 text-[#06B6D4]">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#F5F5F7]">Outbound call</p>
                  <p className="text-xs text-zinc-500">Connected · 02:14</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-[#06B6D4]/10 px-2.5 py-1 text-[11px] font-medium text-[#06B6D4]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" />
                Recording
              </span>
            </div>

            {/* The living waveform — the centerpiece */}
            <div className="my-8">
              <LiveWaveform bars={56} height={88} />
            </div>

            {/* Streaming transcript hint */}
            <div className="space-y-2 rounded-xl border border-white/[0.05] bg-black/30 p-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
                Transcribing
              </p>
              <p className="text-[13px] leading-relaxed text-zinc-400">
                &ldquo;…that actually solves the follow-up problem for us. Can you
                send pricing for a team of twelve?&rdquo;
                <motion.span
                  className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-[#06B6D4]"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </p>
            </div>
          </BorderBeamCard>
        </motion.div>
      </div>
    </section>
  );
}

/** Glass card with a single animated violet border-beam traveling its edge. */
function BorderBeamCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl p-[1px]">
      {/* Beam */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, #8B5CF6 340deg, #06B6D4 360deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      {/* Static subtle border under the beam */}
      <div className="absolute inset-0 rounded-2xl border border-white/[0.06]" />
      {/* Content surface */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0C0C0F]/90 p-6 backdrop-blur-xl">
        <Spotlight color="#06B6D4" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
