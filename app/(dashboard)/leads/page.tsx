"use client";

export const dynamic = 'force-dynamic';

import {
  useEffect, useState, useMemo, useCallback, useRef,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Mail, Search, X, ExternalLink, ChevronLeft, ChevronRight,
  Sparkles, TrendingUp, Clock, UserPlus, MoreHorizontal, Pencil,
  Trash2, Eye, Filter, Download, Plus, Tag, Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLeads } from "@/contexts/leads-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { useCallContext } from "@/lib/call-context";
import { AnimatePresence as AP } from "framer-motion";
import { LeadAddModal } from "@/components/leads/lead-add-modal";
import { LeadEditModal } from "@/components/leads/lead-edit-modal";
import { BulkActionBar } from "@/components/leads/bulk-action-bar";
import { LeadFilterDrawer, type LeadFilters, EMPTY_FILTERS, isFilterActive } from "@/components/leads/lead-filter-drawer";
import { LeadExportModal } from "@/components/leads/lead-export-modal";
import { LeadTableView } from "@/components/leads/lead-table-view";
import { ViewToggle, type ViewMode } from "@/components/leads/view-toggle";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FullLead {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
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
  source: string | null;
  created_at: string;
  deleted_at?: string | null;
  dnc?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const TAB_FILTERS = [
  { key: "all",      label: "All" },
  { key: "new",      label: "New" },
  { key: "hot",      label: "Hot" },
  { key: "callback", label: "Callbacks" },
  { key: "done",     label: "Done" },
  { key: "dnc",      label: "DNC" },
  { key: "trash",    label: "Trash" },
] as const;

type TabKey = typeof TAB_FILTERS[number]["key"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:            { bg: "bg-slate-500/15",   text: "text-slate-300" },
  queued:         { bg: "bg-blue-500/15",    text: "text-blue-300" },
  contacted:      { bg: "bg-amber-500/15",   text: "text-amber-300" },
  connected:      { bg: "bg-emerald-500/15", text: "text-emerald-300" },
  callback:       { bg: "bg-amber-500/15",   text: "text-amber-300" },
  meeting_booked: { bg: "bg-violet-500/15",  text: "text-violet-300" },
  not_interested: { bg: "bg-red-500/15",     text: "text-red-400" },
  do_not_call:    { bg: "bg-rose-900/40",    text: "text-rose-400" },
  wrong_number:   { bg: "bg-red-500/15",     text: "text-red-400" },
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
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
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

// ─── 3-dot menu ───────────────────────────────────────────────────────────────

import { useEffect as useEff, useRef as useR } from "react";

function LeadMenu({
  lead, onCall, onView, onEdit, onDelete,
}: {
  lead: FullLead;
  onCall: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useR<HTMLDivElement>(null);

  useEff(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const items = [
    { icon: <Phone className="h-3.5 w-3.5" />, label: "Call", onClick: onCall, cls: "text-emerald-400" },
    { icon: <Eye className="h-3.5 w-3.5" />, label: "View", onClick: onView, cls: "" },
    { icon: <Pencil className="h-3.5 w-3.5" />, label: "Edit", onClick: onEdit, cls: "" },
    { icon: <Trash2 className="h-3.5 w-3.5" />, label: "Delete", onClick: onDelete, cls: "text-red-400" },
  ];

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-slate-600 hover:text-white hover:border-white/10 transition sm:opacity-0 sm:group-hover:opacity-100"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-7 z-50 min-w-[140px] rounded-xl border border-white/[0.10] bg-[oklch(0.09_0.006_285)] py-1 shadow-2xl"
          >
            {items.map(({ icon, label, onClick, cls }) => (
              <button
                key={label}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onClick(); }}
                className={cn("flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] transition min-h-[40px]", cls)}
              >
                {icon}
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.006_285)] p-6 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15">
          <Trash2 className="h-5 w-5 text-red-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">Delete {name}?</h3>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          This lead will be moved to trash and automatically deleted after 7 days. Restore from the Trash tab.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.04] transition">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

const cardVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function LeadCard({
  lead, selected, onSelect, onCall, onView, onEdit, onDelete,
}: {
  lead: FullLead;
  selected: boolean;
  onSelect: () => void;
  onCall: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const grad = avatarGradient(lead.name);
  const scoreGrad = scoreGradient(lead.ai_score);
  const isHot = (lead.tags ?? []).includes("hot") || lead.status === "callback" || lead.status === "meeting_booked";

  return (
    <motion.div
      variants={cardVariants}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={onView}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-all",
        "border-white/[0.07] bg-[oklch(0.09_0.006_285)] hover:border-white/[0.14] hover:bg-white/[0.04] hover:-translate-y-0.5",
        isHot && "border-amber-500/20 hover:border-amber-500/35",
        selected && "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      {/* Checkbox top-left — larger tap area on mobile */}
      <div
        className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center"
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <div className={cn(
          "flex h-4 w-4 items-center justify-center rounded border transition",
          selected
            ? "border-emerald-500 bg-emerald-500"
            : "border-white/[0.15] bg-white/[0.03] sm:opacity-0 sm:group-hover:opacity-100",
        )}>
          {selected && <Check className="h-2.5 w-2.5 text-black" />}
        </div>
      </div>

      {/* 3-dot menu top-right */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        {isHot && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15">
            <Sparkles className="h-3 w-3 text-amber-400" />
          </span>
        )}
        <LeadMenu lead={lead} onCall={onCall} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Top: avatar + score */}
      <div className="flex items-start gap-3 pt-1">
        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-sm font-bold text-white shadow-sm`}>
          {getInitials(lead.name)}
          {lead.ai_score != null && lead.ai_score > 0 && (
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

      {/* Status + attempts */}
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
          <Phone className="h-3 w-3 shrink-0 text-slate-600" />{lead.phone}
        </p>
        {lead.email && (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
            <Mail className="h-3 w-3 shrink-0 text-slate-600" />{lead.email}
          </p>
        )}
      </div>

      {/* Tags */}
      {(lead.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(lead.tags ?? []).slice(0, 2).map((t) => (
            <span key={t} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300">
              {t}
            </span>
          ))}
          {(lead.tags ?? []).length > 2 && (
            <span className="text-[10px] text-slate-600">+{(lead.tags ?? []).length - 2}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-slate-600">
          <Clock className="h-2.5 w-2.5" />
          {formatLastCall(lead.last_called_at)}
        </span>
        {lead.linkedin && (
          <a href={lead.linkedin} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.06] text-slate-600 hover:text-slate-300 hover:border-white/10 transition">
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onCall}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500">
          <Phone className="h-3.5 w-3.5" /> Call
        </button>
        <button type="button" onClick={onView}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
          View
        </button>
      </div>
    </motion.div>
  );
}

// ─── Trash Lead Card ──────────────────────────────────────────────────────────

function TrashLeadCard({
  lead,
  onRestore,
  onDeleteForever,
}: {
  lead: FullLead;
  onRestore: () => void;
  onDeleteForever: () => void;
}) {
  const grad = avatarGradient(lead.name);
  const deletedAt = lead.deleted_at ? new Date(lead.deleted_at) : null;
  const daysAgo = deletedAt
    ? Math.max(0, Math.floor((Date.now() - deletedAt.getTime()) / 86400000))
    : 0;
  const daysLeft = Math.max(0, 7 - daysAgo);

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-4 opacity-70 transition-all hover:opacity-90 hover:border-red-500/20">
      {/* Deleted badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
          Deleted {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
        </span>
        <span className="text-[10px] text-slate-600">
          Auto-deletes in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-sm font-bold text-white`}>
          {getInitials(lead.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{lead.name}</p>
          {(lead.title || lead.company) && (
            <p className="truncate text-[11px] text-slate-500">
              {[lead.title, lead.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <p className="font-mono text-[11px] text-slate-500">{lead.phone}</p>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/25 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30"
        >
          Restore
        </button>
        <button
          type="button"
          onClick={onDeleteForever}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600/15 border border-red-500/25 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-600/25"
        >
          Delete Forever
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  tab,
  onImport,
  onAddLead,
}: {
  tab: TabKey;
  onImport: () => void;
  onAddLead: () => void;
}) {
  if (tab === 'all') {
    return (
      <PremiumEmptyState
        icon={UserPlus}
        accent="violet"
        title="Your pipeline starts here"
        description="Import a CSV from HubSpot, Salesforce, or a spreadsheet — or add leads one at a time."
        primaryAction={{ label: 'Import CSV', onClick: onImport }}
        secondaryAction={{ label: 'Add lead', onClick: onAddLead }}
        features={[
          { icon: Sparkles, label: 'AI scoring' },
          { icon: Phone, label: 'Power dial ready' },
          { icon: Tag, label: 'Tags & filters' },
        ]}
      />
    );
  }

  const msgs: Record<Exclude<TabKey, 'all'>, { title: string; sub: string }> = {
    new:      { title: "No new leads", sub: "All leads have been contacted." },
    hot:      { title: "No hot leads", sub: "Leads tagged hot or with callback status will appear here." },
    callback: { title: "No callbacks", sub: "Leads marked for callback appear here." },
    done:     { title: "No completed leads", sub: "Meeting booked or not interested leads appear here." },
    dnc:      { title: "No DNC leads", sub: "Leads marked Do Not Call appear here." },
    trash:    { title: "Trash is empty", sub: "Deleted leads appear here for 7 days before permanent removal." },
  };
  const { title, sub } = msgs[tab as Exclude<TabKey, 'all'>];
  return (
    <PremiumEmptyState
      icon={UserPlus}
      accent="emerald"
      title={title}
      description={sub}
      compact
    />
  );
}

// ─── Apply advanced filters ───────────────────────────────────────────────────

function applyAdvancedFilters(leads: FullLead[], filters: LeadFilters): FullLead[] {
  let list = [...leads];

  if (filters.statuses.length > 0) {
    list = list.filter((l) => filters.statuses.includes(l.status));
  }
  if (filters.sources.length > 0) {
    list = list.filter((l) => filters.sources.includes(l.source ?? ''));
  }
  if (filters.lastContact) {
    const now = Date.now();
    const ONE_DAY = 86400000;
    list = list.filter((l) => {
      const ts = l.last_called_at ? new Date(l.last_called_at).getTime() : null;
      switch (filters.lastContact) {
        case 'today':     return ts !== null && (now - ts) < ONE_DAY;
        case 'yesterday': return ts !== null && (now - ts) >= ONE_DAY && (now - ts) < 2 * ONE_DAY;
        case '7d':        return ts !== null && (now - ts) < 7 * ONE_DAY;
        case '30d':       return ts !== null && (now - ts) < 30 * ONE_DAY;
        case 'never':     return ts === null;
        default:          return true;
      }
    });
  }
  if (filters.hasEmail === true)  list = list.filter((l) => !!l.email);
  if (filters.hasEmail === false) list = list.filter((l) => !l.email);
  if (filters.hasNotes === true)  list = list.filter((l) => !!l.notes);
  if (filters.hasNotes === false) list = list.filter((l) => !l.notes);
  if (filters.minAttempts > 0) {
    list = list.filter((l) => (l.call_attempts ?? 0) >= filters.minAttempts);
  }
  if (filters.maxAttempts < 999) {
    list = list.filter((l) => (l.call_attempts ?? 0) <= filters.maxAttempts);
  }

  return list;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const { leads: contextLeads, setImportOpen } = useLeads();
  const { currentWorkspace, apiFetch } = useWorkspace();
  const { startCall } = useCallContext();

  const [leads, setLeads] = useState<FullLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLead, setEditLead] = useState<FullLead | null>(null);
  const [deleteLead, setDeleteLead] = useState<FullLead | null>(null);
  const [deleteForeverLead, setDeleteForeverLead] = useState<FullLead | null>(null);
  const [deleteForeverBusy, setDeleteForeverBusy] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const loadLeads = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id,name,first_name,last_name,title,company,phone,email,ai_score,status,call_attempts,last_called_at,notes,tags,linkedin,source,created_at,dnc,deleted_at")
        .eq("workspace_id", currentWorkspace.id)
        .order("ai_score", { ascending: false });

      if (error) { console.error("Leads load error:", error); return; }
      setLeads((data ?? []) as FullLead[]);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => { loadLeads(); }, [loadLeads, contextLeads.length, currentWorkspace?.id]);

  // Real-time: reflect lead changes (status, call_attempts, dnc, deleted_at) without full reload
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('leads-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads((prev) => [payload.new as FullLead, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads((prev) =>
              prev.map((l) => l.id === (payload.new as FullLead).id ? { ...l, ...payload.new as FullLead } : l),
            );
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((l) => l.id !== (payload.old as { id: string }).id));
          }
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { all: 0, new: 0, hot: 0, callback: 0, done: 0, dnc: 0, trash: 0 };
    for (const l of leads) {
      if (l.deleted_at) { counts.trash++; continue; }
      counts.all++;
      if (l.status === "new" || l.status === "queued") counts.new++;
      if (l.status === "callback" || l.status === "meeting_booked" || (l.tags ?? []).includes("hot")) counts.hot++;
      if (l.status === "callback") counts.callback++;
      if (l.status === "meeting_booked" || l.status === "not_interested") counts.done++;
      if (l.dnc || l.status === "do_not_call") counts.dnc++;
    }
    return counts;
  }, [leads]);

  // Base tab filter (no advanced filters)
  const tabFiltered = useMemo(() => {
    let list = [...leads];
    if (tab === "trash") return list.filter((l) => !!l.deleted_at);
    list = list.filter((l) => !l.deleted_at);

    if (tab === "new")      list = list.filter((l) => l.status === "new" || l.status === "queued");
    else if (tab === "hot") list = list.filter((l) => l.status === "callback" || l.status === "meeting_booked" || (l.tags ?? []).includes("hot"));
    else if (tab === "callback") list = list.filter((l) => l.status === "callback");
    else if (tab === "done") list = list.filter((l) => l.status === "meeting_booked" || l.status === "not_interested");
    else if (tab === "dnc") list = list.filter((l) => l.dnc || l.status === "do_not_call");

    return list;
  }, [leads, tab]);

  // Advanced filters + search
  const filtered = useMemo(() => {
    let list = isFilterActive(filters) && tab !== "trash"
      ? applyAdvancedFilters(tabFiltered, filters)
      : tabFiltered;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.email ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [tabFiltered, debouncedSearch, filters, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = useCallback((t: TabKey) => {
    setTab(t);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleCall = useCallback((lead: FullLead) => {
    void startCall(lead.phone, {
      id: lead.id, name: lead.name, company: lead.company ?? "",
      phone: lead.phone, title: lead.title ?? "",
      email: lead.email ?? undefined, linkedin: lead.linkedin ?? undefined,
      ai_score: lead.ai_score ?? 0, status: lead.status as never,
      call_attempts: lead.call_attempts ?? 0,
      last_called_at: lead.last_called_at ?? undefined,
      notes: lead.notes ?? undefined, tags: lead.tags ?? [],
      company_size: undefined, industry: undefined, revenue: undefined,
      activity_summary: undefined, profile_url: undefined, dnc: lead.dnc ?? false,
    });
  }, [startCall]);

  const handleView = useCallback((lead: FullLead) => {
    router.push(`/leads/${lead.id}`);
  }, [router]);

  const handleDeleteSingle = useCallback(async (lead: FullLead) => {
    const res = await apiFetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setLeads((p) => p.map((l) => l.id === lead.id ? { ...l, deleted_at: new Date().toISOString() } : l));
    toast.success(`${lead.name} deleted`, {
      description: "Recoverable from Trash tab for 30 days",
    });
    setDeleteLead(null);
  }, []);

  const handleRestoreFromTrash = useCallback(async (lead: FullLead) => {
    const res = await apiFetch(`/api/leads/${lead.id}/restore`, { method: "POST" });
    if (!res.ok) { toast.error("Restore failed"); return; }
    setLeads((p) => p.map((l) => l.id === lead.id ? { ...l, deleted_at: null } : l));
    toast.success(`${lead.name} restored`);
  }, []);

  const handleDeleteForever = useCallback(async (lead: FullLead) => {
    setDeleteForeverBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("leads").delete().eq("id", lead.id);
      if (error) { toast.error("Delete failed: " + error.message); return; }
      setLeads((p) => p.filter((l) => l.id !== lead.id));
      toast.success(`${lead.name} permanently deleted`);
      setDeleteForeverLead(null);
    } finally {
      setDeleteForeverBusy(false);
    }
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((l) => l.id)));
    }
  }, [paginated, selectedIds.size]);

  const handleBulkDone = useCallback((action: string, ids: string[]) => {
    if (action === "delete") {
      setLeads((p) => p.map((l) => ids.includes(l.id) ? { ...l, deleted_at: new Date().toISOString() } : l));
    } else if (action === "mark_dnc") {
      setLeads((p) => p.map((l) => ids.includes(l.id) ? { ...l, status: "do_not_call", dnc: true } : l));
    } else if (action === "mark_hot") {
      setLeads((p) => p.map((l) => ids.includes(l.id) ? { ...l, tags: [...(l.tags ?? []).filter((t) => t !== "hot"), "hot"] } : l));
    }
  }, []);

  const handleLeadCreated = useCallback((newLead: Record<string, unknown>) => {
    setLeads((p) => [newLead as unknown as FullLead, ...p]);
  }, []);

  const handleLeadEdited = useCallback((updated: FullLead) => {
    setLeads((p) => p.map((l) => l.id === updated.id ? updated : l));
  }, []);

  const stats = useMemo(() => {
    const active = leads.filter((l) => !l.deleted_at);
    const connected = active.filter((l) => l.status === "connected" || l.status === "meeting_booked").length;
    const contacted = active.filter((l) => (l.call_attempts ?? 0) > 0).length;
    const rate = contacted > 0 ? Math.round((connected / contacted) * 100) : 0;
    return { total: active.length, contacted, connected, rate };
  }, [leads]);

  const filterBadgeCount = [
    filters.statuses.length > 0,
    filters.sources.length > 0,
    !!filters.lastContact,
    filters.hasEmail !== null,
    filters.hasNotes !== null,
    filters.minAttempts > 0,
    filters.maxAttempts < 999,
  ].filter(Boolean).length;

  return (
    <>
      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <LeadAddModal
            onClose={() => setShowAddModal(false)}
            onCreated={handleLeadCreated}
          />
        )}
        {editLead && (
          <LeadEditModal
            lead={editLead}
            onClose={() => setEditLead(null)}
            onSaved={(l) => handleLeadEdited(l as unknown as FullLead)}
          />
        )}
        {deleteLead && (
          <DeleteConfirmModal
            name={deleteLead.name}
            onConfirm={() => handleDeleteSingle(deleteLead)}
            onCancel={() => setDeleteLead(null)}
          />
        )}
        <ConfirmDialog
          open={deleteForeverLead !== null}
          onOpenChange={(open) => { if (!open) setDeleteForeverLead(null); }}
          title={`Delete ${deleteForeverLead?.name ?? 'lead'} forever?`}
          description="This cannot be undone. All call history for this lead will be permanently removed."
          confirmLabel="Delete forever"
          variant="destructive"
          loading={deleteForeverBusy}
          onConfirm={() => { if (deleteForeverLead) void handleDeleteForever(deleteForeverLead); }}
        />
        {showExport && (
          <LeadExportModal
            onClose={() => setShowExport(false)}
            selectedCount={selectedIds.size}
            filteredCount={filtered.length}
            selectedIds={[...selectedIds]}
          />
        )}
      </AnimatePresence>

      {/* Filter drawer */}
      <LeadFilterDrawer
        open={filterDrawerOpen}
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        onClose={() => setFilterDrawerOpen(false)}
      />

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BulkActionBar
            selectedIds={[...selectedIds]}
            onClear={() => setSelectedIds(new Set())}
            onBulkDone={handleBulkDone}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto">
        {/* Stats strip */}
        {!loading && leads.filter((l) => !l.deleted_at).length > 0 && (
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

        {/* Toolbar */}
        <div className="border-b border-white/[0.06] px-4 py-3 space-y-3 lg:px-6">
          {/* Top row: search + actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, phone…"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25 transition"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* Filter */}
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                  isFilterActive(filters)
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/[0.07] text-slate-500 hover:text-slate-300",
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {filterBadgeCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                    {filterBadgeCount}
                  </span>
                )}
              </button>

              {/* Export */}
              <button
                type="button"
                onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* View toggle */}
              <ViewToggle value={viewMode} onChange={setViewMode} />

              {/* Add lead */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Lead</span>
              </button>
            </div>
          </div>

          {/* Filter chips */}
          {isFilterActive(filters) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-600">Filters:</span>
              {filters.statuses.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-300">
                  {s.replace(/_/g, " ")}
                  <button type="button" onClick={() => setFilters((f) => ({ ...f, statuses: f.statuses.filter((x) => x !== s) }))}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {filters.lastContact && (
                <span className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-300">
                  {filters.lastContact}
                  <button type="button" onClick={() => setFilters((f) => ({ ...f, lastContact: "" }))}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition">
                Clear all
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {TAB_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  tab === key
                    ? key === "trash"
                      ? "bg-red-500/15 text-red-300"
                      : "bg-emerald-500/15 text-emerald-300"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {label}
                {tabCounts[key] > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    tab === key
                      ? key === "trash" ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/[0.06] text-slate-500",
                  )}>
                    {tabCounts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-5 lg:px-6">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <EmptyState
              tab={tab}
              onImport={() => setImportOpen(true)}
              onAddLead={() => setShowAddModal(true)}
            />
          ) : viewMode === "table" ? (
            <LeadTableView
              leads={paginated}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              allSelected={selectedIds.size === paginated.length && paginated.length > 0}
              onCall={(l) => handleCall(leads.find((x) => x.id === l.id) ?? (l as unknown as FullLead))}
              onView={(l) => handleView(leads.find((x) => x.id === l.id) ?? (l as unknown as FullLead))}
              onEdit={(l) => setEditLead(leads.find((x) => x.id === l.id) ?? null)}
              onDelete={(l) => setDeleteLead(leads.find((x) => x.id === l.id) ?? null)}
            />
          ) : (
            <>
              {/* Select all bar (only in grid view when something's selected) */}
              {selectedIds.size > 0 && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                  <span className="text-xs text-slate-400">
                    {selectedIds.size} of {paginated.length} selected
                  </span>
                  {selectedIds.size < paginated.length && (
                    <button type="button" onClick={handleSelectAll}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition">
                      Select all {paginated.length}
                    </button>
                  )}
                  <button type="button" onClick={() => setSelectedIds(new Set())}
                    className="ml-auto text-xs text-slate-600 hover:text-slate-400 transition">
                    Clear
                  </button>
                </div>
              )}

              <motion.div
                key={`${tab}-${debouncedSearch}-${page}`}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
                initial="hidden"
                animate="show"
              >
                {paginated.map((lead) =>
                  tab === "trash" ? (
                    <TrashLeadCard
                      key={lead.id}
                      lead={lead}
                      onRestore={() => handleRestoreFromTrash(lead)}
                      onDeleteForever={() => setDeleteForeverLead(lead)}
                    />
                  ) : (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      selected={selectedIds.has(lead.id)}
                      onSelect={() => handleToggleSelect(lead.id)}
                      onCall={() => handleCall(lead)}
                      onView={() => handleView(lead)}
                      onEdit={() => setEditLead(lead)}
                      onDelete={() => setDeleteLead(lead)}
                    />
                  )
                )}
              </motion.div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-slate-600">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-500">Page {page} / {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30">
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
