"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Phone, Mail, Building2, Search, X, ExternalLink,
  CalendarClock, Hash, Tag,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLeads } from "@/contexts/leads-context";

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
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "queued", label: "Queued" },
  { value: "contacted", label: "Contacted" },
  { value: "connected", label: "Connected" },
  { value: "meeting_booked", label: "Meeting" },
  { value: "not_interested", label: "Not Interested" },
];

const STATUS_BADGE: Record<string, string> = {
  new: "bg-slate-500/15 text-slate-300 border border-slate-500/25",
  queued: "bg-blue-500/15 text-blue-300 border border-blue-500/25",
  contacted: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  connected: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  meeting_booked: "bg-violet-500/15 text-violet-300 border border-violet-500/25",
  not_interested: "bg-red-500/15 text-red-300 border border-red-500/25",
  do_not_call: "bg-rose-900/50 text-rose-300 border border-rose-500/25",
};

function scoreColor(score: number | null) {
  if (!score) return "text-muted-foreground";
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-300";
  return "text-muted-foreground";
}

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface DetailPanelProps {
  lead: FullLead;
  onClose: () => void;
  onCallNow: (lead: FullLead) => void;
  onMarkStatus: (lead: FullLead, status: string) => void;
}

function DetailPanel({ lead, onClose, onCallNow, onMarkStatus }: DetailPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-brand/15 text-sm font-semibold text-brand">
              {initials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold">{lead.name}</p>
            {lead.title && <p className="text-xs text-muted-foreground">{lead.title}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {lead.company && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{lead.company}</span>
          </div>
        )}

        <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Phone</span>
            <a href={`tel:${lead.phone}`} className="font-mono text-primary hover:underline">
              {lead.phone}
            </a>
          </div>
          {lead.email && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <a href={`mailto:${lead.email}`} className="truncate text-primary hover:underline max-w-[180px]">
                {lead.email}
              </a>
            </div>
          )}
          {lead.linkedin && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">LinkedIn</span>
              <a
                href={lead.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                Profile <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge className={cn("rounded-full px-2 py-0 text-[10px]", STATUS_BADGE[lead.status] ?? STATUS_BADGE.new)}>
              {lead.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">AI Score</span>
            <span className={cn("font-bold tabular-nums", scoreColor(lead.ai_score))}>
              {lead.ai_score ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Attempts</span>
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3 text-muted-foreground" />
              {lead.call_attempts ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last called</span>
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3 text-muted-foreground" />
              {formatDate(lead.last_called_at)}
            </span>
          </div>
        </div>

        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lead.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" /> {tag}
              </span>
            ))}
          </div>
        )}

        {lead.notes && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
            <p className="text-sm leading-relaxed">{lead.notes}</p>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4 space-y-2">
        <Button
          className="w-full gap-2 bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] font-semibold"
          onClick={() => onCallNow(lead)}
        >
          <Phone className="h-4 w-4" /> Call Now
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-xs hover:bg-white/10"
            onClick={() => onMarkStatus(lead, "not_interested")}
          >
            Not Interested
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-xs hover:bg-white/10"
            onClick={() => onMarkStatus(lead, "meeting_booked")}
          >
            Meeting Booked
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const { leads: contextLeads, setImportOpen } = useLeads();
  const [leads, setLeads] = useState<FullLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<FullLead | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) { setLoading(false); return; }

        const { data, error } = await supabase
          .from("leads")
          .select("id,name,title,company,phone,email,ai_score,status,call_attempts,last_called_at,notes,tags,linkedin,created_at")
          .eq("user_id", session.user.id)
          .order("ai_score", { ascending: false });

        if (error) { console.error("Leads load error:", error); return; }
        setLeads((data ?? []) as FullLead[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contextLeads.length]); // reload when context signals a new import

  const filtered = useMemo(() => {
    let list = leads;
    if (statusFilter !== "all") list = list.filter((l) => l.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q) ||
          l.phone.includes(q),
      );
    }
    return list;
  }, [leads, statusFilter, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCallNow = (lead: FullLead) => {
    router.push(`/dialer?lead_id=${lead.id}`);
  };

  const handleMarkStatus = async (lead: FullLead, status: string) => {
    const supabase = createClient();
    await supabase.from("leads").update({ status }).eq("id", lead.id);
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    if (selectedLead?.id === lead.id) setSelectedLead({ ...selectedLead, status });
  };

  const handleDialSelected = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    router.push(`/dialer?lead_id=${ids[0]}`);
  };

  const imported = contextLeads.filter((l) => l.source === "import").length;

  return (
    <>
      <DashboardHeader
        title="Leads"
        subtitle={`${leads.length} in queue${imported ? ` · ${imported} from CSV` : ""}`}
        showImport
      />
      <main className="flex flex-1 overflow-hidden">
        {/* Lead list */}
        <div className={cn("flex flex-col flex-1 overflow-hidden", selectedLead ? "border-r border-white/10" : "")}>
          {/* Filters + search */}
          <div className="shrink-0 space-y-3 border-b border-white/10 px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, phone…"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    statusFilter === f.value
                      ? "bg-brand/20 text-brand border border-brand/30"
                      : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selected.size} selected</span>
                <Button
                  size="sm"
                  className="h-7 bg-brand text-[oklch(0.08_0.04_153)] text-xs font-semibold hover:bg-[oklch(0.76_0.27_153)]"
                  onClick={handleDialSelected}
                >
                  <Phone className="mr-1.5 h-3 w-3" /> Start dialing
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Lead rows */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-px px-6 py-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5 mb-2" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <p className="text-sm font-medium">No leads match this filter</p>
                <p className="text-xs text-muted-foreground">Try a different status or clear the search.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {filtered.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-3 px-6 py-3.5 transition-colors hover:bg-white/[0.04]",
                      selectedLead?.id === lead.id && "bg-white/[0.06]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(lead.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-brand"
                    />
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-brand/15 text-[11px] font-semibold text-brand">
                        {initials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{lead.name}</p>
                        <Badge
                          className={cn(
                            "h-4 shrink-0 rounded-full px-1.5 py-0 text-[10px]",
                            STATUS_BADGE[lead.status] ?? STATUS_BADGE.new,
                          )}
                        >
                          {lead.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="truncate text-xs text-muted-foreground">
                          {[lead.title, lead.company].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="hidden text-right sm:block">
                        <div className={cn("text-sm font-bold tabular-nums", scoreColor(lead.ai_score))}>
                          {lead.ai_score ?? "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">score</div>
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-white/10"
                          type="button"
                          title="Call now"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallNow(lead);
                          }}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                            title="Send email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-white/10 px-6 py-3 text-xs text-muted-foreground">
            {filtered.length} of {leads.length} leads
          </div>
        </div>

        {/* Detail panel */}
        {selectedLead && (
          <div className="w-80 shrink-0 overflow-hidden">
            <DetailPanel
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onCallNow={handleCallNow}
              onMarkStatus={handleMarkStatus}
            />
          </div>
        )}
      </main>
    </>
  );
}
