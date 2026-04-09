"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockContacts } from "@/lib/mock-data";
import { useLeads } from "@/contexts/leads-context";

type SearchRow =
  | { kind: "crm"; id: string; title: string; subtitle: string }
  | { kind: "queue"; id: string; title: string; subtitle: string };

export function LeadSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const { leads } = useLeads();

  const rows = useMemo((): SearchRow[] => {
    const fromCrm: SearchRow[] = mockContacts.map((c) => ({
      kind: "crm" as const,
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: `${c.company} · ${c.title}`,
    }));
    const fromQueue: SearchRow[] = leads.map((l) => ({
      kind: "queue" as const,
      id: l.id,
      title: l.name,
      subtitle: `${l.company} · ${l.title}`,
    }));
    return [...fromQueue, ...fromCrm];
  }, [leads]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows.slice(0, 10);
    return rows
      .filter(
        (r) =>
          r.title.toLowerCase().includes(s) || r.subtitle.toLowerCase().includes(s)
      )
      .slice(0, 14);
  }, [q, rows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[oklch(0.086_0.024_282)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Search leads</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Name, company, or title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          className="border-white/12 bg-white/5"
        />
        <ScrollArea className="h-72 pr-2">
          <ul className="space-y-2">
            {filtered.map((r) => (
              <li
                key={`${r.kind}-${r.id}`}
                className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm transition-colors hover:border-brand/30 hover:bg-white/[0.06]"
                onClick={() => onOpenChange(false)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {r.kind === "queue" ? "Queue" : "CRM"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{r.subtitle}</div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
