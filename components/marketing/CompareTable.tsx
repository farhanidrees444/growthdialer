"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const rows: Array<{ feature: string; gd: Val; comp1: Val; comp2: Val }> = [
  { feature: "Parallel dialing (10+ lines)", gd: true, comp1: false, comp2: "partial" },
  { feature: "AI real-time call coaching", gd: true, comp1: false, comp2: false },
  { feature: "AI voicemail drop", gd: true, comp1: true, comp2: true },
  { feature: "Local presence (300+ area codes)", gd: true, comp1: true, comp2: false },
  { feature: "Automatic CRM logging", gd: true, comp1: true, comp2: "partial" },
  { feature: "Spam number protection", gd: true, comp1: false, comp2: false },
  { feature: "Multi-channel sequences", gd: true, comp1: "partial", comp2: true },
  { feature: "Built-in analytics dashboard", gd: true, comp1: "partial", comp2: true },
  { feature: "Free onboarding & migration", gd: true, comp1: false, comp2: false },
  { feature: "No per-minute call charges", gd: true, comp1: false, comp2: false },
];

type Val = boolean | "partial";

function Cell({ val, highlight }: { val: Val; highlight?: boolean }) {
  if (val === true)
    return (
      <div className="flex justify-center">
        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", highlight ? "bg-brand/20" : "bg-brand/10")}>
          <Check className="w-3.5 h-3.5 text-brand" />
        </div>
      </div>
    );
  if (val === false)
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-white/4 flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-muted-foreground/50" />
        </div>
      </div>
    );
  return (
    <div className="flex justify-center">
      <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
        <Minus className="w-3.5 h-3.5 text-amber-400" />
      </div>
    </div>
  );
}

export default function CompareTable() {
  return (
    <section className="py-24 lg:py-32 border-t border-white/8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Compare</p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Why teams switch to GrowthDialer
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how we stack up against the alternatives.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-4 bg-[oklch(0.068_0.020_284)] border-b border-white/10">
            <div className="col-span-1 px-6 py-4 text-sm font-medium text-muted-foreground">Feature</div>
            <div className="col-span-1 px-6 py-4 text-center">
              <div className="text-sm font-bold text-brand">GrowthDialer</div>
              <div className="text-xs text-muted-foreground mt-1">$29/user/mo</div>
            </div>
            <div className="col-span-1 px-6 py-4 text-center text-sm text-muted-foreground">
              <Link href="/compare/vs-orum" className="hover:text-foreground transition-colors">
                <div>Orum</div>
                <div className="text-xs text-muted-foreground mt-1">$59/user/mo</div>
              </Link>
            </div>
            <div className="col-span-1 px-6 py-4 text-center text-sm text-muted-foreground">
              <Link href="/compare/vs-nooks" className="hover:text-foreground transition-colors">
                <div>Nooks</div>
                <div className="text-xs text-muted-foreground mt-1">$45/user/mo</div>
              </Link>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={cn(
                "grid grid-cols-4 border-b border-white/6 last:border-0 transition-colors",
                i % 2 === 0 ? "bg-[oklch(0.086_0.024_282)]" : "bg-[oklch(0.080_0.022_283)]"
              )}
            >
              <div className="col-span-1 px-6 py-4 text-sm text-muted-foreground">{row.feature}</div>
              <div className="col-span-1 px-6 py-4">
                <Cell val={row.gd} highlight />
              </div>
              <div className="col-span-1 px-6 py-4">
                <Cell val={row.comp1} />
              </div>
              <div className="col-span-1 px-6 py-4">
                <Cell val={row.comp2} />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/signup">
            <Button className="bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] font-semibold gap-2">
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" className="border-white/15 bg-white/5 hover:bg-white/10">
              View pricing
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {[
            { label: "vs Orum", href: "/compare/vs-orum" },
            { label: "vs Nooks", href: "/compare/vs-nooks" },
            { label: "vs PhoneBurner", href: "/compare/vs-phoneburner" },
            { label: "vs KrispCall", href: "/compare/vs-krispcall" },
          ].map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="text-xs text-muted-foreground hover:text-brand transition-colors underline underline-offset-2"
            >
              {c.label}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
