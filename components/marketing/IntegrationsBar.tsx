"use client";

import { motion } from "framer-motion";

const integrations = [
  { name: "Salesforce", abbr: "SF" },
  { name: "HubSpot", abbr: "HS" },
  { name: "Outreach", abbr: "OR" },
  { name: "Salesloft", abbr: "SL" },
  { name: "Apollo.io", abbr: "AP" },
  { name: "Zapier", abbr: "ZP" },
  { name: "Gong", abbr: "GO" },
  { name: "Slack", abbr: "SK" },
];

const colors = [
  "bg-blue-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-pink-500",
];

export default function IntegrationsBar() {
  return (
    <section id="integrations" className="py-16 border-b border-white/8 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center text-sm text-muted-foreground mb-8"
        >
          Connects with your existing stack in minutes
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {integrations.map((crm, i) => (
            <motion.div
              key={crm.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="flex items-center gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 hover:bg-white/8 hover:border-white/15 transition-all cursor-default group"
            >
              <div
                className={`w-7 h-7 rounded-md ${colors[i]} flex items-center justify-center text-white text-[11px] font-bold shrink-0 group-hover:scale-110 transition-transform`}
              >
                {crm.abbr}
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {crm.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
