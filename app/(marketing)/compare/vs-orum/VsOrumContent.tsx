"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="py-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/30 mb-4">
            GrowthDialer vs Orum
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Orum-level AI.
            <span className="text-primary"> 88% lower cost.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Orum pioneered AI-powered live dialing. GrowthDialer delivers the same autonomous sales technology starting at $79/seat — not $650.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/10 text-muted-foreground/90 hover:bg-white/5">
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
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">$79</div>
            <div className="text-sm font-semibold text-foreground">GrowthDialer / seat / mo</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-muted-foreground/70 mb-2">$650+</div>
            <div className="text-sm text-muted-foreground/70">Orum / seat / mo</div>
          </div>
        </motion.div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Feature-by-feature comparison</h2>
          <p className="text-muted-foreground">Comparable features. Dramatically different price.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto overflow-hidden rounded-xl border border-white/[0.08]"
        >
          <div className="grid grid-cols-3 bg-white/[0.02] px-6 py-4 text-sm font-semibold">
            <span className="text-foreground">Feature</span>
            <span className="text-center text-primary">GrowthDialer</span>
            <span className="text-center text-muted-foreground/70">Orum</span>
          </div>
          {comparisonRows.map((row, index) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-3 px-6 py-4 border-t border-white/[0.06] items-center"
            >
              <span className="text-sm text-muted-foreground/90">{row.feature}</span>
              <span className="text-center">
                {typeof row.growthdialer === "boolean" ? (
                  row.growthdialer ? (
                    <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground/60 mx-auto" />
                  )
                ) : (
                  <span className="font-bold text-primary">{row.growthdialer}</span>
                )}
              </span>
              <span className="text-center">
                {typeof row.competitor === "boolean" ? (
                  row.competitor ? (
                    <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground/60 mx-auto" />
                  )
                ) : (
                  <span className="text-muted-foreground/70">{row.competitor}</span>
                )}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Reasons */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Why teams choose GrowthDialer over Orum</h2>
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
              <Card className="h-full border-white/[0.08] bg-white/[0.02]">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <reason.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{reason.title}</CardTitle>
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
          className="max-w-3xl mx-auto bg-white/[0.02] border border-white/[0.08] rounded-2xl p-10 text-center"
        >
          <p className="text-xl italic mb-6 text-muted-foreground/90">&ldquo;{testimonial.quote}&rdquo;</p>
          <p className="font-semibold text-foreground">{testimonial.author}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Cut your dialing costs by 88%</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your free 14-day trial and see the same AI results at a fraction of Orum&apos;s price.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {["No credit card required", "14-day free trial", "Cancel anytime"].map((item) => (
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
