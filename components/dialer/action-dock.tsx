'use client';

import { motion } from 'framer-motion';
import { Pause, MicOff, Mic, FileText, PhoneForwarded, Grid3X3, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ActionDockProps {
  isMuted: boolean;
  isOnHold: boolean;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onOpenNotes: () => void;
  onDropVoicemail: () => void;
  onOpenKeypad: () => void;
}

function DockButton({
  label,
  hotkey,
  onClick,
  active,
  children,
}: {
  label: string;
  hotkey?: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <motion.button
              onClick={onClick}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                  : 'bg-white/[0.07] border border-white/[0.08] text-white/70 hover:bg-white/[0.12] hover:text-white'
              }`}
              aria-label={label}
            />
          }
        >
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
          {hotkey && (
            <kbd className="ml-2 px-1 py-0.5 bg-white/10 rounded text-[10px] font-mono">{hotkey}</kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ActionDock({
  isMuted,
  isOnHold,
  onToggleMute,
  onToggleHold,
  onOpenNotes,
  onDropVoicemail,
  onOpenKeypad,
}: ActionDockProps) {
  return (
    <div className="flex items-center justify-center gap-3" role="toolbar" aria-label="Call controls">
      <DockButton label={isOnHold ? 'Resume' : 'Hold'} hotkey="O" onClick={onToggleHold} active={isOnHold}>
        <Pause className="w-4 h-4" />
      </DockButton>

      <DockButton label={isMuted ? 'Unmute' : 'Mute'} hotkey="M" onClick={onToggleMute} active={isMuted}>
        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </DockButton>

      <DockButton label="Notes" hotkey="N" onClick={onOpenNotes}>
        <FileText className="w-4 h-4" />
      </DockButton>

      <DockButton label="Voicemail Drop" hotkey="V" onClick={onDropVoicemail}>
        <PhoneForwarded className="w-4 h-4" />
      </DockButton>

      <DockButton label="DTMF Keypad" hotkey="K" onClick={onOpenKeypad}>
        <Grid3X3 className="w-4 h-4" />
      </DockButton>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                className="relative w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-white/30 cursor-not-allowed"
                disabled
                aria-label="Add to conference (coming soon)"
              />
            }
          >
            <Plus className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 text-[8px] bg-purple-500/80 text-white rounded px-1">v2</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Transfer / Conference — Coming in v2</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
