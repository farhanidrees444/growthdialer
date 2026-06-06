'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
export interface AppHotkeyHandlers {
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onNavigateList: (dir: 'up' | 'down') => void;
  onOpenSelected: () => void;
  onCallSelected: () => void;
}

interface UseAppHotkeysOptions {
  enabled?: boolean;
  listNavigationEnabled?: boolean;
  selectedIndex?: number;
  itemCount?: number;
}

/**
 * App-wide shortcuts — defers to dialer hotkeys on /dialer.
 * j/k list nav on leads, call-logs, recordings when enabled.
 */
export function useAppHotkeys(
  handlers: AppHotkeyHandlers,
  options: UseAppHotkeysOptions = {},
) {
  const pathname = usePathname();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const { enabled = true, listNavigationEnabled = false } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isDialer = pathname?.startsWith('/dialer');
      const h = handlersRef.current;

      // Command palette — always (except inputs)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        h.onOpenCommandPalette();
        return;
      }

      if (isInput && e.key !== 'Escape') return;

      // Shortcuts help — global except dialer (dialer has its own ?)
      if (e.key === '?' && !e.shiftKey && !isDialer) {
        e.preventDefault();
        h.onOpenShortcuts();
        return;
      }

      if (isDialer) return;

      const listPages = ['/leads', '/call-logs', '/recordings'];
      const onListPage = listPages.some((p) => pathname?.startsWith(p));

      if (listNavigationEnabled && onListPage) {
        if (e.key === 'j' || e.key === 'J') {
          e.preventDefault();
          h.onNavigateList('down');
          return;
        }
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          h.onNavigateList('up');
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          h.onOpenSelected();
          return;
        }
        if (e.key === 'c' || e.key === 'C') {
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            h.onCallSelected();
          }
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, listNavigationEnabled, pathname]);
}
