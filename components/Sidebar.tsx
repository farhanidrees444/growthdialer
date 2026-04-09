"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Phone,
  LayoutDashboard,
  Users,
  BarChart2,
  Settings,
  Headphones,
  ListChecks,
  Zap,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useLeads } from "@/contexts/leads-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: "Live";
  showCount?: boolean;
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Phone, label: "Dialer", href: "/dialer", badge: "Live" },
  { icon: Users, label: "Leads", href: "/leads", showCount: true },
  { icon: ListChecks, label: "Sequences", href: "/sequences" },
  { icon: BarChart2, label: "Analytics", href: "/analytics" },
  { icon: Headphones, label: "Recordings", href: "/recordings" },
];

const bottomItems = [
  { icon: Zap, label: "Integrations", href: "/integrations" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const { leads } = useLeads();

  const displayName = data?.user?.name ?? "Alex Rivera";
  const role = "Sales Rep";

  return (
    <aside className="w-[228px] shrink-0 flex flex-col bg-sidebar text-sidebar-foreground h-screen sticky top-0 border-r border-sidebar-border shadow-xl shadow-black/40">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0 glow-brand-sm">
            <Zap className="w-4 h-4 text-[oklch(0.08_0.04_153)]" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-white truncate group-hover:text-white/95">
            Growth<span className="text-brand">Dialer</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <motion.div key={item.href} whileHover={{ x: 2 }}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge === "Live" && (
                  <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 h-4 rounded-full">
                    Live
                  </Badge>
                )}
                {item.showCount && (
                  <span className="text-xs tabular-nums text-sidebar-foreground/60">{leads.length}</span>
                )}
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-0.5">
        {bottomItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <motion.div key={item.href} whileHover={{ x: 2 }}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}

        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-sidebar-accent/30">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {initials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{displayName}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{role}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50 mt-1"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
