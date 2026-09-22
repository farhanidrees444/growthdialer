'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Headphones, Bot, ArrowRight, type LucideIcon } from 'lucide-react';
import { EASE_OUT, reveal, revealContainer } from '@/components/marketing/live-floor/motion';
import { Reveal } from '@/components/ui/reveal';
import {
  AI_PILLARS,
  AI_PILLARS_SUBHEAD,
  type ProductFeatureStatus,
} from '@/lib/marketing/honest-copy';

const PILLAR_ICONS: Record<string, LucideIcon> = {
  'conversation-intelligence': Brain,
  'call-brief': Sparkles,
  coaching: Headphones,
  'voice-agent': Bot,
};

const STATUS_STYLES: Record<ProductFeatureStatus, string> = {
  live: 'border border-emerald-600/20 bg-emerald-500/10 text-emerald-700',
  beta: 'border border-cyan-600/20 bg-cyan-500/10 text-cyan-700',
  roadmap: 'border border-amber-600/20 bg-amber-500/10 text-amber-700',
};

const STATUS_LABELS: Record<ProductFeatureStatus, string> = {
  live: 'Live',
  beta: 'Built-in',
  roadmap: 'Roadmap',
};

export function AiProductPillars() {
  return (
    <section id="ai-platform" className="relative px-5 py-16 lg:px-8 lg:py-24" aria-label="AI product pillars">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={revealContainer}
          className="mb-12 max-w-2xl"
        >
          <motion.p variants={reveal} className="mk-eyebrow">
            AI platform
          </motion.p>
          <motion.h2
            variants={reveal}
            className="font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-zinc-950"
          >
            Four pillars.
            <br />
            <span className="font-semibold">Two live · one built-in · one roadmap.</span>
          </motion.h2>
          <motion.p variants={reveal} className="mt-4 text-[16px] leading-relaxed text-zinc-600">
            {AI_PILLARS_SUBHEAD}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={revealContainer}
          className="grid gap-4 sm:grid-cols-2"
        >
          {AI_PILLARS.map((p) => {
            const Icon = PILLAR_ICONS[p.id] ?? Brain;
            const badge = p.statusLabel ?? STATUS_LABELS[p.status];
            return (
              <motion.article
                key={p.id}
                variants={reveal}
                className="mk-card mk-card-hover group relative overflow-hidden p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${p.accent}18`, color: p.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[p.status]}`}
                  >
                    {badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-950">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{p.body}</p>
                <Link
                  href={p.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-950"
                >
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.article>
            );
          })}
        </motion.div>

        <Reveal delay={80} className="mt-10 text-center">
          <Link href="/features/ai" className="mk-btn mk-btn-secondary">
            Explore the full AI platform
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
