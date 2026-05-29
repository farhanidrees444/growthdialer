"use client";

import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { Search, Upload, Sparkles, Gift, HelpCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadSearchDialog } from "@/components/LeadSearchDialog";
import { useLeads } from "@/contexts/leads-context";
import { UserMenu } from "@/components/layout/user-menu";

export function DashboardHeader({
  title,
  titleExtra,
  subtitle,
  showImport = true,
  actions,
}: {
  title: string;
  titleExtra?: React.ReactNode;
  subtitle?: string;
  showImport?: boolean;
  actions?: React.ReactNode;
}) {
  const { setImportOpen } = useLeads();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <LeadSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 flex items-center border-b border-white/10 bg-[oklch(0.056_0.018_286)]/85 backdrop-blur-xl"
      >
        {/* Title block */}
        <div className="flex-1 min-w-0 px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-base lg:text-lg font-bold tracking-tight truncate">{title}</h1>
            {titleExtra}
          </div>
          {subtitle && (
            <p className="hidden text-xs text-muted-foreground sm:block truncate">{subtitle}</p>
          )}
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1 px-3 lg:gap-1.5 lg:px-4">
          {actions}

          {/* Import leads */}
          {showImport && (
            <Button
              type="button"
              size="sm"
              className="hidden sm:flex h-8 gap-1.5 bg-brand px-3 text-xs font-semibold text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)]"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
          )}

          {/* Search — desktop */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden sm:flex h-8 gap-1.5 border-white/15 bg-white/5 text-xs hover:bg-white/10"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>

          {/* Search — mobile */}
          <button
            type="button"
            className="sm:hidden flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Online badge */}
          <Badge className="hidden md:flex gap-1.5 bg-emerald-500/90 px-2.5 text-xs text-white">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            Online
          </Badge>

          {/* ─── Smartlead-style cluster ─── */}
          <div className="flex items-center gap-0.5 border-l border-white/[0.08] pl-2 lg:gap-1 lg:pl-3">

            {/* Ask AI — desktop only */}
            <button
              type="button"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                         bg-gradient-to-r from-violet-600/20 to-cyan-500/20
                         border border-violet-500/25 hover:border-violet-500/50
                         text-xs font-semibold text-white/80 hover:text-white
                         transition-all"
              aria-label="Ask AI"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              Ask AI
            </button>

            {/* Gift — hidden on mobile */}
            <button
              type="button"
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-all"
              aria-label="Refer a friend"
            >
              <Gift className="h-4 w-4" />
            </button>

            {/* Help — hidden on mobile */}
            <button
              type="button"
              className="hidden sm:flex items-center gap-1.5 h-8 px-2 rounded-xl text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-all"
              aria-label="Help"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden xl:inline text-xs font-medium">Help</span>
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-all"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>

            {/* User dropdown */}
            <UserMenu />
          </div>
        </div>
      </motion.header>
    </>
  );
}

export default DashboardHeader;
