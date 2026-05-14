import { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Database, MessageSquare, Mail, Calendar, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "GrowthDialer Integrations — Connect Your Sales Stack",
  description: "Seamlessly integrate GrowthDialer with 15+ CRM, communication, and productivity tools. Sync contacts, log calls, and automate your sales workflow.",
  keywords: "CRM integrations, sales tools, Salesforce, HubSpot, Slack, Zapier",
  openGraph: {
    title: "GrowthDialer Integrations — Connect Your Sales Stack",
    description: "15+ native integrations to connect GrowthDialer with your existing sales tools and workflow.",
    type: "website",
  },
};

const integrations = [
  {
    name: "Salesforce",
    category: "CRM",
    logo: "SF",
    description: "Sync contacts, log calls, and update opportunities automatically.",
    features: ["Contact sync", "Call logging", "Opportunity updates", "Custom fields"],
    howItWorks: "Connect your Salesforce account and GrowthDialer will automatically sync all contacts and log every call with full conversation details.",
    color: "bg-blue-500",
  },
  {
    name: "HubSpot",
    category: "CRM",
    logo: "HS",
    description: "Bidirectional sync with deals, contacts, and company data.",
    features: ["Deal sync", "Contact enrichment", "Company data", "Timeline logging"],
    howItWorks: "Link your HubSpot portal and watch as GrowthDialer creates contacts, logs activities, and updates deal stages in real-time.",
    color: "bg-orange-500",
  },
  {
    name: "Pipedrive",
    category: "CRM",
    logo: "PD",
    description: "Seamless integration with Pipedrive's deal and contact management.",
    features: ["Deal management", "Contact sync", "Activity logging", "Pipeline updates"],
    howItWorks: "Connect Pipedrive and GrowthDialer will automatically create leads, log calls, and move deals through your pipeline.",
    color: "bg-green-500",
  },
  {
    name: "Outreach",
    category: "Sales Engagement",
    logo: "OR",
    description: "Combine GrowthDialer's AI dialing with Outreach sequences.",
    features: ["Sequence sync", "Call logging", "Prospect updates", "Task creation"],
    howItWorks: "Link Outreach and GrowthDialer will log all calls and update prospect engagement data automatically.",
    color: "bg-purple-500",
  },
  {
    name: "Salesloft",
    category: "Sales Engagement",
    logo: "SL",
    description: "Integrate with Salesloft cadences and call logging.",
    features: ["Cadence sync", "Call logging", "Prospect updates", "Step progression"],
    howItWorks: "Connect Salesloft and GrowthDialer will automatically advance prospects through cadences based on call outcomes.",
    color: "bg-teal-500",
  },
  {
    name: "Zapier",
    category: "Automation",
    logo: "ZP",
    description: "Connect GrowthDialer to 5,000+ apps via Zapier.",
    features: ["Workflow automation", "Data sync", "Custom triggers", "Multi-app integration"],
    howItWorks: "Use Zapier to connect GrowthDialer with tools like Slack, Gmail, Trello, and thousands of other business apps.",
    color: "bg-amber-500",
  },
  {
    name: "Slack",
    category: "Communication",
    logo: "SK",
    description: "Get real-time notifications and team collaboration features.",
    features: ["Call notifications", "Team updates", "Performance alerts", "Live coaching"],
    howItWorks: "Receive Slack notifications for important calls, connect rates, and team performance updates.",
    color: "bg-purple-600",
  },
  {
    name: "Gong",
    category: "Conversation Intelligence",
    logo: "GO",
    description: "Combine GrowthDialer's AI with Gong's conversation analytics.",
    features: ["Call recording sync", "Analytics integration", "Performance insights", "Coaching recommendations"],
    howItWorks: "GrowthDialer calls are automatically recorded and analyzed by Gong for deeper conversation intelligence.",
    color: "bg-violet-500",
  },
  {
    name: "Apollo.io",
    category: "Data Enrichment",
    logo: "AP",
    description: "Enrich contact data and sync prospect information.",
    features: ["Contact enrichment", "Company data", "Intent signals", "Account mapping"],
    howItWorks: "Pull enriched contact data from Apollo.io and keep prospect information up-to-date across all your tools.",
    color: "bg-indigo-500",
  },
  {
    name: "ZoomInfo",
    category: "Data Enrichment",
    logo: "ZI",
    description: "Access ZoomInfo's comprehensive B2B database.",
    features: ["Contact discovery", "Company intelligence", "Intent data", "Account insights"],
    howItWorks: "Enrich your prospect data with ZoomInfo's comprehensive B2B database for better targeting and personalization.",
    color: "bg-pink-500",
  },
  {
    name: "LinkedIn Sales Navigator",
    category: "Social Selling",
    logo: "LI",
    description: "Sync LinkedIn leads and account data.",
    features: ["Lead sync", "Account mapping", "Social signals", "Profile enrichment"],
    howItWorks: "Import leads from LinkedIn Sales Navigator and keep social selling data synchronized.",
    color: "bg-blue-600",
  },
  {
    name: "Microsoft Teams",
    category: "Communication",
    logo: "MS",
    description: "Integrate with Microsoft Teams for enterprise communication.",
    features: ["Call notifications", "Team collaboration", "Meeting scheduling", "File sharing"],
    howItWorks: "Receive call updates in Teams channels and collaborate with your sales team seamlessly.",
    color: "bg-blue-700",
  },
  {
    name: "Google Workspace",
    category: "Productivity",
    logo: "GW",
    description: "Connect with Gmail, Calendar, and Drive.",
    features: ["Email sync", "Calendar integration", "File attachments", "Contact sync"],
    howItWorks: "Sync Gmail contacts, schedule follow-ups in Google Calendar, and attach call recordings to Drive.",
    color: "bg-green-600",
  },
  {
    name: "Notion",
    category: "Productivity",
    logo: "NO",
    description: "Log calls and sync data to Notion databases.",
    features: ["Call logging", "Database sync", "Template integration", "Team knowledge base"],
    howItWorks: "Automatically create Notion pages for important calls and sync prospect data to your team's knowledge base.",
    color: "bg-gray-600",
  },
  {
    name: "Airtable",
    category: "Database",
    logo: "AT",
    description: "Sync GrowthDialer data with Airtable bases.",
    features: ["Data sync", "Custom fields", "Automation triggers", "Reporting"],
    howItWorks: "Push call data, prospect information, and performance metrics to Airtable for custom reporting and analysis.",
    color: "bg-orange-600",
  },
];

const categories = ["All", "CRM", "Sales Engagement", "Communication", "Data Enrichment", "Automation", "Productivity"];

export default function IntegrationsPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Integrations
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Connect your entire sales stack
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            GrowthDialer integrates with 15+ tools to keep your data synchronized
            and your sales process seamless across your entire tech stack.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                      {integration.logo}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{integration.description}</p>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.slice(0, 3).map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {integration.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{integration.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h4 className="font-semibold mb-1 text-sm">How it works:</h4>
                    <p className="text-xs text-muted-foreground">{integration.howItWorks}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom Integration CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-brand/5 to-purple-500/5 border-brand/20">
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-brand mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Need a custom integration?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our API and webhooks make it easy to build custom integrations with any tool.
              Plus, our team can help build integrations for enterprise customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs#api">
                <Button variant="outline">View API docs</Button>
              </Link>
              <Link href="/contact-sales">
                <Button className="bg-brand text-white hover:bg-brand/80">
                  Contact sales
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to connect your sales stack?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your free trial and connect GrowthDialer to your existing tools in minutes.
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