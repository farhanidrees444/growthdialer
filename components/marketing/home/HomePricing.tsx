'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { useMarketingMotionReduced } from '@/components/marketing/live-floor/motion';
import { cn } from '@/lib/utils';

const MONTHLY = [
  { name: 'Starter', href: '/pricing?highlight=starter', monthly: '$49', annual: '$39', blurb: 'Solo reps — dial, record, transcribe, and sync calls.', features: ['AI dialer', 'Unlimited calls', 'Recordings and transcripts', '1 local number', 'CRM sync'] },
  { name: 'Growth', href: '/pricing?highlight=growth', monthly: '$79', annual: '$63', blurb: 'Growing sales teams — call scoring and coaching dashboards.', features: ['AI call scoring', 'Post-call summaries', 'Coaching dashboard', 'Sequences', 'Leaderboard'], popular: true },
  { name: 'Pro', href: '/pricing?highlight=pro', monthly: '$119', annual: '$95', blurb: 'High-volume teams — live floor visibility and manager controls.', features: ['Live monitor', 'Whisper, barge, takeover', 'Weekly coaching reports', 'API and webhooks', 'Priority support'] },
];

export function HomePricing() {
  const [annual, setAnnual] = useState(true);
  const reduce = useMarketingMotionReduced();

  return (
    <section id="pricing" className="relative scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mk-eyebrow justify-center">Pricing</p>
          <h2 className="mk-h-section">
            Start free. <span className="font-semibold">Scale when ready.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-zinc-600">
            Every paid plan starts with a 7-day free trial. No credit card required.
          </p>
        </Reveal>

        <Reveal delay={60}>
          <div
            className="mx-auto mb-10 flex w-fit items-center gap-1 rounded-full border border-zinc-950/[0.08] bg-white p-1"
            role="group"
            aria-label="Billing period"
          >
            {[
              { key: true, label: 'Annual' },
              { key: false, label: 'Monthly' },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setAnnual(o.key)}
                aria-pressed={annual === o.key}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-all',
                  annual === o.key
                    ? 'bg-zinc-950 text-white shadow-[0_2px_8px_rgba(9,9,11,0.2)]'
                    : 'text-zinc-600 hover:text-zinc-950'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {MONTHLY.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <div
                className={cn(
                  'relative h-full rounded-2xl p-6 transition-all duration-300',
                  p.popular
                    ? 'border-2 border-zinc-950 bg-white shadow-[0_16px_48px_-12px_rgba(9,9,11,0.16)]'
                    : 'border border-zinc-950/[0.08] bg-white hover:border-zinc-950/[0.16]'
                )}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-medium text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-zinc-950">{p.name}</h3>
                <p className="mt-1 text-[13px] text-zinc-500">{p.blurb}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <motion.span
                    key={annual ? 'annual' : 'monthly'}
                    initial={reduce ? undefined : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="font-display text-4xl font-semibold text-zinc-950"
                  >
                    {annual ? p.annual : p.monthly}
                  </motion.span>
                  <span className="text-sm text-zinc-500">/mo</span>
                </div>
                <p className="mt-1 text-[12px] text-zinc-400">
                  {annual ? 'Billed annually' : 'Billed monthly'}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-zinc-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={cn('mt-8 block text-center', p.popular ? 'mk-btn mk-btn-primary w-full' : 'mk-btn mk-btn-secondary w-full')}
                >
                  Start free trial
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-[13px] text-zinc-500">
            <span>7-day free trial</span>
            <span aria-hidden>·</span>
            <span>No credit card required</span>
            <span aria-hidden>·</span>
            <span>Annual billing saves 20%</span>
            <span aria-hidden>·</span>
            <Link href="/pricing" className="inline-flex items-center gap-1 font-medium text-[#6D28D9] hover:text-[#7C3AED]">
              Full pricing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
