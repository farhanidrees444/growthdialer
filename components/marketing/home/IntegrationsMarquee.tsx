'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { reveal, revealContainer } from '@/components/marketing/live-floor/motion';
import { INTEGRATION_BRANDS } from '@/lib/marketing/integration-brands';

export function IntegrationsMarquee() {
  // Duplicate the set so the CSS -50% translate loops seamlessly.
  const row = [...INTEGRATION_BRANDS, ...INTEGRATION_BRANDS];

  return (
    <motion.section
      id="integrations"
      className="relative overflow-hidden px-5 py-16 lg:px-8 lg:py-24"
      aria-label="Integrations"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35, margin: '-10%' }}
      variants={revealContainer}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-[18%] top-8 h-72 w-72 rounded-full opacity-[0.05] blur-3xl"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-[12%] h-80 w-80 rounded-full opacity-[0.045] blur-3xl"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-5 top-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
      <motion.div variants={reveal} className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Integrations
        </p>
        <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-light leading-[1.1] tracking-tight text-[#F5F5F7]">
          HubSpot is live. The rest of your stack is next.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">
          HubSpot connects today; other CRM and automation tools are on the waitlist. Every dial still logs in GrowthDialer.
        </p>
        <Link
          href="/integrations"
          className="mt-5 inline-flex text-sm font-medium text-[#F5F5F7] underline-offset-4 hover:underline"
        >
          See all integrations →
        </Link>
      </motion.div>

      {/* Marquee — pure-CSS loop (runs on every viewport), edges masked into bg */}
      <motion.div
        variants={reveal}
        className="relative mx-auto max-w-6xl overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [&:hover_.marquee-track]:[animation-play-state:paused]"
      >
        <ul className="marquee-track flex w-max items-center gap-4 [animation-duration:34s]">
          {row.map((b, i) => {
            const { Icon } = b;
            const color = b.color || '#06B6D4';
            return (
              <li
                key={`${b.id}-${i}`}
                className="group relative flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_0_0_1px_var(--brand),0_18px_48px_var(--brand-glow)] sm:h-24 sm:w-24 sm:p-4"
                style={{ ['--brand']: color, ['--brand-glow']: `${color}33` } as CSSProperties}
              >
                {/* Localized radial glow on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${color}2e, transparent 70%)` }}
                />
                <Icon
                  aria-hidden
                  className="relative h-10 w-10 shrink-0 transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12"
                  style={{ color }}
                />
                <span className="sr-only">{b.name}</span>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </motion.section>
  );
}
