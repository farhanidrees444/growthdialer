'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { ShimmerButton } from './ShimmerButton';
import { TypewriterRotator } from './TypewriterRotator';
import { useMarketingMotionReduced, EASE_OUT } from './motion';

export function Hero() {
  const reduce = useMarketingMotionReduced();

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-28 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[480px] w-[min(92vw,860px)] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(124,58,237,0.14) 0%, transparent 72%)',
        }}
      />

      <div className="relative z-[2] mx-auto max-w-3xl text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <h1 className="font-display text-[clamp(2.25rem,6vw,4.75rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]">
            Every call,{' '}
            <span className="font-semibold text-[#A78BFA]">understood</span>
            <br className="hidden sm:block" />
            {' '}
            the moment it ends.
          </h1>

          <TypewriterRotator />

          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-400">
            GrowthDialer records, transcribes and analyzes every conversation — turning raw calls
            into summaries, sentiment and next steps.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ShimmerButton href="https://app.growthdialer.com/signup">
              Start Free — No Card
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </ShimmerButton>
            <ShimmerButton href="/demo" variant="ghost">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08]">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Watch 2-min demo
            </ShimmerButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
