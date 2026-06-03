"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bot,
  Phone,
  Database,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Zap,
  MessageSquare,
} from "lucide-react";
import { MotionShell } from "@/components/marketing/live-floor/MotionShell";
import { Nav } from "@/components/marketing/live-floor/Nav";
import { Grain } from "@/components/marketing/live-floor/Grain";
import { SmoothScroll } from "@/components/marketing/live-floor/SmoothScroll";
import { FinalCTA } from "@/components/marketing/live-floor/FinalCTA";
import { EASE_OUT, reveal, revealContainer } from "@/components/marketing/live-floor/motion";

// ─── Categories ───
const CATEGORIES = [
  { id: "all", label: "All Integrations", icon: Sparkles },
  { id: "ai", label: "AI Voice Agents", icon: Bot },
  { id: "telephony", label: "Telephony & VoIP", icon: Phone },
  { id: "crm", label: "CRMs & Automation", icon: Database },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

// ─── Integration Data ───
interface Integration {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  color: string;
  iconBg: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "vapi",
    name: "Vapi.ai",
    category: "ai",
    description: "Deploy conversational AI voice agents that handle inbound & outbound calls with human-like fluency.",
    color: "#22D3EE",
    iconBg: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    id: "retell",
    name: "Retell AI",
    category: "ai",
    description: "Build lifelike AI phone agents with ultra-low latency and natural turn-taking for enterprise scale.",
    color: "#A78BFA",
    iconBg: "from-violet-500/20 to-violet-500/5",
  },
  {
    id: "telnyx",
    name: "Telnyx",
    category: "telephony",
    description: "Global carrier-grade VoIP with programmable voice, SMS, and SIP trunking for reliable connectivity.",
    color: "#34D399",
    iconBg: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "telephony",
    description: "Industry-standard cloud communications platform for voice, messaging, and video APIs.",
    color: "#F87171",
    iconBg: "from-red-500/20 to-red-500/5",
  },
  {
    id: "fanytel",
    name: "Fanytel",
    category: "telephony",
    description: "High-performance VoIP infrastructure optimized for parallel dialing and call center operations.",
    color: "#FBBF24",
    iconBg: "from-amber-500/20 to-amber-500/5",
  },
  {
    id: "gohighlevel",
    name: "GoHighLevel",
    category: "crm",
    description: "All-in-one marketing platform with CRM, funnels, and automation for agencies and SMBs.",
    color: "#60A5FA",
    iconBg: "from-blue-500/20 to-blue-500/5",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    description: "Enterprise CRM with bi-directional sync for contacts, deals, and call activities in real-time.",
    color: "#FB923C",
    iconBg: "from-orange-500/20 to-orange-500/5",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    description: "World&apos;s #1 CRM. Auto-log calls, update opportunities, and sync contacts seamlessly.",
    color: "#38BDF8",
    iconBg: "from-sky-500/20 to-sky-500/5",
  },
];

// ─── Request Modal ───
function RequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0A0C]/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>

            {!submitted ? (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#F5F5F7]">Request an Integration</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    {"Tell us which tool you'd like us to connect next."}
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                      Integration Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Pipedrive, Zendesk..."
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-[#F5F5F7] placeholder:text-zinc-600 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-[#F5F5F7] placeholder:text-zinc-600 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 w-full rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#7C3AED] active:scale-[0.98]"
                  >
                    Submit Request
                  </button>
                </form>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#8B5CF6]/20">
                  <Check className="h-6 w-6 text-[#8B5CF6]" />
                </div>
                <h3 className="text-lg font-semibold text-[#F5F5F7]">Request Received!</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {"We'll notify you when this integration is available."}
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.05]"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Integration Card ───
function IntegrationCard({ integration }: { integration: Integration }) {
  const [connected, setConnected] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A0A0C]/80 p-6 backdrop-blur-sm"
    >
      {/* Hover glow effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${integration.color}15, transparent 40%)`,
        }}
      />

      {/* Border glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1px ${integration.color}30`,
        }}
      />

      <div className="relative z-10">
        {/* Icon & Category */}
        <div className="mb-4 flex items-start justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${integration.iconBg} ring-1 ring-white/[0.08]`}
          >
            {integration.category === "ai" && <Bot className="h-6 w-6" style={{ color: integration.color }} />}
            {integration.category === "telephony" && (
              <Phone className="h-6 w-6" style={{ color: integration.color }} />
            )}
            {integration.category === "crm" && (
              <Database className="h-6 w-6" style={{ color: integration.color }} />
            )}
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
            style={{
              backgroundColor: `${integration.color}15`,
              color: integration.color,
            }}
          >
            {integration.category === "ai" && "AI Agent"}
            {integration.category === "telephony" && "VoIP"}
            {integration.category === "crm" && "CRM"}
          </span>
        </div>

        {/* Name & Description */}
        <h3 className="mb-2 text-lg font-semibold text-[#F5F5F7]">{integration.name}</h3>
        <p className="mb-5 text-sm leading-relaxed text-zinc-400">{integration.description}</p>

        {/* Connect Button */}
        <button
          onClick={() => setConnected(!connected)}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            connected
              ? "bg-[#22C55E]/15 text-[#22C55E] ring-1 ring-[#22C55E]/30"
              : "bg-white/[0.05] text-zinc-300 ring-1 ring-white/[0.08] hover:bg-white/[0.08] hover:text-[#F5F5F7]"
          }`}
        >
          {connected ? (
            <>
              <Check className="h-4 w-4" />
              Active
            </>
          ) : (
            <>
              Connect
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Hero Orb Animation ───
function HeroOrb() {
  return (
    <div className="relative mx-auto h-64 w-64 md:h-80 md:w-80">
      {/* Outer glow rings */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#22D3EE]/20 blur-3xl"
      />

      {/* Middle ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 rounded-full border border-white/[0.08]"
      >
        {/* Orbiting nodes */}
        {[0, 90, 180, 270].map((deg, i) => (
          <motion.div
            key={deg}
            className="absolute h-3 w-3 rounded-full"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${deg}deg) translateX(${i % 2 === 0 ? "120px" : "100px"}) translateY(-50%)`,
              backgroundColor: i % 2 === 0 ? "#8B5CF6" : "#22D3EE",
              boxShadow: `0 0 20px ${i % 2 === 0 ? "#8B5CF6" : "#22D3EE"}80`,
            }}
          />
        ))}
      </motion.div>

      {/* Inner ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-12 rounded-full border border-white/[0.06]"
      >
        {[45, 135, 225, 315].map((deg) => (
          <motion.div
            key={deg}
            className="absolute h-2 w-2 rounded-full bg-white/40"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${deg}deg) translateX(60px) translateY(-50%)`,
            }}
          />
        ))}
      </motion.div>

      {/* Center orb */}
      <div className="absolute inset-16 flex items-center justify-center rounded-full border border-white/[0.1] bg-gradient-to-br from-[#8B5CF6]/30 to-[#22D3EE]/30 backdrop-blur-sm">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE]"
        >
          <Zap className="h-8 w-8 text-white" />
        </motion.div>
      </div>

      {/* Connection lines (SVG) */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 320">
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Animated dashed lines */}
        <motion.circle
          cx="160"
          cy="160"
          r="100"
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1"
          strokeDasharray="8 8"
          animate={{ strokeDashoffset: [0, -32] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
}

// ─── Main Content ───
export default function IntegrationsContent() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredIntegrations = useMemo(() => {
    return INTEGRATIONS.filter((int) => {
      const matchesCategory = activeCategory === "all" || int.category === activeCategory;
      const matchesSearch =
        int.name.toLowerCase().includes(search.toLowerCase()) ||
        int.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <MotionShell>
      <SmoothScroll />
      <div className="relative min-h-screen overflow-x-clip bg-[#08080A] text-[#F5F5F7] antialiased">
        <Grain />

        {/* Grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-grid-pattern opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />

        <Nav />

        <main className="relative z-[2]">
          {/* ─── Hero Section ─── */}
          <section className="relative overflow-hidden pb-16 pt-32 md:pb-24 md:pt-40">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              <motion.div
                initial="hidden"
                animate="show"
                variants={revealContainer}
                className="text-center"
              >
                <motion.div variants={reveal}>
                  <HeroOrb />
                </motion.div>

                <motion.h1
                  variants={reveal}
                  className="mx-auto mt-8 max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl"
                >
                  <span className="bg-gradient-to-r from-[#F5F5F7] via-[#F5F5F7] to-zinc-400 bg-clip-text text-transparent">
                    Connect GrowthDialer with
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] bg-clip-text text-transparent">
                    Your Tech Stack
                  </span>
                </motion.h1>

                <motion.p
                  variants={reveal}
                  className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400"
                >
                  Sync CRM data, bridge high-performance VoIP lines, and deploy AI voice agents
                  seamlessly with zero manual friction.
                </motion.p>
              </motion.div>
            </div>
          </section>

          {/* ─── Filter & Search ─── */}
          <section className="sticky top-16 z-40 border-b border-white/[0.06] bg-[#08080A]/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Category Tabs */}
                <div className="scrollbar-none flex gap-1 overflow-x-auto pb-2 md:pb-0">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        activeCategory === cat.id
                          ? "text-[#F5F5F7]"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {activeCategory === cat.id && (
                        <motion.div
                          layoutId="active-category"
                          className="absolute inset-0 rounded-lg bg-white/[0.08]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <cat.icon className="relative z-10 h-4 w-4" />
                      <span className="relative z-10">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search integrations..."
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-10 pr-4 text-sm text-[#F5F5F7] placeholder:text-zinc-600 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 md:w-64"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ─── Integration Grid ─── */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              <motion.div
                layout
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence mode="popLayout">
                  {filteredIntegrations.map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {filteredIntegrations.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03]">
                    <Search className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-300">No integrations found</h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    Try adjusting your search or category filter
                  </p>
                </motion.div>
              )}
            </div>
          </section>

          {/* ─── Request Integration CTA ─── */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0A0A0C] to-[#0F0F12] p-8 md:p-12"
              >
                {/* Background glow */}
                <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[#8B5CF6]/20 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[#22D3EE]/20 blur-[100px]" />

                <div className="relative z-10 grid items-center gap-8 md:grid-cols-2">
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#22D3EE]/20 ring-1 ring-white/[0.08]">
                      <MessageSquare className="h-6 w-6 text-[#8B5CF6]" />
                    </div>
                    <h2 className="text-2xl font-semibold text-[#F5F5F7] md:text-3xl">
                      Missing an integration?
                    </h2>
                    <p className="mt-3 text-zinc-400">
                      {"We're constantly expanding our ecosystem. Let us know which tools you need connected and we'll prioritize building them."}
                    </p>
                  </div>

                  <div className="flex justify-start md:justify-end">
                    <button
                      onClick={() => setModalOpen(true)}
                      className="group relative rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition-all hover:bg-[#7C3AED] active:scale-[0.98]"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Request Integration
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ─── Final CTA ─── */}
          <FinalCTA />
        </main>

        {/* Request Modal */}
        <RequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </MotionShell>
  );
}
