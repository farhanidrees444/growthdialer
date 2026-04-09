"use client";

import { motion } from "framer-motion";
import { Upload, Zap, TrendingUp } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Import & prioritize leads",
    description:
      "Connect your CRM or upload a CSV. GrowthDialer's AI scores and ranks every lead by likelihood to connect, so your reps always work the hottest prospects first.",
    terminal: [
      { type: "comment", text: "// AI scoring running..." },
      { type: "info", text: "James Whitfield   score: 92  [HOT]" },
      { type: "info", text: "Priya Nair        score: 85  [WARM]" },
      { type: "info", text: "Marcus Webb       score: 78  [WARM]" },
      { type: "success", text: "✓ 284 leads prioritized in 1.2s" },
    ],
  },
  {
    step: "02",
    icon: Zap,
    title: "Parallel dial at scale",
    description:
      "Our AI dials up to 10 lines simultaneously, drops your rep into live conversations instantly — zero wait time, no idle reps. Voicemail? We handle it automatically.",
    terminal: [
      { type: "comment", text: "// Parallel dialing active" },
      { type: "info", text: "Line 1 → Dialing... James Whitfield" },
      { type: "info", text: "Line 2 → Dialing... Priya Nair" },
      { type: "warn", text: "Line 3 → Voicemail — dropping AI vm" },
      { type: "success", text: "✓ Line 1 CONNECTED — transferring..." },
    ],
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Coach, log & close",
    description:
      "Real-time AI listens and surfaces battlecards, objection handlers, and next-step prompts mid-call. Every call is automatically logged to your CRM with notes.",
    terminal: [
      { type: "comment", text: "// Live coaching active" },
      { type: "warn", text: "Objection: \"We already have a dialer\"" },
      { type: "info", text: "💡 Suggested: ROI comparison slide" },
      { type: "info", text: "📅 Meeting booked: Thu 2pm" },
      { type: "success", text: "✓ Call logged to Salesforce" },
    ],
  },
];

const lineColors: Record<string, string> = {
  comment: "text-muted-foreground",
  info: "text-foreground/80",
  warn: "text-amber-400",
  success: "text-brand",
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            From list to closed — in three steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            GrowthDialer removes every bottleneck between your reps and their next booked meeting.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-20 lg:space-y-28">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                i % 2 === 1 ? "lg:[&>*:first-child]:order-last" : ""
              }`}
            >
              {/* Copy */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-display text-5xl font-bold text-brand/20 tabular-nums">
                    {step.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-brand" />
                  </div>
                </div>
                <h3 className="font-display text-2xl lg:text-3xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{step.description}</p>
              </div>

              {/* Terminal */}
              <div className="rounded-2xl border border-white/10 bg-[oklch(0.068_0.020_284)] overflow-hidden shadow-2xl shadow-black/40">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-brand/50" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">growthdialer — terminal</span>
                </div>
                <div className="p-5 font-mono text-sm space-y-2">
                  {step.terminal.map((line, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + j * 0.12, duration: 0.3 }}
                      className={lineColors[line.type]}
                    >
                      {line.type === "comment" ? (
                        <span className="text-muted-foreground/60">{line.text}</span>
                      ) : (
                        <span>{line.text}</span>
                      )}
                    </motion.div>
                  ))}
                  {/* Blinking cursor */}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="inline-block w-2 h-4 bg-brand rounded-sm align-middle"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
