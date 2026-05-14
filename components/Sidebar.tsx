"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "#", active: true },
  { icon: Phone, label: "Dialer", href: "#", badge: "Live" },
  { icon: Users, label: "Leads", href: "#", badge: "248" },
  { icon: ListChecks, label: "Sequences", href: "#" },
  { icon: BarChart2, label: "Analytics", href: "#" },
  { icon: Headphones, label: "Recordings", href: "#" },
];

const bottomItems = [
  { icon: Zap, label: "Integrations", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

export default function Sidebar() {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-sidebar text-sidebar-foreground h-screen sticky top-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Phone className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-base tracking-tight text-white">
          GrowthDialer
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <motion.a
            key={item.label}
            href={item.href}
            whileHover={{ x: 2 }}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
              item.active
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
            {item.badge && item.badge !== "Live" && (
              <span className="text-xs text-sidebar-foreground/50">
                {item.badge}
              </span>
            )}
            {item.active && (
              <ChevronRight className="w-3.5 h-3.5 text-white/50" />
            )}
          </motion.a>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-0.5">
        {bottomItems.map((item) => (
          <motion.a
            key={item.label}
            href={item.href}
            whileHover={{ x: 2 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white transition-colors"
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </motion.a>
        ))}

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-sidebar-accent/30">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            AJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">Alex Johnson</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">Sales Rep</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
