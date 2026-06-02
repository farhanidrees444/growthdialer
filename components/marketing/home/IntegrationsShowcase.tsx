'use client';

import { motion } from 'framer-motion';
import { Database, Calendar, Mail, MessageSquare, Webhook, Workflow } from 'lucide-react';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { reveal, revealContainer } from '@/components/marketing/live-floor/motion';

// Generic categories (no real brand logos/trademarks). All on the roadmap —
// honestly marked "Coming soon".
const CATEGORIES = [
  { icon: Database, label: 'CRM sync' },
  { icon: Calendar, label: 'Calendar' },
  { icon: Mail, label: 'Email' },
  { icon: MessageSquare, label: 'Chat & alerts' },
  { icon: Workflow, label: 'Automation' },
  { icon: Webhook, label: 'Webhooks / API' },
];

export function IntegrationsShowcase() {
  return (
    <section id="integrations" className="relative px-5 py-16 lg:px-8 lg:py-24">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
        variants={revealContainer}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
          Connect your stack
        </motion.p>
        <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3rem)] font-light leading-[1.05] tracking-tight text-foreground">
          Plays well with your tools.
        </motion.h2>
        <motion.p variants={reveal} className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          Native integrations are on the way. Today, every call is captured and
          analyzed inside GrowthDialer — exports and connections land next.
        </motion.p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealContainer}
        className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              variants={reveal}
              whileHover={{ y: -4 }}
              className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-colors hover:border-white/[0.12]"
            >
              <Spotlight />
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-muted-foreground/90 transition-colors group-hover:text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[14px] font-medium text-foreground">{c.label}</span>
              </div>
              <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] text-muted-foreground/70">Soon</span>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
