"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  SkipForward,
  Clock,
  Building2,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type CallState = "idle" | "dialing" | "connected" | "ended";

const currentLead = {
  name: "Sarah Chen",
  title: "VP of Sales",
  company: "TechNova Inc.",
  phone: "+15551234567",
  attempts: 2,
};

export default function DialerWidget() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [callControlId, setCallControlId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === "connected") {
      interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleCall = useCallback(async () => {
    if (callState !== "idle") return;
    setError(null);
    setCallState("dialing");
    try {
      const res = await fetch("/api/calls/dial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: currentLead.phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to dial");
      }
      setCallControlId(data.call_control_id ?? null);
      setCallState("connected");
    } catch (err) {
      console.error("Dial error:", err);
      setError(err instanceof Error ? err.message : "Call failed");
      setCallState("idle");
    }
  }, [callState]);

  const handleHangup = useCallback(async () => {
    if (callState === "idle" || callState === "ended") return;
    setCallState("ended");
    try {
      if (callControlId) {
        await fetch("/api/calls/hangup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ call_control_id: callControlId }),
        });
      }
    } catch (err) {
      console.error("Hangup error:", err);
    } finally {
      setCallControlId(null);
      setTimeout(() => setCallState("idle"), 1200);
    }
  }, [callState, callControlId]);

  const handleMainButton = () => {
    if (callState === "idle") {
      handleCall();
    } else if (callState === "connected" || callState === "dialing") {
      handleHangup();
    }
  };

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
              : "border border-white/10 bg-white/5 text-muted-foreground"
          )}
        >
          {callState === "idle"
            ? "Ready"
            : callState === "dialing"
            ? "Dialing..."
            : callState === "connected"
            ? "Live"
            : "Call Ended"}
        </Badge>
      </div>

      {/* Lead info */}
      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-brand/[0.06] p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15">
          <User className="h-5 w-5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{currentLead.name}</p>
          <p className="text-xs text-muted-foreground">{currentLead.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{currentLead.company}</p>
          </div>
          <p className="text-xs font-mono text-primary mt-1">{currentLead.phone}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 border-white/10 bg-white/5 text-[10px] text-muted-foreground">
          Attempt {currentLead.attempts}
        </Badge>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
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
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
            <span className="font-mono text-xl font-semibold tabular-nums text-emerald-400">
              {formatTime(elapsed)}
            </span>
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
                className="w-1.5 h-1.5 rounded-full bg-amber-500"
              />
            ))}
            <span className="ml-1 text-sm font-medium text-amber-300">Connecting via Telnyx…</span>
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
        >
          {muted ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setSpeakerOff(!speakerOff)}
          disabled={callState !== "connected"}
        >
          {speakerOff ? (
            <VolumeX className="w-4 h-4 text-red-500" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>

        {/* Main call button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleMainButton}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-colors",
            callState === "idle"
              ? "bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] glow-brand-sm"
              : callState === "dialing"
              ? "bg-amber-500 hover:bg-amber-600"
              : callState === "connected"
              ? "bg-red-500 hover:bg-red-600"
              : "cursor-not-allowed bg-white/10 text-muted-foreground"
          )}
          disabled={callState === "ended"}
        >
          {callState === "idle" ? (
            <><Phone className="w-4 h-4" /> Call</>
          ) : callState === "dialing" ? (
            <><PhoneCall className="w-4 h-4" /> Dialing</>
          ) : callState === "connected" ? (
            <><PhoneOff className="w-4 h-4" /> Hang Up</>
          ) : (
            <><Clock className="w-4 h-4" /> Wrapping up</>
          )}
        </motion.button>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-white/15 bg-white/5 hover:bg-white/10"
          disabled={callState === "connected" || callState === "dialing"}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Queue progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Queue progress
          </span>
          <span>34 / 80 leads</span>
        </div>
        <Progress value={42} className="h-1.5" />
      </div>
    </Card>
  );
}
