'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

const FAQS = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No. You can create an account and make your first AI-analyzed call without entering any payment details. Add a card only when you decide to stay on a paid plan.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Anytime. Upgrade to unlock more features instantly, or move down at the end of your billing period. Your data, recordings and call history stay exactly where they are.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual plans are billed once per year at the discounted workspace rate shown above. Same product as monthly — a lower price in exchange for committing for the year.',
  },
  {
    q: 'How do workspace seats work?',
    a: 'Each plan covers a workspace with a seat limit (1 on Starter, 3 on Pro, 10 on Team). A seat is one person with their own login. Pending invites count toward the limit so you never over-provision.',
  },
  {
    q: 'Can I cancel whenever I want?',
    a: 'Yes. There are no lock-in contracts on monthly plans — cancel from settings and you keep access until the end of the current period. Annual plans run until the end of the committed year.',
  },
  {
    q: 'Which features are still on the roadmap?',
    a: 'Parallel dialing, an AI voice agent / receptionist, CRM integrations and a public API are in active development. Team workspaces, live coaching and manager analytics are live today on Pro and Team — we only charge for what works.',
  },
];

export function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">FAQ</p>
          <h2 className="font-display text-[clamp(1.9rem,4vw,2.75rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Questions,
            <br />
            <span className="font-medium">answered honestly.</span>
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
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[#F5F5F7] focus-visible:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className={`text-[15px] font-medium ${isOpen ? 'text-[#F5F5F7]' : 'text-zinc-300'}`}>{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="shrink-0 text-zinc-500"
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
                      <p className="pb-5 pr-8 text-[14px] leading-relaxed text-zinc-400">{f.a}</p>
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
