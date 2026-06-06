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
    <section className="relative px-5 pt-36 lg:px-8 lg:pt-44">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 h-[420px] w-[min(90vw,820px)] -translate-x-1/2 rounded-full opacity-[0.09] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />
      <motion.div
        initial="hidden"
        animate="show"
        variants={revealContainer}
        className={`relative mx-auto max-w-3xl ${centered ? 'text-center' : ''}`}
      >
        <motion.p
          variants={reveal}
          className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          variants={reveal}
          className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={reveal}
          className={`mt-5 text-[16px] leading-relaxed text-zinc-400 ${centered ? 'mx-auto max-w-xl' : 'max-w-2xl'}`}
        >
          {description}
        </motion.p>
        {children && (
          <motion.div variants={reveal} className={`mt-8 ${centered ? 'flex flex-col justify-center gap-3 sm:flex-row' : ''}`}>
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
