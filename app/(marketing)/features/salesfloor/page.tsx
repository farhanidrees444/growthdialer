import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Eye, MessageSquare, BarChart2, Zap, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Salesfloor — Team Collaboration Features | GrowthDialer",
  description: "Live call monitoring, team coaching, and collaborative selling features. Watch live calls, provide real-time coaching, and improve team performance together.",
  keywords: "sales team collaboration, live call monitoring, sales coaching, team performance",
  openGraph: {
    title: "Salesfloor — Team Collaboration Features | GrowthDialer",
    description: "Transform your sales team with live call monitoring and real-time coaching capabilities.",
    type: "website",
  },
};

const features = [
  {
    icon: Eye,
    title: "Live Call Monitoring",
    description: "Watch your team's calls in real-time. See exactly how they're handling objections, using your battlecards, and following your process.",
    benefits: ["Real-time visibility", "Quality assurance", "Instant feedback"],
    demo: "Monitor 10+ concurrent calls from your dashboard",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Coaching",
    description: "Send live prompts and suggestions during active calls. Guide your reps through tough conversations without interrupting the flow.",
    benefits: ["Live guidance", "Contextual help", "Improved close rates"],
    demo: "Send battlecard suggestions mid-call via chat or overlay",
  },
  {
    icon: Users,
    title: "Team Collaboration Hub",
    description: "Create shared playbooks, battlecards, and objection handlers. Your entire team stays aligned on messaging and tactics.",
    benefits: ["Shared knowledge", "Consistent messaging", "Faster onboarding"],
    demo: "Team wiki with call recordings, scripts, and best practices",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    description: "Track individual and team performance metrics. Identify top performers and replicate their success across your organization.",
    benefits: ["Performance insights", "Data-driven coaching", "Predictive analytics"],
    demo: "Advanced dashboards with conversion tracking and trend analysis",
  },
  {
    icon: Zap,
    title: "Instant Feedback Loops",
    description: "Provide immediate feedback after calls. Tag common issues, suggest improvements, and track progress over time.",
    benefits: ["Rapid improvement", "Continuous learning", "Measurable growth"],
    demo: "Post-call feedback forms with actionable recommendations",
  },
];

const useCases = [
  {
    title: "Scale Your Top Performers",
    description: "Identify what makes your best reps successful, then replicate those behaviors across your entire team.",
    metrics: ["40% improvement in team performance", "Reduced ramp time by 60%", "Higher retention rates"],
  },
  {
    title: "Coach Through Complex Deals",
    description: "Provide expert guidance during high-stakes conversations without being on the call yourself.",
    metrics: ["25% increase in deal size", "Faster deal cycles", "Better win rates"],
  },
  {
    title: "Maintain Quality at Scale",
    description: "Ensure every customer interaction meets your standards, no matter how fast you're growing.",
    metrics: ["99% call quality compliance", "Reduced customer churn", "Higher satisfaction scores"],
  },
];

export default function SalesfloorPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Salesfloor
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Coach your team to
            <span className="text-brand"> legendary performance</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Live call monitoring, real-time coaching, and team collaboration tools
            that transform good sales teams into extraordinary ones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
                Start team coaching <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Key Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything you need to coach at scale</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built for sales leaders who want to maintain quality and consistency
            as their teams grow from 5 to 500+ reps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-brand" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{feature.description}</p>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Key Benefits:</h4>
                    <div className="flex flex-wrap gap-1">
                      {feature.benefits.map((benefit, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">{feature.demo}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-16 bg-muted/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Real results from real teams</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how sales leaders are using Salesfloor to transform their team's performance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{useCase.description}</p>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Results:</h4>
                    <ul className="space-y-1">
                      {useCase.metrics.map((metric, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to level up your sales team?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join 500+ sales leaders who've transformed their teams with Salesfloor's
            coaching and collaboration tools.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
              Start coaching today <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}