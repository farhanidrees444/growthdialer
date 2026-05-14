
import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, ArrowRight, DollarSign, Users, TrendingDown } from "lucide-react";

export const metadata: Metadata = {
  title: "GrowthDialer vs PowerDialer ? Built for 2026, not 2015",
  description: "Compare GrowthDialer vs PowerDialer and see why modern autonomous AI outperforms legacy dialer platforms.",
  keywords: "powerdialer alternative, growthdialer vs powerdialer, modern sales dialer, ai enabled calling, powerdialer comparison",
  openGraph: {
    title: "GrowthDialer vs PowerDialer ? Built for 2026, not 2015",
    description: "Why teams upgrade from PowerDialer to GrowthDialer for autonomous AI and modern workflow.",
    type: "website",
  },
};

const heroStats = [
  { value: "$129/mo", label: "PowerDialer average price", icon: DollarSign },
  { value: "$39/mo", label: "GrowthDialer price per seat", icon: Users },
  { value: "Modern AI", label: "vs legacy dialer workflow", icon: TrendingDown },
];

const features = [
  { feature: "Autonomous AI conversations", growthdialer: "? Full conversations", powerdialer: "? Agent-managed only", growthdialerHas: true, powerdialerHas: false },
  { feature: "Omnichannel sequences", growthdialer: "? Call + Email + SMS", powerdialer: "? Call-only", growthdialerHas: true, powerdialerHas: false },
  { feature: "AI objection handling", growthdialer: "? Real-time responses", powerdialer: "? Manual scripts", growthdialerHas: true, powerdialerHas: false },
  { feature: "Meeting booking", growthdialer: "? Automated scheduling", powerdialer: "? Human handoff", growthdialerHas: true, powerdialerHas: false },
  { feature: "Live coaching", growthdialer: "? AI support prompts", powerdialer: "? None", growthdialerHas: true, powerdialerHas: false },
  { feature: "Free trial", growthdialer: "? 14 days no CC", powerdialer: "? No free trial", growthdialerHas: true, powerdialerHas: false },
];

const comparison = [
  { reps: "1 rep", powerdialer: "$1,548/yr", growthdialer: "$468/yr", savings: "$1,080" },
  { reps: "5 reps", powerdialer: "$7,740/yr", growthdialer: "$2,340/yr", savings: "$5,400" },
  { reps: "10 reps", powerdialer: "$15,480/yr", growthdialer: "$4,680/yr", savings: "$10,800" },
];

const testimonials = [
  {
    name: "Carla Bennett",
    role: "Director of Sales",
    company: "ClearBridge",
    content: "PowerDialer still felt like a 2010 workflow. GrowthDialer brings AI-driven outreach into the modern era and removes the manual handoff after every call.",
    rating: 5,
  },
  {
    name: "David Nguyen",
    role: "Head of SDR",
    company: "LaunchWorks",
    content: "Switching to GrowthDialer meant better pipeline, fewer manual tasks, and a platform that learns from our conversations instead of just dialing numbers.",
    rating: 5,
  },
  {
    name: "Amrita Patel",
    role: "VP of Revenue Operations",
    company: "FluxGlobal",
    content: "GrowthDialer replaces our PowerDialer setup with AI that actually handles the sales cadence. We got faster ramp and stronger meeting volume.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "What makes GrowthDialer a better choice than PowerDialer?",
    answer: "PowerDialer is built around manual dialing workflows. GrowthDialer uses autonomous AI to manage outreach, follow-up, and booking, so your team can focus on closing more deals.",
  },
  {
    question: "Will GrowthDialer work with my current CRM?",
    answer: "Yes. GrowthDialer integrates with popular CRMs and keeps your pipeline updated automatically.",
  },
  {
    question: "Can GrowthDialer handle sales sequences across channels?",
    answer: "Absolutely. GrowthDialer supports phone, email, and SMS in one platform, unlike PowerDialer?s call-first approach.",
  },
  {
    question: "How much can we save by switching?",
    answer: "Teams often save more than $1,000 per user per year while gaining modern AI capabilities that PowerDialer does not offer.",
  },
  {
    question: "How fast can we migrate from PowerDialer?",
    answer: "Most teams are live in 1-2 weeks with our migration support and conversation modeling process.",
  },
];

export default function VsPowerDialerPage() {
  return (
    <div className="pt-24 pb-16">
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">PowerDialer Alternative</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Built for 2026,
            <br />
            <span className="text-brand">not 2015.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            PowerDialer is a proven dialer, but modern sales teams need AI that can run the conversation and follow-up automatically.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {heroStats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="rounded-3xl border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"><stat.icon className="h-6 w-6" /></div>
                <p className="text-3xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="lg" className="bg-brand text-white hover:bg-brand/90">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/demo"><Button size="lg" variant="outline">Book a demo</Button></Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">PowerDialer vs GrowthDialer comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border bg-card text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-4 text-left">Feature</th>
                <th className="border border-border p-4 text-center text-brand">GrowthDialer</th>
                <th className="border border-border p-4 text-center">PowerDialer</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr key={index} className="odd:bg-muted/10 hover:bg-muted/20">
                  <td className="border border-border p-4 font-medium">{item.feature}</td>
                  <td className="border border-border p-4 text-center"><Badge className="bg-green-50 text-green-700 inline-flex items-center gap-2"><Check className="h-4 w-4" />{item.growthdialer}</Badge></td>
                  <td className="border border-border p-4 text-center"><Badge className="bg-red-50 text-red-700 inline-flex items-center gap-2"><X className="h-4 w-4" />{item.powerdialer}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 bg-muted/10 rounded-3xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold mb-4">Move beyond the old dialer model</h2>
            <p className="text-muted-foreground mb-6">PowerDialer still makes reps responsible for every step. GrowthDialer automates conversation flow, follow-up, and booking so your team can focus on revenue.</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>? AI runs the next best action automatically</li>
              <li>? Multichannel outreach in one platform</li>
              <li>? Stronger pipeline with less manual effort</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Annual cost impact</h3>
            {comparison.map((row, index) => (
              <div key={index} className="mb-4 rounded-3xl border border-border p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{row.reps}</span>
                  <span className="font-semibold">Save {row.savings}</span>
                </div>
                <div className="mt-3 text-base font-semibold">{row.powerdialer} vs {row.growthdialer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Customer wins after switching</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">{[...Array(item.rating)].map((_, i) => (<Star key={i} className="h-4 w-4 text-yellow-400" />))}</div>
                  <div className="font-semibold">{item.name}</div>
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
        <h2 className="text-3xl font-bold text-center mb-8">PowerDialer migration FAQ</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-3">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card p-10">
          <h2 className="text-3xl font-bold mb-4">Upgrade your sales stack now</h2>
          <p className="text-muted-foreground mb-8">Stop using an outdated dialer and start using an autonomous sales platform built for the modern buyer.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="lg" className="bg-brand text-white hover:bg-brand/90">Start free trial</Button></Link>
            <Link href="/demo"><Button size="lg" variant="outline">Book a demo</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
