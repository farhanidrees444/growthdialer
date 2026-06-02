'use client';

import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface CallDot {
  id: string;
  leadName: string;
  disposition: string | null;
  time: string;
}

interface SessionReplayMapProps {
  calls: CallDot[];
  onDotClick?: (callId: string) => void;
}

const DOT_COLOR: Record<string, string> = {
  interested:     'bg-green-400',
  meeting_booked: 'bg-green-500',
  callback:       'bg-cyan-400',
  voicemail:      'bg-yellow-400',
  not_interested: 'bg-red-500',
  dnc:            'bg-red-600',
  no_answer:      'bg-zinc-500',
  gatekeeper:     'bg-zinc-400',
  wrong_number:   'bg-red-400',
};

function dotColor(disposition: string | null): string {
  if (!disposition) return 'bg-zinc-600';
  return DOT_COLOR[disposition] ?? 'bg-zinc-500';
}

export function SessionReplayMap({ calls, onDotClick }: SessionReplayMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const visible = calls.slice(-50);

  if (visible.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[11px] text-white/20 tracking-widest">—— today&apos;s calls appear here ——</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((call) => (
        <TooltipProvider key={call.id}>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className={`w-2 h-2 rounded-full transition-all duration-150 ${dotColor(call.disposition)} ${hoveredId === call.id ? 'scale-150' : ', 'scale-100'} cursor-pointer`}
                  onMouseEnter={() => setHoveredId(call.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onDotClick?.(call.id)}
                  aria-label={`${call.leadName} · ${call.disposition ?? 'no disposition'}`}
                />
              }
            />
            <TooltipContent side="bottom" className="text-xs">
              <div className="font-medium">{call.leadName}</div>
              <div className="opacity-60">{call.disposition ?? 'no answer'} · {call.time}</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
