"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Magnetic } from "@/components/marketing/v2/motion";

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.64 0.21 293) 0%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-brand/12 border border-brand/25 text-brand text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            14-day free trial — no credit card needed
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Ready to 3x your
            <br />
            <span className="text-brand">meeting bookings?</span>
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Built for growing sales teams using GrowthDialer to dial smarter, connect faster, and log every call with AI.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Magnetic strength={12}>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] font-semibold text-base px-8 h-13 glow-brand gap-2 transition-all"
                >
                  Start your free trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Magnetic>
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
        </Reveal>

        <Reveal delay={300}>
          <p className="text-xs text-muted-foreground mt-6">
            No credit card · Cancel anytime · Setup in under 2 hours
          </p>
        </Reveal>
      </div>
    </section>
  );
}
