'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Plus, Clock } from 'lucide-react';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { MiniWave } from '@/components/marketing/live-floor/LiveWaveform';
import { EASE_OUT, SPRING, reveal, revealContainer } from '@/components/marketing/live-floor/motion';
import { MARKETING_PLANS, MARKETING_ADDONS } from '@/lib/marketing/pricing';

type Billing = 'monthly' | 'annual';

export function Plans() {
  const [billing, setBilling] = useState<Billing>('annual');

  return (
    <section className="relative px-5 pt-36 lg:px-8 lg:pt-44">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[min(90vw,820px)] -translate-x-1/2 rounded-full opacity-[0.09] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={revealContainer}
        className="relative mx-auto max-w-2xl text-center"
      >
        <motion.div variants={reveal} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1 pl-2 pr-3 backdrop-blur-xl">
          <MiniWave className="scale-90" />
          <span className="text-[12px] text-zinc-400">Pricing</span>
        </motion.div>
        <motion.h1 variants={reveal} className="font-display text-[clamp(2.4rem,5vw,3.75rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]">
          Simple pricing that
          <br />
          <span className="font-medium">scales with you</span>.
        </motion.h1>
        <motion.p variants={reveal} className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-zinc-400">
          Start free on Starter, then upgrade your workspace when you need more seats
          and AI features. Every plan includes call recording and AI summaries.
        </motion.p>

        <motion.div variants={reveal} className="mt-9 flex items-center justify-center gap-3">
          <div className="relative inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-xl">
            {(['monthly', 'annual'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className="relative rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/40"
              >
                {billing === b && (
                  <motion.span
                    layoutId="billing-pill"
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
          <span className="rounded-full border border-[#06B6D4]/25 bg-[#06B6D4]/10 px-2.5 py-1 text-[11px] font-medium text-[#06B6D4]">
            Save up to 20%
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealContainer}
        className="relative mx-auto mt-14 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {MARKETING_PLANS.map((plan) => {
          const price = billing === 'annual' ? plan.annual : plan.monthly;
          const isCustom = price === null;
          const isFree = price === 0;
          return (
            <motion.div
              key={plan.id}
              variants={reveal}
              whileHover={{ y: -6 }}
              transition={SPRING}
              className={`group relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl transition-colors ${
                plan.popular
                  ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
              }`}
            >
              <Spotlight color={plan.popular ? '#8B5CF6' : '#8B5CF6'} />

              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-[#8B5CF6] px-3 py-1 text-[11px] font-semibold text-white shadow-lg shadow-[#8B5CF6]/30">
                  Most popular
                </span>
              )}

              <div className="mb-5">
                <h3 className="text-[15px] font-semibold text-[#F5F5F7]">{plan.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{plan.tagline}</p>
              </div>

              <div className="mb-1 flex items-end gap-1.5">
                {isCustom ? (
                  <span className="font-display text-4xl font-light tracking-tight text-[#F5F5F7]">Custom</span>
                ) : isFree ? (
                  <span className="font-display text-5xl font-light tracking-tight text-[#F5F5F7]">Free</span>
                ) : (
                  <>
                    <span className="mb-1 text-lg text-zinc-500">$</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.id}-${billing}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                        className="font-display text-5xl font-light tabular-nums tracking-tight text-[#F5F5F7]"
                      >
                        {price}
                      </motion.span>
                    </AnimatePresence>
                    <span className="mb-1.5 text-[13px] text-zinc-500">/workspace/mo</span>
                  </>
                )}
              </div>
              <p className="mb-6 h-4 text-[12px] text-zinc-600">
                {isCustom ? 'Tailored to your volume' : isFree ? plan.seats : `${plan.seats} · ${billing === 'annual' ? 'billed annually' : 'billed monthly'}`}
              </p>

              <a
                href={plan.href}
                className={`mb-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A] ${
                  plan.popular
                    ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] focus-visible:ring-[#8B5CF6]/60'
                    : 'border border-white/[0.1] text-zinc-200 hover:border-white/[0.2] hover:text-white focus-visible:ring-white/20'
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>

              {plan.lead && (
                <p className="mb-3 text-[12px] font-medium uppercase tracking-wider text-zinc-600">{plan.lead}</p>
              )}
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-zinc-300">
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.popular ? 'text-[#8B5CF6]' : 'text-zinc-500'}`} />
                    <span>
                      {f.label}
                      {f.soon && (
                        <span className="ml-1.5 rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-500">
                          Coming soon
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealContainer}
        className="mx-auto mt-6 max-w-7xl"
      >
        <motion.div variants={reveal} className="grid gap-4 sm:grid-cols-3">
          {MARKETING_ADDONS.map((a) => (
            <div key={a.title} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-colors hover:border-white/[0.12]">
              <Spotlight />
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-300">
                  {a.soon ? <Clock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
                <span className={`text-[12px] font-medium ${a.soon ? 'text-zinc-500' : 'text-[#06B6D4]'}`}>{a.price}</span>
              </div>
              <h4 className="text-[14px] font-medium text-[#F5F5F7]">{a.title}</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{a.desc}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
