"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type LeadStatus = "hot" | "warm" | "cold";

export interface QueueLead {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email?: string;
  score: number;
  status: LeadStatus;
  attempts: number;
  tags: string[];
  source?: "seed" | "import";
}

/** Handles commas inside double quotes. */
export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
    } else if ((c === "," || c === "\t") && !inQ) {
      result.push(cur.trim());
      cur = "";
    } else if (c !== "\r") {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result.map((s) => s.replace(/^"|"$/g, ""));
}

function normHeader(h: string) {
  return h.toLowerCase().replace(/\s+/g, "_").replace(/"/g, "");
}

function findCol(headers: string[], aliases: string[]): number {
  const H = headers.map(normHeader);
  for (const a of aliases) {
    const i = H.findIndex((h) => h === a || h.endsWith(a) || h.includes(a));
    if (i >= 0) return i;
  }
  return -1;
}

function hashScore(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 60 + (h % 35);
}

function scoreToStatus(score: number): LeadStatus {
  if (score >= 85) return "hot";
  if (score >= 70) return "warm";
  return "cold";
}

export function parseLeadsFromCSV(text: string): QueueLead[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());

  const iName = findCol(headers, ["name", "full_name", "contact", "contact_name"]);
  const iFirst = findCol(headers, ["first_name", "firstname"]);
  const iLast = findCol(headers, ["last_name", "lastname"]);
  const iCompany = findCol(headers, ["company", "organization", "account", "business", "account_name"]);
  const iTitle = findCol(headers, ["title", "role", "job_title", "position", "job"]);

  const out: QueueLead[] = [];
  const ts = Date.now();

  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r]);
    if (cells.length === 0 || cells.every((c) => !c)) continue;

    let name = "";
    if (iName >= 0 && cells[iName]) name = cells[iName].trim();
    else if (iFirst >= 0 || iLast >= 0) {
      name = [cells[iFirst] ?? "", cells[iLast] ?? ""].join(" ").trim();
    }
    if (!name && cells[0]) name = cells[0].trim();
    if (!name) continue;

    const company =
      (iCompany >= 0 && cells[iCompany]?.trim()) ||
      (cells[1]?.trim() ?? "Unknown company");
    const title =
      (iTitle >= 0 && cells[iTitle]?.trim()) || cells[2]?.trim() || "—";

    const score = hashScore(`${name}|${company}`);
    const status = scoreToStatus(score);
    out.push({
      id: `import-${ts}-${r}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      title,
      company,
      phone: "",
      score,
      status,
      attempts: 0,
      tags: ["Imported"],
      source: "import",
    });
  }

  return out;
}

function dbStatusToLeadStatus(dbStatus: string | null, aiScore: number): LeadStatus {
  if (dbStatus === "meeting_booked") return "hot";
  if (dbStatus === "connected" || dbStatus === "contacted") return "warm";
  if (dbStatus === "not_interested" || dbStatus === "do_not_call") return "cold";
  if (aiScore >= 85) return "hot";
  if (aiScore >= 70) return "warm";
  return "cold";
}

type LeadsCtx = {
  leads: QueueLead[];
  loading: boolean;
  importCsv: (text: string) => { added: number; error?: string };
  removeLead: (id: string) => void;
  resetToSeed: () => void;
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
  refresh: () => void;
};

const LeadsContext = createContext<LeadsCtx | null>(null);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<QueueLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadLeads = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("leads")
        .select("id,name,title,company,phone,email,ai_score,status,call_attempts,tags,source")
        .eq("user_id", session.user.id)
        .order("ai_score", { ascending: false })
        .limit(200);

      if (error) {
        console.error("LeadsContext load error:", error);
        return;
      }

      const mapped: QueueLead[] = (data ?? []).map((row) => ({
        id: row.id,
        name: row.name ?? "Unknown",
        title: row.title ?? "",
        company: row.company ?? "",
        phone: row.phone ?? "",
        email: row.email ?? undefined,
        score: row.ai_score ?? 0,
        status: dbStatusToLeadStatus(row.status, row.ai_score ?? 0),
        attempts: row.call_attempts ?? 0,
        tags: (row.tags as string[]) ?? [],
        source: row.source === "import" ? "import" : undefined,
      }));

      setLeads(mapped);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const importCsv = useCallback((text: string) => {
    const rows = parseLeadsFromCSV(text);
    if (rows.length === 0) {
      return {
        added: 0,
        error:
          "No rows imported. Use a header row with columns like name, company, title (or export from your CRM).",
      };
    }
    return { added: rows.length };
  }, []);

  const removeLead = useCallback((id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const resetToSeed = useCallback(() => {
    // No-op with Supabase backend
  }, []);

  const value = useMemo(
    () => ({
      leads,
      loading,
      importCsv,
      removeLead,
      resetToSeed,
      importOpen,
      setImportOpen,
      refresh: loadLeads,
    }),
    [leads, loading, importCsv, removeLead, resetToSeed, importOpen, loadLeads],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}
