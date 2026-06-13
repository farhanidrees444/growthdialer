'use client';

import { useState } from 'react';
import { Grid3x3, Zap, Shield, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ParallelDialConfigModalProps {
  open: boolean;
  queueCount: number;
  onClose: () => void;
  onStart: (config: { lines_count: number; amd_enabled: boolean; vm_drop_enabled: boolean }) => void;
}

import { MAX_PARALLEL_LINES } from '@/lib/parallel-dial/architecture';

const LINE_PRESETS = [2, 3] as const;

export function ParallelDialConfigModal({
  open,
  queueCount,
  onClose,
  onStart,
}: ParallelDialConfigModalProps) {
  const [lines, setLines] = useState(3);
  const [amd, setAmd] = useState(true);
  const [vmDrop, setVmDrop] = useState(true);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg border-white/10 bg-[oklch(0.09_0.006_285)] p-0 gap-0 overflow-hidden">
        <DialogHeader className="border-b border-white/[0.06] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/10 text-violet-300 ring-1 ring-violet-500/20">
              <Grid3x3 className="h-5 w-5" />
            </span>
            <div className="text-left">
              <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                Parallel Dial
                <Badge variant="secondary" className="text-[10px] bg-cyan-500/15 text-cyan-300 border-cyan-500/20">
                  {MAX_PARALLEL_LINES}× max
                </Badge>
              </DialogTitle>
              <DialogDescription>
                First live answer wins — losers auto-hang or get VM drop.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Simultaneous lines
            </label>
            <div className="flex flex-wrap gap-2">
              {LINE_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLines(n)}
                  className={cn(
                    'min-h-10 min-w-12 rounded-xl border px-3 text-sm font-semibold transition-all',
                    lines === n
                      ? 'border-violet-500/50 bg-violet-500/20 text-violet-100 shadow-lg shadow-violet-500/10'
                      : 'border-white/[0.08] text-muted-foreground hover:border-white/[0.15] hover:text-white',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {queueCount} in queue · batch uses up to {Math.min(lines, queueCount)} leads
            </p>
          </div>

          <div className="space-y-3">
            <ToggleRow
              icon={Shield}
              iconClass="text-cyan-400"
              title="Answering machine detection"
              description="Skip machines — only humans reach your headset."
              checked={amd}
              onCheckedChange={setAmd}
            />
            <ToggleRow
              icon={Zap}
              iconClass="text-amber-400"
              title="Auto voicemail drop"
              description="Drop VM on machines and losing lines automatically."
              checked={vmDrop}
              onCheckedChange={setVmDrop}
            />
          </div>

          <ul className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-muted-foreground">
            <li className="flex gap-2"><Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" /> AI brief + disposition same as power dial</li>
            <li className="flex gap-2"><Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" /> Realtime line grid — see every leg live</li>
            <li className="flex gap-2"><Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" /> First live answer bridges to your headset instantly</li>
          </ul>
        </div>

        <DialogFooter className="border-t border-white/[0.06] bg-transparent px-6 py-4 sm:justify-stretch gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={queueCount === 0}
            onClick={() => {
              onStart({ lines_count: lines, amd_enabled: amd, vm_drop_enabled: vmDrop });
              onClose();
            }}
            className="flex-[2] gradient-brand text-white border-0"
          >
            Launch parallel session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  icon: Icon,
  iconClass,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon: typeof Shield;
  iconClass: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', iconClass)} />
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
