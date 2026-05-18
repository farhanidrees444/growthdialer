"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TerminalLog } from "@/lib/dashboard-types";

function typeColor(type: TerminalLog["type"]) {
  switch (type) {
    case "call": return "text-cyan-400";
    case "ai": return "text-fuchsia-400";
    case "error": return "text-red-400";
    default: return "text-slate-400";
  }
}

function typeLabel(type: TerminalLog["type"]) {
  switch (type) {
    case "call": return "CALL";
    case "ai": return " AI ";
    case "error": return "ERR ";
    default: return "SYS ";
  }
}

let logId = 0;
function mkLog(type: TerminalLog["type"], message: string): TerminalLog {
  return {
    id: String(++logId),
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    type,
    message,
  };
}

export default function LiveTerminal() {
  const session = useSupabaseSession();
  const [logs, setLogs] = useState<TerminalLog[]>([
    mkLog("system", "Telephony terminal initialized"),
    mkLog("system", "Waiting for call activity..."),
  ]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!session?.user?.id) return;

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel("live-terminal-calls")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calls",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const record = payload.new as Record<string, unknown> | undefined;
          if (!record) return;

          const phone = String(record.to_number ?? record.from_number ?? "unknown");
          const status = String(record.status ?? "");
          const disposition = record.disposition ? ` → ${record.disposition}` : "";

          let type: TerminalLog["type"] = "call";
          let msg = "";

          if (payload.eventType === "INSERT") {
            msg = `Outbound call initiated → ${phone}`;
          } else if (status === "answered" || status === "active") {
            msg = `Call connected — ${phone}`;
          } else if (status === "completed") {
            const dur = record.duration_seconds ? ` (${record.duration_seconds}s)` : "";
            msg = `Call completed${dur}${disposition} — ${phone}`;
          } else if (status === "no-answer" || status === "busy" || status === "failed") {
            type = "error";
            msg = `Call ${status} — ${phone}`;
          } else if (record.analytics_id) {
            type = "ai";
            msg = `AI analysis complete — ${phone}`;
          } else {
            msg = `Call updated [${status}] — ${phone}`;
          }

          setLogs((prev) => [...prev.slice(-49), mkLog(type, msg)]);
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          setLogs((prev) => [...prev, mkLog("system", "Realtime connected — watching calls table")]);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [session?.user?.id]);

  return (
    <Card className="border-white/10 bg-[oklch(0.06_0.018_286)] shadow-lg shadow-black/30 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Terminal className="h-4 w-4 text-brand" />
        <span className="text-xs font-mono font-semibold text-brand">telephony.log</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Circle
            className={cn(
              "h-2 w-2 fill-current",
              connected ? "text-emerald-400" : "text-slate-600"
            )}
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>
      <div className="h-52 overflow-y-auto px-4 py-3 font-mono text-xs">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-2 py-0.5"
            >
              <span className="shrink-0 text-slate-600">{log.timestamp}</span>
              <span
                className={cn(
                  "shrink-0 rounded px-1 font-bold",
                  typeColor(log.type),
                  "bg-white/5"
                )}
              >
                {typeLabel(log.type)}
              </span>
              <span className="text-slate-300 break-all">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </Card>
  );
}
