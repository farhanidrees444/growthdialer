"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, XCircle, DollarSign, Zap, Brain, TrendingUp } from "lucide-react";

const comparisonRows = [
  { feature: "Autonomous AI dialing", growthdialer: true, competitor: true },
  { feature: "Parallel dialing (10+ lines)", growthdialer: true, competitor: true },
  { feature: "Real-time AI call coaching", growthdialer: true, competitor: true },
  { feature: "AI voicemail detection", growthdialer: true, competitor: true },
  { feature: "16 language support", growthdialer: true, competitor: false },
  { feature: "Live team salesfloor", growthdialer: true, competitor: true },
  { feature: "Native CRM sync", growthdialer: true, competitor: true },
  { feature: "Starting price per seat/mo", growthdialer: "$79", competitor: "$650+" },
];

const reasons = [
  {
    icon: DollarSign,
    title: "88% cheaper — not 88% worse",
    description:
      "Orum prices start around $650/seat per month for similar AI calling features. GrowthDialer starts at $79. That 88% savings goes straight back to your team's budget without sacrificing autonomous AI capabilities.",
  },
  {
    icon: Brain,
    title: "Equal AI, superior economics",
    description:
      "Orum pioneered live-conversation AI dialing — we respect that. GrowthDialer has matched those capabilities and passed the savings to customers. Your pipeline doesn't know which platform booked the meeting.",
  },
  {
    icon: Zap,
    title: "No minimum seat requirements",
    description:
      "Orum requires large team minimums before you can access full AI features. GrowthDialer gives every team — even a 2-person startup — the full autonomous AI stack from day one.",
  },
  {
    icon: TrendingUp,
    title: "Better ROI at every team size",
    description:
      "A 10-rep team using Orum spends $78k/year on software alone. The same team on GrowthDialer spends $9.5k — freeing resources to hire 2 more reps and accelerate pipeline even further.",
  },
];

const testimonial = {
  quote:
    "Orum is a great product but we couldn't justify $650 per seat when we have 40 reps. GrowthDialer gave us the same live-conversation AI at 88% less. Our CAC improved immediately.",
  author: "Derek Walsh",
  role: "CRO, RevOps Solutions",
};

export default function VsOrumContent() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            GrowthDialer vs Orum
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Orum-level AI.
            <span className="text-brand"> 88% lower cost.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Orum pioneered AI-powered live dialing. GrowthDialer delivers the same autonomous sales technology starting at $79/seat — not $650.
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

      {/* Price callout */}
      <section className="container mx-auto px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto grid grid-cols-2 gap-4"
        >
          <div className="bg-brand/10 border border-brand/30 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-brand mb-2">$79</div>
            <div className="text-sm font-semibold">GrowthDialer / seat / mo</div>
          </div>
          <div className="bg-muted/30 border border-muted rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-muted-foreground mb-2">$650+</div>
            <div className="text-sm text-muted-foreground">Orum / seat / mo</div>
          </div>
        </motion.div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Feature-by-feature comparison</h2>
          <p className="text-muted-foreground">Comparable features. Dramatically different price.</p>
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
            <span className="text-center text-muted-foreground">Orum</span>
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
          <h2 className="text-3xl font-bold mb-4">Why teams choose GrowthDialer over Orum</h2>
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
          <h2 className="text-3xl font-bold mb-4">Cut your dialing costs by 88%</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your free 14-day trial and see the same AI results at a fraction of Orum's price.
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
