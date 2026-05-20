"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { X, Zap, ExternalLink } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  bg: string;
  logo: React.ReactNode;
  comingSoon?: boolean;
}

function HubSpotLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M18.164 7.931V5.862a1.56 1.56 0 0 0 .9-1.41V4.41a1.56 1.56 0 0 0-1.56-1.56h-.042a1.56 1.56 0 0 0-1.56 1.56v.042a1.56 1.56 0 0 0 .9 1.41v2.069A6.51 6.51 0 0 0 13.66 9.27L7.11 4.1a1.73 1.73 0 0 0 .05-.38 1.73 1.73 0 1 0-1.73 1.73 1.71 1.71 0 0 0 .9-.26l6.42 5.06a6.51 6.51 0 0 0-.85 3.21 6.51 6.51 0 0 0 .95 3.38l-1.95 1.95a1.4 1.4 0 0 0-.4-.06 1.46 1.46 0 1 0 1.46 1.46 1.4 1.4 0 0 0-.06-.4l1.92-1.92a6.53 6.53 0 1 0 5.34-9.94zm-.7 9.93a3.52 3.52 0 1 1 0-7.04 3.52 3.52 0 0 1 0 7.04z" fill="#FF7A59"/>
    </svg>
  );
}

function SalesforceLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M10.12 4.64a4.26 4.26 0 0 1 3.07-1.3 4.3 4.3 0 0 1 3.62 1.97 3.27 3.27 0 0 1 1.47-.35 3.3 3.3 0 0 1 3.3 3.3 3.3 3.3 0 0 1-.43 1.64 2.97 2.97 0 0 1 .75 1.98 2.97 2.97 0 0 1-2.97 2.97h-.12a2.43 2.43 0 0 1-2.38 1.93 2.43 2.43 0 0 1-1.07-.25 3.64 3.64 0 0 1-3.46 2.49 3.64 3.64 0 0 1-3.37-2.27A2.73 2.73 0 0 1 3.3 14.4a2.73 2.73 0 0 1 .56-1.66 3.16 3.16 0 0 1-.6-1.87 3.16 3.16 0 0 1 3.16-3.16c.22 0 .44.02.65.06a4.26 4.26 0 0 1 3.05-3.13z" fill="#00A1E0"/>
    </svg>
  );
}

function SlackLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A"/>
      <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#36C5F0"/>
      <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#2EB67D"/>
      <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="#ECB22E"/>
      <path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
    </svg>
  );
}

function ApolloLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <circle cx="12" cy="12" r="10" fill="#1F1F2E"/>
      <path d="M12 4l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 19l-6.2 3.9 2.4-7.4L2 11.4h7.6L12 4z" fill="#6366F1"/>
    </svg>
  );
}

const INTEGRATIONS: Integration[] = [
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync contacts, deals, and call activities to your CRM automatically after every call.",
    category: "CRM",
    color: "text-[#FF7A59]",
    bg: "bg-[#FF7A59]/10",
    logo: <HubSpotLogo />,
    comingSoon: true,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Bi-directional logging — call outcomes, dispositions, and recordings synced in real time.",
    category: "CRM",
    color: "text-[#00A1E0]",
    bg: "bg-[#00A1E0]/10",
    logo: <SalesforceLogo />,
    comingSoon: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notified in Slack when a lead connects, books a meeting, or goes DNC.",
    category: "Notifications",
    color: "text-[#ECB22E]",
    bg: "bg-[#ECB22E]/10",
    logo: <SlackLogo />,
    comingSoon: true,
  },
  {
    id: "apollo",
    name: "Apollo.io",
    description: "Import lists directly into your dialer queue and auto-enrich phone numbers.",
    category: "Data",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    logo: <ApolloLogo />,
    comingSoon: true,
  },
];

function ComingSoonModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.02_282)] shadow-2xl">
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10">
              <Zap className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{name} Integration</p>
              <p className="text-xs text-slate-500">Coming soon</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 pb-6">
          <p className="text-sm text-slate-400">
            {name} integration is on our roadmap. Join the waitlist to get early access when it launches.
          </p>
          <a
            href="mailto:fidrees763@gmail.com?subject=Integration%20Waitlist%3A%20${encodeURIComponent(name)}"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Join Waitlist
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [modal, setModal] = useState<string | null>(null);

  const selectedIntegration = INTEGRATIONS.find(i => i.id === modal);

  return (
    <>
      <DashboardHeader title="Integrations" subtitle="Connect your revenue stack" />

      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mb-6 max-w-4xl">
          <p className="text-sm text-slate-500">
            Native integrations are coming soon. Each one will be one-click to connect — no webhooks or API keys needed.
          </p>
        </div>

        <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
          {INTEGRATIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setModal(item.id)}
              className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-left transition-colors hover:border-white/[0.10] hover:bg-white/[0.04]"
            >
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]", item.bg)}>
                {item.logo}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                  {item.comingSoon && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Soon
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wide", item.color)}>
                    {item.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-8 max-w-4xl text-xs text-slate-700">
          Want a specific integration? Contact us and we&apos;ll prioritize it.
        </p>
      </main>

      {modal && selectedIntegration && (
        <ComingSoonModal name={selectedIntegration.name} onClose={() => setModal(null)} />
      )}
    </>
  );
}
