'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Upload, PhoneCall, Mic, FileText, Sparkles, BarChart3 } from 'lucide-react';
import { EASE_OUT, reveal, revealContainer } from './motion';

const NODES = [
  { icon: Upload,    title: 'Lead Import',      sub: ', 'CSV & manual' },
  { icon: PhoneCall, title: 'AI / Power Dialer', sub: ', 'Focus + speed' },
  { icon: Mic,       title: 'Call Recording',   sub: ', 'Automatic' },
  { icon: FileText,  title: 'Transcription',    sub: ', 'Whisper' },
  { icon: Sparkles,  title: 'Summary + Sentiment', sub: ', 'Gemini' },
  { icon: BarChart3, title: 'Analytics',        sub: ', 'Searchable' },
];

export function EcosystemFlow() {
  const reduce = useReducedMotion();
  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={revealContainer}
          className="mb-16 max-w-2xl"
        >
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
            One connected pipeline
          </motion.p>
          <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-foreground">
            From raw lead to <span className="font-medium">revenue intelligence</span>.
          </motion.h2>
          <motion.p variants={reveal} className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
            No glue code, no exports. Every stage hands off to the next inside one
            platform — the conversation becomes data the instant it ends.
          </motion.p>
        </motion.div>

        {/* Flow */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={revealContainer}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0"
        >
          {NODES.map((n, i) => {
            const Icon = n.icon;
            return (
              <motion.div key={n.title} variants={reveal} className="relative">
                {/* Connector line (desktop) */}
                {i < NODES.length - 1 && (
                  <div className="absolute right-0 top-[2.15rem] hidden h-px w-full translate-x-1/2 lg:block">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: EASE_OUT }}
                      className="h-full origin-left bg-gradient-to-r from-white/[0.12] to-white/[0.04]"
                    />
                    {/* Data-flow pulse traveling node → node */}
                    {!reduce && (
                      <motion.span
                        aria-hidden
                        className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
                        style={{ boxShadow: '0 0 8px hsl(186,100%,42%)'' }}
                        initial={{ left: '0%', opacity: 0 }}
                        animate={{ left: ['0%'100%'], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                      />
                    )}
                  </div>
                )}
                <div className="group relative flex flex-col items-center gap-3 px-2 text-center lg:px-3">
                  <div className="relative flex h-[4.3rem] w-[4.3rem] items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-colors group-hover:border-white/[0.12]">
                    <Icon className="h-5 w-5 text-muted-foreground/90" />
                    {/* node index dot */}
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white/[0.08] bg-[#0C0C0F] font-mono text-[9px] tabular-nums text-muted-foreground/70">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground/60">{n.sub}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
