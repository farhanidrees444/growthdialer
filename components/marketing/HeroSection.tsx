"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, TrendingUp, Phone, Users, Zap, CalendarCheck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const floatingCards = [
  {
    id: 1,
    icon: Phone,
    label: "Total calls today",
    targetValue: 2184,
    suffix: "",
    prefix: "",
    pos: "top-[12%] -left-4 lg:-left-10",
    delay: 0.6,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    id: 2,
    icon: CalendarCheck,
    label: "Meetings booked",
    targetValue: 71,
    suffix: "",
    prefix: "",
    pos: "top-[50%] -right-4 lg:-right-10",
    delay: 0.75,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: 3,
    icon: Users,
    label: "Connect rate",
    targetValue: 41.2,
    suffix: "%",
    prefix: "",
    pos: "bottom-[12%] -left-4 lg:-left-10",
    delay: 0.9,
    color: "text-brand",
    bg: "bg-brand/10",
  },
  {
    id: 4,
    icon: DollarSign,
    label: "Pipeline added",
    targetValue: 144,
    suffix: "k",
    prefix: "$",
    pos: "bottom-[50%] -right-4 lg:-right-10",
    delay: 1.05,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

function AnimatedCounter({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const start = performance.now();
    const update = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setCount(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [target]);

  return (
    <span className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

const avatars = [
  { initials: "JW", bg: "bg-indigo-500" },
  { initials: "PN", bg: "bg-emerald-500" },
  { initials: "MW", bg: "bg-amber-500" },
  { initials: "EK", bg: "bg-purple-500" },
  { initials: "RP", bg: "bg-pink-500" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.82 0.27 153) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-8 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.22 264) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6 bg-brand/12 text-brand border border-brand/25 text-xs px-3 py-1.5 rounded-full font-medium gap-2">
                <Zap className="w-3 h-3" fill="currentColor" />
                AI-Powered Parallel Dialing is here
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="font-display text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
            >
              Dial smarter.{" "}
              <span className="text-brand">Close faster.</span>
              <br />
              <span className="text-foreground/60">Grow bigger.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg"
            >
              GrowthDialer gives your sales team AI-powered parallel dialing,
              real-time call coaching, and smart lead prioritization — so you
              hit quota without burning out your reps.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] font-semibold text-base px-7 h-12 glow-brand gap-2 transition-all"
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/15 bg-white/5 hover:bg-white/10 text-sm h-12 px-6 gap-2 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch 2-min demo
                </Button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex items-center gap-4"
            >
              <div className="flex -space-x-2">
                {avatars.map((a) => (
                  <div
                    key={a.initials}
                    className={`w-8 h-8 rounded-full ${a.bg} flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-background`}
                  >
                    {a.initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trusted by <span className="text-foreground font-medium">2,400+</span> sales teams
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right: dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            {/* Main card */}
            <div className="relative rounded-2xl border border-white/10 bg-[oklch(0.086_0.024_282)] overflow-hidden shadow-2xl shadow-black/50">
              {/* Top bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[oklch(0.068_0.020_284)]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-brand/60" />
                </div>
                <div className="flex-1 h-5 rounded-md bg-white/6 mx-8" />
              </div>
              {/* Body mockup */}
              <div className="p-5 space-y-4">
                {/* Active call row */}
                <div className="flex items-center gap-3 bg-brand/10 border border-brand/20 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Sarah Chen — VP Sales</div>
                    <div className="text-xs text-muted-foreground">TechNova Inc. · Connected</div>
                  </div>
                  <div className="font-mono text-xl font-bold text-brand tabular-nums">2:47</div>
                </div>
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Calls", val: "63", color: "text-indigo-400" },
                    { label: "Connects", val: "22", color: "text-brand" },
                    { label: "Meetings", val: "7", color: "text-amber-400" },
                  ].map((k) => (
                    <div key={k.label} className="bg-white/4 rounded-xl p-3 text-center">
                      <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
                      <div className="text-[11px] text-muted-foreground">{k.label}</div>
                    </div>
                  ))}
                </div>
                {/* Chart bars */}
                <div className="bg-white/4 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-3">Call Activity — This Week</div>
                  <div className="flex items-end gap-2 h-16">
                    {[42, 58, 35, 71, 63, 12, 8].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${(h / 80) * 100}%` }}
                        transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
                        className="flex-1 rounded-t-sm"
                        style={{
                          background:
                            i === 4
                              ? "oklch(0.82 0.27 153)"
                              : "oklch(0.82 0.27 153 / 30%)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating metric cards */}
            {floatingCards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, card.id === 1 ? -8 : card.id === 2 ? -6 : -10, 0],
                }}
                transition={{
                  opacity: { delay: card.delay, duration: 0.4 },
                  scale: { delay: card.delay, duration: 0.4 },
                  y: {
                    delay: card.delay + 0.4,
                    duration: card.id === 2 ? 3.5 : 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className={`absolute ${card.pos} bg-[oklch(0.086_0.024_282)] border border-white/12 rounded-xl px-4 py-3 shadow-xl shadow-black/30 backdrop-blur-sm min-w-[140px]`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{card.label}</span>
                </div>
                <div className="text-xl font-bold font-display">
                  <AnimatedCounter
                    target={card.targetValue}
                    suffix={card.suffix}
                    prefix={card.prefix}
                  />
                </div>
                <div className="text-[11px] text-brand font-medium">Live data</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
