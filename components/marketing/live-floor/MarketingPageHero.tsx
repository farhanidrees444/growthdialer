'use client';

import { motion } from 'framer-motion';
import { reveal, revealContainer } from './motion';

type MarketingPageHeroProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  children?: React.ReactNode;
  centered?: boolean;
};

export function MarketingPageHero({
  eyebrow,
  title,
  description,
  children,
  centered = true,
}: MarketingPageHeroProps) {
  return (
    <section className="relative overflow-hidden px-5 pt-32 sm:pt-36 lg:px-8 lg:pt-44">
      {/* Resend signature: dotted grid with radial fade + light rays */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mk-dot-grid mk-fade-grid absolute inset-0" />
        <div className="mk-light-rays absolute inset-x-0 top-0 h-[420px] opacity-70" />
      </div>
      <motion.div
        initial="hidden"
        animate="show"
        variants={revealContainer}
        className={`relative mx-auto max-w-3xl pb-14 lg:pb-20 ${centered ? 'text-center' : ''}`}
      >
        <motion.p variants={reveal} className="mk-eyebrow">
          {eyebrow}
        </motion.p>
        <motion.h1
          variants={reveal}
          className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-zinc-950"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={reveal}
          className={`mk-lead mt-5 ${centered ? 'mx-auto max-w-xl' : 'max-w-2xl'}`}
        >
          {description}
        </motion.p>
        {children && (
          <motion.div
            variants={reveal}
            className={`mt-8 ${centered ? 'flex flex-col items-center justify-center gap-3 sm:flex-row' : 'flex flex-col gap-3 sm:flex-row'}`}
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
