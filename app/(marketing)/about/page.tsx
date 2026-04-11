import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Target, Heart, Award, TrendingUp, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About GrowthDialer — AI-Powered Sales Dialer",
  description: "Founded in 2024, GrowthDialer is on a mission to democratize AI-powered sales technology. Learn about our story, team, and values.",
  keywords: "about GrowthDialer, sales dialer company, AI sales technology, B2B sales automation",
  openGraph: {
    title: "About GrowthDialer — AI-Powered Sales Dialer",
    description: "Founded in 2024, we're building the future of B2B sales with AI-powered dialers and real-time coaching.",
    type: "website",
  },
};

const values = [
  {
    icon: Target,
    title: "Customer Obsession",
    description: "Every feature we build starts with understanding how sales teams actually work. We eat our own dog food.",
  },
  {
    icon: TrendingUp,
    title: "Data-Driven Innovation",
    description: "We measure everything. Our product decisions are guided by real user data and measurable business impact.",
  },
  {
    icon: Heart,
    title: "Empowering Sales Teams",
    description: "Sales is hard enough. We're here to remove friction, not add complexity. Every rep should feel like a superhero.",
  },
  {
    icon: Globe,
    title: "Global by Design",
    description: "Sales happens everywhere. We build for global teams with 16 languages, 300+ area codes, and worldwide compliance.",
  },
];

const milestones = [
  { year: "2024", event: "Founded GrowthDialer with a mission to democratize AI sales technology" },
  { year: "2024 Q2", event: "Launched parallel dialing with AI real-time coaching" },
  { year: "2024 Q3", event: "Reached 1,000+ users and $1M+ ARR" },
  { year: "2024 Q4", event: "Added 16 languages and global expansion capabilities" },
  { year: "2025 Q1", event: "Achieved SOC 2 Type II compliance and enterprise readiness" },
];

const team = [
  {
    name: "Sarah Chen",
    role: "CEO & Co-Founder",
    bio: "Former VP Sales at Salesforce. Scaled teams from 10 to 500+ reps. Built the sales tech that powers Fortune 500 companies.",
    image: "/api/placeholder/150/150",
  },
  {
    name: "Marcus Rodriguez",
    role: "CTO & Co-Founder",
    bio: "Ex-Google AI researcher. Built ML systems at scale. PhD in Computer Science from Stanford.",
    image: "/api/placeholder/150/150",
  },
  {
    name: "Priya Patel",
    role: "Head of Product",
    bio: "Product leader at HubSpot and Outreach. 10+ years building products sales teams love. MBA from Wharton.",
    image: "/api/placeholder/150/150",
  },
  {
    name: "David Kim",
    role: "Head of Engineering",
    bio: "Engineering leader at Stripe and Plaid. Built high-scale systems serving millions of users daily.",
    image: "/api/placeholder/150/150",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            About Us
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Democratizing AI-powered sales
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Founded in 2024, GrowthDialer is on a mission to make enterprise-grade
            sales technology accessible to every B2B sales team, regardless of size.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
                Join our mission <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/careers">
              <Button size="lg" variant="outline">
                View careers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sales is the lifeblood of every B2B company, yet most sales teams are stuck
            with outdated tools that slow them down. We're building the future of sales
            technology — AI-powered dialers that help reps connect with more prospects,
            have better conversations, and close more deals.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand mb-2">2,400+</div>
              <div className="text-muted-foreground">Sales teams trust us</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand mb-2">$144k</div>
              <div className="text-muted-foreground">Avg. pipeline per user</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand mb-2">41%</div>
              <div className="text-muted-foreground">Higher connect rates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 py-16 bg-muted/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Values</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            These principles guide everything we do, from product development to customer support.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-brand" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-8 items-center"
              >
                <div className="w-24 text-right">
                  <div className="text-2xl font-bold text-brand">{milestone.year}</div>
                </div>
                <div className="w-px h-16 bg-brand/30"></div>
                <div className="flex-1">
                  <p className="text-muted-foreground">{milestone.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-4 py-16 bg-muted/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Meet the Team</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're a team of sales veterans, AI researchers, and product builders
            united by a passion for transforming how B2B sales works.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center">
                <CardHeader>
                  <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Join the revolution</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Help us build the future of sales. Whether you're a sales rep, sales leader,
            or just passionate about great products, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/careers">
              <Button size="lg" variant="outline">
                View open roles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}