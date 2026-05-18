"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity, CheckCircle2, AlertTriangle, XCircle,
  Mic, MicOff, RefreshCw,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ServiceCheck {
  ok: boolean;
  latencyMs?: number;
  detail?: string;
}

interface HealthData {
  status: "healthy" | "degraded";
  checks: Record<string, ServiceCheck>;
  timestamp: string;
}

type MicState = "granted" | "denied" | "prompt" | "unknown";

const serviceLabels: Record<string, string> = {
  telnyx: "Telnyx",
  groq: "Groq (STT)",
  gemini: "Gemini (AI)",
  aiPipeline: "AI Pipeline",
};

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        ok ? "bg-emerald-400" : "bg-red-400"
      )}
    />
  );
}

function ServiceRow({ name, check }: { name: string; check: ServiceCheck }) {
  const Icon = check.ok ? CheckCircle2 : check.latencyMs === undefined ? AlertTriangle : XCircle;
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          check.ok ? "text-emerald-400" : "text-red-400"
        )}
      />
      <span className="flex-1 text-muted-foreground">
        {serviceLabels[name] ?? name}
      </span>
      {check.latencyMs !== undefined && (
        <span className="font-mono text-muted-foreground">{check.latencyMs}ms</span>
      )}
      {check.detail && !check.latencyMs && (
        <span className="font-mono text-muted-foreground truncate max-w-20" title={check.detail}>
          {check.detail.slice(0, 20)}
        </span>
      )}
    </div>
  );
}

export default function SystemHealthDropdown() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [micState, setMicState] = useState<MicState>("unknown");

  const checkMic = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      setMicState("unknown");
      return;
    }
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
      const res = await fetch("/api/telnyx/health");
      if (res.ok) {
        const data = await res.json() as HealthData;
        setHealth(data);
      }
    } catch {
      // silently fail — dropdown will show stale or empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkMic();
  }, [checkMic]);

  useEffect(() => {
    if (open && !health) {
      fetchHealth();
    }
  }, [open, health, fetchHealth]);

  const allOk = health?.status === "healthy";
  const ButtonIcon = loading ? RefreshCw : allOk ? Activity : AlertTriangle;
  const buttonColor = loading
    ? "text-muted-foreground"
    : allOk
    ? "text-emerald-400"
    : "text-amber-400";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 text-xs hover:bg-white/10 transition-colors"
      >
        <ButtonIcon className={cn("h-3.5 w-3.5", buttonColor, loading && "animate-spin")} />
        <span className={buttonColor}>
          {loading ? "Checking..." : allOk ? "All systems go" : health ? "Degraded" : "System health"}
        </span>
        {!allOk && health && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 border-white/10 bg-[oklch(0.09_0.02_282)] p-4 shadow-xl shadow-black/40"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">System Health</p>
          <button
            type="button"
            onClick={fetchHealth}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>

        {!health && !loading && (
          <p className="text-xs text-muted-foreground text-center py-2">
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

        {health && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {Object.entries(health.checks).map(([name, check]) => (
              <ServiceRow key={name} name={name} check={check} />
            ))}
          </motion.div>
        )}

        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2 text-xs">
            {micState === "granted" ? (
              <Mic className="h-3.5 w-3.5 text-emerald-400" />
            ) : micState === "denied" ? (
              <MicOff className="h-3.5 w-3.5 text-red-400" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="flex-1 text-muted-foreground">Microphone</span>
            <span
              className={cn(
                "font-mono",
                micState === "granted"
                  ? "text-emerald-400"
                  : micState === "denied"
                  ? "text-red-400"
                  : "text-amber-400"
              )}
            >
              {micState === "granted"
                ? "Granted"
                : micState === "denied"
                ? "Denied"
                : micState === "prompt"
                ? "Not set"
                : "Unknown"}
            </span>
          </div>
          {micState === "denied" && (
            <p className="mt-1.5 text-[11px] text-red-400/80">
              Microphone access is blocked. Enable it in your browser settings to make calls.
            </p>
          )}
        </div>

        {health?.timestamp && (
          <p className="mt-2 text-[10px] text-muted-foreground/60 text-right">
            Checked {new Date(health.timestamp).toLocaleTimeString()}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
