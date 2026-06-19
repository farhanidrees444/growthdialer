'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/marketing/live-floor/Reveal';
import { ShimmerButton } from '@/components/marketing/live-floor/ShimmerButton';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { SPRING, EASE_OUT } from '@/components/marketing/live-floor/motion';
import { MARKETING_PLANS } from '@/lib/marketing/pricing';

type Billing = 'monthly' | 'annual';

const HIGHLIGHT = MARKETING_PLANS.filter((p) => p.id === 'starter' || p.id === 'pro' || p.id === 'team');

export function HomePricing() {
  const [billing, setBilling] = useState<Billing>('annual');

  return (
    <motion.section
      id="pricing"
      className="relative overflow-hidden px-5 py-20 lg:px-8 lg:py-28"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3, margin: '-10%' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[min(92vw,860px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.045] blur-3xl"
        style={{ background: 'radial-gradient(circle at 42% 48%, #8B5CF6 0%, #06B6D4 42%, transparent 72%)' }}
      />
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Pricing
        </p>
        <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
          Start free. <span className="font-medium">Scale when ready.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[16px] text-zinc-400">
          Every plan includes recording and AI summaries. Upgrade your workspace when your team grows.
        </p>

        <div className="mt-8 inline-flex items-center gap-3">
          <div className="relative inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
            {(['monthly', 'annual'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className="relative rounded-full px-5 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/40"
              >
                {billing === b && (
                  <motion.span
                    layoutId="home-billing-pill"
                    transition={SPRING}
                    className="absolute inset-0 rounded-full bg-[#8B5CF6]"
                  />
                )}
                <span className={`relative z-10 ${billing === b ? 'text-white' : 'text-zinc-400'}`}>
                  {b === 'monthly' ? 'Monthly' : 'Annual'}
                </span>
              </button>
            ))}
          </div>
          <AnimatePresence>
            {billing === 'annual' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-2.5 py-1 text-[11px] font-medium text-[#06B6D4]"
              >
                Save up to 20%
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Reveal>

      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="relative mx-auto mt-12 grid max-w-5xl items-start gap-4 md:grid-cols-3"
      >
        {HIGHLIGHT.map((plan) => {
          const price = billing === 'annual' ? plan.annual : plan.monthly;
          const isFree = price === 0;
          return (
            <motion.div
              key={plan.id}
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } } }}
              whileHover={{ y: -4 }}
              transition={SPRING}
              className={`marketing-hover-lift relative flex flex-col rounded-[1.75rem] border p-6 backdrop-blur-xl ${
                plan.popular
                  ? 'z-20 scale-[1.03] border-transparent bg-[linear-gradient(#111119,#111119)_padding-box,linear-gradient(135deg,#8B5CF6,#06B6D4)_border-box] shadow-[0_26px_100px_rgba(139,92,246,0.24),0_0_80px_rgba(6,182,212,0.10)]'
                  : 'border-white/[0.08] bg-[#0F0F12]/80'
              }`}
            >
              {plan.popular && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.34),rgba(6,182,212,0.14)_36%,transparent_72%)] opacity-80 blur-2xl"
                  />
                  <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-3 py-1 text-[11px] font-semibold text-white shadow-[0_0_36px_rgba(139,92,246,0.55)]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/80" />
                    Most popular
                  </span>
                </>
              )}
              <Spotlight color={plan.popular ? '#8B5CF6' : undefined} />
              <h3 className="text-[15px] font-semibold text-[#F5F5F7]">{plan.name}</h3>
              <p className="mt-1 text-[13px] text-zinc-500">{plan.tagline}</p>
              <div className="my-5 flex items-end gap-1">
                {isFree ? (
                  <span className="font-display text-4xl font-light text-[#F5F5F7]">Free</span>
                ) : (
                  <>
                    <span className="mb-1 text-lg text-zinc-500">$</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.id}-${billing}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="font-display text-4xl font-light tabular-nums text-[#F5F5F7]"
                      >
                        {price}
                      </motion.span>
                    </AnimatePresence>
                    <span className="mb-1 text-sm text-zinc-500">/mo</span>
                  </>
                )}
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-[13px] text-zinc-400">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" />
                    {f.label}
                  </li>
                ))}
              </ul>
              <ShimmerButton href={plan.href} className="w-full justify-center">
                {plan.cta}
              </ShimmerButton>
            </motion.div>
          );
        })}
      </motion.div>

      <p className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-[13px] text-zinc-600">
        <span>No credit card required</span>
        <span aria-hidden>·</span>
        <span>Cancel anytime</span>
        <span aria-hidden>·</span>
        <Link href="/pricing" className="inline-flex items-center gap-1 text-[#8B5CF6] hover:text-[#06B6D4]">
          Full pricing <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </p>
    </motion.section>
  );
}
