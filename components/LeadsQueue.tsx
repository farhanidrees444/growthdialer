"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Mail, MoreHorizontal, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/leads-context";

const statusConfig = {
  hot: { label: "Hot", class: "bg-red-500/15 text-red-300 border border-red-500/25" },
  warm: { label: "Warm", class: "bg-amber-500/15 text-amber-300 border border-amber-500/25" },
  cold: { label: "Cold", class: "bg-sky-500/15 text-sky-300 border border-sky-500/25" },
};

const scoreColor = (score: number) => {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-300";
  return "text-muted-foreground";
};

interface LeadsQueueProps {
  /** When set, only show this many rows (dashboard widget). */
  limit?: number;
}

export default function LeadsQueue({ limit }: LeadsQueueProps) {
  const { leads, setImportOpen } = useLeads();
  const router = useRouter();
  const shown = typeof limit === "number" ? leads.slice(0, limit) : leads;
  const remaining = Math.max(0, 40 + leads.length * 2);

  return (
    <Card className="flex flex-col border-white/10 bg-[oklch(0.086_0.024_282)]/95 shadow-xl shadow-black/30 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 gap-y-2 border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="font-display font-semibold text-sm">Leads queue</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {remaining} remaining today · {leads.length} in queue
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-7 bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] text-xs font-semibold"
            onClick={() => setImportOpen(true)}
          >
            Import leads
          </Button>
          <Link href="/leads">
            <Button variant="outline" size="sm" className="h-7 border-white/15 bg-white/5 text-xs hover:bg-white/10">
              View all
            </Button>
          </Link>
        </div>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {shown.map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.04]"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-brand/15 text-[11px] font-semibold text-brand">
                {lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{lead.name}</p>
                <Badge className={cn("h-4 rounded-full px-1.5 py-0 text-[10px] font-medium", statusConfig[lead.status].class)}>
                  {statusConfig[lead.status].label}
                </Badge>
                {lead.source === "import" && (
                  <Badge variant="outline" className="h-4 border-white/15 text-[10px] text-muted-foreground">
                    CSV
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                <p className="truncate text-xs text-muted-foreground">
                  {lead.title} · {lead.company}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className={cn("text-sm font-bold tabular-nums", scoreColor(lead.score))}>{lead.score}</div>
                <div className="text-[10px] text-muted-foreground">score</div>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-white/10"
                  type="button"
                  title="Call in dialer"
                  onClick={() => router.push('/dialer')}
                >
                  <Phone className="h-3.5 w-3.5" />
                </Button>
                {lead.name && (
                  <a
                    href={`mailto:${(lead as any).email ?? ''}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                    title="Send email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" type="button">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
