import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Zap, Users, MessageSquare, Shield, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Changelog — GrowthDialer Product Updates & New Features",
  description: "Stay up to date with the latest GrowthDialer features, improvements, and bug fixes. See what's new in our AI-powered sales dialer platform.",
  keywords: "growthdialer changelog, product updates, new features, ai dialer updates",
  openGraph: {
    title: "Changelog — GrowthDialer Product Updates & New Features",
    description: "Stay up to date with the latest GrowthDialer features and improvements.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog — GrowthDialer Product Updates & New Features",
    description: "Stay up to date with the latest GrowthDialer features and improvements.",
  },
};

const changelog = [
  {
    version: "v2.4.0",
    date: "2026-04-09",
    title: "Autonomous Agent Enhancements",
    description: "Major improvements to our AI autonomous agent capabilities",
    changes: [
      "Enhanced objection handling with 40% better conversion rates",
      "Added support for 5 new languages (Spanish, French, German, Italian, Portuguese)",
      "Improved voicemail drop accuracy with AI-generated personalized messages",
      "New real-time call coaching with instant feedback during conversations",
    ],
    icon: Users,
    type: "major",
  },
  {
    version: "v2.3.1",
    date: "2026-03-28",
    title: "Security & Compliance Updates",
    description: "Enhanced security features and compliance improvements",
    changes: [
      "Added SOC 2 Type II compliance certification",
      "Implemented advanced spam protection with carrier-level filtering",
      "Enhanced data encryption for all stored call recordings",
      "Added GDPR compliance features for EU customers",
    ],
    icon: Shield,
    type: "security",
  },
  {
    version: "v2.3.0",
    date: "2026-03-15",
    title: "Omnichannel Outreach",
    description: "Launch of our comprehensive omnichannel outreach platform",
    changes: [
      "LinkedIn integration for automated connection requests and messaging",
      "Email sequences with AI-generated personalized outreach",
      "SMS integration for follow-up campaigns",
      "Unified dashboard showing all channel performance",
    ],
    icon: MessageSquare,
    type: "feature",
  },
  {
    version: "v2.2.0",
    date: "2026-02-20",
    title: "24/7 Operation Mode",
    description: "Full autonomous operation with round-the-clock calling",
    changes: [
      "Autonomous agent can now operate 24/7 without human intervention",
      "Smart scheduling based on prospect time zones and optimal calling hours",
      "Emergency stop controls for immediate cessation if needed",
      "Advanced reporting on autonomous vs human-assisted performance",
    ],
    icon: Zap,
    type: "feature",
  },
  {
    version: "v2.1.5",
    date: "2026-02-01",
    title: "CRM Integration Improvements",
    description: "Enhanced integrations with major CRM platforms",
    changes: [
      "Improved Salesforce sync with custom field mapping",
      "Added HubSpot deal creation automation",
      "Enhanced Pipedrive contact enrichment",
      "New Zapier integration for custom workflows",
    ],
    icon: Star,
    type: "improvement",
  },
];

export default function ChangelogPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Product Updates
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Changelog
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Stay up to date with the latest features, improvements, and fixes in GrowthDialer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
            >
              Try Latest Features <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Changelog */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {changelog.map((entry, index) => (
              <Card key={index} className="border-white/10 bg-[oklch(0.086_0.024_282)]/95">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${
                        entry.type === 'major' ? 'bg-green-500/15' :
                        entry.type === 'security' ? 'bg-red-500/15' :
                        entry.type === 'feature' ? 'bg-blue-500/15' : 'bg-purple-500/15'
                      } flex items-center justify-center`}>
                        <entry.icon className={`w-5 h-5 ${
                          entry.type === 'major' ? 'text-green-400' :
                          entry.type === 'security' ? 'text-red-400' :
                          entry.type === 'feature' ? 'text-blue-400' : 'text-purple-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{entry.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {entry.version}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{entry.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2">{entry.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {entry.changes.map((change, changeIndex) => (
                      <li key={changeIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/25">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get notified when we release new features and improvements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button className="bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)]">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="container mx-auto px-4 py-16 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Coming Soon
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Roadmap</h2>
            <p className="text-lg text-muted-foreground">
              What we're building next. Vote on features or{" "}
              <Link href="/contact-sales" className="text-brand hover:underline">
                suggest your own
              </Link>
              .
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                quarter: "Q2 2026",
                status: "In Progress",
                statusColor: "bg-brand/15 text-brand",
                items: [
                  "Native Salesforce CTI integration (click-to-call from SFDC)",
                  "Power Dialer mode for single-line sequential campaigns",
                  "SMS follow-up sequences with AI personalization",
                ],
              },
              {
                quarter: "Q3 2026",
                status: "Planned",
                statusColor: "bg-blue-500/15 text-blue-400",
                items: [
                  "Mobile app (iOS + Android) for on-the-go coaching",
                  "WhatsApp Business integration for global outreach",
                  "Manager dashboard with rep leaderboards and call scorecards",
                  "Advanced A/B testing for scripts and voicemail drops",
                ],
              },
              {
                quarter: "Q4 2026",
                status: "Exploring",
                statusColor: "bg-purple-500/15 text-purple-400",
                items: [
                  "AI-generated prospect research cards (LinkedIn + news + funding)",
                  "Video voicemail drop support",
                  "Conversation intelligence reporting (topic frequency, talk ratio)",
                ],
              },
            ].map((section) => (
              <Card key={section.quarter} className="border-white/10 bg-[oklch(0.086_0.024_282)]/95">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{section.quarter}</CardTitle>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${section.statusColor}`}>
                      {section.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Have a feature request?{" "}
            <Link href="/contact-sales" className="text-brand hover:underline">
              Let us know
            </Link>{" "}
            — high-vote requests move up the queue.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Experience the Latest Features</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Try GrowthDialer today and see the difference our latest updates make.
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