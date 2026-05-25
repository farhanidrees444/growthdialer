'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SidebarCounts {
  leads: number | null;
  recordings: number | null;
  notifications: number | null;
  numbers: number | null;
}

export function useSidebarCounts(): SidebarCounts {
  const [counts, setCounts] = useState<SidebarCounts>({
    leads: null,
    recordings: null,
    notifications: null,
    numbers: null,
  });

  const fetchAll = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [leads, recordings, notifications, numbers] = await Promise.all([
      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null),
      supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('was_recorded', true),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null),
      supabase
        .from('purchased_numbers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active'),
    ]);

    setCounts({
      leads: leads.count,
      recordings: recordings.count,
      notifications: notifications.count,
      numbers: numbers.count,
    });
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Realtime: re-count on any change to the watched tables
  useEffect(() => {
    const supabase = createClient();
    const tables = ['leads', 'calls', 'notifications', 'purchased_numbers'] as const;

    const channels = tables.map((table) =>
      supabase
        .channel(`sidebar-count-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          void fetchAll();
        })
        .subscribe(),
    );

    return () => {
      channels.forEach((c) => void supabase.removeChannel(c));
    };
  }, [fetchAll]);

  return counts;
}

export function formatSidebarCount(n: number | null): string | null {
  if (n === null) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}
