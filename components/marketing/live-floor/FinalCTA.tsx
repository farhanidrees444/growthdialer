'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { SiteFooter } from './SiteFooter';
import { EASE_OUT } from './motion';

const APP_SIGNIN = 'https://app.growthdialer.com/login';
const APP_SIGNUP = 'https://app.growthdialer.com/signup';

export function FinalCTA() {
  return (
    <>
      {/* CTA */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8 lg:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[min(92vw,820px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-[130px]"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <div className="mb-8 flex justify-center">
            <LiveWaveform bars={28} height={36} barWidth={2.5} gap={3} />
          </div>
          <h2 className="font-display text-[clamp(2.4rem,5.5vw,4rem)] font-light leading-[1.02] tracking-tight text-foreground">
            Stop taking notes.
            <br />
            <span className="font-medium">Start hearing everything.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
            Spin up your first AI-analyzed call in minutes. No credit card, no
            setup call — just dial.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={APP_SIGNUP}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-sm font-medium text-white transition-all hover:bg-[#7C3AED] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A]"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={APP_SIGNIN}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.08] px-7 text-sm font-medium text-muted-foreground/90 transition-all hover:border-white/[0.16] hover:text-foreground active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Log in
            </a>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </>
  );
}
