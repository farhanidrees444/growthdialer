"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Mail, Search, X, ExternalLink, ChevronLeft, ChevronRight,
  Sparkles, TrendingUp, PhoneMissed, Clock, UserPlus,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLeads } from "@/contexts/leads-context";
import { useCallContext } from "@/lib/call-context";

interface FullLead {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  phone: string;
  email: string | null;
  ai_score: number | null;
  status: string;
  call_attempts: number | null;
  last_called_at: string | null;
  notes: string | null;
  tags: string[] | null;
  linkedin: string | null;
  created_at: string;
  dnc?: boolean;
}

const PAGE_SIZE = 20;

const TAB_FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "hot", label: "Hot" },
  { key: "callback", label: "Callbacks" },
  { key: "done", label: "Done" },
  { key: "dnc", label: "DNC" },
] as const;

type TabKey = typeof TAB_FILTERS[number]["key"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:           { bg: "bg-slate-500/15",   text: "text-slate-300" },
  queued:        { bg: "bg-blue-500/15",    text: "text-blue-300" },
  contacted:     { bg: "bg-amber-500/15",   text: "text-amber-300" },
  connected:     { bg: "bg-emerald-500/15", text: "text-emerald-300" },
  callback:      { bg: "bg-amber-500/15",   text: "text-amber-300" },
  meeting_booked:{ bg: "bg-violet-500/15",  text: "text-violet-300" },
  not_interested:{ bg: "bg-red-500/15",     text: "text-red-400" },
  do_not_call:   { bg: "bg-rose-900/40",    text: "text-rose-400" },
  wrong_number:  { bg: "bg-red-500/15",     text: "text-red-400" },
};

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-400",
  "from-violet-500 to-purple-400",
  "from-amber-500 to-orange-400",
  "from-blue-500 to-cyan-400",
  "from-rose-500 to-pink-400",
];

function scoreGradient(score: number | null): string {
  if (!score) return "from-slate-500 to-slate-600";
  if (score >= 80) return "from-emerald-500 to-teal-400";
  if (score >= 50) return "from-amber-500 to-orange-400";
  return "from-slate-500 to-slate-600";
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function formatLastCall(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const { bg, text } = STATUS_COLORS[status] ?? { bg: "bg-slate-500/15", text: "text-slate-300" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${bg} ${text}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function LeadCard({
  lead,
  onCall,
  onView,
}: {
  lead: FullLead;
  onCall: () => void;
  onView: () => void;
}) {
  const grad = avatarGradient(lead.name);
  const scoreGrad = scoreGradient(lead.ai_score);
  const isHot = (lead.tags ?? []).includes("hot") || lead.status === "callback" || lead.status === "meeting_booked";

  return (
    <motion.div
      variants={cardVariants}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all",
        "border-white/[0.07] bg-[oklch(0.086_0.024_282)] hover:border-white/[0.12] hover:bg-white/[0.04]",
        isHot && "border-amber-500/20 hover:border-amber-500/30",
      )}
    >
      {/* Hot indicator */}
      {isHot && (
        <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15">
          <Sparkles className="h-3 w-3 text-amber-400" />
        </span>
      )}

      {/* Top: avatar + score */}
      <div className="flex items-start gap-3">
        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-sm font-bold text-white shadow-sm`}>
          {getInitials(lead.name)}
          {lead.ai_score !== null && (
            <div className={`absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${scoreGrad} text-[9px] font-bold text-white shadow-sm`}>
              {lead.ai_score}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-sm font-semibold text-white leading-tight">{lead.name}</p>
          {(lead.title || lead.company) && (
            <p className="mt-0.5 truncate text-[11px] text-slate-500 leading-tight">
              {[lead.title, lead.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={lead.status} />
        {lead.call_attempts != null && lead.call_attempts > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <Phone className="h-2.5 w-2.5" /> {lead.call_attempts}×
          </span>
        )}
      </div>

      {/* Contact info */}
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <Phone className="h-3 w-3 shrink-0 text-slate-600" />
          {lead.phone}
        </p>
        {lead.email && (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
            <Mail className="h-3 w-3 shrink-0 text-slate-600" />
            {lead.email}
          </p>
        )}
      </div>

      {/* Footer: last call + links */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-slate-600">
          <Clock className="h-2.5 w-2.5" />
          {formatLastCall(lead.last_called_at)}
        </span>
        <div className="flex items-center gap-1">
          {lead.linkedin && (
            <a
              href={lead.linkedin}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.06] text-slate-600 transition hover:text-slate-300 hover:border-white/10"
              title="LinkedIn"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCall(); }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          <Phone className="h-3.5 w-3.5" />
          Call
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          View
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const msgs: Record<TabKey, { title: string; sub: string }> = {
    all: { title: "No leads yet", sub: "Import a CSV or add leads manually to get started." },
    new: { title: "No new leads", sub: "All leads have been contacted." },
    hot: { title: "No hot leads", sub: "Leads tagged hot or with callback status will appear here." },
    callback: { title: "No callbacks", sub: "Leads marked for callback will appear here." },
    done: { title: "No completed leads", sub: "Leads marked meeting booked or not interested appear here." },
    dnc: { title: "No DNC leads", sub: "Leads marked Do Not Call appear here." },
  };
  const { title, sub } = msgs[tab];
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
        <UserPlus className="h-7 w-7 text-slate-600" />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs text-slate-500 leading-relaxed">{sub}</p>
    </div>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const { leads: contextLeads, setImportOpen } = useLeads();
  const { startCall } = useCallContext();

  const [leads, setLeads] = useState<FullLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) { setLoading(false); return; }

        const { data, error } = await supabase
          .from("leads")
          .select("id,name,title,company,phone,email,ai_score,status,call_attempts,last_called_at,notes,tags,linkedin,created_at,dnc")
          .eq("user_id", session.user.id)
          .order("ai_score", { ascending: false });

        if (error) { console.error("Leads load error:", error); return; }
        setLeads((data ?? []) as FullLead[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contextLeads.length]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { all: 0, new: 0, hot: 0, callback: 0, done: 0, dnc: 0 };
    for (const l of leads) {
      counts.all++;
      if (l.status === "new" || l.status === "queued") counts.new++;
      if (l.status === "callback" || l.status === "meeting_booked" || (l.tags ?? []).includes("hot")) counts.hot++;
      if (l.status === "callback") counts.callback++;
      if (l.status === "meeting_booked" || l.status === "not_interested") counts.done++;
      if (l.dnc || l.status === "do_not_call") counts.dnc++;
    }
    return counts;
  }, [leads]);

  const filtered = useMemo(() => {
    let list = [...leads];
    if (tab === "new") list = list.filter((l) => l.status === "new" || l.status === "queued");
    else if (tab === "hot") list = list.filter((l) => l.status === "callback" || l.status === "meeting_booked" || (l.tags ?? []).includes("hot"));
    else if (tab === "callback") list = list.filter((l) => l.status === "callback");
    else if (tab === "done") list = list.filter((l) => l.status === "meeting_booked" || l.status === "not_interested");
    else if (tab === "dnc") list = list.filter((l) => l.dnc || l.status === "do_not_call");

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q) ||
          l.phone.includes(q),
      );
    }
    return list;
  }, [leads, tab, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = useCallback((t: TabKey) => { setTab(t); setPage(1); }, []);

  const handleCall = useCallback((lead: FullLead) => {
    startCall(lead.phone, {
      id: lead.id,
      name: lead.name,
      company: lead.company ?? "",
      phone: lead.phone,
      title: lead.title ?? "",
      email: lead.email ?? undefined,
      linkedin: lead.linkedin ?? undefined,
      ai_score: lead.ai_score ?? 0,
      status: lead.status as never,
      call_attempts: lead.call_attempts ?? 0,
      last_called_at: lead.last_called_at ?? undefined,
      notes: lead.notes ?? undefined,
      tags: lead.tags ?? [],
      company_size: undefined,
      industry: undefined,
      revenue: undefined,
      activity_summary: undefined,
      profile_url: undefined,
      dnc: lead.dnc ?? false,
    });
  }, [startCall]);

  const handleView = useCallback((lead: FullLead) => {
    router.push(`/dialer?lead_id=${lead.id}`);
  }, [router]);

  const stats = useMemo(() => {
    const connected = leads.filter((l) => l.status === "connected" || l.status === "meeting_booked").length;
    const contacted = leads.filter((l) => (l.call_attempts ?? 0) > 0).length;
    const rate = contacted > 0 ? Math.round((connected / contacted) * 100) : 0;
    return { total: leads.length, contacted, connected, rate };
  }, [leads]);

  return (
    <>
      <DashboardHeader
        title="Leads"
        subtitle={`${leads.length} total · ${stats.contacted} contacted`}
        showImport
      />

      <main className="flex-1 overflow-y-auto">
        {/* Stats strip */}
        {!loading && leads.length > 0 && (
          <div className="border-b border-white/[0.06] px-4 py-3 lg:px-6">
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Total", value: stats.total, color: "text-white" },
                { label: "Contacted", value: stats.contacted, color: "text-amber-300" },
                { label: "Connected", value: stats.connected, color: "text-emerald-300", icon: TrendingUp },
                { label: "Connect Rate", value: `${stats.rate}%`, color: stats.rate >= 20 ? "text-emerald-300" : "text-slate-300" },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  {Icon && <Icon className="h-3.5 w-3.5 text-emerald-400/70" />}
                  <span className={`text-lg font-bold tabular-nums ${color}`}>{value}</span>
                  <span className="text-xs text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + tabs */}
        <div className="border-b border-white/[0.06] px-4 py-3 space-y-3 lg:px-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, phone…"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tab pills */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {TAB_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  tab === key
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {label}
                {tabCounts[key] > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    tab === key ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.06] text-slate-500",
                  )}>
                    {tabCounts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="px-4 py-5 lg:px-6">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <motion.div
              key={`${tab}-${debouncedSearch}-${page}`}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden"
              animate="show"
            >
              {paginated.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onCall={() => handleCall(lead)}
                  onView={() => handleView(lead)}
                />
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-slate-600">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
