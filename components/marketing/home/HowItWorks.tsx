'use client';

import { motion } from 'framer-motion';
import { Upload, PhoneCall, Sparkles } from 'lucide-react';
import { reveal, revealContainer, EASE_OUT } from '@/components/marketing/live-floor/motion';

const STEPS = [
  {
    n: '01',
    icon: Upload,
    title: 'Import your leads',
    body: 'Bring a list in by CSV or add leads by hand. They land in a clean queue, ready to work.',
  },
  {
    n: '02',
    icon: PhoneCall,
    title: 'Dial & talk',
    body: 'Call from the AI Dialer or Power Dialer. Recording starts automatically the moment you connect.',
  },
  {
    n: '03',
    icon: Sparkles,
    title: 'AI handles the rest',
    body: 'Each call is transcribed and turned into a summary, sentiment and next steps — logged to analytics.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 px-5 py-16 lg:px-8 lg:py-24" aria-label="How it works">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
        variants={revealContainer}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          How it works
        </motion.p>
        <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
          Live in <span className="font-medium">three steps</span>.
        </motion.h2>
      </motion.div>

      <motion.ol
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealContainer}
        className="relative mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3"
      >
        {/* connecting line on desktop */}
        <div aria-hidden className="absolute left-0 right-0 top-[2.4rem] hidden h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent md:block" />
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <motion.li
              key={s.n}
              variants={reveal}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-[#8B5CF6]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-display text-3xl font-light tabular-nums text-white/10">{s.n}</span>
              </div>
              <h3 className="text-[16px] font-medium text-[#F5F5F7]">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">{s.body}</p>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}
