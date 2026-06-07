'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Phone, Sparkles, Users, Headphones } from 'lucide-react';
import { EASE_OUT, SPRING, reveal, revealContainer } from '@/components/marketing/live-floor/motion';
import { MARKETING_PLANS, MARKETING_ADDONS } from '@/lib/marketing/pricing';

type Billing = 'monthly' | 'annual';

const INCLUDED_EVERYWHERE = [
  { icon: Phone, label: 'Call recording' },
  { icon: Sparkles, label: 'AI summaries' },
  { icon: Users, label: 'Leads pipeline' },
  { icon: Headphones, label: 'Web dialer' },
];

export function Plans() {
  const [billing, setBilling] = useState<Billing>('annual');

  return (
    <>
      {/* Hero */}
      <section className="relative border-b border-zinc-800/60 px-5 pb-14 pt-32 lg:px-8 lg:pb-16 lg:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[min(92vw,860px)] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 72%)',
          }}
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={revealContainer}
          className="relative mx-auto max-w-3xl text-center"
        >
          <motion.p
            variants={reveal}
            className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600"
          >
            Pricing
          </motion.p>
          <motion.h1
            variants={reveal}
            className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-light leading-[1.04] tracking-tight text-zinc-50"
          >
            Simple plans.{' '}
            <span className="font-medium text-violet-300">Zero surprises.</span>
          </motion.h1>
          <motion.p
            variants={reveal}
            className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-zinc-400"
          >
            Start free on Starter. Upgrade your workspace when you need more seats, parallel lines,
            and team analytics — every plan includes recording and AI summaries.
          </motion.p>

          <motion.div variants={reveal} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <div className="relative inline-flex rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-1 backdrop-blur-md">
              {(['monthly', 'annual'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBilling(b)}
                  className="relative rounded-md px-5 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                >
                  {billing === b && (
                    <motion.span
                      layoutId="pricing-billing-pill"
                      transition={SPRING}
                      className="absolute inset-0 rounded-md bg-zinc-100"
                    />
                  )}
                  <span className={`relative z-10 ${billing === b ? 'text-zinc-950' : 'text-zinc-500'}`}>
                    {b === 'monthly' ? 'Monthly' : 'Annual'}
                  </span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {billing === 'annual' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400"
                >
                  Save up to 20%
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </section>

      {/* Included on every plan */}
      <section className="border-b border-zinc-800/60 bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-4 lg:px-8">
          <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
            Every plan includes
          </span>
          {INCLUDED_EVERYWHERE.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 text-[13px] text-zinc-400">
              <Icon className="h-3.5 w-3.5 text-zinc-600" />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Plan cards */}
      <section className="px-5 py-14 lg:px-8 lg:py-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={revealContainer}
          className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {MARKETING_PLANS.map((plan) => {
            const price = billing === 'annual' ? plan.annual : plan.monthly;
            const isCustom = price === null;
            const isFree = price === 0;

            return (
              <motion.article
                key={plan.id}
                variants={reveal}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`relative flex flex-col rounded-xl border p-6 backdrop-blur-md transition-colors ${
                  plan.popular
                    ? 'border-violet-500/30 bg-violet-500/[0.06] shadow-[0_0_0_1px_rgba(124,58,237,0.15)]'
                    : 'border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700/70'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-950">
                    Most popular
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-base font-semibold text-zinc-100">{plan.name}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{plan.tagline}</p>
                </div>

                <div className="mb-1 flex items-end gap-1">
                  {isCustom ? (
                    <span className="font-display text-4xl font-light text-zinc-100">Custom</span>
                  ) : isFree ? (
                    <span className="font-display text-4xl font-light text-zinc-100">Free</span>
                  ) : (
                    <>
                      <span className="mb-1 text-lg text-zinc-600">$</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${plan.id}-${billing}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25, ease: EASE_OUT }}
                          className="font-display text-4xl font-light tabular-nums text-zinc-100"
                        >
                          {price}
                        </motion.span>
                      </AnimatePresence>
                      <span className="mb-1 text-sm text-zinc-600">/mo</span>
                    </>
                  )}
                </div>
                <p className="mb-6 min-h-[1.25rem] text-[12px] text-zinc-600">
                  {isCustom
                    ? 'Tailored to your volume'
                    : isFree
                      ? plan.seats
                      : `${plan.seats} · ${billing === 'annual' ? 'billed annually' : 'billed monthly'}`}
                </p>

                <a
                  href={plan.href}
                  className={`mb-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition active:scale-[0.98] ${
                    plan.popular
                      ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                      : 'border border-zinc-800/60 bg-zinc-950/50 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </a>

                {plan.lead && (
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                    {plan.lead}
                  </p>
                )}
                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5 text-[13px] text-zinc-400">
                      <Check
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.popular ? 'text-violet-400' : 'text-zinc-600'}`}
                      />
                      <span>
                        {f.label}
                        {f.soon && (
                          <span className="ml-1.5 rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600">
                            Soon
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Add-ons */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={revealContainer}
          className="mx-auto mt-10 max-w-7xl"
        >
          <motion.h2 variants={reveal} className="mb-4 text-sm font-medium text-zinc-400">
            Add-ons &amp; roadmap
          </motion.h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {MARKETING_ADDONS.map((addon) => (
              <motion.div
                key={addon.title}
                variants={reveal}
                className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-md"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-[14px] font-medium text-zinc-200">{addon.title}</h4>
                  <span
                    className={`shrink-0 text-[11px] font-medium ${addon.soon ? 'text-zinc-600' : 'text-violet-400'}`}
                  >
                    {addon.price}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-zinc-500">{addon.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
}
