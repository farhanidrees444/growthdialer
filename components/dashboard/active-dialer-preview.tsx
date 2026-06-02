'use client';

import { Phone, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActiveDialerPreviewProps {
  leadsInQueue: number;
}

export default function ActiveDialerPreview({ leadsInQueue }: ActiveDialerPreviewProps) {
  const router = useRouter();

  return (
    <div className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.07] bg-[oklch(0.07_0.006_285)] p-8">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_60%_50%_at_50%_100%,oklch(0.5_0.2_145_/_0.08),transparent)]" />

      {/* Status badge */}
      <div className="absolute left-4 top-4 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-600">
        <Zap className="h-3 w-3 text-emerald-400 animate-pulse" />
        Voice engine ready
      </div>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.06] bg-[oklch(0.05_0.015_286)] shadow-inner shadow-black/40">
          <Phone className="h-8 w-8 text-slate-600" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white">Ready to Call</h3>
          <p className="mt-1 text-sm text-slate-400">
            {leadsInQueue > 0
              ? `${leadsInQueue} lead${leadsInQueue !== 1 ? 's' : ''} in queue · Start when ready`
              : 'Import leads to begin calling'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dialer')}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-8 py-3 text-sm font-bold uppercase tracking-wider text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:shadow-[0_0_28px_rgba(16,185,129,0.25)]"
        >
          Start Calling
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
