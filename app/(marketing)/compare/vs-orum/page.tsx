
import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, ArrowRight, DollarSign, Users, TrendingDown } from "lucide-react";

export const metadata: Metadata = {
  title: "GrowthDialer vs Orum ? 88% Cheaper for AI Sales",
  description: "Compare GrowthDialer vs Orum and learn why teams switch to GrowthDialer for better autonomous AI at 88% lower cost.",
  keywords: "orum alternative, growthdialer vs orum, orum pricing, sales ai comparison, affordable ai sales",
  openGraph: {
    title: "GrowthDialer vs Orum ? 88% Cheaper for AI Sales",
    description: "See why teams move from Orum's premium pricing to GrowthDialer's autonomous AI and save 88%.",
    type: "website",
  },
};

const heroStats = [
  { value: "$250/mo", label: "Orum enterprise starting price", icon: DollarSign },
  { value: "$39/mo", label: "GrowthDialer price per rep", icon: Users },
  { value: "88% savings", label: "vs Orum annual cost", icon: TrendingDown },
];

const features = [
  { feature: "Autonomous AI sales agent", growthdialer: "? Full conversation handling", orum: "? Limited AI workflow", growthdialerHas: true, orumHas: false },
  { feature: "Real-time objection handling", growthdialer: "? AI resolves objections", orum: "? Scripts only", growthdialerHas: true, orumHas: false },
  { feature: "16 language support", growthdialer: "? Global outreach", orum: "? English-first", growthdialerHas: true, orumHas: false },
  { feature: "24/7 prospecting", growthdialer: "? Around the clock", orum: "? Business hours only", growthdialerHas: true, orumHas: false },
  { feature: "Omnichannel follow-up", growthdialer: "? Call + Email + SMS", orum: "? Phone-focused", growthdialerHas: true, orumHas: false },
  { feature: "Meeting booking", growthdialer: "? AI schedules automatically", orum: "? Manual handoff", growthdialerHas: true, orumHas: false },
  { feature: "Affordable pricing", growthdialer: "? $39/user/mo", orum: "? $250/user/mo", growthdialerHas: true, orumHas: false },
  { feature: "Free trial", growthdialer: "? 14 days no CC", orum: "? Demo only", growthdialerHas: true, orumHas: false },
];

const costComparison = [
  { teamSize: "1 rep", orum: "$3,000/yr", growthdialer: "$468/yr", savings: "$2,532" },
  { teamSize: "5 reps", orum: "$15,000/yr", growthdialer: "$2,340/yr", savings: "$12,660" },
  { teamSize: "10 reps", orum: "$30,000/yr", growthdialer: "$4,680/yr", savings: "$25,320" },
  { teamSize: "20 reps", orum: "$60,000/yr", growthdialer: "$9,360/yr", savings: "$50,640" },
];

const testimonials = [
  {
    name: "Alyssa Reed",
    role: "VP of Revenue",
    company: "DemandFlow",
    content: "Orum felt expensive and underdelivered. GrowthDialer gave us true autonomous AI that handles objections, books meetings, and works across email and SMS. The ROI was immediate.",
    rating: 5,
  },
  {
    name: "Jordan Lee",
    role: "Sales Ops Director",
    company: "EdgeScale",
    content: "We saved 88% vs Orum and gained a sales engine that runs 24/7. GrowthDialer is simply more capable and far more affordable.",
    rating: 5,
  },
  {
    name: "Priya Nambiar",
    role: "Head of Customer Acquisition",
    company: "BrightLoop",
    content: "Orum's price never matched the feature set. GrowthDialer handles multi-language outreach beautifully and costs a fraction of the price.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "Is GrowthDialer really cheaper than Orum?",
    answer: "Yes. Orum starts at around $250/user/month, while GrowthDialer provides more advanced autonomous AI at $39/user/month, delivering up to 88% savings.",
  },
  {
    question: "Can GrowthDialer handle outbound sales calls better than Orum?",
    answer: "GrowthDialer uses autonomous agents built for modern sales workflows. It handles objections, books meetings, and sends follow-up messages ? far beyond Orum's limited voice-first approach.",
  },
  {
    question: "What makes GrowthDialer's AI more powerful?",
    answer: "GrowthDialer is designed for end-to-end sales conversations. It adapts in real time, qualifies leads, and keeps dialogues moving without manual intervention.",
  },
  {
    question: "Does GrowthDialer support the same integrations as Orum?",
    answer: "GrowthDialer supports all major CRMs and sales tools, making it easy to replace Orum and keep your existing workflows intact.",
  },
  {
    question: "How fast can we switch from Orum to GrowthDialer?",
    answer: "Most teams migrate in a week or less. We help import your contacts, diallists, and CRM setup so you can start saving immediately.",
  },
];

export default function VsOrumPage() {
  return (
    <div className="pt-24 pb-16">
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">Orum Alternative</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Better AI sales performance
            <br />
            <span className="text-brand">for 88% less.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Don?t pay enterprise Orum pricing for limited AI. GrowthDialer delivers true autonomous agents, omnichannel outreach,
            and global language support at a fraction of the cost.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {heroStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/90">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">Compare pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Orum pricing vs GrowthDialer value</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border bg-card text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-4 text-left">Feature</th>
                <th className="border border-border p-4 text-center text-brand">GrowthDialer</th>
                <th className="border border-border p-4 text-center">Orum</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr key={index} className="odd:bg-muted/10 hover:bg-muted/20">
                  <td className="border border-border p-4 font-medium">{item.feature}</td>
                  <td className="border border-border p-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-green-700">
                      <Check className="h-4 w-4" />
                      {item.growthdialer}
                    </div>
                  </td>
                  <td className="border border-border p-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-red-700">
                      <X className="h-4 w-4" />
                      {item.orum}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 bg-muted/10 rounded-3xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold mb-4">Annual savings calculator</h2>
            <p className="text-muted-foreground mb-8">
              Estimate how much your team can save by switching from Orum?s premium pricing to GrowthDialer?s modern AI platform.
            </p>
            <div className="space-y-4">
              {costComparison.map((row, index) => (
                <div key={index} className="flex items-center justify-between rounded-3xl bg-card p-5 shadow-sm">
                  <span className="font-medium">{row.teamSize}</span>
                  <span className="text-muted-foreground">{row.orum}</span>
                  <span className="text-brand font-semibold">{row.growthdialer}</span>
                  <span className="text-green-600 font-semibold">Save {row.savings}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-white p-8">
            <h3 className="text-xl font-semibold mb-4">Why this matters</h3>
            <p className="text-muted-foreground mb-4">
              Teams using GrowthDialer keep more budget for growth initiatives instead of overpaying for basic AI. The savings compound as your team scales.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>? Better ROI on every sales seat</li>
              <li>? More meetings booked for the same spend</li>
              <li>? Faster time to value when you onboard</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Customer success stories</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.role} ? {item.company}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 bg-muted/10 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-3xl border border-border bg-card p-6"
            >
              <h3 className="font-semibold mb-3">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card p-10">
          <h2 className="text-3xl font-bold mb-4">Switch from Orum and start saving today</h2>
          <p className="text-muted-foreground mb-8">
            The smart move is to stop paying premium Orum pricing for limited AI. Get better sales results and save 88% with GrowthDialer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/90">Start your free trial</Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">Book a demo</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
