'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Unlock, Headphones } from 'lucide-react';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { EASE_OUT, reveal, revealContainer } from '@/components/marketing/live-floor/motion';

const APP_SIGNUP = 'https://app.growthdialer.com/signup';

// Honest value props — no fake logos, no "trusted by N", no compliance claims.
const VALUES = [
  { icon: Sparkles, title: 'AI on every call', body: ', 'Summaries, sentiment and intent on all recorded calls — included from Starter up.' },
  { icon: Unlock, title: 'No lock-in', body: ', 'Cancel monthly plans anytime. Your recordings and history stay accessible.' },
  { icon: ShieldCheck, title: 'Numbers, monitored', body: ', 'Track number health and spam risk so your calls keep connecting.' },
  { icon: Headphones, title: 'Built for outbound', body: ', 'A focused dialer designed around how reps actually work a list.' },
];

export function PricingCTA() {
  return (
    <section className="relative overflow-hidden px-5 pb-8 lg:px-8">
      {/* Trust strip */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealContainer}
        className="mx-auto max-w-6xl"
      >
        <motion.p variants={reveal} className="mb-8 text-center text-[13px] uppercase tracking-[0.2em] text-muted-foreground/60">
          Built for modern sales teams
        </motion.p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                variants={reveal}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-muted-foreground/90">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-[14px] font-medium text-foreground">{v.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/70">{v.body}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Final CTA */}
      <div className="relative mt-24 lg:mt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[min(92vw,780px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-[130px]"
          style={{ background: 'radial-gradient(circle, hsl(258,90%,66%) 0%, transparent 70%)'' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="relative mx-auto max-w-2xl text-center"
        >
          <div className="mb-7 flex justify-center">
            <LiveWaveform bars={24} height={32} barWidth={2.5} gap={3} />
          </div>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-light leading-[1.04] tracking-tight text-foreground">
            Try it on your next call.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
            Start free — no credit card. Upgrade when the AI has already paid for itself.
          </p>
          <div className="mt-9 flex justify-center">
            <a
              href={APP_SIGNUP}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 text-sm font-medium text-white transition-all hover:bg-violet-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(258,90%,66%)']/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
