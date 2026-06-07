import { Shield, Sparkles, Users, Zap } from 'lucide-react';

const ITEMS = [
  { icon: Zap, label: 'Free Starter tier', detail: 'No credit card' },
  { icon: Sparkles, label: 'AI on every call', detail: 'Summaries & sentiment' },
  { icon: Users, label: 'Workspace pricing', detail: 'Not per-seat surprises' },
  { icon: Shield, label: 'SOC 2 in progress', detail: 'Enterprise-ready path' },
];

export function TrustStrip() {
  return (
    <section className="border-y border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-zinc-800/40 md:grid-cols-4">
        {ITEMS.map(({ icon: Icon, label, detail }) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-zinc-950 px-5 py-4 sm:px-6 sm:py-5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-zinc-400">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-zinc-200">{label}</p>
              <p className="truncate text-[11px] text-zinc-600">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
