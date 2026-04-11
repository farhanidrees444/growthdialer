import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Zap,
  Users,
  BarChart2,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  MessageSquare,
  Database,
  Settings,
  Headphones,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GrowthDialer Features — AI Sales Dialer",
  description: "Discover all GrowthDialer features: AI-powered parallel dialing, real-time coaching, CRM integrations, and advanced analytics for B2B sales teams.",
  keywords: "sales dialer features, AI dialer, parallel dialing, sales automation, CRM integration",
  openGraph: {
    title: "GrowthDialer Features — AI Sales Dialer",
    description: "Complete feature overview of the AI-powered sales dialer that helps teams book 3x more meetings.",
    type: "website",
  },
};

const features = [
  {
    icon: Phone,
    title: "Parallel Dialing (10+ Lines)",
    description: "Dial up to 10 prospects simultaneously. Never wait on hold again — our AI connects you instantly to live conversations.",
    benefits: ["Zero idle time", "10x faster outreach", "Automatic voicemail drop"],
    image: "/api/placeholder/600/400",
    useCase: "Perfect for high-volume SDR teams that need to reach hundreds of prospects daily.",
  },
  {
    icon: Zap,
    title: "AI Real-Time Call Coaching",
    description: "Our AI listens to every call and provides live battlecards, objection handling, and next-step prompts mid-conversation.",
    benefits: ["Instant objection handling", "Deal-closing prompts", "Competitor intelligence"],
    image: "/api/placeholder/600/400",
    useCase: "AE teams close 40% more deals with AI-powered conversation guidance.",
  },
  {
    icon: Users,
    title: "Team Collaboration Hub",
    description: "Live listening, call reviews, and team-wide analytics. Know exactly what's working and coach your team to success.",
    benefits: ["Live call monitoring", "Team performance insights", "Call recording & review"],
    image: "/api/placeholder/600/400",
    useCase: "Sales managers can listen to live calls and provide real-time coaching.",
  },
  {
    icon: BarChart2,
    title: "Advanced Analytics Dashboard",
    description: "Track connect rates, conversation quality, deal velocity, and ROI across your entire sales team.",
    benefits: ["Real-time metrics", "Custom reporting", "Performance insights"],
    image: "/api/placeholder/600/400",
    useCase: "Identify top performers and replicate their success across your team.",
  },
  {
    icon: Shield,
    title: "Compliance & Security",
    description: "SOC 2 Type II certified with built-in TCPA compliance, DNC scrubbing, and call recording disclosure.",
    benefits: ["TCPA compliant", "DNC list scrubbing", "Audit logs"],
    image: "/api/placeholder/600/400",
    useCase: "Enterprise sales teams can confidently scale outreach without compliance worries.",
  },
  {
    icon: Globe,
    title: "16 Languages & Global Reach",
    description: "AI voice calling in 16 languages with 300+ local area codes for hyper-local presence anywhere in the world.",
    benefits: ["16 languages supported", "300+ area codes", "Global expansion ready"],
    image: "/api/placeholder/600/400",
    useCase: "Expand into new markets without hiring international sales teams.",
  },
];

const stats = [
  { value: "2,184", label: "Calls made this month", icon: Phone },
  { value: "71", label: "Meetings booked", icon: Target },
  { value: "41.2%", label: "Connect rate", icon: TrendingUp },
  { value: "$144k", label: "Pipeline generated", icon: BarChart2 },
];

export default function FeaturesPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Everything you need to dominate B2B sales
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            GrowthDialer combines AI-powered dialing, real-time coaching, and team collaboration
            to help sales teams book 3x more meetings and close more deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
              }`}
            >
              <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                </div>
                <p className="text-lg text-muted-foreground mb-6">{feature.description}</p>

                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Key Benefits:</h4>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Use Case:</h4>
                  <p className="text-sm text-muted-foreground">{feature.useCase}</p>
                </div>
              </div>

              <div className={index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                <div className="bg-muted/20 border border-muted rounded-lg p-8 text-center">
                  <feature.icon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Feature screenshot/mockup</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your sales process?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join 2,400+ sales teams who've increased their connect rates by 41% and booked 3x more meetings.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}