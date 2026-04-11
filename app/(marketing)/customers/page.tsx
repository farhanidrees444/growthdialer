import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Quote, TrendingUp, Users, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Success Stories — GrowthDialer",
  description: "Read real testimonials from B2B sales teams who've increased their connect rates by 41% and booked 3x more meetings with GrowthDialer.",
  keywords: "customer testimonials, sales success stories, B2B sales results",
  openGraph: {
    title: "Customer Success Stories — GrowthDialer",
    description: "Real results from real sales teams using GrowthDialer's AI-powered dialer.",
    type: "website",
  },
};

const testimonials = [
  {
    name: "Sarah Chen",
    role: "VP of Sales",
    company: "TechNova Inc.",
    logo: "TN",
    industry: "SaaS",
    companySize: "200 employees",
    metrics: {
      connectRate: "+45%",
      meetings: "+180%",
      pipeline: "+$2.1M",
    },
    quote: "GrowthDialer transformed our sales process overnight. Our connect rate jumped from 28% to 41%, and we're booking 3x more qualified meetings. The AI coaching feature alone is worth the investment.",
    results: [
      "Increased connect rate by 45%",
      "Booked 180% more meetings",
      "Added $2.1M to pipeline in 6 months",
      "Reduced rep burnout by 60%",
    ],
    avatar: "/api/placeholder/60/60",
  },
  {
    name: "Marcus Rodriguez",
    role: "Head of Revenue",
    company: "CloudSync Technologies",
    logo: "CS",
    industry: "Cloud Infrastructure",
    companySize: "150 employees",
    metrics: {
      connectRate: "+52%",
      meetings: "+220%",
      pipeline: "+$3.8M",
    },
    quote: "We switched from a legacy dialer that was holding us back. GrowthDialer's parallel dialing and AI voice technology gave us a competitive edge. Our average deal size increased by 35%.",
    results: [
      "52% higher connect rate",
      "220% more meetings booked",
      "35% increase in average deal size",
      "Payback in 30 days",
    ],
    avatar: "/api/placeholder/60/60",
  },
  {
    name: "Priya Patel",
    role: "Director of Sales",
    company: "DataFlow Analytics",
    logo: "DF",
    industry: "Data Analytics",
    companySize: "80 employees",
    metrics: {
      connectRate: "+38%",
      meetings: "+150%",
      pipeline: "+$1.4M",
    },
    quote: "The team collaboration features are incredible. Our managers can monitor calls in real-time and provide coaching. We've reduced our ramp time from 6 months to 8 weeks.",
    results: [
      "38% improvement in connect rates",
      "150% more qualified meetings",
      "Reduced ramp time by 75%",
      "Improved team performance by 40%",
    ],
    avatar: "/api/placeholder/60/60",
  },
  {
    name: "David Kim",
    role: "Sales Operations Manager",
    company: "SecureNet Solutions",
    logo: "SN",
    industry: "Cybersecurity",
    companySize: "300 employees",
    metrics: {
      connectRate: "+41%",
      meetings: "+190%",
      pipeline: "+$4.2M",
    },
    quote: "Compliance was a big concern for us. GrowthDialer's SOC 2 compliance and built-in TCPA features gave us peace of mind. The results speak for themselves.",
    results: [
      "41% higher connect rates",
      "190% more meetings scheduled",
      "100% TCPA compliance",
      "Zero data security incidents",
    ],
    avatar: "/api/placeholder/60/60",
  },
  {
    name: "Emma Thompson",
    role: "Chief Revenue Officer",
    company: "InnovateLabs",
    logo: "IL",
    industry: "AI/ML Services",
    companySize: "120 employees",
    metrics: {
      connectRate: "+49%",
      meetings: "+210%",
      pipeline: "+$2.8M",
    },
    quote: "GrowthDialer doesn't just help you make more calls — it helps you have better conversations. The AI coaching provides real-time suggestions that actually work.",
    results: [
      "49% increase in connect rates",
      "210% more meetings booked",
      "25% improvement in conversation quality",
      "Higher customer satisfaction scores",
    ],
    avatar: "/api/placeholder/60/60",
  },
  {
    name: "Carlos Mendoza",
    role: "VP of Sales",
    company: "GlobalTech Systems",
    logo: "GT",
    industry: "Enterprise Software",
    companySize: "500+ employees",
    metrics: {
      connectRate: "+43%",
      meetings: "+170%",
      pipeline: "+$6.1M",
    },
    quote: "At our scale, small improvements compound quickly. GrowthDialer's 43% connect rate improvement translated to $6M in additional pipeline. It's the best investment we've made.",
    results: [
      "43% higher connect rates",
      "170% more qualified meetings",
      "$6.1M additional pipeline",
      "ROI of 340% in first year",
    ],
    avatar: "/api/placeholder/60/60",
  },
];

const stats = [
  { value: "2,400+", label: "Happy customers", icon: Users },
  { value: "41%", label: "Average connect rate increase", icon: TrendingUp },
  { value: "3x", label: "More meetings booked", icon: Target },
  { value: "$144k", label: "Average pipeline per user", icon: TrendingUp },
];

export default function CustomersPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Customer Stories
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Real results from
            <span className="text-brand"> real sales teams</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            See how B2B sales teams are crushing their goals with GrowthDialer.
            These aren't testimonials — these are transformation stories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
                Join our customers <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-brand" />
              </div>
              <div className="text-3xl font-bold text-brand mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <div className="space-y-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid lg:grid-cols-3 gap-8 items-center ${
                index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
              }`}
            >
              <div className={`lg:col-span-2 ${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
                <Card className="bg-gradient-to-r from-brand/5 to-purple-500/5 border-brand/20">
                  <CardContent className="p-8">
                    <Quote className="w-8 h-8 text-brand mb-4" />
                    <blockquote className="text-lg mb-6 italic">
                      "{testimonial.quote}"
                    </blockquote>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">{testimonial.logo}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role} at {testimonial.company}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {testimonial.industry} • {testimonial.companySize}
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand">{testimonial.metrics.connectRate}</div>
                        <div className="text-xs text-muted-foreground">Connect Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand">{testimonial.metrics.meetings}</div>
                        <div className="text-xs text-muted-foreground">More Meetings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand">{testimonial.metrics.pipeline}</div>
                        <div className="text-xs text-muted-foreground">Pipeline Added</div>
                      </div>
                    </div>

                    {/* Results */}
                    <div>
                      <h4 className="font-semibold mb-3">Key Results:</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {testimonial.results.map((result, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-brand rounded-full flex-shrink-0"></div>
                            <span>{result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className={`hidden lg:block ${index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                <div className="bg-muted/20 border border-muted rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-brand">{testimonial.logo}</span>
                  </div>
                  <h3 className="font-bold mb-2">{testimonial.company}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.industry}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to join our success stories?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your free trial today and see why 2,400+ sales teams choose GrowthDialer
            to transform their sales performance.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
              Start your success story <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}