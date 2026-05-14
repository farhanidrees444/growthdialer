
import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, ArrowRight, DollarSign, Users, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "GrowthDialer vs PhoneBurner ? Modern AI for outbound teams",
  description: "Compare GrowthDialer vs PhoneBurner and discover the benefits of modern autonomous AI over legacy dialer workflows.",
  keywords: "phoneburner alternative, growthdialer vs phoneburner, modern dialer, ai outbound sales, phoneburner comparison",
  openGraph: {
    title: "GrowthDialer vs PhoneBurner ? Modern AI for outbound teams",
    description: "Why outbound teams upgrade from PhoneBurner to GrowthDialer for autonomous AI and better results.",
    type: "website",
  },
};

const heroStats = [
  { value: "$149/mo", label: "PhoneBurner cost per user", icon: DollarSign },
  { value: "$39/mo", label: "GrowthDialer price per user", icon: Users },
  { value: "2x productivity", label: "better outbound efficiency", icon: TrendingUp },
];

const features = [
  { feature: "Autonomous sales agent", growthdialer: "? Built-in AI conversations", phoneburner: "? Agent-driven calls", growthdialerHas: true, phoneburnerHas: false },
  { feature: "Multichannel outreach", growthdialer: "? Call + Email + SMS", phoneburner: "? Call-only", growthdialerHas: true, phoneburnerHas: false },
  { feature: "Meeting booking", growthdialer: "? AI schedules meetings", phoneburner: "? Manual transfer", growthdialerHas: true, phoneburnerHas: false },
  { feature: "Real-time coaching", growthdialer: "? AI prompts reps", phoneburner: "? No coaching", growthdialerHas: true, phoneburnerHas: false },
  { feature: "Lead qualification", growthdialer: "? AI qualifies prospects", phoneburner: "? Manual review", growthdialerHas: true, phoneburnerHas: false },
  { feature: "Free trial", growthdialer: "? 14 days no CC", phoneburner: "? No free trial", growthdialerHas: true, phoneburnerHas: false },
];

const savings = [
  { reps: "1 rep", phoneburner: "$1,788/yr", growthdialer: "$468/yr", savings: "$1,320" },
  { reps: "5 reps", phoneburner: "$8,940/yr", growthdialer: "$2,340/yr", savings: "$6,600" },
  { reps: "10 reps", phoneburner: "$17,880/yr", growthdialer: "$4,680/yr", savings: "$13,200" },
];

const testimonials = [
  {
    name: "Michael Brown",
    role: "Revenue Director",
    company: "Ascend Partners",
    content: "PhoneBurner helped us dial quickly, but it still required reps to manage every follow-up. GrowthDialer automates the entire outbound path and improves conversion rates.",
    rating: 5,
  },
  {
    name: "Hannah Li",
    role: "Sales Operations Manager",
    company: "LeadSpring",
    content: "We cut our cost per rep while increasing meeting volume. GrowthDialer?s AI does the work PhoneBurner expected reps to do manually.",
    rating: 5,
  },
  {
    name: "Ethan Patel",
    role: "VP of Sales",
    company: "VectorOne",
    content: "PhoneBurner is a dialer, not an AI platform. GrowthDialer is the upgrade we needed for modern demand gen teams.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "Why should I switch from PhoneBurner to GrowthDialer?",
    answer: "PhoneBurner is a legacy dialer that still relies on manual follow-up. GrowthDialer automates conversations, books meetings, and supports email and SMS so your team can close faster.",
  },
  {
    question: "Does GrowthDialer still support power dialing?",
    answer: "Yes. GrowthDialer includes fast dialing options while adding autonomous AI and multichannel outreach, unlike PhoneBurner?s call-only workflow.",
  },
  {
    question: "How much can a team save by switching?",
    answer: "A single rep can save over $1,300 annually, and savings compound as team size grows while productivity improves.",
  },
  {
    question: "Can GrowthDialer improve call conversion?",
    answer: "Yes. Our AI handles objection responses and follow-up automatically, which increases conversion and reduces manual workload.",
  },
  {
    question: "How quickly can we get started?",
    answer: "Most PhoneBurner teams go live in under two weeks with our onboarding support and data migration assistance.",
  },
];

export default function VsPhoneBurnerPage() {
  return (
    <div className="pt-24 pb-16">
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">PhoneBurner Alternative</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Modern AI
            <br />
            <span className="text-brand">vs legacy dialing.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            PhoneBurner is a great dialer, but it still relies on reps to own the workflow. GrowthDialer automates the full sequence from call to meeting.
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
            <Link href="/demo"><Button size="lg" variant="outline">Request a demo</Button></Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">PhoneBurner vs GrowthDialer feature comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border bg-card text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-4 text-left">Feature</th>
                <th className="border border-border p-4 text-center text-brand">GrowthDialer</th>
                <th className="border border-border p-4 text-center">PhoneBurner</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr key={index} className="odd:bg-muted/10 hover:bg-muted/20">
                  <td className="border border-border p-4 font-medium">{item.feature}</td>
                  <td className="border border-border p-4 text-center"><Badge className="bg-green-50 text-green-700 inline-flex items-center gap-2"><Check className="h-4 w-4" />{item.growthdialer}</Badge></td>
                  <td className="border border-border p-4 text-center"><Badge className="bg-red-50 text-red-700 inline-flex items-center gap-2"><X className="h-4 w-4" />{item.phoneburner}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 bg-muted/10 rounded-3xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold mb-4">The cost of outdated workflows</h2>
            <p className="text-muted-foreground mb-6">PhoneBurner can keep reps busy, but it doesn't automate outcomes. GrowthDialer reduces manual work and improves conversion with AI-powered follow-up.</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>? Goodbye manual dial lists and follow-up tasks</li>
              <li>? AI keeps conversations moving automatically</li>
              <li>? Faster path from outreach to booked meetings</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Annual cost comparison</h3>
            {savings.map((row, index) => (
              <div key={index} className="mb-4 rounded-3xl border border-border p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{row.reps}</span>
                  <span className="font-semibold">{row.savings} saved</span>
                </div>
                <div className="mt-3 text-base font-semibold">{row.phoneburner} vs {row.growthdialer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why teams leave PhoneBurner</h2>
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
        <h2 className="text-3xl font-bold text-center mb-8">Common migration questions</h2>
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
          <h2 className="text-3xl font-bold mb-4">Upgrade from PhoneBurner today</h2>
          <p className="text-muted-foreground mb-8">Get modern outbound AI and save on cost while improving meeting conversion.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="lg" className="bg-brand text-white hover:bg-brand/90">Start free trial</Button></Link>
            <Link href="/demo"><Button size="lg" variant="outline">Book a demo</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
