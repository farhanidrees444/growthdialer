'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'Is there a free plan?',
    a: 'Yes. The free Starter plan includes a dialer, number and core features — no credit card required. Upgrade when your team grows.',
  },
  {
    q: 'Do I need hardware or a phone line?',
    a: 'No. GrowthDialer runs entirely in your browser over a carrier-grade voice backend — just headphones and an internet connection.',
  },
  {
    q: 'How fast can my team start calling?',
    a: 'Most teams import a CSV, claim a number and start dialing within minutes. There is no mandatory onboarding call.',
  },
  {
    q: 'What does the AI actually do?',
    a: 'It transcribes recorded calls and produces summaries, sentiment and action items. It does not place calls on your behalf yet — an AI voice agent is on the roadmap.',
  },
  {
    q: 'Does GrowthDialer integrate with my CRM?',
    a: 'HubSpot is live today. Additional CRM integrations are on the waitlist — in the meantime every call still logs with dispositions inside GrowthDialer.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Subscriptions can be cancelled at any time — there is no lock-in call or retention maze.',
  },
];

export function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal>
          <p className="mk-eyebrow">FAQ</p>
          <h2 className="mk-h-section">
            Questions, <span className="font-semibold">answered.</span>
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-zinc-600">
            Everything else —{' '}
            <a href="/contact-sales" className="font-medium text-zinc-950 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-950">
              talk to sales
            </a>{' '}
            or read the{' '}
            <a href="/docs" className="font-medium text-zinc-950 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-950">
              docs
            </a>
            .
          </p>
        </Reveal>

        <div>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 40}>
                <div className="border-b border-zinc-950/[0.08]">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-[15px] font-medium text-zinc-950">{f.q}</span>
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-950/[0.08] transition-transform duration-300',
                        isOpen && 'rotate-180'
                      )}
                    >
                      <ChevronDown className="h-4 w-4 text-zinc-600" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pr-12 text-[14px] leading-relaxed text-zinc-600">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
