"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, XCircle, Brain, Zap, BarChart2, Globe } from "lucide-react";

const comparisonRows = [
  { feature: "Autonomous AI dialing", growthdialer: true, competitor: false },
  { feature: "Parallel dialing (10+ lines)", growthdialer: true, competitor: false },
  { feature: "Real-time AI call coaching", growthdialer: true, competitor: false },
  { feature: "AI voicemail detection", growthdialer: true, competitor: true },
  { feature: "16 language support", growthdialer: true, competitor: false },
  { feature: "Live team salesfloor", growthdialer: true, competitor: false },
  { feature: "Native CRM sync", growthdialer: true, competitor: true },
  { feature: "Starting price per seat/mo", growthdialer: "$79", competitor: "$149" },
];

const reasons = [
  {
    icon: Brain,
    title: "AI that acts, not just assists",
    description:
      "PhoneBurner automates the dialing process — but a human still handles every conversation manually. GrowthDialer's AI actively coaches mid-call, handles objections, and can autonomously carry early-stage conversations while your reps focus on closing.",
  },
  {
    icon: Zap,
    title: "10x lines vs 1",
    description:
      "PhoneBurner dials one number at a time with power-dial mode. GrowthDialer dials up to 10 lines simultaneously, drops pre-recorded voicemails instantly, and connects your rep only when a human answers — eliminating dead time entirely.",
  },
  {
    icon: BarChart2,
    title: "Revenue metrics, not call metrics",
    description:
      "PhoneBurner shows you dial counts and connection rates. GrowthDialer shows pipeline generated, deal velocity, AI coaching impact, and revenue per dial — the numbers your VP cares about.",
  },
  {
    icon: Globe,
    title: "Built for 2026, not 2015",
    description:
      "PhoneBurner was built in an era when fast dialing was the innovation. GrowthDialer was built when AI changed what's possible — autonomous outreach, real-time conversation intelligence, and adaptive coaching that improves every week.",
  },
];

const testimonial = {
  quote:
    "We used PhoneBurner for 3 years. It was reliable but we were still doing all the heavy lifting. GrowthDialer's AI handles the rote parts of every call so our reps can focus on the 20% that actually moves deals.",
  author: "Lisa Hammond",
  role: "Sales Manager, TechReach",
};

export default function VsPhoneBurnerContent() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            GrowthDialer vs PhoneBurner
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Modern AI for
            <span className="text-brand"> outbound teams.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            PhoneBurner automates dialing. GrowthDialer automates the whole conversation — AI coaching, parallel dialing, and autonomous outreach in one platform.
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
          <p className="text-muted-foreground">See the gap between legacy dialing and modern AI.</p>
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
            <span className="text-center text-muted-foreground">PhoneBurner</span>
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
                    <CheckCircle className="w-5 h-5 text-primary mx-auto" />
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
                    <CheckCircle className="w-5 h-5 text-primary mx-auto" />
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
          <h2 className="text-3xl font-bold mb-4">Why outbound teams upgrade from PhoneBurner</h2>
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
          <h2 className="text-3xl font-bold mb-4">Ready to move beyond the power dialer?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your free trial and experience the next generation of outbound sales.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {["No credit card required", "14-day free trial", "Free migration support"].map((item) => (
              <span key={item} className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-primary" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
