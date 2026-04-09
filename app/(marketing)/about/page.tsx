import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users, Target, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About GrowthDialer — AI-Powered Sales Dialer for B2B Teams",
  description: "Learn about GrowthDialer's mission to revolutionize B2B sales with autonomous AI dialers. Founded in 2024, we're helping sales teams connect with more prospects and close more deals.",
  keywords: "about growthdialer, ai sales dialer company, b2b sales automation, autonomous calling",
  openGraph: {
    title: "About GrowthDialer — AI-Powered Sales Dialer for B2B Teams",
    description: "Learn about our mission to revolutionize B2B sales with autonomous AI dialers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About GrowthDialer — AI-Powered Sales Dialer for B2B Teams",
    description: "Learn about our mission to revolutionize B2B sales with autonomous AI dialers.",
  },
};

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're building the future of B2B sales by making every sales rep 10x more effective through AI.",
  },
  {
    icon: Users,
    title: "Sales-First",
    description: "Founded by sales leaders who understand the pain points of modern B2B selling.",
  },
  {
    icon: Award,
    title: "Innovation",
    description: "Pushing the boundaries of what's possible with AI voice technology and autonomous agents.",
  },
  {
    icon: Heart,
    title: "Customer Obsessed",
    description: "Every feature we build starts with understanding how sales teams actually work.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            About GrowthDialer
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            We're on a mission to revolutionize B2B sales by making every sales rep 10x more effective through autonomous AI dialers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/25">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Founded in 2024 by a team of sales leaders frustrated with the limitations of traditional dialers,
            GrowthDialer was born from the realization that AI could transform how B2B sales teams connect with prospects.
            What started as a simple idea has evolved into the most advanced autonomous AI dialer on the market.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Today, we're proud to serve thousands of sales teams worldwide, helping them book more meetings,
            close more deals, and grow their businesses faster than ever before.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Values</h2>
          <p className="text-lg text-muted-foreground">
            The principles that guide everything we do
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {values.map((value, index) => (
            <Card key={index} className="border-white/10 bg-[oklch(0.086_0.024_282)]/95">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Join the Revolution</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Ready to transform your sales process with AI?
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
        >
          Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}