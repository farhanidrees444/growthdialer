
import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, ArrowRight, DollarSign, Users, TrendingDown } from "lucide-react";

export const metadata: Metadata = {
  title: "GrowthDialer vs Nooks ? 10x Cheaper AI Outreach",
  description: "Compare GrowthDialer vs Nooks and learn why teams choose GrowthDialer for modern AI outreach at 10x lower cost.",
  keywords: "nooks alternative, growthdialer vs nooks, sales automation pricing, ai outreach platform, nooks comparison",
  openGraph: {
    title: "GrowthDialer vs Nooks ? 10x Cheaper AI Outreach",
    description: "See how GrowthDialer beats Nooks with autonomous AI and a lower price point.",
    type: "website",
  },
};

const heroStats = [
  { value: "$417/mo", label: "Nooks average plan cost", icon: DollarSign },
  { value: "$39/mo", label: "GrowthDialer all-in cost", icon: Users },
  { value: "10x cheaper", label: "than Nooks annual spend", icon: TrendingDown },
];

const features = [
  { feature: "Autonomous outreach", growthdialer: "? AI runs the process", nooks: "? Human campaigns", growthdialerHas: true, nooksHas: false },
  { feature: "Omnichannel sequencing", growthdialer: "? Call + email + SMS", nooks: "? Email + SMS only", growthdialerHas: true, nooksHas: true },
  { feature: "Meeting booking", growthdialer: "? Auto schedules", nooks: "? Manual handoff", growthdialerHas: true, nooksHas: false },
  { feature: "Global language support", growthdialer: "? 16 languages", nooks: "? English-first", growthdialerHas: true, nooksHas: false },
  { feature: "AI objection handling", growthdialer: "? Dynamic responses", nooks: "? Static templates", growthdialerHas: true, nooksHas: false },
  { feature: "Conversation intelligence", growthdialer: "? Smart insights", nooks: "? Basic metrics", growthdialerHas: true, nooksHas: true },
  { feature: "Free trial", growthdialer: "? 14 days no CC", nooks: "? Paid trial", growthdialerHas: true, nooksHas: false },
];

const savings = [
  { teamSize: "1 rep", nooks: "$5,004/yr", growthdialer: "$468/yr", savings: "$4,536" },
  { teamSize: "5 reps", nooks: "$25,020/yr", growthdialer: "$2,340/yr", savings: "$22,680" },
  { teamSize: "10 reps", nooks: "$50,040/yr", growthdialer: "$4,680/yr", savings: "$45,360" },
];

const testimonials = [
  {
    name: "James Miller",
    role: "Sales Enablement Lead",
    company: "RevenueGrid",
    content: "Nooks felt powerful but expensive. GrowthDialer gave us the same outreach breadth plus autonomous AI that reduces manual work and increases pipeline.",
    rating: 5,
  },
  {
    name: "Lina Park",
    role: "Head of Growth",
    company: "LaunchPoint",
    content: "The cost savings from GrowthDialer were dramatic. We went from a complex Nooks setup to a single platform that handles follow-up automatically.",
    rating: 5,
  },
  {
    name: "Noah Kim",
    role: "Director of Outbound",
    company: "ScaleTrail",
    content: "GrowthDialer replaced Nooks without losing any capability. In fact, we got better response rates because the AI keeps conversations alive.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "Why do teams move from Nooks to GrowthDialer?",
    answer: "Nooks can be expensive and multi-tool. GrowthDialer consolidates calls, email, and SMS with autonomous AI and costs about 10x less than Nooks.",
  },
  {
    question: "Does GrowthDialer support omnichannel outreach like Nooks?",
    answer: "Yes. GrowthDialer supports phone, email, and SMS natively, with AI-driven follow-up and qualification built in.",
  },
  {
    question: "How much can we save by switching from Nooks?",
    answer: "Teams often save over $20k per year for a five-rep team. GrowthDialer provides more automation and better conversation outcomes for far less.",
  },
  {
    question: "Can GrowthDialer replace my existing sequences?",
    answer: "Yes. GrowthDialer can ingest your current campaign content and improve it with AI-driven conversation management and follow-up.",
  },
  {
    question: "How fast is onboarding from Nooks?",
    answer: "Most Nooks customers are live in under two weeks with our migration support, including campaign import and CRM setup.",
  },
];

export default function VsNooksPage() {
  return (
    <div className="pt-24 pb-16">
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">Nooks Alternative</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Modern AI outreach,
            <br />
            <span className="text-brand">10x cheaper than Nooks.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Nooks may be strong for workflows, but it costs too much and still leaves sales teams managing campaigns manually. GrowthDialer automates the whole process.
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
        <h2 className="text-3xl font-bold text-center mb-12">Nooks vs GrowthDialer feature comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border bg-card text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-4 text-left">Feature</th>
                <th className="border border-border p-4 text-center text-brand">GrowthDialer</th>
                <th className="border border-border p-4 text-center">Nooks</th>
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
                    <Badge className="bg-red-50 text-red-700 inline-flex items-center gap-2"><X className="h-4 w-4" />{item.nooks}</Badge>
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
            <h2 className="text-3xl font-bold mb-4">Save more while doing more</h2>
            <p className="text-muted-foreground mb-6">GrowthDialer turns expensive Nooks budgets into operational leverage. You get more automation, less manual campaign work, and better outcomes.</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>? One platform for sales outreach and follow-up</li>
              <li>? AI keeps conversations moving without extra tools</li>
              <li>? Lower cost per rep and faster ramp time</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Annual spend comparison</h3>
            {savings.map((row, index) => (
              <div key={index} className="mb-4 rounded-3xl border border-border p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{row.teamSize}</span>
                  <span className="font-semibold">{row.savings} saved</span>
                </div>
                <div className="mt-3 text-base font-semibold">{row.nooks} vs {row.growthdialer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Customer feedback from Nooks switchers</h2>
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
        <h2 className="text-3xl font-bold text-center mb-8">Common Nooks questions</h2>
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
          <h2 className="text-3xl font-bold mb-4">Switch from Nooks and keep more of your budget</h2>
          <p className="text-muted-foreground mb-8">GrowthDialer gives you AI-powered outreach and a simpler, more affordable experience than Nooks.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="lg" className="bg-brand text-white hover:bg-brand/90">Start free trial</Button></Link>
            <Link href="/demo"><Button size="lg" variant="outline">Request a demo</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
