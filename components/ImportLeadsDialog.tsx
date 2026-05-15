"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/contexts/leads-context";

export function ImportLeadsDialog() {
  const router = useRouter();
  const { importOpen, setImportOpen, importCsv, refresh } = useLeads();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      setMessage(null);
      try {
        const text = await file.text();

        const localResult = importCsv(text);
        if (localResult.error) {
          setError(localResult.error);
          return;
        }

        try {
          const res = await fetch("/api/leads/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ csv: text }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.warn("Lead import warning:", body.error ?? res.status);
          } else {
            refresh();
          }
        } catch (networkErr) {
          console.warn("Lead import network error:", networkErr);
        }

        const count = localResult.added;
        setMessage(`Imported ${count} lead${count === 1 ? "" : "s"}.`);
        window.setTimeout(() => {
          setImportOpen(false);
          setMessage(null);
          router.push("/leads");
        }, 1000);
      } finally {
        setLoading(false);
      }
    },
    [importCsv, setImportOpen, refresh, router]
  );

  return (
    <Dialog open={importOpen} onOpenChange={setImportOpen}>
      <DialogContent className="sm:max-w-md border-white/10 bg-[oklch(0.086_0.024_282)]">
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
            <p className="text-xs text-muted-foreground mt-1">Saved to your leads queue</p>
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

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setImportOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
