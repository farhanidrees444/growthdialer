'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, PhoneIncoming, PhoneMissed } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/workspace-context';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import type { CallLogRow } from '@/lib/calls/display';
import { fmtCallDuration, fmtCallTime, getCounterparty, isMissedCall } from '@/lib/calls/display';
import { cn } from '@/lib/utils';
import { useSiteTheme } from '@/components/theme/site-theme';

interface Props {
  /** Subscribe to realtime inserts for live refresh */
  live?: boolean;
}

export function InboundHistoryPanel({ live = false }: Props) {
  const { isDark } = useSiteTheme();
  const session = useSupabaseSession();
  const userId = session?.user?.id;
  const { apiFetch } = useWorkspace();
  const [calls, setCalls] = useState<CallLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    void apiFetch('/api/incoming/history?limit=8')
      .then((r) => r.json())
      .then((d: { calls?: CallLogRow[] }) => setCalls(d.calls ?? []))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!live || !userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`inbound-history-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown> | undefined;
          if (row) load();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [live, userId, load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className={cn(
        'rounded-2xl border border-dashed p-8 text-center',
        isDark ? 'border-white/[0.1] bg-white/[0.01]' : 'border-zinc-950/[0.12] bg-white',
      )}>
        <div className={cn(
          'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl',
          isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/[0.08]',
        )}>
          <PhoneIncoming className={cn('h-7 w-7', isDark ? 'text-cyan-400/60' : 'text-cyan-600/70')} />
        </div>
        <p className={cn('text-sm font-medium', isDark ? 'text-white/80' : 'text-zinc-900')}>
          Waiting for your first inbound call
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
          Share your inbound number. When someone calls, it appears here instantly — with lead screen-pop if they&apos;re in your CRM.
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
            transition={{ delay: i * 0.04 }}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3.5 py-3 transition',
              missed
                ? isDark
                  ? 'border-red-500/20 bg-red-500/[0.05]'
                  : 'border-red-500/25 bg-red-500/[0.06]'
                : isDark
                  ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
                  : 'border-zinc-950/[0.06] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.04)] hover:border-zinc-950/[0.12]',
            )}
          >
            {missed ? (
              <PhoneMissed className={cn('h-4 w-4 shrink-0', isDark ? 'text-red-400' : 'text-red-600')} />
            ) : (
              <PhoneIncoming className={cn('h-4 w-4 shrink-0', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm font-medium', isDark ? 'text-white' : 'text-zinc-900')}>
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
        className={cn(
          'mt-2 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition',
          isDark
            ? 'border-white/[0.08] bg-white/[0.02] text-cyan-400 hover:bg-cyan-500/10'
            : 'border-zinc-950/10 bg-white text-cyan-700 shadow-sm hover:bg-cyan-50',
        )}
      >
        View all inbound logs
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
