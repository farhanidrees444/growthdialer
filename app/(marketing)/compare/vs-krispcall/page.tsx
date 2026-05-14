
import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, ArrowRight, DollarSign, Users, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "GrowthDialer vs KrispCall ? Same price, 10x AI power",
  description: "Compare GrowthDialer vs KrispCall and see how modern autonomous AI beats legacy voice-only dialers at the same or lower price.",
  keywords: "krispcall alternative, growthdialer vs krispcall, ai dialer comparison, sales AI pricing, voice sales automation",
  openGraph: {
    title: "GrowthDialer vs KrispCall ? Same price, 10x AI power",
    description: "Why teams switch from KrispCall to GrowthDialer for more powerful autonomous sales AI.",
    type: "website",
  },
};

const heroStats = [
  { value: "$12-$40/mo", label: "KrispCall pricing range", icon: DollarSign },
  { value: "$39/mo", label: "GrowthDialer all-in price", icon: Users },
  { value: "10x AI power", label: "beyond voice-only", icon: TrendingUp },
];

const features = [
  { feature: "Autonomous sales agent", growthdialer: "? Full AI conversations", krispcall: "? Call execution only", growthdialerHas: true, krispcallHas: false },
  { feature: "Voice + follow-up", growthdialer: "? Call, email, SMS", krispcall: "? Phone only", growthdialerHas: true, krispcallHas: false },
  { feature: "Objection handling", growthdialer: "? AI responds dynamically", krispcall: "? Manual scripts", growthdialerHas: true, krispcallHas: false },
  { feature: "Lead qualification", growthdialer: "? AI qualifies leads", krispcall: "? Export reports", growthdialerHas: true, krispcallHas: false },
  { feature: "Language coverage", growthdialer: "? 16 languages", krispcall: "? English-first", growthdialerHas: true, krispcallHas: false },
  { feature: "CRM automation", growthdialer: "? Smart deal updates", krispcall: "? Basic logging", growthdialerHas: true, krispcallHas: false },
  { feature: "Free trial", growthdialer: "? 14 days no CC", krispcall: "? Paid trial", growthdialerHas: true, krispcallHas: false },
];

const savings = [
  { reps: "1 rep", krispcall: "$468/yr", growthdialer: "$468/yr", difference: "$0" },
  { reps: "5 reps", krispcall: "$2,340/yr", growthdialer: "$2,340/yr", difference: "Same price, better AI" },
  { reps: "10 reps", krispcall: "$4,680/yr", growthdialer: "$4,680/yr", difference: "More automation included" },
];

const testimonials = [
  {
    name: "Maria Garcia",
    role: "VP Sales",
    company: "NovaReach",
    content: "KrispCall gave us a decent dialer, but it still relied on manual follow-up. GrowthDialer replaced our whole process with autonomous AI that actually closes deals.",
    rating: 5,
  },
  {
    name: "Connor Banks",
    role: "Director of Demand Gen",
    company: "PulseWave",
    content: "The same price as KrispCall, but GrowthDialer delivers far more value. We can now do conversational outreach across phone, email, and SMS without extra apps.",
    rating: 5,
  },
  {
    name: "Ritu Sharma",
    role: "Sales Enablement Lead",
    company: "Lumenix",
    content: "GrowthDialer?s AI handles objections and books meetings automatically. KrispCall felt like a modern call bridge. GrowthDialer feels like the future.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "How is GrowthDialer different from KrispCall?",
    answer: "KrispCall is a voice-first dialer for agents. GrowthDialer is a modern autonomous sales platform that handles calls, follow-up messages, lead qualification, and meeting bookings automatically.",
  },
  {
    question: "Can I save money by switching from KrispCall?",
    answer: "Yes. At comparable pricing, GrowthDialer offers far more automation and value. You gain email and SMS outreach, AI objection handling, and multi-language support for the same spend.",
  },
  {
    question: "Does GrowthDialer support my existing CRM?",
    answer: "GrowthDialer integrates with major CRMs and maps contact activity automatically so you can keep your current sales stack.",
  },
  {
    question: "Can GrowthDialer replace my call center workflow?",
    answer: "Yes. GrowthDialer can automate up to 80% of outbound conversations, freeing reps to focus on higher-value deals.",
  },
  {
    question: "How long does onboarding take?",
    answer: "Most teams are live in under two weeks, with our onboarding team helping import data and configure AI workflows.",
  },
];

export default function VsKrispCallPage() {
  return (
    <div className="pt-24 pb-16">
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">KrispCall Alternative</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Same pricing,
            <br />
            <span className="text-brand">10x more AI value.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            KrispCall is a strong dialer, but it still makes sales reps do most of the work. GrowthDialer replaces manual sequences with autonomous AI across calls, email, and SMS.
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
              <Button size="lg" className="bg-brand text-white hover:bg-brand/90">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">See the demo</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">From voice-only to full outreach automation</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border bg-card text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-4 text-left">Feature</th>
                <th className="border border-border p-4 text-center text-brand">GrowthDialer</th>
                <th className="border border-border p-4 text-center">KrispCall</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr key={index} className="odd:bg-muted/10 hover:bg-muted/20">
                  <td className="border border-border p-4 font-medium">{item.feature}</td>
                  <td className="border border-border p-4 text-center">
                    <Badge className="bg-green-50 text-green-700 inline-flex items-center gap-2"><Check className="h-4 w-4" />{item.growthdialer}</Badge>
                  </td>
                  <td className="border border-border p-4 text-center">
                    <Badge className="bg-red-50 text-red-700 inline-flex items-center gap-2"><X className="h-4 w-4" />{item.krispcall}</Badge>
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
            <h2 className="text-3xl font-bold mb-4">Why the same price should do more</h2>
            <p className="text-muted-foreground mb-6">If you?re paying KrispCall pricing, you should get more than a dialer. GrowthDialer includes outbound intelligence, AI follow-up, and automatic deal updates without extra add-ons.</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>? No separate email or SMS tools needed</li>
              <li>? AI handles objections and qualifies prospects</li>
              <li>? Instant insights from every conversation</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Same annual cost, more automation</h3>
            {savings.map((row, index) => (
              <div key={index} className="mb-4 rounded-3xl border border-border p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{row.reps}</span>
                  <span>{row.difference}</span>
                </div>
                <div className="mt-3 text-base font-semibold">{row.krispcall} vs {row.growthdialer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Trusted by teams leaving KrispCall</h2>
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
        <h2 className="text-3xl font-bold text-center mb-8">Ask before you switch</h2>
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
          <h2 className="text-3xl font-bold mb-4">Push past KrispCall limitations</h2>
          <p className="text-muted-foreground mb-8">Stay on a modern platform that keeps pace with outbound sales. GrowthDialer gives you autonomous AI, omnichannel outreach, and built-in CRM intelligence.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/90">Try GrowthDialer free</Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">Book a walkthrough</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
