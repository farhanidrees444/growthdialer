'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ShortcutsHelpModalProps {
  open: boolean;
  onClose: () => void;
}

const GROUPS = [
  {
    label: 'Global',
    keys: [
      { keys: ['?'], desc: 'Open this shortcuts modal' },
      { keys: ['D'], desc: 'Open manual dialer' },
      { keys: ['/'], desc: 'Focus queue search' },
      { keys: ['Esc'], desc: 'Close overlay / modal' },
    ],
  },
  {
    label: 'Browse mode',
    keys: [
      { keys: ['↑'↓'], desc: 'Navigate queue' },
      { keys: ['Enter'], desc: 'Select lead' },
      { keys: ['P'], desc: 'Start power dial' },
    ],
  },
  {
    label: 'Preview mode',
    keys: [
      { keys: ['Space'], desc: 'Start call' },
      { keys: ['S'], desc: 'Skip lead' },
      { keys: ['H'], desc: 'Mark hot' },
      { keys: ['N'], desc: 'Open quick note' },
    ],
  },
  {
    label: 'Live call',
    keys: [
      { keys: ['Space'], desc: 'End call' },
      { keys: ['M'], desc: 'Toggle mute' },
      { keys: ['O'], desc: 'Toggle hold' },
      { keys: ['N'], desc: 'Open notes' },
      { keys: ['V'], desc: 'Drop voicemail' },
      { keys: ['K'], desc: 'Open DTMF keypad' },
      { keys: ['1–8'], desc: 'Select disposition' },
    ],
  },
];

export function ShortcutsHelpModal({ open, onClose }: ShortcutsHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-zinc-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-[11px] font-medium uppercase tracking-widest text-white/30 mb-2">
                {group.label}
              </div>
              <div className="space-y-1.5">
                {group.keys.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 text-[11px] bg-white/[0.07] border border-white/[0.12] rounded text-white/80 font-mono"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
