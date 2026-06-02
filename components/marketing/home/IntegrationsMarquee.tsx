'use client';

import { motion, useReducedMotion } from 'framer-motion';

// PLANNED integrations — shown honestly as "coming soon", dimmed/monochrome
// wordmarks (no brand logo art). We do not imply current compatibility.
const PLANNED = [
  'Salesforce', 'HubSpot', 'Slack', 'Zoom', 'Notion', 'Gmail',
  'Zapier', 'Stripe', 'Twilio', 'Calendly', 'Intercom', 'Zendesk',
];

export function IntegrationsMarquee() {
  const reduce = useReducedMotion();
  const row = [...PLANNED, ...PLANNED];

  return (
    <section id="integrations" className="relative px-5 py-16 lg:px-8 lg:py-24" aria-label="Planned integrations">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Integrations — coming soon
        </p>
        <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-light leading-[1.1] tracking-tight text-[#F5F5F7]">
          Built to fit the tools you&apos;ll connect.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">
          These integrations are planned, not live yet. Today, every call is
          captured and analyzed inside GrowthDialer.
        </p>
      </div>

      {/* Marquee with edges masked into the background */}
      <div className="relative mx-auto max-w-6xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div
          className="flex w-max items-center gap-3"
          animate={reduce ? undefined : { x: ['0%', '-50%'] }}
          transition={reduce ? undefined : { duration: 32, repeat: Infinity, ease: 'linear' }}
        >
          {row.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 backdrop-blur-xl"
            >
              <span className="font-display text-[15px] font-medium tracking-tight text-zinc-500 grayscale">
                {name}
              </span>
              <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-600">
                Soon
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
