import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Phone } from 'lucide-react';

interface LineStatus {
  id: number;
  label: string;
  status: 'ringing' | 'connected' | 'no-answer' | 'voicemail' | 'idle';
  timer: string;
}

interface ParallelLinesProps {
  lines: LineStatus[];
}

export default function ParallelLines({ lines }: ParallelLinesProps) {
  const statusConfig = {
    ringing: { text: 'Ringing...', color: 'text-amber-300', icon: <Phone className="h-4 w-4" /> },
    connected: { text: 'Connected ✓', color: 'text-emerald-300', icon: <CheckCircle2 className="h-4 w-4" /> },
    'no-answer': { text: 'No Answer ✗', color: 'text-slate-400', icon: <XCircle className="h-4 w-4" /> },
    voicemail: { text: 'Voicemail', color: 'text-slate-300', icon: <Phone className="h-4 w-4" /> },
    idle: { text: 'Empty', color: 'text-slate-500', icon: <Phone className="h-4 w-4" /> },
  } as const;

  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
      <div className="mb-4 flex items-center justify-between text-sm uppercase tracking-[0.32em] text-slate-400">
        <span>Parallel lines</span>
        <span className="text-emerald-300">Live status</span>
      </div>
      <div className="space-y-3">
        {lines.map((line) => {
          const config = statusConfig[line.status];
          return (
            <motion.div key={line.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Line {line.id}: {line.label}</p>
                <p className="text-xs text-slate-400">{line.timer}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '' }}>
                <span className={config.color}>{config.icon}</span>
                <span className={config.color}>{config.text}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
