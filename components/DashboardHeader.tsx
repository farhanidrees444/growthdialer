"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Bell, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadSearchDialog } from "@/components/LeadSearchDialog";
import { useLeads } from "@/contexts/leads-context";

export function DashboardHeader({
  title,
  subtitle,
  showImport = true,
}: {
  title: string;
  subtitle?: string;
  /** Show Import leads in header (also available in queue). */
  showImport?: boolean;
}) {
  const { data } = useSession();
  const { setImportOpen } = useLeads();
  const [searchOpen, setSearchOpen] = useState(false);
  const firstName = data?.user?.name?.split(" ")[0] ?? "there";

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
        className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[oklch(0.056_0.018_286)]/85 px-6 py-4 backdrop-blur-xl"
      >
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">
            {subtitle ?? `${dateStr} · ${greeting}, ${firstName}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {showImport && (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 bg-brand px-3 text-xs font-semibold text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)]"
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
            className="h-8 gap-1.5 border-white/15 bg-white/5 text-xs hover:bg-white/10"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative h-8 w-8 border-white/15 bg-white/5 hover:bg-white/10"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
          </Button>
          <Badge className="gap-1.5 bg-emerald-500/90 px-2.5 text-xs text-white">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            Online
          </Badge>
        </div>
      </motion.header>
    </>
  );
}

export default DashboardHeader;
