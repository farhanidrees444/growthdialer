"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { HOME_FAQ_LIVE_VS_ROADMAP } from "@/lib/marketing/honest-copy";

const faqs = [
  {
    q: "How does GrowthDialer compare to Orum and Nooks?",
    a: "GrowthDialer pairs power and parallel dialing with built-in conversation intelligence when calls are recorded, plus a manager coaching floor. Plans start at $49/seat/mo — compare features honestly on our pricing and compare pages.",
  },
  {
    q: "How does parallel dialing work?",
    a: "On Pro, dial up to 10 lines at once. When a prospect answers, your rep connects on that leg; other lines can be hung up or sent voicemail drop per your session settings.",
  },
  {
    q: "Will my numbers get flagged as spam?",
    a: "We surface carrier health and spam status on numbers you own in GrowthDialer so you can rotate caller ID and retire risky lines before connect rates drop.",
  },
  {
    q: "Does GrowthDialer integrate with my CRM?",
    a: "HubSpot OAuth is available today — calls log on disposition with duration and recording link. Salesforce and other CRMs are on the waitlist; every call still lives in Call Logs with disposition and notes.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — every plan starts with a 7-day free trial and does not require a credit card. Paid plans start at $49/seat/mo.",
  },
  {
    q: "How long does it take to get set up?",
    a: "Most solo reps sign in, import a CSV, provision a number, and place a first call the same day. Team workspaces add invites and role setup — no mandatory onboarding call.",
  },
  {
    q: "Can I import my existing leads?",
    a: "Yes — CSV import is live today. CRM sync beyond HubSpot is on the roadmap; you can also push events via outgoing webhooks when configured.",
  },
  {
    q: "What compliance features do you have?",
    a: "DNC flags on leads, TCPA-oriented import fields, disposition audit trail, and configurable recording behavior. Formal SOC 2 certification is on the roadmap — not claimed today.",
  },
  {
    q: "How does AI analysis work?",
    a: "When a recording saves, our call analysis service transcribes the audio and produces summary, sentiment, intent, and next steps — visible on the recording and lead timeline. No separate 'AI coach' listens in real time.",
  },
  {
    q: "Can managers monitor calls in real-time?",
    a: "Managers on Pro and Team can use listen mode on the coaching floor and leave post-call feedback. Whisper and barge into the live audio bridge are planned — not shipped yet.",
  },
  {
    q: "What's included in the Starter plan?",
    a: "Starter is $49/seat/mo: the AI dialer, unlimited calls, recordings with transcripts, one local number. CRM sync is waitlist-only today. Growth adds AI call scoring, post-call summaries, the coaching dashboard, and leaderboards; sequences are coming soon.",
  },
  {
    q: "Which features are live versus coming soon?",
    a: HOME_FAQ_LIVE_VS_ROADMAP,
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          FAQ
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          Questions, answered plainly.
        </h2>
        <p className="text-sm text-muted-foreground mb-10 max-w-xl">
          Live features, roadmap items, and pricing — labeled as they are, not as we wish they were.
        </p>
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-foreground/90">{faq.q}</span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
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
