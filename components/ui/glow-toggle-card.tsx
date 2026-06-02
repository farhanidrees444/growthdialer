"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface GlowToggleCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  icon: LucideIcon;
  glowColor?: "cyan" | "green" | "fuchsia" | "amber";
  disabled?: boolean;
  badge?: string;
}

const glowMap = {
  cyan: "shadow-cyan-500/30 border-cyan-500/30",
  green: "shadow-emerald-500/30 border-emerald-500/30",
  fuchsia: "shadow-fuchsia-500/30 border-fuchsia-500/30",
  amber: "shadow-amber-500/30 border-amber-500/30",
};

const iconColorMap = {
  cyan: "text-cyan-400 bg-cyan-500/15",
  green: "text-emerald-400 bg-emerald-500/15",
  fuchsia: "text-fuchsia-400 bg-fuchsia-500/15",
  amber: "text-amber-400 bg-amber-500/15",
};

export function GlowToggleCard({
  title,
  description,
  enabled,
  onChange,
  icon: Icon,
  glowColor = "cyan",
  disabled = false,
  badge,
}: GlowToggleCardProps) {
  return (
    <motion.div
      animate={
        enabled
          ? { boxShadow: `0 0 20px 0 rgba(0,0,0,0.1)` }
          : { boxShadow: "none" }
      }
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-4 transition-colors",
        enabled
          ? `border-white/20 bg-[oklch(0.1_0.03_282)] ${glowMap[glowColor]}`
          : "border-white/10 bg-[oklch(0.09_0.006_285)]/90",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          iconColorMap[glowColor]
        )}
      >
        <Icon className="h-4.5 w-4.5 h-[1.125rem] w-[1.125rem]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          {badge && (
            <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onChange}
        disabled={disabled}
        className="shrink-0"
      />
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "pointer-events-none absolute inset-0 rounded-xl opacity-10",
              glowColor === "cyan" && "bg-cyan-400",
              glowColor === "green" && "bg-emerald-400",
              glowColor === "fuchsia" && "bg-fuchsia-400",
              glowColor === "amber" && "bg-amber-400"
            )}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
