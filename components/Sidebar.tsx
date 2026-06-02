"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Phone,
  LayoutDashboard,
  Users,
  BarChart2,
  Headphones,
  Zap,
  ChevronRight,
  X,
  Hash,
  Sparkles,
  ChevronsUpDown,
  Check,
  Headset,
  Plus,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { useMobileNav } from "@/contexts/mobile-nav-context";
import { useSidebarCounts, formatSidebarCount } from "@/hooks/use-sidebar-counts";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/auth/permissions";

type CountKey = 'leads' | 'recordings' | 'numbers';

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: "Live";
  countKey?: CountKey;
  sparkle?: boolean;
  managerOnly?: boolean;
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Phone, label: "AI Dialer", href: "/dialer", badge: "Live", sparkle: true },
  { icon: Users, label: "Leads", href: "/leads", countKey: 'leads' },
  { icon: BarChart2, label: "Analytics", href: "/analytics" },
  { icon: Headphones, label: "Recordings", href: "/recordings", countKey: 'recordings' },
  { icon: Hash, label: "My Numbers", href: "/numbers", countKey: 'numbers' },
  { icon: Zap, label: "Integrations", href: "/integrations" },
  { icon: Headset, label: "Coaching", href: "/coaching/live", managerOnly: true },
];

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  free:       { label: "Free",       className: "bg-slate-700/80 text-slate-300" },
  pro:        { label: "Pro",        className: "bg-violet-500/20 text-violet-300 border border-violet-500/30" },
  team:       { label: "Team",       className: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
  enterprise: { label: "Enterprise", className: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
};

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function WorkspaceSwitcher() {
  const router = useRouter();
  const { workspaces, currentWorkspace, currentRole, setCurrentWorkspace, loading } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (loading || !currentWorkspace) return null;

  const planBadge = PLAN_BADGES[currentWorkspace.plan] ?? PLAN_BADGES.free;

  return (
    <div className="relative px-3 pb-3">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.07] hover:border-white/[0.12]"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{currentWorkspace.name}</p>
          {currentRole && (
            <p className="truncate text-[10px] text-slate-500">{ROLE_LABELS[currentRole]}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", planBadge.className)}>
            {planBadge.label}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-slate-600" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-3 right-3 top-[calc(100%+4px)] z-50 rounded-xl border border-white/[0.10] bg-[oklch(0.10_0.024_282)] p-1.5 shadow-2xl shadow-black/60"
            >
              <p className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Workspaces
              </p>
              {workspaces.map((ws) => {
                const isActive = ws.id === currentWorkspace.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      void setCurrentWorkspace(ws);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                      isActive ? "bg-white/[0.07] text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                      <Building2 className="h-3 w-3" />
                    </div>
                    <span className="flex-1 truncate text-xs font-medium">{ws.name}</span>
                    {isActive && <Check className="h-3 w-3 shrink-0 text-emerald-400" />}
                  </button>
                );
              })}
              <div className="mx-1 my-1.5 border-t border-white/[0.06]" />
              <button
                type="button"
                onClick={() => { router.push('/workspace/setup'); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-white/[0.15]">
                  <Plus className="h-3 w-3" />
                </div>
                <span className="text-xs font-medium">Create workspace</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileNav();
  const sidebarCounts = useSidebarCounts();
  const { currentRole } = useWorkspace();

  const canCoach = currentRole && ["owner", "admin", "manager"].includes(currentRole);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-xl shadow-black/40",
          "fixed inset-y-0 right-0 z-50 w-[280px] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          "lg:static lg:border-l-0 lg:border-r lg:border-sidebar-border lg:w-[228px] lg:translate-x-0 lg:z-auto lg:h-screen lg:shrink-0",
        )}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between gap-2.5 px-5 py-4 border-b border-sidebar-border">
          <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5 min-w-0 group">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0 glow-brand-sm">
              <Zap className="w-4 h-4 text-[oklch(0.08_0.04_153)]" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-white truncate group-hover:text-white/95">
              Growth<span className="text-brand">Dialer</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={close}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workspace switcher */}
        <div className="pt-3">
          <WorkspaceSwitcher />
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            if (item.managerOnly && !canCoach) return null;
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <motion.div key={item.href} whileHover={{ x: 2 }}>
                <Link
                  href={item.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                    active
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 flex items-center gap-1.5">
                    {item.label}
                    {item.sparkle && <Sparkles className="h-3 w-3 text-amber-400/80" />}
                  </span>
                  {item.badge === "Live" && (
                    <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 h-4 rounded-full">
                      Live
                    </Badge>
                  )}
                  {item.countKey && (() => {
                    const raw = sidebarCounts[item.countKey];
                    const formatted = formatSidebarCount(raw);
                    return raw === null ? (
                      <span className="w-7 h-3.5 rounded bg-white/[0.05] animate-pulse" />
                    ) : formatted ? (
                      <span className="text-xs tabular-nums text-sidebar-foreground/60">{formatted}</span>
                    ) : null;
                  })()}
                  {active && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
                </Link>
              </motion.div>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
