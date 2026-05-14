"use client";

import { useState, useEffect } from "react";
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
  phone: "+1 (555) 842-7391",
  attempts: 2,
};

export default function DialerWidget() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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

  const handleCall = () => {
    if (callState === "idle") {
      setCallState("dialing");
      setTimeout(() => setCallState("connected"), 2500);
    } else if (callState === "connected" || callState === "dialing") {
      setCallState("ended");
      setTimeout(() => setCallState("idle"), 1500);
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Active Dialer</h2>
        <Badge
          className={cn(
            "text-[10px] px-2 rounded-full font-medium",
            callState === "connected"
              ? "bg-emerald-100 text-emerald-700"
              : callState === "dialing"
              ? "bg-amber-100 text-amber-700"
              : "bg-muted text-muted-foreground"
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
      <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
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
        <Badge variant="secondary" className="text-[10px] shrink-0">
          Attempt {currentLead.attempts}
        </Badge>
      </div>

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
            <span className="font-mono text-xl font-semibold tabular-nums text-emerald-600">
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
            <span className="ml-1 text-sm text-amber-600 font-medium">Calling...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9 rounded-full"
          onClick={() => setMuted(!muted)}
          disabled={callState !== "connected"}
        >
          {muted ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9 rounded-full"
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
          onClick={handleCall}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-white transition-colors",
            callState === "idle"
              ? "bg-primary hover:bg-primary/90"
              : callState === "dialing"
              ? "bg-amber-500 hover:bg-amber-600"
              : callState === "connected"
              ? "bg-red-500 hover:bg-red-600"
              : "bg-muted text-muted-foreground cursor-not-allowed"
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
          className="w-9 h-9 rounded-full"
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
