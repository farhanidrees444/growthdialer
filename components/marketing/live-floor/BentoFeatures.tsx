'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Brain, ShieldCheck, Zap, BarChart3, TrendingUp, Phone, CheckCircle2 } from 'lucide-react';
import { reveal, revealContainer, EASE_OUT } from './motion';

interface CardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

function TiltCard({ children, className = '' }: CardWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-colors hover:border-white/[0.12] hover:bg-white/[0.03] ${className}`}
    >
      {/* Cursor radial light */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: isHovered
            ? `radial-gradient(400px circle at ${(mouseX.get() + 0.5) * 100}% ${(mouseY.get() + 0.5) * 100}%, rgba(139, 92, 246, 0.12), transparent 60%)`
            : 'none',
        }}
      />
      <div style={{ transform: 'translateZ(20px)' }}>{children}</div>
    </motion.div>
  );
}

// Sentiment Meter Chart
function SentimentMeter() {
  const segments = [
    { label: 'Positive', value: 68, color: '#22C55E' },
    { label: 'Neutral', value: 24, color: '#6B7280' },
    { label: 'Negative', value: 8, color: '#EF4444' },
  ];

  return (
    <div className="mt-6 space-y-3">
      {segments.map((seg, i) => (
        <motion.div
          key={seg.label}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5, ease: EASE_OUT }}
          viewport={{ once: true }}
        >
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-zinc-400">{seg.label}</span>
            <span className="font-mono text-zinc-300">{seg.value}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${seg.value}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: EASE_OUT }}
              viewport={{ once: true }}
              className="h-full rounded-full"
              style={{ backgroundColor: seg.color }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Number Health Display
function NumberHealthDisplay() {
  const carriers = [
    { name: 'AT&T', status: 'Clean', color: '#22C55E' },
    { name: 'Verizon', status: 'Clean', color: '#22C55E' },
    { name: 'T-Mobile', status: 'Monitor', color: '#F59E0B' },
  ];

  return (
    <div className="mt-4 space-y-2">
      {carriers.map((carrier, i) => (
        <motion.div
          key={carrier.name}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
        >
          <span className="text-xs text-zinc-400">{carrier.name}</span>
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: carrier.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: carrier.color }} />
            {carrier.status}
          </span>
        </motion.div>
      ))}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        Trust Score: 94/100
      </div>
    </div>
  );
}

// Power Dialer Controls
function PowerDialerControls() {
  const [activeMode, setActiveMode] = useState<'browse' | 'focus' | 'power'>('focus');
  const modes = [
    { id: 'browse' as const, label: 'Browse' },
    { id: 'focus' as const, label: 'Focus' },
    { id: 'power' as const, label: 'Power' },
  ];

  return (
    <div className="mt-4">
      <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-black/30 p-1">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`relative flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeMode === mode.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {activeMode === mode.id && (
              <motion.div
                layoutId="powerDialerMode"
                className="absolute inset-0 rounded-md bg-violet-600/30 border border-violet-500/40"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{mode.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <Phone className="h-4 w-4" />
        </div>
        <div className="text-xs">
          <p className="font-medium text-zinc-300">Ready to dial</p>
          <p className="text-zinc-500">12 leads in queue</p>
        </div>
      </div>
    </div>
  );
}

// Performance Analytics Chart
function PerformanceChart() {
  const data = [35, 42, 38, 55, 48, 62, 58, 72, 68, 78, 74, 82];
  const maxValue = Math.max(...data);

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-zinc-300">Connect Rate</span>
        </div>
        <span className="font-mono text-lg font-semibold text-emerald-400">78%</span>
      </div>
      <div className="relative h-24">
        <svg className="h-full w-full" viewBox="0 0 300 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <motion.path
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            d={`M 0 100 ${data.map((v, i) => `L ${(i / (data.length - 1)) * 300} ${100 - (v / maxValue) * 80}`).join(' ')} L 300 100 Z`}
            fill="url(#chartGradient)"
          />
          {/* Line */}
          <motion.path
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: EASE_OUT }}
            viewport={{ once: true }}
            d={`M ${data.map((v, i) => `${(i / (data.length - 1)) * 300} ${100 - (v / maxValue) * 80}`).join(' L ')}`}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeLinecap="round"
            filter="drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))"
          />
          {/* Data points */}
          {data.map((v, i) => (
            <motion.circle
              key={i}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.8 + i * 0.05, duration: 0.3 }}
              viewport={{ once: true }}
              cx={(i / (data.length - 1)) * 300}
              cy={100 - (v / maxValue) * 80}
              r="3"
              fill="#8B5CF6"
            />
          ))}
        </svg>
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-zinc-600">
        <span>Jan</span>
        <span>Mar</span>
        <span>Jun</span>
        <span>Sep</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

export function BentoFeatures() {
  return (
    <section id="bento-features" className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={revealContainer}
          className="mb-14 text-center"
        >
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            Built for performance
          </motion.p>
          <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Everything you need to <span className="font-medium">close more deals</span>
          </motion.h2>
        </motion.div>

        {/* Asymmetric Bento Grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={revealContainer}
          className="grid gap-4 md:grid-cols-12 md:grid-rows-2"
        >
          {/* Card 1: AI Conversation Intelligence - Large 2x2 */}
          <motion.div variants={reveal} className="md:col-span-7 md:row-span-2">
            <TiltCard className="h-full p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Brain className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                  AI-Powered
                </span>
              </div>
              <h3 className="mt-4 text-xl font-medium tracking-tight text-[#F5F5F7]">
                AI Conversation Intelligence
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                Real-time transcription, sentiment analysis, and intent detection on every call. 
                Let AI surface the insights so your reps can focus on closing.
              </p>
              <SentimentMeter />
              <div className="mt-6 flex flex-wrap gap-2">
                {['Intent Detection', 'Auto-Summary', 'Key Topics'].map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] text-zinc-400"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </TiltCard>
          </motion.div>

          {/* Card 2: Number Health - Small */}
          <motion.div variants={reveal} className="md:col-span-5">
            <TiltCard className="h-full p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </span>
              </div>
              <h3 className="mt-4 text-lg font-medium tracking-tight text-[#F5F5F7]">
                Number Health & Spam Monitoring
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Track carrier reputation and spam risk in real-time.
              </p>
              <NumberHealthDisplay />
            </TiltCard>
          </motion.div>

          {/* Card 3: Power Dialer - Small */}
          <motion.div variants={reveal} className="md:col-span-5">
            <TiltCard className="h-full p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Zap className="h-5 w-5" />
                </span>
              </div>
              <h3 className="mt-4 text-lg font-medium tracking-tight text-[#F5F5F7]">
                Power Dialer
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Three calling modes to match your workflow.
              </p>
              <PowerDialerControls />
            </TiltCard>
          </motion.div>

          {/* Card 4: Performance Analytics - Full width */}
          <motion.div variants={reveal} className="md:col-span-12">
            <TiltCard className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="lg:max-w-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                      <BarChart3 className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                      Real-time
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-medium tracking-tight text-[#F5F5F7]">
                    Performance Analytics
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Connect rate, talk time, dispositions, and sentiment trends. 
                    Your entire calling operation visualized in one powerful dashboard.
                  </p>
                </div>
                <div className="flex-1 lg:max-w-lg">
                  <PerformanceChart />
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
