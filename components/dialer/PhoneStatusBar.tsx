'use client';

import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { useWebPhone, type PhoneStatus } from '@/contexts/webphone-context';

function StatusDot({ status }: { status: PhoneStatus }) {
  if (status === 'ready') {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
    );
  }
  if (status === 'initializing') {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />;
  }
  return <WifiOff className="h-3.5 w-3.5 text-rose-400" />;
}

export default function PhoneStatusBar() {
  const { phoneStatus, reconnect } = useWebPhone();

  const label =
    phoneStatus === 'ready'
      ? 'Ready to call'
      : phoneStatus === 'initializing'
        ? 'Connecting…'
        : 'Phone offline';

  const baseClass =
    'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors';

  const colorClass =
    phoneStatus === 'ready'
      ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300'
      : phoneStatus === 'initializing'
        ? 'border-amber-500/25 bg-amber-500/[0.08] text-amber-300'
        : 'border-rose-500/25 bg-rose-500/[0.08] text-rose-300';

  return (
    <div className={`${baseClass} ${colorClass}`}>
      <StatusDot status={phoneStatus} />
      <span>{label}</span>
      {phoneStatus === 'error' && (
        <button
          type="button"
          onClick={reconnect}
          className="ml-1 flex items-center gap-1 rounded-full border border-rose-500/30 px-2 py-0.5 text-[10px] hover:border-rose-400/50 hover:bg-rose-500/10 transition-colors"
          title="Reconnect"
        >
          <RefreshCw className="h-2.5 w-2.5" />
          Reconnect
        </button>
      )}
      {phoneStatus === 'idle' && (
        <Wifi className="h-3.5 w-3.5 opacity-40" />
      )}
    </div>
  );
}
