'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { IconType } from 'react-icons';
import {
  SiSalesforce,
  SiHubspot,
  SiSlack,
  SiZoom,
  SiNotion,
  SiGmail,
  SiZapier,
  SiStripe,
  SiTwilio,
  SiCalendly,
  SiIntercom,
  SiZendesk,
} from 'react-icons/si';
import { useMounted } from '@/hooks/use-mounted';

type Brand = { name: string; Icon: IconType };

// Real, recognizable SaaS logos shown as the stack GrowthDialer is built to sit
// alongside — NOT a claim of customers or shipped integrations. Honest framing
// lives in the copy below.
const ROW_A: Brand[] = [
  { name: 'Salesforce', Icon: SiSalesforce },
  { name: 'HubSpot', Icon: SiHubspot },
  { name: 'Slack', Icon: SiSlack },
  { name: 'Zoom', Icon: SiZoom },
  { name: 'Notion', Icon: SiNotion },
  { name: 'Gmail', Icon: SiGmail },
];

const ROW_B: Brand[] = [
  { name: 'Zapier', Icon: SiZapier },
  { name: 'Stripe', Icon: SiStripe },
  { name: 'Twilio', Icon: SiTwilio },
  { name: 'Calendly', Icon: SiCalendly },
  { name: 'Intercom', Icon: SiIntercom },
  { name: 'Zendesk', Icon: SiZendesk },
];

function LogoPill({ name, Icon }: Brand) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.015] px-6 py-3.5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div
        animate={{
          filter: isHovered ? 'grayscale(0%) brightness(1.2)' : 'grayscale(100%) brightness(0.85)',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <Icon className="h-6 w-6 text-zinc-500" aria-hidden />
      </motion.div>
      <motion.span
        animate={{
          color: isHovered ? '#F5F5F7' : '#71717A',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="whitespace-nowrap font-display text-[15px] font-medium tracking-tight"
      >
        {name}
      </motion.span>
    </motion.div>
  );
}

function MarqueeRow({
  brands,
  direction,
  duration,
  reduce,
}: {
  brands: Brand[];
  direction: 'left' | 'right';
  duration: number;
  reduce: boolean;
}) {
  // Duplicate the set so the -50% translate loops seamlessly.
  const track = [...brands, ...brands];
  const from = direction === 'left' ? '0%' : '-50%';
  const to = direction === 'left' ? '-50%' : '0%';

  return (
    <div className="flex w-max gap-4">
      <motion.div
        className="flex w-max gap-4"
        initial={{ x: from }}
        animate={reduce ? undefined : { x: [from, to] }}
        transition={reduce ? undefined : { duration, repeat: Infinity, ease: 'linear' }}
      >
        {track.map((b, i) => (
          <LogoPill key={`${b.name}-${i}`} {...b} />
        ))}
      </motion.div>
    </div>
  );
}

export function SocialProof() {
  const prefersReduced = useReducedMotion();
  const mounted = useMounted();
  const reduce = mounted && !!prefersReduced;

  return (
    <section className="relative px-5 py-14 lg:px-8 lg:py-20">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-9 text-center text-[12px] font-medium uppercase tracking-[0.22em] text-zinc-600"
      >
        Designed to fit the stack you already run
      </motion.p>

      <div className="relative mx-auto max-w-6xl space-y-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <MarqueeRow brands={ROW_A} direction="left" duration={32} reduce={reduce} />
        <MarqueeRow brands={ROW_B} direction="right" duration={38} reduce={reduce} />
      </div>

      <p className="mt-9 text-center text-[12px] text-zinc-700">
        Logos shown illustrate the tools sales teams use — native integrations are on the roadmap.
      </p>
    </section>
  );
}
