"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  SkipForward,
  Clock,
  Building2,
  User,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type CallState = "idle" | "dialing" | "connected" | "ended";

interface QueuedLead {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  phone: string;
  call_attempts: number;
}

export default function DialerWidget() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [callControlId, setCallControlId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [leads, setLeads] = useState<QueuedLead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [loadingLeads, setLoadingLeads] = useState(true);

  // Load queued leads from Supabase
  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("leads")
          .select("id,name,title,company,phone,call_attempts")
          .in("status", ["new", "queued", "contacted"])
          .order("ai_score", { ascending: false })
          .limit(50),
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .in("status", ["new", "queued", "contacted"]),
      ]);
      setLeads((data as QueuedLead[]) ?? []);
      setTotalInQueue(count ?? 0);
      setLoadingLeads(false);
    };
    load();
  }, []);

  const currentLead = leads[currentIndex] ?? null;

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === "connected") {
      interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleCall = useCallback(async () => {
    if (callState !== "idle" || !currentLead) return;
    setError(null);
    setCallState("dialing");
    try {
      const res = await fetch("/api/calls/dial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: currentLead.phone, lead_id: currentLead.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to dial");
      setCallControlId(data.call_control_id ?? null);
      setCallState("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call failed");
      setCallState("idle");
    }
  }, [callState, currentLead]);

  const handleHangup = useCallback(async () => {
    if (callState === "idle" || callState === "ended") return;
    setCallState("ended");
    if (callControlId) {
      fetch("/api/calls/hangup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_control_id: callControlId }),
      }).catch(console.error);
    }
    setCallControlId(null);
    setTimeout(() => setCallState("idle"), 1200);
  }, [callState, callControlId]);

  const handleSkip = () => {
    if (leads.length > 0) setCurrentIndex((prev) => (prev + 1) % leads.length);
  };

  // Empty state
  if (!loadingLeads && leads.length === 0) {
    return (
      <Card className="flex flex-col gap-4 border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold">Active dialer</h2>
          <Badge className="rounded-full px-2 text-[10px] font-medium border border-white/10 bg-white/5 text-muted-foreground">
            No queue
          </Badge>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No leads in queue</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Import leads to start dialing</p>
          </div>
          <Link href="/leads">
            <Button size="sm" variant="outline" className="border-white/15 bg-white/5 text-xs hover:bg-white/10">
              Import leads
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">Active dialer</h2>
        <Badge
          className={cn(
            "rounded-full px-2 text-[10px] font-medium",
            callState === "connected"
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : callState === "dialing"
              ? "border border-amber-500/30 bg-amber-500/15 text-amber-300"
              : "border border-white/10 bg-white/5 text-muted-foreground",
          )}
        >
          {callState === "idle" ? "Ready" : callState === "dialing" ? "Dialing..." : callState === "connected" ? "Live" : "Call Ended"}
        </Badge>
      </div>

      {/* Lead info */}
      {loadingLeads ? (
        <div className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/5" />
      ) : currentLead ? (
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-brand/[0.06] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15">
            <User className="h-5 w-5 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{currentLead.name}</p>
            {currentLead.title && <p className="text-xs text-muted-foreground">{currentLead.title}</p>}
            {currentLead.company && (
              <div className="mt-1 flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{currentLead.company}</p>
              </div>
            )}
            <p className="mt-1 font-mono text-xs text-primary">{currentLead.phone}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 border-white/10 bg-white/5 text-[10px] text-muted-foreground">
            Attempt {currentLead.call_attempts}
          </Badge>
        </div>
      ) : null}

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      {/* Call timer */}
      <AnimatePresence>
        {callState === "connected" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 py-1"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="h-2 w-2 rounded-full bg-emerald-500"
            />
            <span className="font-mono text-xl font-semibold tabular-nums text-emerald-400">{formatTime(elapsed)}</span>
          </motion.div>
        )}
        {callState === "dialing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-1.5 py-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                className="h-1.5 w-1.5 rounded-full bg-amber-500"
              />
            ))}
            <span className="ml-1 text-sm font-medium text-amber-300">Connecting…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setMuted(!muted)}
          disabled={callState !== "connected"}
          title="Mute"
        >
          {muted ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
        </Button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={callState === "idle" ? handleCall : handleHangup}
          disabled={callState === "ended" || !currentLead}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors",
            callState === "idle"
              ? "bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] glow-brand-sm"
              : callState === "dialing"
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : callState === "connected"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "cursor-not-allowed bg-white/10 text-muted-foreground",
          )}
        >
          {callState === "idle" ? (
            <><Phone className="h-4 w-4" /> Call</>
          ) : callState === "dialing" ? (
            <><PhoneCall className="h-4 w-4" /> Dialing</>
          ) : callState === "connected" ? (
            <><PhoneOff className="h-4 w-4" /> Hang Up</>
          ) : (
            <><Clock className="h-4 w-4" /> Wrapping up</>
          )}
        </motion.button>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-white/15 bg-white/5 hover:bg-white/10"
          onClick={handleSkip}
          disabled={callState === "connected" || callState === "dialing" || leads.length <= 1}
          title="Skip to next lead"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Queue progress */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Queue progress
          </span>
          <span>{totalInQueue > 0 ? `${currentIndex + 1} / ${totalInQueue} leads` : "0 leads"}</span>
        </div>
        <Progress value={totalInQueue > 0 ? ((currentIndex + 1) / totalInQueue) * 100 : 0} className="h-1.5" />
      </div>
    </Card>
  );
}
