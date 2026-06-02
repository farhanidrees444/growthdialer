import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users, Code, Zap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Careers at GrowthDialer — Join Our Mission to Transform B2B Sales",
  description: "Join GrowthDialer and help revolutionize B2B sales with AI. We're hiring talented individuals passionate about sales, AI, and building the future of sales engagement.",
  keywords: "careers growthdialer, jobs ai sales, b2b sales careers, autonomous calling jobs",
  openGraph: {
    title: "Careers at GrowthDialer — Join Our Mission to Transform B2B Sales",
    description: "Join our team and help revolutionize B2B sales with AI-powered dialers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers at GrowthDialer — Join Our Mission to Transform B2B Sales",
    description: "Join our team and help revolutionize B2B sales with AI-powered dialers.",
  },
};

const openPositions = [
  {
    title: "Senior AI Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build the next generation of AI voice models and autonomous agents.",
  },
  {
    title: "Sales Operations Manager",
    department: "Sales",
    location: "Remote",
    type: "Full-time",
    description: "Scale our sales processes and help enterprise customers succeed.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Design intuitive interfaces for sales teams and AI-powered workflows.",
  },
  {
    title: "Customer Success Manager",
    department: "Customer Success",
    location: "Remote",
    type: "Full-time",
    description: "Ensure our customers achieve maximum ROI from our AI dialer platform.",
  },
];

const perks = [
  {
    icon: Users,
    title: "Remote-First Culture",
    description: "Work from anywhere with flexible hours and async communication.",
  },
  {
    icon: Code,
    title: "Latest Technology",
    description: "Work with cutting-edge AI, voice tech, and modern development tools.",
  },
  {
    icon: Zap,
    title: "Fast-Paced Environment",
    description: "Join a startup moving quickly to disrupt the $50B sales tech industry.",
  },
  {
    icon: MessageSquare,
    title: "Direct Impact",
    description: "Your work directly impacts thousands of sales teams and their success.",
  },
];

export default function CareersPage() {
  return (
    <div className="py-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/30 mb-4">
            We&apos;re Hiring
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Join Our Mission
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Help us revolutionize B2B sales by building the most advanced AI dialer platform in the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="mailto:careers@growthdialer.com">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
                View Open Positions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white/10 text-muted-foreground/90 hover:bg-white/5">
                Learn About Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Open Positions</h2>
          <p className="text-lg text-muted-foreground">
            Join our growing team of innovators
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {openPositions.map((position, index) => (
            <Card key={index} className="border-white/[0.08] bg-white/[0.02] hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1 text-foreground">{position.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{position.department}</span>
                      <span>•</span>
                      <span>{position.location}</span>
                      <span>•</span>
                      <span>{position.type}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">{position.description}</p>
                <Button variant="outline" size="sm" className="w-full border-white/10 text-muted-foreground/90 hover:bg-white/5 hover:text-primary">
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Don&apos;t see a perfect fit? We&apos;re always looking for talented people.
          </p>
          <Link
            href="mailto:careers@growthdialer.com"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Send us your resume →
          </Link>
        </div>
      </section>

      {/* Perks Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Why Join GrowthDialer?</h2>
          <p className="text-lg text-muted-foreground">
            Work with amazing people on meaningful projects
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {perks.map((perk, index) => (
            <Card key={index} className="border-white/[0.08] bg-white/[0.02] text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <perk.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{perk.title}</h3>
                <p className="text-sm text-muted-foreground">{perk.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Make an Impact?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join us in building the future of B2B sales
        </p>
        <Link href="mailto:careers@growthdialer.com">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
            Apply for a Position <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
