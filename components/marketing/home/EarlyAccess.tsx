'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

const APP_SIGNUP = 'https://app.growthdialer.com/signup';

export function EarlyAccess() {
  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-10 text-center backdrop-blur-xl lg:p-16"
      >
        <Spotlight />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[260px] w-[min(80vw,560px)] -translate-x-1/2 rounded-full opacity-[0.12] blur-[110px]"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
        />
        <span className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.06] py-1 pl-1.5 pr-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6]">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="text-[12px] font-medium text-[#8B5CF6]">Early access</span>
        </span>

        <h2 className="relative font-display text-[clamp(2rem,4.5vw,3.25rem)] font-light leading-[1.04] tracking-tight text-[#F5F5F7]">
          Be among the first teams
          <br />
          <span className="font-medium">on GrowthDialer.</span>
        </h2>
        <p className="relative mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-zinc-400">
          We&apos;re onboarding our first sales teams now. Create an account, make
          a call, and help shape what comes next — no credit card required.
        </p>

        <div className="relative mt-9 flex justify-center">
          <a
            href={APP_SIGNUP}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-sm font-medium text-white transition-all hover:bg-[#7C3AED] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A]"
          >
            Claim your spot
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
