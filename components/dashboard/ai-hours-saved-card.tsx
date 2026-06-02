"use client";

import { motion } from "framer-motion";
import { Brain, Clock, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AIHoursSaved } from "@/lib/dashboard-types";

interface AIHoursSavedCardProps {
  data: AIHoursSaved;
  loading?: boolean;
}

function StatRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold tabular-nums">
        {value.toFixed(1)} <span className="text-muted-foreground font-normal">{unit}</span>
      </span>
    </div>
  );
}

export default function AIHoursSavedCard({ data, loading }: AIHoursSavedCardProps) {
  return (
    <Card className="border-white/10 bg-[oklch(0.09_0.006_285)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 border border-white/10">
          <Brain className="h-5 w-5 text-fuchsia-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">AI Hours Saved</p>
          <div className="mt-1 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
            ) : (
              <>
                <p className="font-display text-2xl font-bold tracking-tight text-fuchsia-400">
                  {data.total.toFixed(1)}
                </p>
                <span className="text-sm text-muted-foreground">hrs this month</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 space-y-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5"
        >
          <StatRow label="Transcription" value={data.transcription} unit="hrs" />
          <StatRow label="Disposition tagging" value={data.disposition} unit="hrs" />
          <StatRow label="Summary writing" value={data.summary} unit="hrs" />
        </motion.div>
      )}

      {!loading && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/8 px-3 py-2">
          <DollarSign className="h-4 w-4 shrink-0 text-fuchsia-400" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Estimated value saved</p>
            <p className="font-display text-sm font-bold text-fuchsia-400">
              ${data.dollarValue.toLocaleString()}
            </p>
          </div>
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">@ $50/hr</span>
        </div>
      )}
    </Card>
  );
}
