'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Headphones, Bot, ArrowRight, type LucideIcon } from 'lucide-react';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { EASE_OUT, reveal, revealContainer } from '@/components/marketing/live-floor/motion';
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
  live: 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  beta: 'border border-cyan-500/25 bg-cyan-500/10 text-cyan-400',
  roadmap: 'border border-amber-500/25 bg-amber-500/10 text-amber-400',
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
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            AI platform
          </motion.p>
          <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Four pillars.
            <br />
            <span className="font-medium">Two live · one built-in · one roadmap.</span>
          </motion.h2>
          <motion.p variants={reveal} className="mt-4 text-[16px] leading-relaxed text-zinc-400">
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
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.12]"
              >
                <Spotlight color={p.accent} />
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
                <h3 className="text-lg font-semibold text-[#F5F5F7]">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">{p.body}</p>
                <Link
                  href={p.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-300 transition group-hover:text-white"
                >
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mt-8 text-center"
        >
          <Link
            href="/features/ai"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#8B5CF6]/40 hover:text-white"
          >
            Explore the full AI platform
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
