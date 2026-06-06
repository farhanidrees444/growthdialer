'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, PhoneIncoming, PhoneMissed } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import type { CallLogRow } from '@/lib/calls/display';
import { fmtCallDuration, fmtCallTime, getCounterparty, isMissedCall } from '@/lib/calls/display';
import { cn } from '@/lib/utils';

export function InboundHistoryPanel() {
  const { apiFetch } = useWorkspace();
  const [calls, setCalls] = useState<CallLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch('/api/calls/logs?direction=inbound&limit=6')
      .then((r) => r.json())
      .then((d: { calls?: CallLogRow[] }) => setCalls(d.calls ?? []))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center">
        <PhoneIncoming className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No inbound calls yet.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          When someone dials your GrowthDialer number, it shows up here instantly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {calls.map((call, i) => {
        const missed = isMissedCall(call);
        return (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2.5',
              missed
                ? 'border-red-500/20 bg-red-500/[0.04]'
                : 'border-white/[0.06] bg-white/[0.02]',
            )}
          >
            {missed ? (
              <PhoneMissed className="h-4 w-4 shrink-0 text-red-400" />
            ) : (
              <PhoneIncoming className="h-4 w-4 shrink-0 text-cyan-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {getCounterparty(call)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {fmtCallTime(call.started_at ?? call.created_at)}
                {' · '}
                {fmtCallDuration(call.duration_seconds)}
                {missed && ' · Missed'}
              </p>
            </div>
          </motion.div>
        );
      })}
      <Link
        href="/call-logs?filter=inbound"
        className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition"
      >
        View all call logs
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
