'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';
import { Reveal } from '@/components/ui/reveal';

const APP_SIGNUP = 'https://app.growthdialer.com/signup';

export function EarlyAccess() {
  return (
    <section className="relative overflow-hidden px-5 py-16 lg:px-8 lg:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mk-dot-grid mk-fade-grid absolute inset-0" />
        <div className="mk-light-rays absolute inset-x-0 top-0 h-[420px] opacity-60" />
      </div>
      <Reveal className="relative mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="mk-card relative overflow-hidden p-10 text-center lg:p-16"
        >
          <div aria-hidden className="mk-glow-brand pointer-events-none absolute inset-0" />
          <div className="relative">
            <span className="mk-chip mb-6">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#6D28D9]">
                <Sparkles className="h-3 w-3" />
              </span>
              <span>Early access</span>
            </span>

            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-zinc-950">
              Be among the first teams
              <br />
              <span className="font-semibold">on GrowthDialer.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-zinc-600">
              We&apos;re onboarding our first sales teams now. Create an account, make
              a call, and help shape what comes next — no credit card required.
            </p>

            <div className="mt-9 flex justify-center">
              <a href={APP_SIGNUP} className="mk-btn mk-btn-primary">
                Claim your spot
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </Reveal>
    </section>
  );
}
