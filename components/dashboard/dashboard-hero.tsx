'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface DashboardHeroProps {
  greeting: string;
  firstName: string;
  dateStr: string;
}

export function DashboardHero({ greeting, firstName, dateStr }: DashboardHeroProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative px-4 pb-4 pt-6 lg:px-6 lg:pb-5 lg:pt-8"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_0%_0%,rgba(139,92,246,0.1),transparent_55%)]"
        aria-hidden
      />
      <h1 className="relative text-2xl font-light text-white md:text-3xl">
        {greeting}
        {firstName ? ', ' : ''}
        <span className="bg-gradient-to-r from-white via-zinc-100 to-violet-300/90 bg-clip-text font-semibold text-transparent">
          {firstName}
        </span>
      </h1>
      <p className="relative mt-1.5 text-sm text-slate-500">{dateStr}</p>
      {!reduce && (
        <motion.div
          aria-hidden
          className="relative mt-3 h-px max-w-[140px] bg-gradient-to-r from-violet-500/50 via-cyan-500/25 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </motion.div>
  );
}
