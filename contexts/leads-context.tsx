"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LeadStatus = "hot" | "warm" | "cold";

export interface QueueLead {
  id: string;
  name: string;
  title: string;
  company: string;
  score: number;
  status: LeadStatus;
  attempts: number;
  tags: string[];
  source?: "seed" | "import";
}

const STORAGE_KEY = "growthdialer-queue-leads-v1";

const SEED_LEADS: QueueLead[] = [
  {
    id: "1",
    name: "James Whitfield",
    title: "CTO",
    company: "BluePeak Systems",
    score: 92,
    status: "hot",
    attempts: 0,
    tags: ["SaaS", "Series B"],
    source: "seed",
  },
  {
    id: "2",
    name: "Priya Nair",
    title: "Director of Ops",
    company: "Vortex Analytics",
    score: 85,
    status: "warm",
    attempts: 1,
    tags: ["Enterprise"],
    source: "seed",
  },
  {
    id: "3",
    name: "Marcus Webb",
    title: "VP Engineering",
    company: "Nimbus Cloud",
    score: 78,
    status: "warm",
    attempts: 2,
    tags: ["Cloud", "Mid-Market"],
    source: "seed",
  },
  {
    id: "4",
    name: "Elena Kowalski",
    title: "Head of Sales",
    company: "Meridian Corp",
    score: 61,
    status: "cold",
    attempts: 3,
    tags: ["Outbound"],
    source: "seed",
  },
  {
    id: "5",
    name: "Raj Patel",
    title: "CEO",
    company: "Stackify AI",
    score: 88,
    status: "hot",
    attempts: 0,
    tags: ["AI", "Startup"],
    source: "seed",
  },
];

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
      score,
      status,
      attempts: 0,
      tags: ["Imported"],
      source: "import",
    });
  }

  return out;
}

type LeadsCtx = {
  leads: QueueLead[];
  importCsv: (text: string) => { added: number; error?: string };
  removeLead: (id: string) => void;
  resetToSeed: () => void;
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
};

const LeadsContext = createContext<LeadsCtx | null>(null);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<QueueLead[]>(SEED_LEADS);
  const [hydrated, setHydrated] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QueueLead[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeads(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {
      /* ignore */
    }
  }, [leads, hydrated]);

  const importCsv = useCallback((text: string) => {
    try {
      const newOnes = parseLeadsFromCSV(text);
      if (newOnes.length === 0) {
        return {
          added: 0,
          error:
            "No rows imported. Use a header row with columns like name, company, title (or export from your CRM).",
        };
      }
      setLeads((prev) => [...newOnes, ...prev]);
      return { added: newOnes.length };
    } catch (e) {
      return {
        added: 0,
        error: e instanceof Error ? e.message : "Could not parse file.",
      };
    }
  }, []);

  const removeLead = useCallback((id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const resetToSeed = useCallback(() => {
    setLeads(SEED_LEADS);
  }, []);

  const value = useMemo(
    () => ({
      leads,
      importCsv,
      removeLead,
      resetToSeed,
      importOpen,
      setImportOpen,
    }),
    [leads, importCsv, removeLead, resetToSeed, importOpen]
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}
