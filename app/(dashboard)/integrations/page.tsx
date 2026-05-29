"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, CheckCircle2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── SVG Logos ────────────────────────────────────────────────────────────────

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

function PipedriveLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" fill="#1A1A1A"/>
      <circle cx="12" cy="12" r="2.5" fill="#25C16F"/>
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

function ZapierLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" fill="#FF4A00"/>
      <path d="M13.5 6l-3 6h3l-3 6 7.5-7.5H14l3-4.5H13.5z" fill="white"/>
    </svg>
  );
}

function MakeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect width="24" height="24" rx="6" fill="#6D00CC"/>
      <path d="M5 12c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7-7-3.134-7-7z" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GoogleCalendarLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect x="2" y="4" width="20" height="18" rx="2" fill="#fff" stroke="#dadce0"/>
      <rect x="2" y="4" width="20" height="5" rx="2" fill="#4285F4"/>
      <rect x="2" y="8" width="20" height="1" fill="#4285F4"/>
      <circle cx="8" cy="3" r="1.5" fill="#4285F4"/>
      <circle cx="16" cy="3" r="1.5" fill="#4285F4"/>
      <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#4285F4">31</text>
    </svg>
  );
}

function CalendlyLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <circle cx="12" cy="12" r="10" fill="#006BFF"/>
      <path d="M16 10a4 4 0 1 1-4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M14 7h2v2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function ZoomInfoLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect width="24" height="24" rx="4" fill="#074FD6"/>
      <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Zi</text>
    </svg>
  );
}

function GoHighLevelLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect width="24" height="24" rx="4" fill="#F5A623"/>
      <path d="M7 12l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function N8nLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect width="24" height="24" rx="4" fill="#E8532C"/>
      <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">n8n</text>
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'all' | 'crm' | 'communication' | 'data' | 'automation' | 'calendar';

interface Integration {
  id: string;
  name: string;
  description: string;
  bullets: string[];
  category: Category;
  categoryLabel: string;
  color: string;
  bg: string;
  logo: React.ReactNode;
  comingSoon: boolean;
  popular?: boolean;
}

// ─── Integration data ─────────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  // CRM
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and call activities to your CRM automatically after every call.',
    bullets: ['Auto-sync leads after disposition', 'Push call recordings to contact timeline', 'Two-way contact sync'],
    category: 'crm',
    categoryLabel: 'CRM',
    color: 'text-[#FF7A59]',
    bg: 'bg-[#FF7A59]/10',
    logo: <HubSpotLogo />,
    comingSoon: true,
    popular: true,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Bi-directional logging — call outcomes, dispositions, and recordings synced in real time.',
    bullets: ['Real-time activity logging', 'Opportunity creation from meetings booked', 'Custom field mapping'],
    category: 'crm',
    categoryLabel: 'CRM',
    color: 'text-[#00A1E0]',
    bg: 'bg-[#00A1E0]/10',
    logo: <SalesforceLogo />,
    comingSoon: true,
    popular: true,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Push call outcomes to deals and log activities to your pipeline automatically.',
    bullets: ['Auto-create deals on meeting booked', 'Log calls with duration + notes', 'Stage progression triggers'],
    category: 'crm',
    categoryLabel: 'CRM',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    logo: <PipedriveLogo />,
    comingSoon: true,
  },
  {
    id: 'gohighlevel',
    name: 'GoHighLevel',
    description: 'Sync contacts and call data to GHL workflows and pipelines.',
    bullets: ['Contact sync with tags', 'Trigger GHL workflows on disposition', 'Call activity in timeline'],
    category: 'crm',
    categoryLabel: 'CRM',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    logo: <GoHighLevelLogo />,
    comingSoon: true,
  },
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notified in Slack when a lead connects, books a meeting, or goes DNC.',
    bullets: ['Real-time call alerts', 'Meeting booked notifications', 'Daily digest of session stats'],
    category: 'communication',
    categoryLabel: 'Notifications',
    color: 'text-[#ECB22E]',
    bg: 'bg-[#ECB22E]/10',
    logo: <SlackLogo />,
    comingSoon: true,
    popular: true,
  },
  // Data enrichment
  {
    id: 'apollo',
    name: 'Apollo.io',
    description: 'Import lists directly into your dialer queue and auto-enrich phone numbers.',
    bullets: ['One-click list import', 'Phone number enrichment', 'Email sequence sync'],
    category: 'data',
    categoryLabel: 'Data',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    logo: <ApolloLogo />,
    comingSoon: true,
    popular: true,
  },
  {
    id: 'zoominfo',
    name: 'ZoomInfo',
    description: 'Enrich your leads with verified phone numbers and company intelligence.',
    bullets: ['Phone number verification', 'Company + contact enrichment', 'Intent data signals'],
    category: 'data',
    categoryLabel: 'Data',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    logo: <ZoomInfoLogo />,
    comingSoon: true,
  },
  // Automation
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect GrowthDialer to 5,000+ apps via triggers and actions — no code needed.',
    bullets: ['Trigger on call ended', 'Trigger on meeting booked', 'Push leads from any source'],
    category: 'automation',
    categoryLabel: 'Automation',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    logo: <ZapierLogo />,
    comingSoon: true,
    popular: true,
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Visual workflow automation for complex multi-step call outcome sequences.',
    bullets: ['Advanced scenario builder', 'Conditional routing by disposition', 'Batch data processing'],
    category: 'automation',
    categoryLabel: 'Automation',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    logo: <MakeLogo />,
    comingSoon: true,
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Self-hosted workflow automation with full control over your call data pipeline.',
    bullets: ['Self-hosted option available', 'Open-source compatible', 'Custom webhook flows'],
    category: 'automation',
    categoryLabel: 'Automation',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    logo: <N8nLogo />,
    comingSoon: true,
  },
  // Calendar
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Automatically create calendar events when meetings are booked from your calls.',
    bullets: ['Auto-create meeting events', 'Sync call callbacks to calendar', 'Remind before follow-ups'],
    category: 'calendar',
    categoryLabel: 'Calendar',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    logo: <GoogleCalendarLogo />,
    comingSoon: true,
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Send your Calendly link in post-call follow-ups and track booking attribution.',
    bullets: ['Auto-send booking link after calls', 'Track meetings booked via link', 'Attribution to call session'],
    category: 'calendar',
    categoryLabel: 'Calendar',
    color: 'text-[#006BFF]',
    bg: 'bg-blue-600/10',
    logo: <CalendlyLogo />,
    comingSoon: true,
  },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'crm', label: 'CRM' },
  { id: 'communication', label: 'Notifications' },
  { id: 'data', label: 'Data' },
  { id: 'automation', label: 'Automation' },
  { id: 'calendar', label: 'Calendar' },
];

// ─── Waitlist modal ───────────────────────────────────────────────────────────

function WaitlistModal({
  integration,
  onClose,
}: {
  integration: Integration;
  onClose: () => void;
}) {
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), provider: integration.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Something went wrong. Try again.');
        return;
      }
      setJoined(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.02_282)] shadow-2xl"
      >
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06]", integration.bg)}>
              {integration.logo}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{integration.name}</p>
              <p className="text-xs text-slate-500">{integration.categoryLabel} integration</p>
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
          {joined ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-4 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-white">You&apos;re on the list!</p>
              <p className="text-xs text-slate-400">We&apos;ll email you when the {integration.name} integration launches.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-xl border border-white/10 px-5 py-2 text-sm text-slate-400 hover:text-white"
              >
                Close
              </button>
            </motion.div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-400 leading-relaxed">
                {integration.description}
              </p>
              <ul className="mb-4 space-y-1.5">
                {integration.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mb-3 space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/30"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
              <button
                type="button"
                onClick={handleJoin}
                disabled={!email.trim() || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
              >
                <Bell className="h-3.5 w-3.5" />
                {loading ? 'Saving…' : 'Notify me when ready'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Integration card ─────────────────────────────────────────────────────────

function IntegrationCard({ item, onClick }: { item: Integration; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      className="group flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]", item.bg)}>
          {item.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">{item.name}</h3>
            {item.popular && (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">Popular</span>
            )}
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Soon
            </span>
          </div>
          <span className={cn("text-[10px] font-semibold uppercase tracking-wide", item.color)}>
            {item.categoryLabel}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed text-slate-500 mb-3 flex-1">{item.description}</p>

      {/* Feature bullets */}
      <ul className="space-y-1 mb-4">
        {item.bullets.map((b) => (
          <li key={b} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="h-1 w-1 shrink-0 rounded-full bg-slate-600" />
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-600">Click to join waitlist</span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-brand opacity-0 transition-opacity group-hover:opacity-100">
          <Bell className="h-3 w-3" />
          Notify me
        </span>
      </div>
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [modal, setModal] = useState<string | null>(null);

  const filtered = activeCategory === 'all'
    ? INTEGRATIONS
    : INTEGRATIONS.filter((i) => i.category === activeCategory);

  const selectedIntegration = INTEGRATIONS.find((i) => i.id === modal);

  return (
    <>
      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        {/* Category filter tabs */}
        <div className="mb-6 flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-white/[0.06]">
          {CATEGORIES.map(({ id, label }) => {
            const count = id === 'all' ? INTEGRATIONS.length : INTEGRATIONS.filter((i) => i.category === id).length;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveCategory(id)}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeCategory === id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-500 hover:text-slate-300',
                )}
              >
                {label}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  activeCategory === id ? 'bg-brand/15 text-brand' : 'bg-white/[0.05] text-slate-600',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Header note */}
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 max-w-4xl">
          <Zap className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-300/80">
            Native integrations are actively in development. Join the waitlist for any integration to get early access and help prioritize our roadmap.
          </p>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((item) => (
              <IntegrationCard key={item.id} item={item} onClick={() => setModal(item.id)} />
            ))}
          </motion.div>
        </AnimatePresence>

        <p className="mt-8 max-w-4xl text-xs text-slate-700">
          Need a specific integration? Contact us and we&apos;ll prioritize it for the roadmap.
        </p>
      </main>

      <AnimatePresence>
        {modal && selectedIntegration && (
          <WaitlistModal integration={selectedIntegration} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
