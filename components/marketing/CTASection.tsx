"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.82 0.27 153) 0%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="inline-flex items-center gap-2 bg-brand/12 border border-brand/25 text-brand text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            14-day free trial — no credit card needed
          </div>

          <h2 className="font-display text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Ready to 3x your
            <br />
            <span className="text-brand">meeting bookings?</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Join 2,400+ sales teams using GrowthDialer to dial smarter, connect faster, and close more deals.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] font-semibold text-base px-8 h-13 glow-brand gap-2 transition-all"
              >
                Start your free trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="border-white/15 bg-white/5 hover:bg-white/10 text-sm h-13 px-7 transition-all"
              >
                See a live demo
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            No credit card · Cancel anytime · Setup in under 2 hours
          </p>
        </motion.div>
      </div>
    </section>
  );
}
