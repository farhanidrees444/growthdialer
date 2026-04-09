"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Plug } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const items = [
  { id: "hubspot", name: "HubSpot", description: "Sync contacts, deals, and activities." },
  { id: "salesforce", name: "Salesforce", description: "Bi-directional CRM logging." },
  { id: "slack", name: "Slack", description: "Notify channels on connect and meetings." },
  { id: "apollo", name: "Apollo.io", description: "Import lists and enrich phone numbers." },
];

export default function IntegrationsPage() {
  const [on, setOn] = useState<Record<string, boolean>>({
    hubspot: true,
    salesforce: false,
    slack: true,
    apollo: false,
  });

  return (
    <>
      <DashboardHeader title="Integrations" subtitle="Connect your revenue stack" />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
          {items.map((item) => (
            <Card key={item.id} className="p-5 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Plug className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Label htmlFor={item.id} className="text-xs text-muted-foreground sr-only">
                  Enable {item.name}
                </Label>
                <Switch
                  id={item.id}
                  checked={on[item.id]}
                  onCheckedChange={(v) => setOn((s) => ({ ...s, [item.id]: v }))}
                />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
