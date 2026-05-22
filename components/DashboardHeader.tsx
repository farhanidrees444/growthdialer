"use client";

import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { Bell, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadSearchDialog } from "@/components/LeadSearchDialog";
import { useLeads } from "@/contexts/leads-context";
import { useSupabaseSession } from "@/lib/supabase/hooks";

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
  const session = useSupabaseSession();
  const { setImportOpen } = useLeads();
  const [searchOpen, setSearchOpen] = useState(false);
  const firstName = session?.user?.user_metadata?.full_name?.split(" ")[0] ?? session?.user?.email?.split(" ")[0] ?? "there";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
          <p className="hidden text-xs text-muted-foreground sm:block truncate">
            {subtitle ?? `${dateStr} · ${greeting}, ${firstName}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5 px-3 lg:gap-2 lg:px-6">
          {actions}
          {showImport && (
            <Button
              type="button"
              size="sm"
              className="hidden sm:flex h-8 gap-1.5 bg-brand px-3 text-xs font-semibold text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)]"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              Import leads
            </Button>
          )}
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
          {/* Mobile search & bell — 44px tap target */}
          <button
            type="button"
            className="sm:hidden flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="relative hidden sm:flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => setSearchOpen(true)}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <Badge className="hidden sm:flex gap-1.5 bg-emerald-500/90 px-2.5 text-xs text-white">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            Online
          </Badge>
        </div>
      </motion.header>
    </>
  );
}

export default DashboardHeader;
