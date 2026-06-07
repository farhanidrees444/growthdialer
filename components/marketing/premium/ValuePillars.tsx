'use client';

import { motion } from 'framer-motion';
import { Brain, Headphones, Layers, TrendingUp } from 'lucide-react';
import { Reveal } from '@/components/marketing/live-floor/Reveal';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

const PILLARS = [
  {
    icon: Brain,
    title: 'AI-native intelligence',
    description:
      'Every call is transcribed, summarized, and tagged with sentiment and intent — so reps sell and managers coach from facts, not memory.',
  },
  {
    icon: Layers,
    title: 'One workspace, full stack',
    description:
      'Dialer, recordings, leads, dispositions, and analytics in a single pane. No juggling five tools to run one outbound motion.',
  },
  {
    icon: Headphones,
    title: 'Live coaching floor',
    description:
      'Managers listen, whisper, and debrief without shadowing every dial. Built for teams that review calls async at scale.',
  },
  {
    icon: TrendingUp,
    title: 'Pricing that scales cleanly',
    description:
      'Start free solo. Upgrade to Pro or Team workspaces when you hire — transparent workspace pricing, not opaque enterprise quotes.',
  },
];

export function ValuePillars() {
  return (
    <section className="px-5 py-20 lg:px-8 lg:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Why GrowthDialer
        </p>
        <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-light leading-[1.08] tracking-tight text-zinc-50">
          Crystal-clear value for{' '}
          <span className="font-medium text-violet-300">modern revenue teams</span>
        </h2>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar, i) => {
          const Icon = pillar.icon;
          return (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: EASE_OUT }}
              className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-md transition-colors hover:border-zinc-700/70 hover:bg-zinc-900/45"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800/60 bg-zinc-950/80 text-violet-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-medium text-zinc-100">{pillar.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{pillar.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
