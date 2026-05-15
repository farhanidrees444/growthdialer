"use client";

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface LiveStatsProps {
  calls: number;
  connects: number;
  meetings: number;
  connectRate: number;
}

export default function LiveStats({ calls, connects, meetings, connectRate }: LiveStatsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 py-4 px-6 rounded-[32px] border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,102,0.08)]">
      <div className="flex items-center">
        <h1 className="text-3xl font-semibold text-white">Dialer</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-[0_0_15px_rgba(0,255,102,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Calls Today</p>
          <p className="mt-2 text-2xl font-semibold text-white">{calls}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-[0_0_15px_rgba(0,255,102,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Connects Today</p>
          <p className="mt-2 text-2xl font-semibold text-white">{connects}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-[0_0_15px_rgba(0,255,102,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Meetings Today</p>
          <p className="mt-2 text-2xl font-semibold text-white">{meetings}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-[0_0_15px_rgba(0,255,102,0.08)]">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.3em]">Connect Rate</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">{connectRate.toFixed(1)}%</p>
        </motion.div>
      </div>
    </div>
  );
}
