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
    a: 'Live today: AI Dialer, Power Dialer, AI call briefs, conversation intelligence, live manager coaching, team workspaces (Team plan), leads, analytics and number-health monitoring. Parallel dialing, AI voice agents and CRM integrations are on the roadmap and clearly marked “Coming soon.”',
  },
  {
    q: 'Can I try it before paying?',
    a: 'Yes — start free with no credit card. Make real calls and see the AI summaries for yourself before deciding on a plan.',
  },
  {
    q: 'Are my calls recorded automatically?',
    a: 'Recording follows your settings. With recording on, calls are captured automatically so the AI can transcribe and analyze them; you can change recording behavior any time in settings.',
  },
  {
    q: 'What does the AI summary actually include?',
    a: 'A short bullet recap of the conversation, the overall sentiment, the detected intent, and suggested next steps — all linked back to the call and the lead.',
  },
  {
    q: 'Can I bring my own phone numbers?',
    a: 'You provision numbers inside GrowthDialer and we monitor their health and spam risk so your connect rates stay high. Porting and bring-your-own options are on the roadmap.',
  },
  {
    q: 'How does Power Dialer differ from the AI Dialer?',
    a: 'The AI Dialer is a focused single-call stage with three modes. Power Dialer moves you through a list back-to-back — disposition, note, and advance without breaking rhythm.',
  },
  {
    q: 'Do you support inbound calls?',
    a: 'Yes — inbound calls ring in the browser (or forward to your phone / go to voicemail per your settings), and they get recorded and analyzed just like outbound calls.',
  },
  {
    q: 'Is my data secure?',
    a: 'Your calls, recordings and transcripts are tied to your account and used only to power the product for you. We don’t sell your data. Formal compliance certifications are in progress.',
  },
  {
    q: 'What does it cost?',
    a: 'Starter is free (1 seat). Pro is $49/workspace/mo for up to 3 seats; Team is $99/workspace/mo for up to 10. See the pricing page for annual discounts — upgrade or downgrade any time from Settings.',
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
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">FAQ</p>
          <h2 className="font-display text-[clamp(1.9rem,4vw,2.75rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
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
