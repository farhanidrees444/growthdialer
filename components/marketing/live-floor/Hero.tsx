'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Phone, Sparkles, Play, Check, TrendingUp, Zap, Users, Brain, ChevronRight } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Spotlight } from './Spotlight';
import { EASE_OUT, SPRING } from './motion';

const LOGOS = [
  { name: 'Leadmine', color: '#06B6D4' },
  { name: 'RevGenius', color: '#8B5CF6' },
  { name: 'SalesFlow', color: '#F59E0B' },
  { name: 'Prospector', color: '#10B981' },
  { name: 'Dialforce', color: '#EC4899' },
];

const STATS = [
  { value: '10M+', label: 'Calls Analyzed' },
  { value: '98%', label: 'Uptime' },
  { value: '2.5x', label: 'More Connects' },
];

const FEATURES_QUICK = [
  { icon: Brain, label: 'AI Transcription' },
  { icon: Zap, label: 'Power Dialer' },
  { icon: Users, label: 'Team Coaching' },
];

function FloatingCard({ className, children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span ref={ref}>{count}{suffix}</span>;
}

function DashboardMockup() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Dialer', 'Analytics', 'Recordings'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tabs.length]);

  return (
    <div className="relative w-full">
      {/* Browser chrome */}
      <div className="rounded-t-xl bg-zinc-900/80 px-4 py-3 backdrop-blur-xl border border-white/[0.08] border-b-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="ml-4 flex-1">
            <div className="mx-auto flex h-7 max-w-md items-center gap-2 rounded-lg bg-white/[0.06] px-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-xs text-zinc-400">app.growthdialer.com</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="relative overflow-hidden rounded-b-xl border border-white/[0.08] border-t-0 bg-[#0A0A0D]/95 p-4 backdrop-blur-xl">
        <Spotlight color="#8B5CF6" />
        
        {/* Top nav */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4]">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">GrowthDialer</span>
          </div>
          <div className="flex gap-1">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === i ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {activeTab === i && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 rounded-lg bg-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="dialer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Active call card */}
              <div className="rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#06B6D4]/20">
                      <Phone className="h-4 w-4 text-[#06B6D4]" />
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#06B6D4]/30" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">Sarah Chen</p>
                      <p className="text-xs text-zinc-500">Acme Corporation</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#06B6D4]/10 px-2.5 py-1 text-[11px] font-medium text-[#06B6D4]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
                    02:34
                  </span>
                </div>
                <LiveWaveform bars={32} height={40} barWidth={3} gap={2} />
              </div>
              
              {/* Queue preview */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Queue', value: '12', color: 'text-zinc-300' },
                  { label: 'Connected', value: '8', color: 'text-emerald-400' },
                  { label: 'Meetings', value: '3', color: 'text-[#8B5CF6]' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
                    <p className={`text-lg font-semibold tabular-nums ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-zinc-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {activeTab === 1 && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-zinc-500">Connect Rate</span>
                  </div>
                  <p className="text-2xl font-semibold text-white">68%</p>
                  <p className="text-[10px] text-emerald-400">+12% this week</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-[#8B5CF6]" />
                    <span className="text-xs text-zinc-500">Calls Today</span>
                  </div>
                  <p className="text-2xl font-semibold text-white">142</p>
                  <p className="text-[10px] text-[#8B5CF6]">32 connected</p>
                </div>
              </div>
              
              {/* Mini chart */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="mb-2 text-xs text-zinc-500">Weekly Performance</p>
                <div className="flex h-12 items-end justify-between gap-1">
                  {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="flex-1 rounded-t bg-gradient-to-t from-[#8B5CF6] to-[#06B6D4]"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 2 && (
            <motion.div
              key="recordings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {[
                { name: 'Mike Johnson', company: 'TechCorp', duration: '4:32', sentiment: 'Positive' },
                { name: 'Lisa Park', company: 'StartupXYZ', duration: '2:18', sentiment: 'Interested' },
                { name: 'David Kim', company: 'Enterprise Co', duration: '6:45', sentiment: 'Meeting Set' },
              ].map((rec, i) => (
                <motion.div
                  key={rec.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium text-zinc-300">
                      {rec.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{rec.name}</p>
                      <p className="text-[10px] text-zinc-600">{rec.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">{rec.duration}</p>
                    <p className="text-[10px] text-emerald-400">{rec.sentiment}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative overflow-hidden px-5 pb-16 pt-24 lg:px-8 lg:pb-24 lg:pt-32">
      {/* Gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(6, 182, 212, 0.10) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div style={{ y, opacity }} className="relative mx-auto max-w-7xl">
        {/* Announcement banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-8 flex justify-center"
        >
          <Link
            href="/changelog"
            className="group inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 py-1.5 pl-2 pr-4 backdrop-blur-xl transition-all hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/15"
          >
            <span className="flex h-5 items-center gap-1.5 rounded-full bg-[#8B5CF6] px-2 text-[11px] font-semibold text-white">
              NEW
            </span>
            <span className="text-[13px] text-zinc-300">AI Call Summaries now in beta</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1.5 pl-2 pr-3.5 backdrop-blur-xl"
            >
              <span className="flex h-5 items-center gap-1.5 rounded-full bg-[#06B6D4]/10 px-2 text-[11px] font-medium text-[#06B6D4]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06B6D4] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#06B6D4]" />
                </span>
                Live
              </span>
              <span className="text-[13px] text-zinc-400">AI-Powered Sales Dialer</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 }}
              className="font-display text-balance text-[clamp(2.5rem,5.5vw,4.5rem)] font-light leading-[1.02] tracking-tight text-[#F5F5F7]"
            >
              The AI dialer that{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text font-medium text-transparent">
                  understands
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: EASE_OUT }}
                />
              </span>{' '}
              every conversation
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.25 }}
              className="mt-6 max-w-lg text-pretty text-[17px] leading-relaxed text-zinc-400"
            >
              Record, transcribe, and analyze every sales call with AI. Get instant summaries, 
              sentiment analysis, and next steps — without taking a single note.
            </motion.p>

            {/* Quick features */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.35 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              {FEATURES_QUICK.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5"
                >
                  <f.icon className="h-3.5 w-3.5 text-[#8B5CF6]" />
                  <span className="text-xs text-zinc-400">{f.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.45 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 text-sm font-medium text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] hover:shadow-[#8B5CF6]/35 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A]"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-6 text-sm font-medium text-zinc-300 transition-all hover:border-white/[0.16] hover:text-[#F5F5F7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                <Play className="h-4 w-4 fill-current" />
                Watch Demo
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: EASE_OUT, delay: 0.6 }}
              className="mt-10"
            >
              <p className="mb-4 text-[12px] uppercase tracking-[0.15em] text-zinc-600">
                Trusted by leading sales teams
              </p>
              <div className="flex flex-wrap items-center gap-6">
                {LOGOS.map((logo, i) => (
                  <motion.div
                    key={logo.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    <div
                      className="h-5 w-5 rounded-md"
                      style={{ backgroundColor: `${logo.color}20` }}
                    >
                      <div
                        className="h-full w-full rounded-md opacity-60"
                        style={{ backgroundColor: logo.color }}
                      />
                    </div>
                    <span className="text-sm font-medium">{logo.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING, delay: 0.4 }}
            className="relative"
          >
            {/* Floating stats cards */}
            <FloatingCard
              delay={0.8}
              className="absolute -left-8 top-4 z-10 hidden rounded-xl border border-white/[0.08] bg-zinc-900/90 p-3 backdrop-blur-xl lg:block"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">+47%</p>
                  <p className="text-[10px] text-zinc-500">Connect rate</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard
              delay={1.0}
              className="absolute -right-4 bottom-20 z-10 hidden rounded-xl border border-white/[0.08] bg-zinc-900/90 p-3 backdrop-blur-xl lg:block"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                  <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">AI Ready</p>
                  <p className="text-[10px] text-zinc-500">Instant insights</p>
                </div>
              </div>
            </FloatingCard>

            {/* Glow effect */}
            <div
              aria-hidden
              className="absolute -inset-4 rounded-3xl opacity-50 blur-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
              }}
            />

            <div className="relative">
              <DashboardMockup />
            </div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.8 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-white/[0.06] pt-10"
        >
          {STATS.map((stat, i) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-light text-white lg:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
