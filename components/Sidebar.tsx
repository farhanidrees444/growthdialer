"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  LayoutGroup,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Phone,
  LayoutDashboard,
  Users,
  BarChart2,
  Headphones,
  Zap,
  Trophy,
  ListOrdered,
  X,
  Hash,
  Sparkles,
  PhoneIncoming,
  ScrollText,
  ChevronsUpDown,
  Check,
  LockKeyhole,
  Headset,
  Plus,
  Building2,
} from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useMobileNav } from "@/contexts/mobile-nav-context";
import { useSidebarCounts, formatSidebarCount } from "@/hooks/use-sidebar-counts";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { useCalls } from "@/contexts/calls-context";
import { EASE_OUT, SPRING } from "@/components/marketing/live-floor/motion";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SidebarSkeleton } from "@/components/layout/sidebar-skeleton";
import { getNavItemAccent, resolveRouteAccent } from "@/lib/ui/route-accents";
import { usePlan } from "@/lib/plan/use-plan";
import type { FeatureKey } from "@/lib/plan/plan-gates";

type CountKey = "leads" | "recordings" | "numbers" | "calls";

type NavItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: "Live";
  countKey?: CountKey;
  sparkle?: boolean;
  managerOnly?: boolean;
  gateFeature?: FeatureKey;
};

const DASHBOARD_ITEM: NavItem = {
  id: "dashboard",
  icon: LayoutDashboard,
  label: "Dashboard",
  href: "/dashboard",
};

const ENGAGE_ITEMS: NavItem[] = [
  { id: "dialer", icon: Phone, label: "AI Dialer", href: "/dialer", badge: "Live", sparkle: true },
  { id: "sequences", icon: ListOrdered, label: "Sequences", href: "/sequences" },
  { id: "leads", icon: Users, label: "Leads", href: "/leads", countKey: "leads" },
  { id: "incoming", icon: PhoneIncoming, label: "Incoming", href: "/incoming", badge: "Live" },
];

const INTELLIGENCE_ITEMS: NavItem[] = [
  { id: "call-logs", icon: ScrollText, label: "Call Logs", href: "/call-logs", countKey: "calls" },
  { id: "recordings", icon: Headphones, label: "Recordings", href: "/recordings", countKey: "recordings" },
  { id: "analytics", icon: BarChart2, label: "Analytics", href: "/analytics" },
];

const TEAM_ITEMS: NavItem[] = [
  { id: "leaderboard", icon: Trophy, label: "Leaderboard", href: "/leaderboard", managerOnly: true, gateFeature: "leaderboard" },
  { id: "coaching", icon: Headset, label: "Coaching", href: "/coaching", managerOnly: true, gateFeature: "coaching_dashboard" },
];

const PREFETCH_HREFS = new Set(["/dialer", "/leads", "/analytics"]);

const SETUP_ITEMS: NavItem[] = [
  { id: "numbers", icon: Hash, label: "My Numbers", href: "/numbers", countKey: "numbers" },
  { id: "integrations", icon: Zap, label: "Integrations", href: "/dashboard/integrations" },
];

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-slate-700/80 text-slate-300" },
  pro: { label: "Pro", className: "bg-violet-500/20 text-violet-300 border border-violet-500/30" },
  team: { label: "Team", className: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
  enterprise: { label: "Enterprise", className: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
};

const STAGGER = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
} as const;

function isNavActive(pathname: string, searchParams: URLSearchParams, item: NavItem): boolean {
  if (item.href.includes("?")) {
    const [path, query] = item.href.split("?");
    if (pathname !== path) return false;
    const expected = new URLSearchParams(query);
    for (const [key, val] of expected.entries()) {
      if (searchParams.get(key) !== val) return false;
    }
    return true;
  }

  if (item.href === "/settings") {
    if (pathname !== "/settings" && !pathname.startsWith("/settings/")) return false;
    return searchParams.get("tab") !== "calling";
  }

  if (item.href === "/dashboard") return pathname === "/dashboard";

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const { workspaces, currentWorkspace, currentRole, setCurrentWorkspace, loading } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (loading || !currentWorkspace) return null;

  const planBadge = PLAN_BADGES[currentWorkspace.plan] ?? PLAN_BADGES.free;

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((p) => !p)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border border-zinc-800/50 bg-zinc-900/50 text-left transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/40",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
      )}
      aria-label={collapsed ? `Workspace: ${currentWorkspace.name}` : undefined}
    >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
        <Building2 className="h-3.5 w-3.5" />
      </div>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-100">{currentWorkspace.name}</p>
            {currentRole && (
              <p className="truncate text-[10px] text-slate-500">{ROLE_LABELS[currentRole]}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                planBadge.className,
              )}
            >
              {planBadge.label}
            </span>
            <ChevronsUpDown className="h-3 w-3 text-slate-600" />
          </div>
        </>
      )}
    </button>
  );

  return (
    <div className={cn("relative pb-3", collapsed ? "px-2" : "px-3")}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger render={trigger} />
          <TooltipContent side="right" sideOffset={8}>
            {currentWorkspace.name}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute z-50 rounded-xl border border-white/[0.10] bg-[oklch(0.1_0.006_285)] p-1.5 shadow-2xl shadow-black/60",
                collapsed ? "left-full top-0 ml-2 w-56" : "left-3 right-3 top-[calc(100%+4px)]",
              )}
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
                      isActive
                        ? "bg-white/[0.07] text-white"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
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
                onClick={() => {
                  router.push("/workspace/setup");
                  setOpen(false);
                }}
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

function NavCountBadge({
  countKey,
  counts,
}: {
  countKey: CountKey;
  counts: ReturnType<typeof useSidebarCounts>;
}) {
  const raw = counts[countKey];
  const formatted = formatSidebarCount(raw);

  if (raw === null) {
    return <span className="h-4 w-6 shrink-0 animate-pulse rounded bg-white/[0.05]" aria-hidden />;
  }
  if (!formatted || raw === 0) return null;

  return (
    <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400">
      {formatted}
    </span>
  );
}

function SidebarNavItem({
  item,
  active,
  collapsed,
  counts,
  onNavigate,
  reduceMotion,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  counts: ReturnType<typeof useSidebarCounts>;
  onNavigate: () => void;
  reduceMotion: boolean;
}) {
  const Icon = item.icon;
  const accent = getNavItemAccent(item.id);
  const { isRinging: callsRinging } = useCalls();
  const { can } = usePlan();
  const showRingPulse = item.id === "incoming" && callsRinging;
  const locked = item.gateFeature ? !can(item.gateFeature) : false;

  const linkInner = (
    <Link
      href={locked ? "/pricing?highlight=growth" : item.href}
      prefetch={PREFETCH_HREFS.has(item.href)}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center rounded-lg text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
        active ? "text-white" : "text-zinc-400 hover:text-zinc-100",
        locked && "text-white/30 hover:text-white/50",
      )}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <>
          <motion.span
            layoutId="sidebar-active-pill"
            className={cn("absolute inset-0 rounded-lg backdrop-blur-sm", accent.activePill)}
            transition={reduceMotion ? { duration: 0 } : SPRING}
          />
          <span
            className={cn(
              "absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b",
              accent.bar,
            )}
            aria-hidden
          />
        </>
      )}

      <motion.span
        className={cn(
          "relative z-[1] flex shrink-0 items-center justify-center",
          active ? accent.icon : "text-zinc-500",
        )}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        transition={SPRING}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </motion.span>

      {!collapsed && (
        <motion.span
          className="relative z-[1] flex min-w-0 flex-1 items-center gap-1.5"
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          <span className="truncate">{item.label}</span>
          {item.sparkle && <Sparkles className="h-3 w-3 shrink-0 text-violet-400/70" aria-hidden />}
          {locked && <LockKeyhole className="h-3 w-3 shrink-0 text-white/30" aria-hidden />}
        </motion.span>
      )}

      {!collapsed && item.badge === "Live" && (
        <Badge className={cn(
          "relative z-[1] h-4 shrink-0 rounded-md border-0 px-1.5 py-0 text-[10px] font-normal",
          showRingPulse
            ? "bg-cyan-500/20 text-cyan-200"
            : "bg-zinc-800 text-zinc-300",
        )}>
          {showRingPulse ? "Ringing" : "Live"}
        </Badge>
      )}

      {!collapsed && item.countKey && (
        <span className="relative z-[1]">
          <NavCountBadge countKey={item.countKey} counts={counts} />
        </span>
      )}
    </Link>
  );

  const hoverWrap = (
    <motion.div
      whileHover={reduceMotion || active ? undefined : { x: 2 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className={cn("relative rounded-lg transition-shadow duration-200", !active && accent.hoverGlow)}
    >
      {showRingPulse && !reduceMotion && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-cyan-400/40"
          animate={{ opacity: [0.35, 0.85, 0.35], boxShadow: [
            "0 0 0 0 rgba(6,182,212,0)",
            "0 0 18px 2px rgba(139,92,246,0.35)",
            "0 0 0 0 rgba(6,182,212,0)",
          ] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}
      {linkInner}
    </motion.div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={hoverWrap} />
        <TooltipContent side="right" sideOffset={8} className="flex items-center gap-2">
          {item.label}
          {locked && <LockKeyhole className="h-3 w-3 text-white/30" />}
          {item.badge === "Live" && (
            <span className="text-[10px] font-semibold text-[#06B6D4]">Live</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return hoverWrap;
}

function NavSection({
  title,
  items,
  collapsed,
  canCoach,
  pathname,
  searchParams,
  counts,
  onNavigate,
  reduceMotion,
  showDivider,
}: {
  title?: string;
  items: NavItem[];
  collapsed: boolean;
  canCoach: boolean;
  pathname: string;
  searchParams: URLSearchParams;
  counts: ReturnType<typeof useSidebarCounts>;
  onNavigate: () => void;
  reduceMotion: boolean;
  showDivider?: boolean;
}) {
  const visible = items.filter((item) => !item.managerOnly || canCoach);
  if (visible.length === 0) return null;

  return (
    <motion.div
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 6 },
              show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
            }
      }
      className={cn(showDivider && "mt-1 border-t border-zinc-800/50 pt-3")}
    >
      {title && !collapsed && (
        <p className="mb-1.5 px-3 text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
          {title}
        </p>
      )}
      <ul className="space-y-0.5">
        {visible.map((item) => (
          <motion.li
            key={item.id}
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: { opacity: 0, x: -6 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT } },
                  }
            }
          >
            <SidebarNavItem
              item={item}
              active={isNavActive(pathname, searchParams, item)}
              collapsed={collapsed}
              counts={counts}
              onNavigate={onNavigate}
              reduceMotion={reduceMotion}
            />
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Sidebar({
  isDesktopCollapsed = false,
}: {
  isDesktopCollapsed?: boolean;
}) {
  return (
    <Suspense fallback={<SidebarSkeleton collapsed={isDesktopCollapsed} />}>
      <SidebarInner isDesktopCollapsed={isDesktopCollapsed} />
    </Suspense>
  );
}

function SidebarInner({
  isDesktopCollapsed,
}: {
  isDesktopCollapsed: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isOpen, close } = useMobileNav();
  const sidebarCounts = useSidebarCounts();
  const { currentRole } = useWorkspace();
  const reduceMotion = useReducedMotion();
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  const canCoach = Boolean(currentRole && ["owner", "admin", "manager"].includes(currentRole));
  const isCollapsed = isDesktopCollapsed && isDesktopViewport;
  const routeAccent = resolveRouteAccent(pathname);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktopViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "relative flex flex-col border-r border-zinc-800/50 bg-zinc-950 text-sidebar-foreground",
          "fixed inset-y-0 left-0 z-50 transition-[width,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:z-auto lg:h-full lg:shrink-0 lg:translate-x-0",
          isCollapsed ? "w-[72px]" : "w-[280px] lg:w-[240px]",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b opacity-60",
            routeAccent.bar,
          )}
          aria-hidden
        />
        {/* Mobile drawer header. Desktop brand and account controls live in the top bar. */}
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-zinc-800/50 lg:hidden",
            isCollapsed
              ? "flex-col gap-3 px-2 py-4"
              : "justify-between gap-3 px-4 py-5 min-h-[72px]",
          )}
        >
          <BrandLogo
            href="/dashboard"
            onClick={close}
            showText={!isCollapsed}
            size="sidebar"
            variant="icon-dark"
            framed={isCollapsed}
            priority
            className={cn(
              "min-w-0",
              isCollapsed
                ? "mx-auto justify-center"
                : "flex-1 min-w-0 pr-1",
            )}
          />

          <div className={cn("flex items-center gap-1", isCollapsed && "w-full justify-center")}>
            <button
              type="button"
              onClick={close}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={cn("shrink-0 pt-3", isCollapsed && "pt-2")}>
          <WorkspaceSwitcher collapsed={isCollapsed} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <LayoutGroup>
            <motion.nav
              initial={reduceMotion ? false : "hidden"}
              animate="show"
              variants={reduceMotion ? undefined : STAGGER}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-thin"
            >
            {/* Dashboard — standalone */}
            <motion.div
              variants={
                reduceMotion
                  ? undefined
                  : {
                      hidden: { opacity: 0, x: -6 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT } },
                    }
              }
              className="mb-2"
            >
              <SidebarNavItem
                item={DASHBOARD_ITEM}
                active={isNavActive(pathname, searchParams, DASHBOARD_ITEM)}
                collapsed={isCollapsed}
                counts={sidebarCounts}
                onNavigate={close}
                reduceMotion={!!reduceMotion}
              />
            </motion.div>

            <NavSection
              title="Engage"
              items={ENGAGE_ITEMS}
              collapsed={isCollapsed}
              canCoach={canCoach}
              pathname={pathname}
              searchParams={searchParams}
              counts={sidebarCounts}
              onNavigate={close}
              reduceMotion={!!reduceMotion}
            />

            <NavSection
              title="Intelligence"
              items={INTELLIGENCE_ITEMS}
              collapsed={isCollapsed}
              canCoach={canCoach}
              pathname={pathname}
              searchParams={searchParams}
              counts={sidebarCounts}
              onNavigate={close}
              reduceMotion={!!reduceMotion}
              showDivider
            />

            <NavSection
              title="Team"
              items={TEAM_ITEMS}
              collapsed={isCollapsed}
              canCoach={canCoach}
              pathname={pathname}
              searchParams={searchParams}
              counts={sidebarCounts}
              onNavigate={close}
              reduceMotion={!!reduceMotion}
              showDivider
            />
            <NavSection
              title="Setup"
              items={SETUP_ITEMS}
              collapsed={isCollapsed}
              canCoach={canCoach}
              pathname={pathname}
              searchParams={searchParams}
              counts={sidebarCounts}
              onNavigate={close}
              reduceMotion={!!reduceMotion}
              showDivider
            />
          </motion.nav>
          </LayoutGroup>
        </div>
      </aside>
    </>
  );
}
