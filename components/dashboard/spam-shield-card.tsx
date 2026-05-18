"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SpamShield, NumberStat } from "@/lib/dashboard-types";

interface SpamShieldCardProps {
  data: SpamShield;
  loading?: boolean;
}

const statusConfig = {
  clean: {
    label: "Clean",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/20",
    icon: ShieldCheck,
  },
  warn: {
    label: "Warning",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/20",
    icon: ShieldAlert,
  },
  flagged: {
    label: "Flagged",
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/20",
    icon: ShieldX,
  },
};

function NumberRow({ stat }: { stat: NumberStat }) {
  const cfg = statusConfig[stat.status];
  const Icon = cfg.icon;
  const display = stat.number.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, "$1 ($2) $3-$4");

  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
      <span className="flex-1 font-mono text-muted-foreground truncate">{display}</span>
      <div className={cn("rounded-full px-2 py-0.5 font-semibold", cfg.bg, cfg.color)}>
        {stat.answerRate}%
      </div>
    </div>
  );
}

export default function SpamShieldCard({ data, loading }: SpamShieldCardProps) {
  const healthColor =
    data.health >= 70 ? "text-emerald-400" : data.health >= 40 ? "text-amber-400" : "text-red-400";
  const HealthIcon = data.health >= 70 ? ShieldCheck : data.health >= 40 ? ShieldAlert : ShieldX;

  const lastChecked = new Date(data.lastChecked).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 border border-white/10">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">Spam Shield</p>
          {loading ? (
            <div className="mt-1 h-8 w-20 animate-pulse rounded bg-white/10" />
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <p className={cn("font-display text-2xl font-bold tracking-tight", healthColor)}>
                {data.health}%
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <HealthIcon className={cn("h-3.5 w-3.5", healthColor)} />
                <span>answer rate health</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!loading && data.numbers.length === 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground py-2">
          No active numbers tracked yet.
        </p>
      )}

      {!loading && data.numbers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 space-y-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5"
        >
          {data.numbers.map((n) => (
            <NumberRow key={n.number} stat={n} />
          ))}
        </motion.div>
      )}

      {!loading && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span>Last checked {lastChecked}</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider">7-day avg</span>
        </div>
      )}
    </Card>
  );
}
