"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, XCircle, Zap, DollarSign, Brain, Users } from "lucide-react";

const comparisonRows = [
  { feature: "Autonomous AI dialing", growthdialer: true, competitor: false },
  { feature: "Parallel dialing (10+ lines)", growthdialer: true, competitor: true },
  { feature: "Real-time AI call coaching", growthdialer: true, competitor: false },
  { feature: "AI voicemail detection", growthdialer: true, competitor: true },
  { feature: "Live team salesfloor", growthdialer: true, competitor: false },
  { feature: "16 language support", growthdialer: true, competitor: false },
  { feature: "Native CRM sync (Salesforce, HubSpot)", growthdialer: true, competitor: true },
  { feature: "Starting price per seat/mo", growthdialer: "$79", competitor: "$249+" },
];

const reasons = [
  {
    icon: Brain,
    title: "Autonomous AI — not just auto-dial",
    description:
      "DandyDialer gives you a faster dialer. GrowthDialer gives you an AI that handles objections, personalizes pitches, and books meetings autonomously — no extra headcount required.",
  },
  {
    icon: DollarSign,
    title: "Enterprise features at startup pricing",
    description:
      "DandyDialer's enterprise tier starts at $249/seat. GrowthDialer delivers the same power — parallel dialing, CRM sync, live coaching — starting at $79/seat with no hidden fees.",
  },
  {
    icon: Zap,
    title: "Faster time to first meeting",
    description:
      "Teams switching from DandyDialer book their first AI-assisted meeting within 48 hours of setup. No professional services, no 30-day onboarding — just results.",
  },
  {
    icon: Users,
    title: "Built for the full sales team",
    description:
      "From SDRs running outbound campaigns to AEs closing deals to managers coaching live — GrowthDialer's salesfloor covers the entire funnel in one platform.",
  },
];

const testimonial = {
  quote:
    "We were paying DandyDialer $300 per seat and still manually handling objections. GrowthDialer cut our cost by 70% and our AI now handles the first 3 minutes of every call.",
  author: "Marcus Chen",
  role: "VP of Sales, DataFlow Inc.",
};

export default function VsDandyDialerContent() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            GrowthDialer vs DandyDialer
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Enterprise features.
            <span className="text-brand"> Startup pricing.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            DandyDialer charges enterprise rates for basic automation. GrowthDialer delivers autonomous AI sales at a fraction of the cost.
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
          <p className="text-muted-foreground">See exactly where GrowthDialer pulls ahead.</p>
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
            <span className="text-center text-muted-foreground">DandyDialer</span>
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
          <h2 className="text-3xl font-bold mb-4">Why teams switch from DandyDialer</h2>
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
          <h2 className="text-3xl font-bold mb-4">Ready to make the switch?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your free 14-day trial. No credit card. Cancel anytime.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {["No credit card required", "14-day free trial", "Free migration support"].map((item) => (
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
