"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Search,
  Bot,
  Phone,
  Database,
  ArrowRight,
  Check,
  X,
  Zap,
  Shield,
  Radio,
  Cpu,
  ExternalLink,
  FileCode2,
  Webhook,
} from "lucide-react";
import { MotionShell } from "@/components/marketing/live-floor/MotionShell";
import { Nav } from "@/components/marketing/live-floor/Nav";
import { Grain } from "@/components/marketing/live-floor/Grain";
import { SmoothScroll } from "@/components/marketing/live-floor/SmoothScroll";
import { FinalCTA } from "@/components/marketing/live-floor/FinalCTA";
import { EASE_OUT, reveal, revealContainer } from "@/components/marketing/live-floor/motion";

// ─── Categories ───
const CATEGORIES = [
  { id: "all", label: "All Connectors" },
  { id: "ai", label: "AI Voice Ecosystem" },
  { id: "telephony", label: "Telephony & Carrier Lines" },
  { id: "crm", label: "CRMs & Automated Workflows" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

// ─── Integration Data ───
interface Integration {
  id: string;
  name: string;
  category: Exclude<CategoryId, "all">;
  description: string;
  tag: string;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "vapi",
    name: "Vapi.ai",
    category: "ai",
    description: "Deploy conversational AI voice agents with sub-200ms latency for human-like phone interactions.",
    tag: "AI Voice",
    color: "#22D3EE",
  },
  {
    id: "retell",
    name: "Retell AI",
    category: "ai",
    description: "Enterprise-grade AI phone agents with natural turn-taking and real-time conversation steering.",
    tag: "AI Voice",
    color: "#A78BFA",
  },
  {
    id: "telnyx",
    name: "Telnyx",
    category: "telephony",
    description: "Global carrier-grade infrastructure with programmable voice, SMS, and SIP trunking.",
    tag: "Carrier",
    color: "#34D399",
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "telephony",
    description: "Industry-standard cloud communications APIs for voice, messaging, and video at scale.",
    tag: "Carrier",
    color: "#F87171",
  },
  {
    id: "fanytel",
    name: "Fanytel",
    category: "telephony",
    description: "High-throughput VoIP infrastructure optimized for parallel dialing and call center operations.",
    tag: "Carrier",
    color: "#FBBF24",
  },
  {
    id: "gohighlevel",
    name: "GoHighLevel",
    category: "crm",
    description: "All-in-one marketing automation with CRM, funnels, and workflow orchestration for agencies.",
    tag: "Automation",
    color: "#60A5FA",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    description: "Bi-directional CRM sync for contacts, deals, and call activities with real-time data flow.",
    tag: "Automation",
    color: "#FB923C",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    description: "Enterprise CRM integration with auto-logged calls, opportunity updates, and contact sync.",
    tag: "Automation",
    color: "#38BDF8",
  },
];

// ─── Cursor Spotlight Card ───
function IntegrationCard({ integration }: { integration: Integration }) {
  const [connected, setConnected] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleConnect = () => {
    if (!connected) {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 600);
    }
    setConnected(!connected);
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-white/[0.02] to-transparent p-6 transition-colors duration-300 ${
        pulsing ? "border-[#8B5CF6]/50" : "border-white/[0.04]"
      }`}
    >
      {/* Cursor-tracking spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${springX}px ${springY}px, ${integration.color}15, transparent 40%)`,
        }}
      />

      {/* Cursor-tracking border highlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(200px circle at ${springX}px ${springY}px, ${integration.color}30, transparent 40%)`,
          WebkitMaskImage: "linear-gradient(black, black) content-box, linear-gradient(black, black)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />

      {/* Pulse animation on connect */}
      <AnimatePresence>
        {pulsing && (
          <motion.div
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: `0 0 40px ${integration.color}40` }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Header row */}
        <div className="mb-4 flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: `linear-gradient(135deg, ${integration.color}20, transparent)` }}
          >
            {integration.category === "ai" && <Bot className="h-5 w-5" style={{ color: integration.color }} />}
            {integration.category === "telephony" && <Phone className="h-5 w-5" style={{ color: integration.color }} />}
            {integration.category === "crm" && <Database className="h-5 w-5" style={{ color: integration.color }} />}
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${integration.color}12`, color: integration.color }}
          >
            {integration.tag}
          </span>
        </div>

        {/* Name & Description */}
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">{integration.name}</h3>
        <p className="mb-5 text-sm leading-relaxed text-neutral-400">{integration.description}</p>

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
            connected
              ? "bg-[#8B5CF6]/15 text-[#A78BFA]"
              : "bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          {connected ? (
            <>
              <Check className="h-4 w-4 text-[#8B5CF6]" />
              <span>Active & Syncing</span>
            </>
          ) : (
            <>
              <span>Connect Setup</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Bento Feature Card with Spotlight ───
function BentoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent p-6 ${className}`}
    >
      {/* Spotlight effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(139,92,246,0.08), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ─── Animated Node Graph (AI Orchestration Visual) ───
function NodeGraph() {
  return (
    <div className="relative h-32 w-full">
      <svg className="h-full w-full" viewBox="0 0 300 100">
        <defs>
          <linearGradient id="node-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        {/* Connection lines */}
        <line x1="50" y1="50" x2="150" y2="50" stroke="url(#node-line)" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="150" y1="50" x2="250" y2="50" stroke="url(#node-line)" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Lead Node */}
        <circle cx="50" cy="50" r="16" fill="#1a1a1f" stroke="#8B5CF6" strokeWidth="2" />
        <text x="50" y="80" textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="system-ui">Lead</text>
        
        {/* AI Agent Node */}
        <circle cx="150" cy="50" r="20" fill="#1a1a1f" stroke="#22D3EE" strokeWidth="2" />
        <text x="150" y="80" textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="system-ui">AI Agent</text>
        
        {/* CRM Node */}
        <circle cx="250" cy="50" r="16" fill="#1a1a1f" stroke="#34D399" strokeWidth="2" />
        <text x="250" y="80" textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="system-ui">CRM</text>
        
        {/* Animated traveling dot */}
        <motion.circle
          r="4"
          fill="#8B5CF6"
          filter="url(#glow)"
          animate={{ cx: [50, 150, 250, 150, 50], cy: [50, 50, 50, 50, 50] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}

// ─── Dial Lines Visual ───
function DialLinesVisual() {
  return (
    <div className="flex items-end justify-center gap-1.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE]"
          animate={{ height: [16, 40, 24, 48, 16] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0c]/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/[0.05] hover:text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>

            {!submitted ? (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold tracking-tight text-white">Request an Integration</h3>
                  <p className="mt-2 text-sm text-neutral-400">
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
                    <label className="mb-1.5 block text-sm font-medium text-neutral-300">Integration Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Pipedrive, Zendesk..."
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-300">Your Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
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
                <h3 className="text-lg font-semibold text-white">Request Received!</h3>
                <p className="mt-2 text-sm text-neutral-400">{"We'll notify you when this integration is available."}</p>
                <button
                  onClick={onClose}
                  className="mt-6 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/[0.05]"
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
      <div className="relative min-h-screen overflow-x-clip bg-[#030712] text-white antialiased">
        <Grain />

        {/* Dotted grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"
        />

        {/* Ambient glow accents */}
        <div className="pointer-events-none absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-[400px] w-[400px] translate-x-1/2 bg-gradient-to-b from-cyan-500/8 via-transparent to-transparent blur-3xl" />

        <Nav />

        <main className="relative z-[2]">
          {/* ─── HERO ZONE ─── */}
          <section className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-44">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              <motion.div initial="hidden" animate="show" variants={revealContainer} className="text-center">
                {/* Premium Badge */}
                <motion.div variants={reveal} className="mb-8 flex justify-center">
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8B5CF6] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8B5CF6]" />
                    </span>
                    <span className="text-xs font-medium tracking-wide text-neutral-400">
                      GrowthDialer Infrastructure v2.0
                    </span>
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  variants={reveal}
                  className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tighter md:text-5xl lg:text-6xl"
                >
                  <span className="bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                    Engineered for Raw Speed.
                  </span>
                  <br />
                  <span className="bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                    Built to Sync Everywhere.
                  </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p variants={reveal} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400">
                  Deploy a high-volume, 10-line parallel dialing matrix and effortlessly bind your entire pipeline
                  orchestration layer into a single, low-latency control center.
                </motion.p>
              </motion.div>
            </div>
          </section>

          {/* ─── BENTO FEATURES MATRIX ─── */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Card 1: AI Voice Orchestration (Double height) */}
                <BentoCard className="lg:row-span-2">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-transparent">
                    <Cpu className="h-5 w-5 text-[#8B5CF6]" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">AI Voice Orchestration</h3>
                  <p className="mb-6 text-sm text-neutral-400">
                    Low-latency conversational agent nodes with intelligent routing and real-time conversation steering.
                  </p>
                  <NodeGraph />
                  <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="font-mono">{"< 200ms latency"}</span>
                  </div>
                </BentoCard>

                {/* Card 2: Multi-Line Parallel Dialing */}
                <BentoCard>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE]/20 to-transparent">
                    <Radio className="h-5 w-5 text-[#22D3EE]" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">Multi-Line Parallel Dialing</h3>
                  <p className="mb-4 text-sm text-neutral-400">
                    10 simultaneous dial lines with intelligent load balancing and automatic failover.
                  </p>
                  <DialLinesVisual />
                  <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                    <span className="font-mono">10 ACTIVE LINES</span>
                  </div>
                </BentoCard>

                {/* Card 3: Reputation Safeguarding */}
                <BentoCard>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#34D399]/20 to-transparent">
                    <Shield className="h-5 w-5 text-[#34D399]" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">Reputation Safeguarding</h3>
                  <p className="mb-4 text-sm text-neutral-400">
                    10DLC compliance with automatic rate-limiting thresholds and spam shield protocols.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                      <span className="font-mono text-xs text-neutral-400">SPAM_SCORE</span>
                      <span className="font-mono text-xs text-emerald-400">0.02</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                      <span className="font-mono text-xs text-neutral-400">10DLC_STATUS</span>
                      <span className="font-mono text-xs text-emerald-400">VERIFIED</span>
                    </div>
                  </div>
                </BentoCard>
              </div>
            </div>
          </section>

          {/* ─── INTEGRATIONS HUB ─── */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-12 text-center"
              >
                <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">
                  <span className="bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                    High-Fidelity Integrations Hub
                  </span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-neutral-400">
                  Connect your entire tech stack with enterprise-grade reliability.
                </p>
              </motion.div>

              {/* Sticky Filter Row */}
              <div className="sticky top-16 z-40 -mx-5 border-y border-white/[0.04] bg-[#030712]/90 px-5 py-4 backdrop-blur-xl lg:-mx-8 lg:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Category Tabs */}
                  <div className="scrollbar-none flex gap-1 overflow-x-auto">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`relative whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          activeCategory === cat.id ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        {activeCategory === cat.id && (
                          <motion.div
                            layoutId="active-tab"
                            className="absolute inset-0 rounded-lg bg-white/[0.08]"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search connectors..."
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 md:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Integration Grid */}
              <div className="mt-8">
                <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filteredIntegrations.map((integration) => (
                      <IntegrationCard key={integration.id} integration={integration} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {filteredIntegrations.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03]">
                      <Search className="h-8 w-8 text-neutral-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-300">No connectors found</h3>
                    <p className="mt-2 text-sm text-neutral-500">Try adjusting your search or category filter</p>
                  </motion.div>
                )}
              </div>
            </div>
          </section>

          {/* ─── INFRASTRUCTURE CTA ─── */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className="relative overflow-hidden rounded-3xl border border-white/[0.04] bg-gradient-to-br from-[#0a0a0c] to-[#050507] p-8 md:p-12"
              >
                {/* Ambient glows */}
                <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[#8B5CF6]/15 blur-[120px]" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[#22D3EE]/15 blur-[120px]" />

                <div className="relative z-10 grid items-center gap-8 md:grid-cols-2">
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-transparent">
                      <Webhook className="h-6 w-6 text-[#8B5CF6]" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                      Running custom programmatic webhooks or private API clusters?
                    </h2>
                    <p className="mt-3 text-neutral-400">
                      Deploy enterprise-grade webhook infrastructure with automatic retries, payload validation, and
                      real-time monitoring.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-start md:justify-end">
                    <button className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-medium text-neutral-300 backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:text-white">
                      <FileCode2 className="h-4 w-4" />
                      Read API Specs
                      <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                    </button>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#8B5CF6] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#7C3AED] active:scale-[0.98]"
                    >
                      <Zap className="h-4 w-4" />
                      Deploy Custom Webhook Cluster
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      {/* Glow on hover */}
                      <span className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100" style={{ boxShadow: "0 0 40px rgba(139,92,246,0.4)" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <FinalCTA />
        </main>

        <RequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </MotionShell>
  );
}
