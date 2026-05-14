import { motion } from 'framer-motion';
import { Bell, TrendingUp, Wifi, Sparkles } from 'lucide-react';

interface LiveStatsProps {
  calls: number;
  connects: number;
  meetings: number;
  connectRate: number;
  isReady: boolean;
  dnd: boolean;
}

export default function LiveStats({ calls, connects, meetings, connectRate, isReady, dnd }: LiveStatsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 py-4 px-6 rounded-[32px] border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,102,0.08)]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-emerald-400/80">Dialer</p>
            <h1 className="text-3xl font-semibold text-white">Parallel lines and live call controls</h1>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dnd ? 'bg-red-500/15 text-red-300' : 'bg-emerald-400/15 text-emerald-300'}`}>
            {dnd ? 'Do Not Disturb' : '● Online'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-[0_0_15px_rgba(0,255,102,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Calls</p>
          <p className="mt-2 text-2xl font-semibold text-white">{calls}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-[0_0_15px_rgba(0,255,102,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Connects</p>
          <p className="mt-2 text-2xl font-semibold text-white">{connects}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-[0_0_15px_rgba(0,255,102,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Meetings</p>
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

      <div className="absolute right-6 top-6 flex items-center gap-2 text-emerald-300">
        <Wifi className="h-4 w-4" />
        <span>{isReady ? 'Device ready' : 'Device offline'}</span>
      </div>
    </div>
  );
}
