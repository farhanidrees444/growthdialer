"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react";
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
import { useLeads } from "@/contexts/leads-context";

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

export function ImportLeadsDialog() {
  const router = useRouter();
  const { importOpen, setImportOpen, refresh } = useLeads();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidWarning, setInvalidWarning] = useState<string | null>(null);
  const [defaultCountry, setDefaultCountry] = useState("US");

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      setMessage(null);
      setInvalidWarning(null);
      try {
        const text = await file.text();

        const res = await fetch("/api/leads/import", {
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

        const parts: string[] = [];
        if (inserted > 0) parts.push(`${inserted} lead${inserted === 1 ? "" : "s"} imported`);
        if (skipped > 0) parts.push(`${skipped} skipped (duplicates)`);
        setMessage(parts.join(", ") + ".");

        if (invalidPhones > 0) {
          setInvalidWarning(
            `${invalidPhones} lead${invalidPhones === 1 ? "" : "s"} had unrecognized phone formats and were saved with "invalid phone" status. You can fix them in the Leads page.`
          );
        }

        refresh();

        window.setTimeout(() => {
          setImportOpen(false);
          setMessage(null);
          setInvalidWarning(null);
          router.push("/leads");
        }, invalidPhones > 0 ? 3000 : 1200);
      } catch {
        setError("Network error — check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [setImportOpen, refresh, router, defaultCountry]
  );

  return (
    <Dialog open={importOpen} onOpenChange={setImportOpen}>
      <DialogContent className="sm:max-w-md border-white/10 bg-[oklch(0.09_0.006_285)]">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand" />
            Import leads
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Upload a CSV with a header row. Recognized columns include{" "}
            <span className="text-foreground/90">name</span>,{" "}
            <span className="text-foreground/90">company</span>,{" "}
            <span className="text-foreground/90">phone</span>,{" "}
            <span className="text-foreground/90">title</span> (or export from HubSpot / Salesforce).
          </DialogDescription>
        </DialogHeader>

        {/* Country selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Leads country <span className="text-muted-foreground/50">(for phone formatting)</span>
          </label>
          <Select value={defaultCountry} onValueChange={(v) => { if (v) setDefaultCountry(v); }}>
            <SelectTrigger className="h-9 border-white/15 bg-white/5 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 cursor-pointer hover:border-brand/40 hover:bg-white/[0.05] transition-colors">
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={loading}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {loading ? (
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-brand/90" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">Drop a CSV here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Saved permanently to your leads queue</p>
          </div>
        </label>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-brand" role="status">
            {message}
          </p>
        )}
        {invalidWarning && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {invalidWarning}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setImportOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
