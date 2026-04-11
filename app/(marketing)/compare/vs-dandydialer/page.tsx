import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, ArrowRight, DollarSign, Users, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "GrowthDialer vs DandyDialer — Enterprise Features at Startup Pricing",
  description: "Compare GrowthDialer vs DandyDialer and see why sales teams switch from enterprise dialers to GrowthDialer's autonomous AI.",
  keywords: "dandydialer alternative, growthdialer vs dandydialer, enterprise dialer, ai sales automation, startup pricing",
  openGraph: {
    title: "GrowthDialer vs DandyDialer — Enterprise Features at Startup Pricing",
    description: "Why teams adopt GrowthDialer instead of DandyDialer for better AI, broader outreach, and lower cost.",
    type: "website",
  },
};

const heroStats = [
  { value: "$99+/mo", label: "DandyDialer enterprise pricing", icon: DollarSign },
  { value: "$39/mo", label: "GrowthDialer startup pricing", icon: Users },
  { value: "60% savings", label: "vs enterprise alternatives", icon: TrendingUp },
];

const features = [
  { feature: "Pricing model", growthdialer: "Startup-friendly $39/mo", dandydialer: "Enterprise $99+/mo" },
  { feature: "Autonomous AI agent", growthdialer: "Yes", dandydialer: "No" },
  { feature: "AI conversation handling", growthdialer: "Yes", dandydialer: "No" },
  { feature: "Objection resolution", growthdialer: "Yes", dandydialer: "No" },
  { feature: "16 languages", growthdialer: "Yes", dandydialer: "No" },
  { feature: "24/7 operation", growthdialer: "Yes", dandydialer: "No" },
  { feature: "Omnichannel outreach", growthdialer: "Yes", dandydialer: "No" },
  { feature: "Lead qualification", growthdialer: "Yes", dandydialer: "No" },
  { feature: "Meeting booking", growthdialer: "Yes", dandydialer: "No" },
  { feature: "Free trial", growthdialer: "Yes", dandydialer: "No" },
];

const costComparison = [
  { teamSize: "1 rep", dandydialer: "$1,188+/yr", growthdialer: "$468/yr", savings: "$720+" },
  { teamSize: "5 reps", dandydialer: "$5,940+/yr", growthdialer: "$2,340/yr", savings: "$3,600+" },
  { teamSize: "10 reps", dandydialer: "$11,880+/yr", growthdialer: "$4,680/yr", savings: "$7,200+" },
  { teamSize: "25 reps", dandydialer: "$29,700+/yr", growthdialer: "$11,700/yr", savings: "$17,999+" },
];

const testimonials = [
  { name: "Sara Bowen", role: "Chief Sales Officer", company: "ScaleUp", content: "DandyDialer was powerful but too expensive for our startup pace. GrowthDialer gave us the same enterprise-grade AI at a startup-friendly price.", rating: 5 },
  { name: "Noah Green", role: "Revenue Operations Lead", company: "PulseForge", content: "GrowthDialer delivers autonomous agents and smarter outcomes. DandyDialer felt like old enterprise software with a hefty bill.", rating: 5 },
  { name: "Mei Tan", role: "Head of SDR", company: "LaunchPoint", content: "We kept the enterprise capabilities without the enterprise cost. GrowthDialer handles language support and follow-up much better than DandyDialer.", rating: 5 },
];

const faqs = [
  { question: "How does GrowthDialer compare to DandyDialer?", answer: "GrowthDialer gives you enterprise features like autonomous AI, multi-language support, and omnichannel outreach at startup-priced seats." },
  { question: "Is GrowthDialer more expensive than DandyDialer?", answer: "No. GrowthDialer is built for modern growth teams and delivers better AI capabilities at a lower per-user cost." },
  { question: "Can I migrate from DandyDialer easily?", answer: "Yes. We offer migration support to bring over contacts, call logs, and CRM settings so you can switch with minimal downtime." },
  { question: "Does GrowthDialer support the same CRM integrations?", answer: "Yes. GrowthDialer supports Salesforce, HubSpot, Pipedrive, and other major CRM platforms." },
  { question: "How fast can we get started?", answer: "Most teams go live in under two weeks with our onboarding and setup support." },
];

export default function VsDandyDialerPage() {
  return (
    <div className="pt-24 pb-16">
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">DandyDialer Alternative</Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Enterprise features at
          <br />
          <span className="text-brand">startup pricing.</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">DandyDialer charges enterprise prices for basic features. GrowthDialer delivers autonomous AI, 16 languages, and 24/7 outreach at startup-friendly pricing.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {heroStats.map((stat, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="rounded-3xl border border-border bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"><stat.icon className="h-6 w-6" /></div>
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup"><Button size="lg" className="bg-brand text-white hover:bg-brand/90">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          <Link href="/demo"><Button size="lg" variant="outline">See it in action</Button></Link>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">DandyDialer vs GrowthDialer feature comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border bg-card text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-4 text-left">Feature</th>
                <th className="border border-border p-4 text-center text-brand">GrowthDialer</th>
                <th className="border border-border p-4 text-center">DandyDialer</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr key={index} className="odd:bg-muted/10 hover:bg-muted/20">
                  <td className="border border-border p-4 font-medium">{item.feature}</td>
                  <td className="border border-border p-4 text-center"><Badge className="bg-green-50 text-green-700 inline-flex items-center gap-2"><Check className="h-4 w-4" />{item.growthdialer}</Badge></td>
                  <td className="border border-border p-4 text-center"><Badge className="bg-red-50 text-red-700 inline-flex items-center gap-2"><X className="h-4 w-4" />{item.dandydialer}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 bg-muted/10 rounded-3xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold mb-4">Save without sacrificing enterprise capability</h2>
            <p className="text-muted-foreground mb-6">GrowthDialer brings enterprise AI and outreach to growing teams. DandyDialer charges more for less automation and fewer channels.</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Autonomous AI handles conversations</li>
              <li>• Multi-language outreach included</li>
              <li>• Lower cost per rep with better results</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Annual savings comparison</h3>
            {costComparison.map((row, index) => (
              <div key={index} className="mb-4 rounded-3xl border border-border p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{row.teamSize}</span><span className="font-semibold">{row.savings} saved</span></div>
                <div className="mt-3 text-base font-semibold">{row.dandydialer} vs {row.growthdialer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Startup reviews after switching</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">{[...Array(item.rating)].map((_, i) => (<Star key={i} className="h-4 w-4 text-yellow-400" />))}</div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.role} • {item.company}</div>
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
        <h2 className="text-3xl font-bold text-center mb-8">Common DandyDialer questions</h2>
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
          <h2 className="text-3xl font-bold mb-4">Get enterprise AI without enterprise pricing</h2>
          <p className="text-muted-foreground mb-8">GrowthDialer matches enterprise features and delivers them at a price built for startups.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="lg" className="bg-brand text-white hover:bg-brand/90">Start free trial</Button></Link>
            <Link href="/demo"><Button size="lg" variant="outline">Schedule your demo</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
