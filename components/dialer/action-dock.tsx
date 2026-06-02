'use client';

import { motion } from 'framer-motion';
import { Pause, MicOff, Mic, FileText, PhoneForwarded, Grid3X3, Circle, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ActionDockProps {
  isMuted: boolean;
  isOnHold: boolean;
  isRecording?: boolean;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onOpenNotes: () => void;
  onDropVoicemail: () => void;
  onOpenKeypad: () => void;
  onToggleRecord?: () => void;
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
  isRecording = false,
  onToggleMute,
  onToggleHold,
  onOpenNotes,
  onDropVoicemail,
  onOpenKeypad,
  onToggleRecord,
}: ActionDockProps) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap" role="toolbar" aria-label="Call controls">
      <DockButton label={isOnHold ? 'Resume' : ', 'Hold'} hotkey="O" onClick={onToggleHold} active={isOnHold}>
        <Pause className="w-4 h-4" />
      </DockButton>

      <DockButton label={isMuted ? 'Unmute' : ', 'Mute'} hotkey="M" onClick={onToggleMute} active={isMuted}>
        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </DockButton>

      <DockButton label="Notes" hotkey="N" onClick={onOpenNotes}>
        <FileText className="w-4 h-4" />
      </DockButton>

      <DockButton label="DTMF Keypad" hotkey="K" onClick={onOpenKeypad}>
        <Grid3X3 className="w-4 h-4" />
      </DockButton>

      <DockButton label="Voicemail Drop" hotkey="V" onClick={onDropVoicemail}>
        <PhoneForwarded className="w-4 h-4" />
      </DockButton>

      {onToggleRecord && (
        <DockButton
          label={isRecording ? 'Stop Recording' : ', 'Record'}
          hotkey="R"
          onClick={onToggleRecord}
          active={isRecording}
        >
          {isRecording ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
        </DockButton>
      )}
    </div>
  );
}
