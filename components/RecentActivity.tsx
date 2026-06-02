"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PhoneCall, PhoneMissed, CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type ActivityType = "meeting" | "call" | "missed" | "other";

interface ActivityItem {
  id: string;
  type: ActivityType;
  text: string;
  sub: string;
  iconClass: string;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const ICON_MAP: Record<ActivityType, { icon: React.ElementType; cls: string }> = {
  meeting: { icon: CalendarCheck, cls: "bg-emerald-500/15 text-emerald-400" },
  call: { icon: PhoneCall, cls: "bg-sky-500/15 text-sky-400" },
  missed: { icon: PhoneMissed, cls: "bg-red-500/15 text-red-400" },
  other: { icon: PhoneCall, cls: "bg-slate-500/15 text-slate-400" },
};

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("calls")
          .select("id,status,to_number,duration_seconds,created_at,lead_id,leads(name,company)")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(8);

        if (!data || data.length === 0) {
          setLoading(false);
          return;
        }

        const mapped: ActivityItem[] = data.map((row: any) => {
          const leadName = row.leads?.name ?? row.to_number ?? "Unknown";
          const company: string = row.leads?.company ?? "";
          const time = formatRelative(row.created_at);
          const dur = row.duration_seconds;
          const companyStr = company ? `${company} · ` : "";

          if (row.status === "completed" && dur && dur > 5) {
            return {
              id: row.id,
              type: "call" as ActivityType,
              text: `Connected with ${leadName}`,
              sub: `${companyStr}${formatDuration(dur)} · ${time}`,
              iconClass: ICON_MAP.call.cls,
            };
          }
          if (row.status === "completed" || row.status === "no-answer") {
            return {
              id: row.id,
              type: "missed" as ActivityType,
              text: `No answer — ${leadName}`,
              sub: `${companyStr}${time}`,
              iconClass: ICON_MAP.missed.cls,
            };
          }
          return {
            id: row.id,
            type: "other" as ActivityType,
            text: `Called ${leadName}`,
            sub: `${companyStr}${row.status ?? "initiated"} · ${time}`,
            iconClass: ICON_MAP.other.cls,
          };
        });

        setItems(mapped);
      } catch (err) {
        console.error("RecentActivity load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const IconFor = ({ type }: { type: ActivityType }) => {
    const { icon: Icon } = ICON_MAP[type];
    return <Icon className="w-3.5 h-3.5" />;
  };

  return (
    <Card className="flex flex-col border-white/10 bg-[oklch(0.09_0.006_285)]/95 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="font-display text-sm font-semibold">Recent activity</h2>
      </div>

      {loading ? (
        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5">
              <div className="h-7 w-7 animate-pulse rounded-lg bg-white/5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <PhoneCall className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No calls yet — make your first call</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.04]"
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  item.iconClass,
                )}
              >
                <IconFor type={item.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug truncate">{item.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}
