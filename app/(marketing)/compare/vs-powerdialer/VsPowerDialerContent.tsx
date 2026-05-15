"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, XCircle, Brain, Zap, BarChart2, Globe } from "lucide-react";

const comparisonRows = [
  { feature: "Autonomous AI dialing", growthdialer: true, competitor: false },
  { feature: "Parallel dialing (10+ lines)", growthdialer: true, competitor: true },
  { feature: "Real-time AI call coaching", growthdialer: true, competitor: false },
  { feature: "AI voicemail detection", growthdialer: true, competitor: true },
  { feature: "16 language support", growthdialer: true, competitor: false },
  { feature: "Live team salesfloor", growthdialer: true, competitor: false },
  { feature: "Native CRM sync", growthdialer: true, competitor: true },
  { feature: "Starting price per seat/mo", growthdialer: "$79", competitor: "$129" },
];

const reasons = [
  {
    icon: Brain,
    title: "AI that learns, not just dials",
    description:
      "PowerDialer.com gives you a faster dialer. GrowthDialer gives you an AI that improves with every call — adapting objection handling, updating battlecards, and personalizing outreach based on what's actually working for your team.",
  },
  {
    icon: Zap,
    title: "Parallel dialing with live coaching",
    description:
      "Both platforms can dial multiple lines. Only GrowthDialer combines parallel dialing with real-time AI coaching — so when you connect, your rep has instant context, relevant battlecards, and suggested next steps surfaced automatically.",
  },
  {
    icon: BarChart2,
    title: "Pipeline intelligence, not just call logs",
    description:
      "PowerDialer tracks what calls were made. GrowthDialer tracks why deals are won and lost — AI conversation analysis, intent signals, and deal-stage coaching that connects calling activity to revenue outcomes.",
  },
  {
    icon: Globe,
    title: "Built for the AI era",
    description:
      "PowerDialer.com was built when faster dialing was competitive differentiation. GrowthDialer was built for an era where AI handles the repetitive parts of selling so your reps can focus exclusively on relationship-building and closing.",
  },
];

const testimonial = {
  quote:
    "PowerDialer got us more calls. GrowthDialer got us better outcomes from those calls. The AI coaching alone improved our connect-to-meeting rate by 35% in the first month.",
  author: "Jordan Lee",
  role: "Sales Director, OutboundPro",
};

export default function VsPowerDialerContent() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            GrowthDialer vs PowerDialer
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Built for 2026.
            <span className="text-brand"> Not 2015.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            PowerDialer optimizes call volume. GrowthDialer optimizes revenue — with autonomous AI, real-time coaching, and conversation intelligence that legacy dialers can&apos;t match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Feature-by-feature comparison</h2>
          <p className="text-muted-foreground">Legacy dialing vs modern autonomous AI.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto overflow-hidden rounded-xl border border-muted"
        >
          <div className="grid grid-cols-3 bg-muted/50 px-6 py-4 text-sm font-semibold">
            <span>Feature</span>
            <span className="text-center text-brand">GrowthDialer</span>
            <span className="text-center text-muted-foreground">PowerDialer</span>
          </div>
          {comparisonRows.map((row, index) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-3 px-6 py-4 border-t border-muted items-center"
            >
              <span className="text-sm">{row.feature}</span>
              <span className="text-center">
                {typeof row.growthdialer === "boolean" ? (
                  row.growthdialer ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span className="font-bold text-brand">{row.growthdialer}</span>
                )}
              </span>
              <span className="text-center">
                {typeof row.competitor === "boolean" ? (
                  row.competitor ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span className="text-muted-foreground">{row.competitor}</span>
                )}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Reasons */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why teams upgrade from PowerDialer</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                    <reason.icon className="w-6 h-6 text-brand" />
                  </div>
                  <CardTitle className="text-xl">{reason.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{reason.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-muted/30 border border-muted rounded-2xl p-10 text-center"
        >
          <p className="text-xl italic mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
          <p className="font-semibold">{testimonial.author}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Upgrade to AI-powered outbound</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your free trial and see the difference autonomous AI makes on your pipeline.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {["No credit card required", "14-day free trial", "Cancel anytime"].map((item) => (
              <span key={item} className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
