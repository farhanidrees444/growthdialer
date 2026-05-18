"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity, CheckCircle2, XCircle,
  Mic, MicOff, RefreshCw, Shield,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ServiceInfo {
  label: string;
  ok: boolean;
  latency: string;
}

interface HealthData {
  services: Record<string, { ok: boolean; latency: string }>;
  overall: 'healthy' | 'degraded';
  timestamp: string;
}

type MicState = "granted" | "denied" | "prompt" | "unknown";

const SERVICE_LABELS: Record<string, string> = {
  voice_network: "Voice Network",
  transcription_engine: "Transcription Engine",
  ai_engine: "AI Engine",
  database: "Database",
};

export default function SystemHealthDropdown() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [overall, setOverall] = useState<'healthy' | 'degraded' | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [micState, setMicState] = useState<MicState>("unknown");

  const checkMic = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    try {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      setMicState(result.state as MicState);
      result.addEventListener("change", () => setMicState(result.state as MicState));
    } catch {
      setMicState("unknown");
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/health");
      if (res.ok) {
        const data = await res.json() as HealthData;
        setServices(
          Object.entries(data.services).map(([key, val]) => ({
            label: SERVICE_LABELS[key] ?? key,
            ok: val.ok,
            latency: val.latency,
          }))
        );
        setOverall(data.overall);
        setTimestamp(data.timestamp);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkMic(); }, [checkMic]);

  useEffect(() => {
    if (open && services.length === 0) fetchHealth();
  }, [open, services.length, fetchHealth]);

  const allOk = overall === 'healthy';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 text-xs hover:bg-white/10 transition-colors"
      >
        {/* Pulse dot */}
        <span className="relative flex h-2 w-2">
          <span className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            allOk || overall === null ? "bg-emerald-400" : "bg-amber-400"
          )} />
          <span className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            allOk || overall === null ? "bg-emerald-500" : "bg-amber-500"
          )} />
        </span>
        <span className={cn(
          loading ? "text-muted-foreground" : allOk || overall === null ? "text-emerald-400" : "text-amber-400"
        )}>
          {loading ? "Checking…" : allOk || overall === null ? "All systems go" : "Degraded"}
        </span>
        {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 border-white/10 bg-[oklch(0.09_0.02_282)] p-4 shadow-xl shadow-black/40"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-sm font-semibold">System Health</p>
          </div>
          <button
            type="button"
            onClick={fetchHealth}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>

        {services.length === 0 && !loading && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Click refresh to check service status.
          </p>
        )}

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 animate-pulse rounded bg-white/10" />
            ))}
          </div>
        )}

        {services.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2.5"
          >
            {services.map((svc) => (
              <div key={svc.label} className="flex items-center gap-2 text-xs">
                {svc.ok
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  : <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
                <span className="flex-1 text-muted-foreground">{svc.label}</span>
                <span className={cn("font-mono text-muted-foreground", !svc.ok && "text-red-400")}>
                  {svc.ok ? svc.latency : "Offline"}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2 text-xs">
            {micState === "granted"
              ? <Mic className="h-3.5 w-3.5 text-emerald-400" />
              : micState === "denied"
              ? <MicOff className="h-3.5 w-3.5 text-red-400" />
              : <Mic className="h-3.5 w-3.5 text-amber-400" />}
            <span className="flex-1 text-muted-foreground">Microphone</span>
            <span className={cn(
              "font-mono",
              micState === "granted" ? "text-emerald-400" : micState === "denied" ? "text-red-400" : "text-amber-400"
            )}>
              {micState === "granted" ? "Granted" : micState === "denied" ? "Denied" : micState === "prompt" ? "Not set" : "Unknown"}
            </span>
          </div>
          {micState === "denied" && (
            <p className="mt-1.5 text-[11px] text-red-400/80">
              Enable microphone access in your browser settings to make calls.
            </p>
          )}
        </div>

        {timestamp && (
          <p className="mt-2 text-right text-[10px] text-muted-foreground/60">
            Checked {new Date(timestamp).toLocaleTimeString()}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
