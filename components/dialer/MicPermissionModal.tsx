'use client';

import { useState } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';

export default function MicPermissionModal() {
  const { micPermission, requestMicPermission } = useWebPhone();
  const [requesting, setRequesting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show when permission is unknown and not dismissed
  if (micPermission === 'granted' || dismissed) return null;

  const handleGrant = async () => {
    setRequesting(true);
    await requestMicPermission();
    setRequesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.006_285)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          {micPermission === 'denied' ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/[0.08]">
                <MicOff className="h-7 w-7 text-rose-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Microphone blocked</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  Your browser has blocked microphone access. To make calls, open your
                  browser settings, find the permissions for this site, and allow the
                  microphone.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Chrome / Edge:</p>
                <p>Click the lock icon in the address bar → Microphone → Allow</p>
              </div>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                Dismiss
              </button>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08]">
                <Mic className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Allow microphone access</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  To make calls directly from your browser you need to grant microphone
                  access. Your audio is never recorded without your explicit consent.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGrant}
                disabled={requesting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60"
              >
                {requesting ? 'Requesting…' : 'Grant Permission'}
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
