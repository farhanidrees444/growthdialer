'use client';

import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { getSoundEnabled, setSoundEnabled } from '@/lib/ui/sound-preferences';
import { cn } from '@/lib/utils';

function ToggleRow({
  label, description, checked, onChange, icon: Icon, iconColor,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: typeof Volume2;
  iconColor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} />
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="mt-0.5 text-xs text-white/35 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-[#8B5CF6]' : 'bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

export function SoundDesignToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(getSoundEnabled());
    const onPref = (e: Event) => {
      const v = (e as CustomEvent<{ enabled: boolean }>).detail?.enabled;
      if (typeof v === 'boolean') setEnabled(v);
    };
    window.addEventListener('gd:sound-pref', onPref);
    return () => window.removeEventListener('gd:sound-pref', onPref);
  }, []);

  return (
    <ToggleRow
      label="UI sound cues"
      description="Soft connect chime and disposition click. Off by default — never autoplays when disabled."
      checked={enabled}
      onChange={(v) => {
        setSoundEnabled(v);
        setEnabled(v);
      }}
      icon={Volume2}
      iconColor="text-[#06B6D4]"
    />
  );
}
