'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

const FAQS = [
  {
    q: 'What exactly is GrowthDialer?',
    a: 'An AI sales dialer. You make outbound calls from a focused web dialer, every call is recorded, and the AI turns each conversation into a summary, sentiment read and suggested next steps — automatically.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. GrowthDialer runs in the browser. Sign in, connect a number, and start calling — nothing to download.',
  },
  {
    q: 'How does the AI analysis work?',
    a: 'After a recorded call, the audio is transcribed and then analyzed to produce a bullet summary, sentiment (positive, neutral or negative) and detected intent. It happens in seconds, with no manual note-taking.',
  },
  {
    q: 'Which features are live versus coming soon?',
    a: 'Live today: the AI Dialer, Power Dialer, call recording, conversation intelligence, leads, analytics and number-health monitoring. Parallel dialing, an AI voice agent, team workspaces and integrations are clearly marked “Coming soon.”',
  },
  {
    q: 'Can I try it before paying?',
    a: 'Yes — start free with no credit card. Make real calls and see the AI summaries for yourself before deciding on a plan.',
  },
];

export function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">FAQ</p>
          <h2 className="font-display text-[clamp(1.9rem,4vw,2.75rem)] font-light leading-[1.05] tracking-tight text-foreground">
            Good to
            <br />
            <span className="font-medium">know.</span>
          </h2>
        </motion.div>

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-foreground focus-visible:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className={`text-[15px] font-medium ${isOpen ? 'text-foreground' : 'text-muted-foreground/90'}`}>{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="shrink-0 text-muted-foreground/70"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pr-8 text-[14px] leading-relaxed text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
