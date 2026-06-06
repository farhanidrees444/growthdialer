import type { SupabaseClient } from '@supabase/supabase-js';

export type DialerQueueTab = 'queue' | 'hot' | 'callbacks';
export type DialerQueueSort = 'priority' | 'recent' | 'az' | 'tz_safe';

export interface DialerQueueFilters {
  hasPhone?: boolean;
  hot?: boolean;
  callbacks?: boolean;
  hasNotes?: boolean;
  recentlyContacted?: boolean;
  tzSafe?: boolean;
}

export interface DialerQueueConfig {
  tab?: DialerQueueTab;
  sort?: DialerQueueSort;
  search?: string;
  filters?: DialerQueueFilters;
  excludeIds?: string[];
  limit?: number;
  offset?: number;
}

export const DEFAULT_QUEUE_FILTERS: DialerQueueFilters = {
  hasPhone: true,
};

export const LEAD_QUEUE_SELECT =
  'id, name, title, company, phone, email, status, ai_score, last_called_at, call_attempts, tags, notes, dnc, user_id';

const TERMINAL_STATUSES = '("do_not_call","meeting_booked")';

export function normalizeQueueConfig(config: DialerQueueConfig = {}): Required<
  Pick<DialerQueueConfig, 'tab' | 'sort' | 'search' | 'filters' | 'excludeIds' | 'limit' | 'offset'>
> {
  return {
    tab: config.tab ?? 'queue',
    sort: config.sort ?? 'priority',
    search: config.search ?? '',
    filters: { ...DEFAULT_QUEUE_FILTERS, ...config.filters },
    excludeIds: config.excludeIds ?? [],
    limit: config.limit ?? 500,
    offset: config.offset ?? 0,
  };
}

export function buildDialerLeadsQuery(
  supabase: SupabaseClient,
  workspaceId: string,
  rawConfig: DialerQueueConfig = {},
) {
  const { tab, sort, search, filters, excludeIds, limit, offset } = normalizeQueueConfig(rawConfig);

  let query = supabase
    .from('leads')
    .select(LEAD_QUEUE_SELECT)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .not('status', 'in', TERMINAL_STATUSES)
    .eq('dnc', false);

  if (tab === 'hot') {
    query = query.gte('ai_score', 70);
  } else if (tab === 'callbacks') {
    query = query.eq('status', 'callback');
  }

  if (filters.hasPhone) {
    query = query.not('phone', 'is', null).neq('phone', '');
  }
  if (filters.hot && tab !== 'hot') {
    query = query.gte('ai_score', 70);
  }
  if (filters.callbacks && tab !== 'callbacks') {
    query = query.eq('status', 'callback');
  }
  if (filters.hasNotes) {
    query = query.not('notes', 'is', null).neq('notes', '');
  }
  if (filters.recentlyContacted) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('last_called_at', sevenDaysAgo);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.map((id) => `"${id}"`).join(',')})`);
  }

  const effectiveSort = sort === 'tz_safe' ? 'priority' : sort;
  if (effectiveSort === 'priority') {
    query = query
      .order('ai_score', { ascending: false })
      .order('last_called_at', { ascending: true, nullsFirst: true });
  } else if (effectiveSort === 'recent') {
    query = query.order('last_called_at', { ascending: false, nullsFirst: false });
  } else if (effectiveSort === 'az') {
    query = query.order('name', { ascending: true });
  } else {
    query = query.order('ai_score', { ascending: false });
  }

  return query.range(offset, offset + limit - 1);
}

export function buildDialerQueueCountQuery(
  supabase: SupabaseClient,
  workspaceId: string,
  rawConfig: DialerQueueConfig = {},
) {
  const { tab, search, filters, excludeIds } = normalizeQueueConfig({ ...rawConfig, limit: 1, offset: 0 });

  let query = supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .not('status', 'in', TERMINAL_STATUSES)
    .eq('dnc', false);

  if (tab === 'hot') {
    query = query.gte('ai_score', 70);
  } else if (tab === 'callbacks') {
    query = query.eq('status', 'callback');
  }

  if (filters.hasPhone) {
    query = query.not('phone', 'is', null).neq('phone', '');
  }
  if (filters.hot && tab !== 'hot') {
    query = query.gte('ai_score', 70);
  }
  if (filters.callbacks && tab !== 'callbacks') {
    query = query.eq('status', 'callback');
  }
  if (filters.hasNotes) {
    query = query.not('notes', 'is', null).neq('notes', '');
  }
  if (filters.recentlyContacted) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('last_called_at', sevenDaysAgo);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.map((id) => `"${id}"`).join(',')})`);
  }

  return query;
}

export async function fetchDialerQueueCounts(
  supabase: SupabaseClient,
  workspaceId: string,
) {
  const base = () =>
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .not('status', 'in', TERMINAL_STATUSES)
      .eq('dnc', false)
      .not('phone', 'is', null)
      .neq('phone', '');

  const [{ count: hotCount }, { count: callbackCount }, { count: totalCount }] = await Promise.all([
    base().gte('ai_score', 70),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .eq('status', 'callback'),
    base(),
  ]);

  return {
    queue: totalCount ?? 0,
    hot: hotCount ?? 0,
    callbacks: callbackCount ?? 0,
  };
}
