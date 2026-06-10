"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2, Phone, Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { WorkflowIllustration } from "@/components/ui/workflow-illustration";
import { useLeads } from "@/contexts/leads-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
  { code: "CA", label: "🇨🇦 Canada" },
  { code: "AU", label: "🇦🇺 Australia" },
  { code: "PK", label: "🇵🇰 Pakistan" },
  { code: "IN", label: "🇮🇳 India" },
  { code: "DE", label: "🇩🇪 Germany" },
  { code: "FR", label: "🇫🇷 France" },
  { code: "AE", label: "🇦🇪 UAE" },
  { code: "SG", label: "🇸🇬 Singapore" },
];

interface ImportSummary {
  inserted: number;
  skipped: number;
  invalidPhones: number;
}

export function ImportLeadsDialog() {
  const router = useRouter();
  const { importOpen, setImportOpen, refresh } = useLeads();
  const { apiFetch } = useWorkspace();
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [defaultCountry, setDefaultCountry] = useState("US");
  const [dragOver, setDragOver] = useState(false);

  const resetState = useCallback(() => {
    setError(null);
    setSummary(null);
    setLoading(false);
    setDragOver(false);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setImportOpen(open);
    if (!open) resetState();
  }, [setImportOpen, resetState]);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      setSummary(null);
      try {
        const text = await file.text();

        const res = await apiFetch("/api/leads/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: text, defaultCountry }),
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(body.error ?? `Import failed (${res.status}). Please try again.`);
          return;
        }

        const inserted: number = body.inserted ?? 0;
        const skipped: number = body.skipped ?? 0;
        const invalidPhones: number = body.invalidPhones ?? 0;

        if (inserted === 0 && skipped === 0) {
          setError("No valid leads found in the CSV. Make sure the file has a header row with name and phone columns.");
          return;
        }

        setSummary({ inserted, skipped, invalidPhones });
        refresh();
      } catch {
        setError("Network error — check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [apiFetch, defaultCountry, refresh]
  );

  function goToLeads() {
    handleOpenChange(false);
    router.push("/leads");
  }

  function startDialing() {
    handleOpenChange(false);
    router.push("/dialer");
  }

  return (
    <Dialog open={importOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden border-white/10 bg-[oklch(0.09_0.006_285)] sm:max-w-lg">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(52,211,153,0.12),transparent)]"
          aria-hidden
        />

        <DialogHeader className="relative">
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            {summary ? "Import complete" : "Import leads"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {summary
              ? "Your leads are in the queue and ready to dial."
              : (
                <>
                  Upload a CSV with a header row. Recognized columns include{" "}
                  <span className="text-foreground/90">name</span>,{" "}
                  <span className="text-foreground/90">company</span>,{" "}
                  <span className="text-foreground/90">phone</span>,{" "}
                  <span className="text-foreground/90">title</span> (or export from HubSpot / Salesforce).
                </>
              )}
          </DialogDescription>
        </DialogHeader>

        {summary ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative space-y-4"
          >
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 shadow-[0_0_24px_rgba(52,211,153,0.08)]">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm font-medium text-emerald-200">
                {summary.inserted > 0
                  ? `${summary.inserted} lead${summary.inserted === 1 ? "" : "s"} added to your workspace`
                  : "Import processed"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Imported', value: summary.inserted, highlight: true },
                { label: 'Skipped', value: summary.skipped, highlight: false },
                { label: 'Invalid', value: summary.invalidPhones, highlight: summary.invalidPhones > 0 },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-center"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-50" aria-hidden />
                  <p className={cn(
                    'relative text-lg font-bold tabular-nums',
                    highlight && label === 'Invalid' ? 'text-amber-400' : highlight ? 'text-white' : 'text-slate-400',
                  )}>
                    {value}
                  </p>
                  <p className="relative text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {summary.invalidPhones > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {summary.invalidPhones} lead{summary.invalidPhones === 1 ? "" : "s"} had unrecognized phone formats and were saved with &quot;invalid phone&quot; status. Fix them on the Leads page.
              </div>
            )}

            {summary.skipped > 0 && (
              <p className="text-xs text-slate-500">
                {summary.skipped} duplicate{summary.skipped === 1 ? "" : "s"} were skipped — existing records were kept.
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={goToLeads} className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                View leads
              </Button>
              {summary.inserted > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={startDialing}
                  className="gap-1.5 border border-violet-500/25 bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Start dialing
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="relative space-y-4">
            {!loading && (
              <div className="flex justify-center py-1">
                <WorkflowIllustration scene="leads" accent="emerald" className="scale-90" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Leads country <span className="text-muted-foreground/50">(for phone formatting)</span>
              </label>
              <Select value={defaultCountry} onValueChange={(v) => { if (v) setDefaultCountry(v); }}>
                <SelectTrigger className="h-9 border-white/15 bg-white/5 text-sm focus:border-emerald-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 cursor-pointer transition-all duration-200',
                dragOver
                  ? 'border-emerald-500/50 bg-emerald-500/[0.06] shadow-[0_0_32px_rgba(52,211,153,0.12)]'
                  : 'border-white/15 bg-white/[0.03] hover:border-emerald-500/35 hover:bg-emerald-500/[0.04]',
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                disabled={loading}
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
              ) : (
                <motion.div
                  animate={reduce || dragOver ? undefined : { y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Upload className="h-10 w-10 text-emerald-400/90" />
                </motion.div>
              )}
              <div className="text-center">
                <p className="text-sm font-medium">Drop a CSV here or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">Saved permanently to your leads queue</p>
              </div>
            </label>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
