'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SiSlack, SiZoom, SiSalesforce, SiHubspot, SiNotion } from 'react-icons/si';
import type { IconType } from 'react-icons';

type Brand = [IconType, string];

const BRANDS: Brand[] = [
  [SiSlack, 'Slack'],
  [SiZoom, 'Zoom'],
  [SiSalesforce, 'Salesforce'],
  [SiHubspot, 'HubSpot'],
  [SiNotion, 'Notion'],
];

function LogoPill({ name, Icon }: { name: string; Icon: IconType }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
      whileHover={{ scale: 1.05, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        animate={{
          filter: isHovered ? 'grayscale(0%) brightness(1.1)' : 'grayscale(100%) brightness(0.8)',
        }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="h-5 w-5 text-zinc-400" aria-hidden />
      </motion.div>
      <span className="whitespace-nowrap text-sm font-medium text-zinc-400 transition-colors duration-300 group-hover:text-white">
        {name}
      </span>
    </motion.div>
  );
}

export function SocialProof() {
  return (
    <section className="relative px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-600">Built for modern sales teams</p>
          <p className="mt-2 text-xs text-zinc-700">Integrates seamlessly with the tools you already use</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          {BRANDS.map(([Icon, name]) => (
            <LogoPill key={name} name={name} Icon={Icon} />
          ))}
        </motion.div>

        <p className="mt-8 text-center text-xs text-zinc-700">
          Logos shown illustrate the tools sales teams use — native integrations are on the roadmap.
        </p>
      </div>
    </section>
  );
}
