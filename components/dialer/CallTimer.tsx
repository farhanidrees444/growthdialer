import { Clock3 } from 'lucide-react';

interface CallTimerProps {
  duration: number;
  status: string;
  quality: number;
}

function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function CallTimer({ duration, status, quality }: CallTimerProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_0_30px_rgba(0,255,102,0.08)] text-center">
      <div className="flex items-center justify-center gap-2 text-slate-300">
        <Clock3 className="h-4 w-4 text-emerald-300" />
        <span className="text-xs uppercase tracking-[0.35em] text-slate-500">{status}</span>
      </div>
      <p className="mt-3 text-5xl font-semibold text-white">{formatDuration(duration)}</p>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
        <span className="rounded-full bg-white/5 px-3 py-1 uppercase tracking-[0.24em]">Quality</span>
        <span className="font-semibold text-white">{quality}%</span>
      </div>
    </div>
  );
}
