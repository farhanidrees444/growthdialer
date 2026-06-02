'use client';

import { useCallAudio } from '@/hooks/use-call-audio';

interface CallerWaveformProps {
  active: boolean;
}

export function CallerWaveform({ active }: CallerWaveformProps) {
  const { bars } = useCallAudio(active);

  return (
    <div
      className="flex items-end justify-center gap-[2px] w-full"
      style={{ height: 80 }}
      aria-label="Audio waveform"
    >
      {bars.map((height, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all duration-75"
          style={{
            height: Math.max(3, height),
            minWidth: 2,
            background: active
              ? `linear-gradient(to top, hsl(262,80%,50%), hsl(186,100%,42%))'`
              : 'rgba(255,255,255,0.08)',
            opacity: active ? 0.85 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
