'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Target, ListChecks } from 'lucide-react';
import { Spotlight } from './Spotlight';
import { reveal, revealContainer, EASE_OUT } from './motion';

const CAPABILITIES = [
  {
    icon: ListChecks,
    title: 'AI call summaries',
    body: 'A clean bullet recap and suggested next steps the moment the call ends — no manual note-taking.',
  },
  {
    icon: TrendingUp,
    title: 'Sentiment analysis',
    body: 'Positive, neutral or negative read on every conversation, so you can see how a deal actually felt.',
  },
  {
    icon: Target,
    title: 'Intent detection',
    body: 'Surface what the prospect was really after — pricing, a demo, a callback — and act on it faster.',
  },
];

export function ConversationIntelligence() {
  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24">
      {/* faint violet wash — one accent moment */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full opacity-[0.07] blur-[120px]"
        style={{ background: 'radial-gradient(circle, hsl(258,90%,66%) 0%, transparent 70%)' }}
      />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Left: copy + capabilities */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={revealContainer}
        >
          <motion.div variants={reveal} className="mb-5 inline-flex items-center gap-2 rounded-full border border-[hsl(258,90%,66%)]/20 bg-violet-600/[0.06] py-1 pl-1.5 pr-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600/20 text-[hsl(258,90%,66%)]">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="text-[12px] font-medium text-[hsl(258,90%,66%)]">AI-native</span>
          </motion.div>

          <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-foreground">
            Conversation intelligence,<br />
            <span className="font-medium">built in</span> — not bolted on.
          </motion.h2>

          <motion.p variants={reveal} className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
            Most dialers stop at the recording. GrowthDialer reads every call and
            hands back the part that matters — what happened, how it felt, and
            what to do next.
          </motion.p>

          <div className="mt-10 space-y-7">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <motion.div key={c.title} variants={reveal} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-[hsl(258,90%,66%)]">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-medium text-foreground">{c.title}</h3>
                    <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-muted-foreground">{c.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right: analyzed-call card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="relative rounded-2xl border border-white/[0.06] bg-[#0C0C0F]/80 p-6 backdrop-blur-xl"
        >
          <Spotlight />
          <div className="mb-5 flex items-center justify-between border-b border-white/[0.05] pb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Call with Acme Co.</p>
              <p className="font-mono text-xs tabular-nums text-muted-foreground/60">Outbound · 2:14 · analyzed</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              <TrendingUp className="h-3 w-3" /> Positive
            </span>
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">Summary</p>
          <ul className="space-y-2">
            {[
              'Prospect evaluating tools for a 12-person team',
              'Current follow-up process is manual and slow',
              'Asked for team pricing and a short demo',
            ].map((t, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: EASE_OUT }}
                className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground/90"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-600" />
                {t}
              </motion.li>
            ))}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Intent</p>
              <p className="mt-1 text-[13px] font-medium text-foreground">Pricing + demo</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Next step</p>
              <p className="mt-1 text-[13px] font-medium text-foreground">Send quote</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
