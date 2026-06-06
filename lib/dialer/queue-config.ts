import type { DialerQueueConfig, DialerQueueFilters, DialerQueueSort, DialerQueueTab } from './queue-query';
import { DEFAULT_QUEUE_FILTERS } from './queue-query';

const SORT_KEYS: DialerQueueSort[] = ['priority', 'recent', 'az', 'tz_safe'];

export function getSavedQueueConfig(): DialerQueueConfig {
  if (typeof window === 'undefined') {
    return { tab: 'queue', sort: 'priority', filters: DEFAULT_QUEUE_FILTERS };
  }

  try {
    const savedSort = localStorage.getItem('dialer-sort');
    const sort = savedSort && SORT_KEYS.includes(savedSort as DialerQueueSort)
      ? (savedSort as DialerQueueSort)
      : 'priority';

    const savedFilters = localStorage.getItem('dialer-filters');
    const filters: DialerQueueFilters = savedFilters
      ? { ...DEFAULT_QUEUE_FILTERS, ...JSON.parse(savedFilters) as DialerQueueFilters }
      : DEFAULT_QUEUE_FILTERS;

    return {
      tab: 'queue' as DialerQueueTab,
      sort,
      filters,
    };
  } catch {
    return { tab: 'queue', sort: 'priority', filters: DEFAULT_QUEUE_FILTERS };
  }
}
