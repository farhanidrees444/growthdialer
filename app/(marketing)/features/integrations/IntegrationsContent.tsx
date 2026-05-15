"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Zap, Database, Globe, Settings } from "lucide-react";

const integrations = [
  {
    category: "CRM",
    items: [
      { name: "Salesforce", description: "Bi-directional sync for contacts, activities, and deals.", icon: "SF" },
      { name: "HubSpot", description: "Auto-log calls, update deals, and sync contacts in real time.", icon: "HS" },
      { name: "Pipedrive", description: "Sync leads and activities directly to your Pipedrive pipeline.", icon: "PD" },
      { name: "Zoho CRM", description: "Push call outcomes and notes to Zoho automatically.", icon: "ZO" },
    ],
  },
  {
    category: "Communication",
    items: [
      { name: "Slack", description: "Receive call summaries, alerts, and team notifications in Slack.", icon: "SL" },
      { name: "Microsoft Teams", description: "Surface deal updates and coaching alerts in Teams channels.", icon: "MT" },
      { name: "Gmail", description: "Trigger email sequences after call outcomes.", icon: "GM" },
      { name: "Outlook", description: "Log calls and set follow-up tasks straight from Outlook.", icon: "OL" },
    ],
  },
  {
    category: "Automation",
    items: [
      { name: "Zapier", description: "Connect GrowthDialer to 5,000+ apps with no-code workflows.", icon: "ZP" },
      { name: "Make (Integromat)", description: "Build advanced multi-step automations triggered by call events.", icon: "MK" },
      { name: "Webhooks", description: "Send real-time call data to any endpoint you choose.", icon: "WH" },
      { name: "REST API", description: "Full-featured API for custom integrations and enterprise workflows.", icon: "AP" },
    ],
  },
  {
    category: "Productivity",
    items: [
      { name: "Google Calendar", description: "Auto-schedule follow-ups and sync meetings from calls.", icon: "GC" },
      { name: "Calendly", description: "Let prospects book directly from call outcomes.", icon: "CL" },
      { name: "Notion", description: "Push call notes and summaries to your Notion workspace.", icon: "NT" },
      { name: "Google Sheets", description: "Export call data and analytics to Google Sheets.", icon: "GS" },
    ],
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Zero manual data entry",
    description: "Every call is automatically logged with duration, outcome, notes, and next steps — no rep ever needs to type a CRM update again.",
  },
  {
    icon: Database,
    title: "Single source of truth",
    description: "All your call data, contact history, and deal notes flow into your CRM in real time so your pipeline is always accurate.",
  },
  {
    icon: Globe,
    title: "Works with your existing stack",
    description: "We built native integrations for the tools your team already uses — no forced migrations or new software to learn.",
  },
  {
    icon: Settings,
    title: "Custom workflows",
    description: "Trigger actions based on call outcomes, disposition codes, or AI sentiment — automate the follow-up work your team hates.",
  },
];

export default function IntegrationsContent() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Integrations
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Connect GrowthDialer to
            <span className="text-brand"> your entire sales stack</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            15+ native integrations so your calls, contacts, and deal data automatically flow to the tools your team already lives in.
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

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-brand" />
              </div>
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Integration Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">All your tools, all connected</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Native integrations with the CRM, communication, automation, and productivity tools your sales team relies on every day.
          </p>
        </div>

        <div className="space-y-12">
          {integrations.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Badge variant="outline">{category.category}</Badge>
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.items.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full hover:border-brand/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center text-xs font-bold text-brand">
                            {item.icon}
                          </div>
                          <CardTitle className="text-base">{item.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* API Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-muted/30 border border-muted rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Need a custom integration?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our REST API and webhook system let your engineering team connect GrowthDialer to any internal tool or custom workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
                Start building <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Talk to sales
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to connect your stack?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Set up your first integration in under 5 minutes. No engineering required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-brand text-white hover:bg-brand/80">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {["No credit card required", "14-day free trial", "Cancel anytime"].map((item) => (
              <span key={item} className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
