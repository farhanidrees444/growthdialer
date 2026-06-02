'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Phone, Calendar, TrendingUp, Users, Zap, BarChart3, Check } from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Spotlight } from './Spotlight';
import { EASE_OUT } from './motion';

// Animated counter component
function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 50, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(latest)}${suffix}`;
      }
    });
    return unsubscribe;
  }, [springValue, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// Floating metrics cards
const METRIC_CARDS = [
  {
    icon: Phone,
    label: 'Calls Active',
    value: 142,
    trend: '+12%',
    color: '#8B5CF6',
    position: 'left-0 top-8',
  },
  {
    icon: Calendar,
    label: 'Meetings Set',
    value: 28,
    trend: '+24%',
    color: '#06B6D4',
    position: 'right-0 top-24',
  },
  {
    icon: TrendingUp,
    label: 'Connect Rate',
    value: 68,
    suffix: '%',
    trend: '+8%',
    color: '#10B981',
    position: 'left-12 bottom-16',
  },
];

const ENTERPRISE_FEATURES = [
  'SSO & SAML authentication',
  'Custom integrations',
  'Dedicated account manager',
  'SLA guarantees',
  'Priority support',
  'Custom AI training',
];

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '', 
  trend, 
  color, 
  delay = 0 
}: { 
  icon: typeof Phone;
  label: string;
  value: number;
  suffix?: string;
  trend: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
      className="rounded-xl border border-white/[0.08] bg-zinc-900/80 p-4 backdrop-blur-xl shadow-2xl"
    >
      <div className="mb-2 flex items-center gap-2">
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-white">
          <AnimatedNumber value={value} suffix={suffix} />
        </span>
        <span className="text-xs font-medium text-emerald-400">{trend}</span>
      </div>
    </motion.div>
  );
}

function DashboardPreview() {
  const [activeReps, setActiveReps] = useState([
    { name: 'Sarah M.', calls: 23, connects: 8, avatar: 'SM' },
    { name: 'John D.', calls: 18, connects: 6, avatar: 'JD' },
    { name: 'Lisa P.', calls: 21, connects: 7, avatar: 'LP' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReps(reps => 
        reps.map(rep => ({
          ...rep,
          calls: rep.calls + Math.floor(Math.random() * 2),
          connects: rep.connects + (Math.random() > 0.7 ? 1 : 0),
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0D]/95 p-4 backdrop-blur-xl">
      <Spotlight color="#06B6D4" />
      
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4]">
            <BarChart3 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-white">Enterprise Dashboard</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Active reps grid */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {activeReps.map((rep, i) => (
          <div key={rep.name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
            <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-[10px] font-bold text-white">
              {rep.avatar}
            </div>
            <p className="mb-0.5 text-[11px] font-medium text-white">{rep.name}</p>
            <p className="text-[10px] text-zinc-500">{rep.calls} calls / {rep.connects} connects</p>
          </div>
        ))}
      </div>

      {/* Live call indicator */}
      <div className="rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-[11px] text-[#06B6D4]">
            <Phone className="h-3 w-3" />
            Sarah M. - Enterprise Co.
          </span>
          <span className="font-mono text-[11px] text-zinc-500">03:42</span>
        </div>
        <LiveWaveform bars={24} height={24} barWidth={3} gap={2} />
      </div>
    </div>
  );
}

export function EnterpriseCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section ref={containerRef} className="relative overflow-hidden px-5 py-20 lg:px-8 lg:py-28">
      {/* Background gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(139, 92, 246, 0.12) 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 h-full w-1/2"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 80% 60%, rgba(6, 182, 212, 0.10) 0%, transparent 60%)',
        }}
      />
      
      {/* Grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
            Enterprise
          </p>
          <h2 className="mx-auto max-w-3xl font-display text-[clamp(2rem,4.5vw,3.5rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Build your intelligent{' '}
            <span className="font-medium">enterprise outreach engine</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-zinc-400">
            Scale to thousands of reps with enterprise-grade security, custom integrations, 
            and dedicated support that grows with your team.
          </p>
        </motion.div>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: CTA content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
          >
            {/* Feature list */}
            <div className="mb-8">
              <p className="mb-4 text-sm font-medium text-zinc-400">Everything in Pro, plus:</p>
              <ul className="grid grid-cols-2 gap-3">
                {ENTERPRISE_FEATURES.map((feature, i) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-2 text-[14px] text-zinc-300"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/10">
                      <Check className="h-3 w-3 text-[#8B5CF6]" />
                    </span>
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Metrics cards */}
            <div className="mb-8 grid grid-cols-3 gap-3">
              {METRIC_CARDS.map((metric, i) => (
                <MetricCard
                  key={metric.label}
                  icon={metric.icon}
                  label={metric.label}
                  value={metric.value}
                  suffix={metric.suffix}
                  trend={metric.trend}
                  color={metric.color}
                  delay={0.4 + i * 0.1}
                />
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact-sales"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 text-sm font-medium text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] hover:shadow-[#8B5CF6]/35 active:scale-[0.98]"
              >
                Talk to Sales
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.08] px-6 text-sm font-medium text-zinc-300 transition-all hover:border-white/[0.16] hover:text-[#F5F5F7] active:scale-[0.98]"
              >
                View Pricing
              </Link>
            </div>

            <p className="mt-4 text-[13px] text-zinc-600">
              Custom pricing for teams of 50+ · Enterprise SLA included
            </p>
          </motion.div>

          {/* Right: Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.2 }}
            className="relative"
          >
            {/* Glow */}
            <div
              aria-hidden
              className="absolute -inset-8 rounded-3xl opacity-40 blur-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.10) 100%)',
              }}
            />
            
            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.5 }}
              className="absolute -left-6 -top-4 z-10 hidden rounded-xl border border-white/[0.08] bg-zinc-900/90 p-3 backdrop-blur-xl lg:block"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                  <Users className="h-3.5 w-3.5 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">150+</p>
                  <p className="text-[10px] text-zinc-500">Active Reps</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.7 }}
              className="absolute -bottom-4 -right-4 z-10 hidden rounded-xl border border-white/[0.08] bg-zinc-900/90 p-3 backdrop-blur-xl lg:block"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">99.9%</p>
                  <p className="text-[10px] text-zinc-500">Uptime SLA</p>
                </div>
              </div>
            </motion.div>

            <div className="relative">
              <DashboardPreview />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
