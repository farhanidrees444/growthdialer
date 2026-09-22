'use client';

import { motion } from 'framer-motion';
import { useMarketingMotionReduced } from '@/components/marketing/live-floor/motion';

// Clearly generic / fictional placeholder wordmarks — swappable later.
// No real brands, no "trusted by N".
const LOGOS = ['Acme', 'Northwind', 'Globex', 'Initech', 'Vandelay', 'Soylent', 'Hooli', 'Umbrella'];

export function SocialProof() {
  const reduce = useMarketingMotionReduced();
  const row = [...LOGOS, ...LOGOS];

  return (
    <section className="relative px-5 py-10 lg:px-8">
      <p className="mb-7 text-center text-[12px] uppercase tracking-[0.2em] text-zinc-600">
        Built for modern sales teams
      </p>

      <div className="relative mx-auto max-w-5xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          className="flex w-max items-center gap-14"
          animate={reduce ? undefined : { x: ['0%', '-50%'] }}
          transition={reduce ? undefined : { duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="select-none whitespace-nowrap font-display text-xl font-medium tracking-tight text-zinc-600 transition-colors hover:text-zinc-400"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>

      <p className="mt-7 text-center text-[12px] text-zinc-700">
        Placeholder names shown — these are illustrative, not customers.
      </p>
    </section>
  );
}
