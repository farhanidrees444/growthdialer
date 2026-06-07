'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Play } from 'lucide-react';
import { ShimmerButton } from './ShimmerButton';
import { TypewriterRotator } from './TypewriterRotator';
import { ProductShowcase } from '@/components/marketing/premium/ProductShowcase';
import { useMarketingMotionReduced, EASE_OUT } from './motion';

const PROOF = [
  'Free Starter — no card',
  'Workspace pricing from $49/mo',
  'HubSpot sync live',
];

export function Hero() {
  const reduce = useMarketingMotionReduced();

  return (
    <section className="relative overflow-hidden px-5 pb-12 pt-28 sm:pb-16 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[520px] w-[min(96vw,1000px)] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 50% 0%, rgba(124,58,237,0.11) 0%, transparent 72%)',
        }}
      />

      <div className="relative z-[2] mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 xl:gap-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="text-center lg:text-left"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800/60 bg-zinc-900/40 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-zinc-500 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            AI sales dialer
          </p>

          <h1 className="font-display text-[clamp(2.35rem,5.5vw,4.25rem)] font-light leading-[1.02] tracking-tight text-zinc-50">
            Every call,{' '}
            <span className="font-semibold text-violet-300">understood</span>
            <br className="hidden sm:block" />
            {' '}
            the moment it ends.
          </h1>

          <div className="lg:text-left">
            <TypewriterRotator />
          </div>

          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-zinc-400 lg:mx-0">
            Record, transcribe, and analyze every conversation — with power dialing, live coaching,
            and workspace pricing built for growing outbound teams.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <ShimmerButton href="https://app.growthdialer.com/signup" size="lg">
              Start Free — No Card
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </ShimmerButton>
            <ShimmerButton href="/demo" variant="ghost" size="lg">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08]">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Watch 2-min demo
            </ShimmerButton>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-start">
            {PROOF.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[13px] text-zinc-500">
                <Check className="h-3.5 w-3.5 text-zinc-600" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
          className="mx-auto w-full lg:mx-0 lg:justify-self-end"
        >
          <ProductShowcase />
        </motion.div>
      </div>
    </section>
  );
}
