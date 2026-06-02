'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Phone, TrendingUp, Activity } from 'lucide-react';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { EASE_OUT, reveal, revealContainer } from '@/components/marketing/live-floor/motion';

export function DashboardPreview() {
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Dashboard', icon: Activity, image: '/dashboard-preview-main.png' },
    { label: 'Dialer', icon: Phone, image: '/dialer-interface.png' },
    { label: 'Analytics', icon: TrendingUp, image: '/analytics-dashboard.png' },
  ];

  return (
    <section className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[460px] w-[min(92vw,900px)] -translate-x-1/2 rounded-full opacity-[0.07] blur-[130px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
        variants={revealContainer}
        className="relative mx-auto max-w-2xl text-center"
      >
        <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Product preview
        </motion.p>
        <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
          Your floor, <span className="font-medium">live</span>.
        </motion.h2>
        <motion.p variants={reveal} className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-zinc-400">
          A look at the dialer in motion — calls connect, the AI listens, and
          insights land the moment you hang up.
        </motion.p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }}
        className="mt-8 flex justify-center gap-3"
      >
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={idx}
              onClick={() => setActiveTab(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                activeTab === idx
                  ? 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Dashboard with real product image */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: EASE_OUT }}
        className="relative mx-auto mt-14 max-w-5xl"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0A0A0D]/90 p-3 backdrop-blur-xl shadow-2xl shadow-black/60">
          <Spotlight />
          
          {/* Tab content image with animation */}
          <div className="relative w-full overflow-hidden rounded-2xl bg-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-[400px] md:h-[500px]"
              >
                <Image
                  src={tabs[activeTab].image}
                  alt={tabs[activeTab].label}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
