'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Plus, Clock } from 'lucide-react';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { MiniWave } from '@/components/marketing/live-floor/LiveWaveform';
import { EASE_OUT, SPRING, reveal, revealContainer } from '@/components/marketing/live-floor/motion';

const APP_SIGNUP = 'https://app.growthdialer.com/signup';

type Billing = 'monthly' | 'annual';

interface Plan {
  id: string;
  name: string;
  monthly: number | null;
  annual: number | null;
  tagline: string;
  cta: string;
  href: string;
  popular?: boolean;
  lead?: string;
  features: { label: string; soon?: boolean }[];
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 25,
    annual: 18,
    tagline: 'For solo reps getting started with outbound.',
    cta: 'Start Free',
    href: APP_SIGNUP,
    features: [
      { label: 'Outbound calling (US & Canada)' },
      { label: 'Web dialer + click-to-call' },
      { label: '1 local number' },
      { label: 'Call recording' },
      { label: 'Leads management' },
      { label: 'Basic analytics' },
      { label: 'AI call summaries' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 39,
    annual: 29,
    tagline: 'The full AI dialer for working reps.',
    cta: 'Start Free',
    href: APP_SIGNUP,
    popular: true,
    lead: 'Everything in Starter, plus',
    features: [
      { label: 'AI Dialer (3-mode Focus Stage)' },
      { label: 'Power Dialer' },
      { label: 'AI Conversation Intelligence — summaries, sentiment & intent' },
      { label: 'Advanced analytics' },
      { label: 'Multiple numbers' },
      { label: 'Number health & spam monitoring' },
      { label: 'Inbound calling' },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    monthly: 69,
    annual: 48,
    tagline: 'For growing teams that need more room.',
    cta: 'Start Free',
    href: APP_SIGNUP,
    lead: 'Everything in Pro, plus',
    features: [
      { label: 'Higher calling & usage limits' },
      { label: 'Priority support' },
      { label: 'Team workspaces', soon: true },
      { label: 'Public API', soon: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: null,
    annual: null,
    tagline: 'For high-volume teams with custom needs.',
    cta: 'Contact sales',
    href: '/contact-sales',
    lead: 'Everything in Scale, plus',
    features: [
      { label: 'Volume discounts' },
      { label: 'Dedicated support' },
      { label: 'Custom onboarding' },
    ],
  },
];

const ADDONS = [
  { title: 'Additional numbers', price: 'from $3 / number / mo', desc: 'Add local numbers as your team grows.', soon: false },
  { title: 'Parallel Dialer', price: 'Coming soon', desc: 'Dial multiple lines at once and connect on the first answer.', soon: true },
  { title: 'AI Voice Agent / Receptionist', price: 'Coming soon', desc: 'An AI that answers and qualifies inbound calls for you.', soon: true },
];

export function Plans() {
  const [billing, setBilling] = useState<Billing>('annual');

  return (
    <section className="relative px-5 pt-36 lg:px-8 lg:pt-44">
      {/* Ambient violet glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[min(90vw,820px)] -translate-x-1/2 rounded-full opacity-[0.09] blur-[120px]"
        style={{ background: 'radial-gradient(circle, hsl(258,90%,66%) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={revealContainer}
        className="relative mx-auto max-w-2xl text-center"
      >
        <motion.div variants={reveal} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1 pl-2 pr-3 backdrop-blur-xl">
          <MiniWave className="scale-90" />
          <span className="text-[12px] text-muted-foreground">Pricing</span>
        </motion.div>
        <motion.h1 variants={reveal} className="font-display text-[clamp(2.4rem,5vw,3.75rem)] font-light leading-[1.02] tracking-tight text-foreground">
          Simple pricing that
          <br />
          <span className="font-medium">scales with you</span>.
        </motion.h1>
        <motion.p variants={reveal} className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          Start free, upgrade when you&apos;re ready. Every plan includes call
          recording and AI call summaries — no add-ons required to get value.
        </motion.p>

        {/* Toggle */}
        <motion.div variants={reveal} className="mt-9 flex items-center justify-center gap-3">
          <div className="relative inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-xl">
            {(['monthly'a, 'nnual'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className="relative rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(258,90%,66%)']/40"
              >
                {billing === b && (
                  <motion.span
                    layoutId="billing-pill"
                    transition={SPRING}
                    className="absolute inset-0 rounded-full bg-violet-600"
                  />
                )}
                <span className={`relative z-10 ${billing === b ? 'text-white' : 'text-muted-foreground'}`}>
                  {b === 'monthly' ? 'Monthly' : 'Annual'}
                </span>
              </button>
            ))}
          </div>
          <span className="rounded-full border border-[hsl(186,100%,42%)']/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            Save up to 30%
          </span>
        </motion.div>
      </motion.div>

      {/* Plan cards */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealContainer}
        className="relative mx-auto mt-14 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {PLANS.map((plan) => {
          const price = billing === 'annual' ? plan.annual : plan.monthly;
          const isCustom = price === null;
          return (
            <motion.div
              key={plan.id}
              variants={reveal}
              whileHover={{ y: -6 }}
              transition={SPRING}
              className={`group relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl transition-colors ${
                plan.popular
                  ? 'border-[hsl(258,90%,66%)']/40 bg-violet-600/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
              }`}
            >
              <Spotlight color={plan.popular ? hsl(258, 90%, 66%)'  : 'hsl(258, 90%, 66%)'} />

              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-semibold text-white shadow-lg shadow-[hsl(258,90%,66%)']/30">
                  Most popular
                </span>
              )}

              <div className="mb-5">
                <h3 className="text-[15px] font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/70">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-1 flex items-end gap-1.5">
                {isCustom ? (
                  <span className="font-display text-4xl font-light tracking-tight text-foreground">Custom</span>
                ) : (
                  <>
                    <span className="mb-1 text-lg text-muted-foreground/70">$</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.id}-${billing}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                        className="font-display text-5xl font-light tabular-nums tracking-tight text-foreground"
                      >
                        {price}
                      </motion.span>
                    </AnimatePresence>
                    <span className="mb-1.5 text-[13px] text-muted-foreground/70">/user/mo</span>
                  </>
                )}
              </div>
              <p className="mb-6 h-4 text-[12px] text-muted-foreground/60">
                {isCustom ? 'Tailored to your volume' : billing === 'annual' ? 'billed annually' : 'billed monthly'}
              </p>

              {/* CTA */}
              <a
                href={plan.href}
                className={`mb-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  plan.popular
                    ? 'bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-[hsl(258,90%,66%)']/60'
                    : 'border border-white/[0.1] text-zinc-200 hover:border-white/[0.2] hover:text-white focus-visible:ring-white/20'
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>

              {/* Features */}
              {plan.lead && (
                <p className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground/60">{plan.lead}</p>
              )}
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground/90">
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.popular ? 'text-[hsl(258,90%,66%)']' : 'text-muted-foreground/70'}`} />
                    <span>
                      {f.label}
                      {f.soon && (
                        <span className="ml-1.5 rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-muted-foreground/70">
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

      {/* Add-ons */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealContainer}
        className="mx-auto mt-6 max-w-7xl"
      >
        <motion.div variants={reveal} className="grid gap-4 sm:grid-cols-3">
          {ADDONS.map((a) => (
            <div key={a.title} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-colors hover:border-white/[0.12]">
              <Spotlight />
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-muted-foreground/90">
                  {a.soon ? <Clock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
                <span className={`text-[12px] font-medium ${a.soon ? 'text-muted-foreground/70' : 'text-primary'}`}>{a.price}</span>
              </div>
              <h4 className="text-[14px] font-medium text-foreground">{a.title}</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/70">{a.desc}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
