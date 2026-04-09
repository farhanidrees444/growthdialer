"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Brain,
  BarChart3,
  GitBranch,
  PhoneCall,
  Shield,
  Headphones,
  MessageSquare,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Parallel Dialing",
    description:
      "Dial up to 10 prospects simultaneously. AI drops your rep into live calls instantly — no wait time, no wasted seconds.",
    span: "lg:col-span-2",
    highlight: true,
  },
  {
    icon: Brain,
    title: "AI Call Coaching",
    description:
      "Real-time transcription, objection detection, and live battlecard suggestions — mid-conversation.",
    span: "lg:col-span-1",
  },
  {
    icon: BarChart3,
    title: "Pipeline Analytics",
    description:
      "Live dashboards with call activity, connect rates, and forecast accuracy — updated in real time.",
    span: "lg:col-span-1",
  },
  {
    icon: GitBranch,
    title: "Smart Sequences",
    description:
      "Multi-touch sequences that combine calls, emails, and LinkedIn — all automated and personalized.",
    span: "lg:col-span-1",
  },
  {
    icon: PhoneCall,
    title: "Local Presence",
    description:
      "Display local caller IDs in over 300 area codes. Connect rates increase 35% when prospects recognize the number.",
    span: "lg:col-span-1",
  },
  {
    icon: Shield,
    title: "Spam Protection",
    description:
      "Automatic number rotation and carrier health monitoring keeps your numbers clean and out of spam filters.",
    span: "lg:col-span-1",
  },
  {
    icon: Headphones,
    title: "AI Voicemail Drop",
    description:
      "Pre-recorded voicemails dropped with one click. Personalized per prospect using AI voice synthesis.",
    span: "lg:col-span-1",
  },
  {
    icon: MessageSquare,
    title: "CRM Auto-Logging",
    description:
      "Every call, note, and outcome synced to Salesforce, HubSpot, or your CRM of choice — automatically.",
    span: "lg:col-span-2",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Everything your team needs to crush quota
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One platform replaces your dialer, sequencer, and call coaching tool — while your reps just focus on selling.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 4) * 0.08, duration: 0.45 }}
              className={`${f.span} group relative rounded-2xl border border-white/8 bg-[oklch(0.086_0.024_282)] p-6 hover:border-brand/30 hover:bg-[oklch(0.10_0.028_282)] transition-all duration-300 overflow-hidden`}
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: "radial-gradient(ellipse at top left, oklch(0.82 0.27 153 / 5%) 0%, transparent 60%)" }}
              />

              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                    f.highlight
                      ? "bg-brand/20 group-hover:bg-brand/30"
                      : "bg-white/6 group-hover:bg-white/10"
                  }`}
                >
                  <f.icon
                    className={`w-5 h-5 transition-colors ${
                      f.highlight ? "text-brand" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
