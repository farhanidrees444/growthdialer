"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "How does parallel dialing work?",
    a: "GrowthDialer dials up to 10 lines simultaneously. When any prospect answers, your rep is immediately connected — no hold music, no delays. Unanswered lines are automatically hung up or routed to AI voicemail drop.",
  },
  {
    q: "Will my numbers get flagged as spam?",
    a: "We continuously monitor carrier health for all numbers in your pool and rotate them before they hit spam thresholds. Our Spam Protection feature keeps your numbers clean and your connect rates high.",
  },
  {
    q: "Does GrowthDialer integrate with my CRM?",
    a: "Yes — we have native integrations with Salesforce, HubSpot, Pipedrive, Outreach, Salesloft, and Apollo.io. Every call is automatically logged with disposition, duration, and AI-generated notes.",
  },
  {
    q: "Is there a free trial?",
    a: "All plans include a 14-day free trial with no credit card required. You get access to all features on the Growth plan so you can see exactly what GrowthDialer can do for your team.",
  },
  {
    q: "How long does it take to get set up?",
    a: "Most teams are live within 2 hours. Our onboarding team handles CRM integration, number provisioning, and initial lead import. You can be making calls the same day you sign up.",
  },
  {
    q: "Can I import my existing leads?",
    a: "Yes — you can import leads via CSV, sync directly from your CRM, or connect via our API. Our AI will automatically score and prioritize your entire list on import.",
  },
  {
    q: "What compliance features do you have?",
    a: "GrowthDialer includes built-in DNC list scrubbing, TCPA-compliant consent management, call recording disclosure prompts, and audit logs. We're SOC 2 Type II certified.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 lg:py-32 border-t border-white/8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Common questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know before you get started.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="rounded-xl border border-white/8 bg-[oklch(0.086_0.024_282)] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex items-center justify-between w-full px-6 py-4 text-left gap-4 hover:bg-white/3 transition-colors"
              >
                <span className="text-sm font-medium">{faq.q}</span>
                <div className="shrink-0 w-6 h-6 rounded-full bg-white/6 flex items-center justify-center">
                  {open === i ? (
                    <Minus className="w-3.5 h-3.5 text-brand" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-white/6 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
