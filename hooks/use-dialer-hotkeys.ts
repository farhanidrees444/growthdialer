'use client';

import { useEffect, useRef } from 'react';
import type { DialerMode } from '@/lib/dialer/state-machine';

interface HotkeyHandlers {
  mode: DialerMode;
  /** When true, Space in preview is handled by power countdown — do not manual-dial */
  powerDialActive?: boolean;
  onOpenManualDial: () => void;
  onOpenShortcuts: () => void;
  onFocusSearch: () => void;
  onNavigateQueue: (direction: 'up' | 'down') => void;
  onSelectLead: () => void;
  onStartPowerDial: () => void;
  onStartCall: () => void;
  onSkipLead: () => void;
  onMarkHot: () => void;
  onQuickNote: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onOpenNotes: () => void;
  onDropVoicemail: () => void;
  onOpenKeypad: () => void;
  onDisposition: (index: number) => void;
  onClose: () => void;
}

export function useDialerHotkeys(handlers: HotkeyHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const h = handlersRef.current;

      // Global hotkeys (work even in inputs for Escape)
      if (e.key === 'Escape') { h.onClose(); return; }

      if (isInput) return; // remaining hotkeys are blocked when typing

      // Global (all modes)
      if (e.key === '?' && !e.shiftKey) { e.preventDefault(); h.onOpenShortcuts(); return; }
      if (e.key === 'd' || e.key === 'D') { e.preventDefault(); h.onOpenManualDial(); return; }
      if (e.key === '/') { e.preventDefault(); h.onFocusSearch(); return; }

      const { mode } = h;

      if (mode === 'browse') {
        if (e.key === 'ArrowUp') { e.preventDefault(); h.onNavigateQueue('up'); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); h.onNavigateQueue('down'); return; }
        if (e.key === 'Enter') { e.preventDefault(); h.onSelectLead(); return; }
        if (e.key === 'p' || e.key === 'P') { e.preventDefault(); h.onStartPowerDial(); return; }
      }

      if (mode === 'preview') {
        if (!h.powerDialActive && e.key === ' ') { e.preventDefault(); h.onStartCall(); return; }
        if (!h.powerDialActive && (e.key === 's' || e.key === 'S')) { e.preventDefault(); h.onSkipLead(); return; }
        if (e.key === 'h' || e.key === 'H') { e.preventDefault(); h.onMarkHot(); return; }
        if (e.key === 'n' || e.key === 'N') { e.preventDefault(); h.onQuickNote(); return; }
      }

      if (mode === 'live') {
        if (e.key === ' ') { e.preventDefault(); h.onEndCall(); return; }
        if (e.key === 'm' || e.key === 'M') { e.preventDefault(); h.onToggleMute(); return; }
        if (e.key === 'o' || e.key === 'O') { e.preventDefault(); h.onToggleHold(); return; }
        if (e.key === 'n' || e.key === 'N') { e.preventDefault(); h.onOpenNotes(); return; }
        if (e.key === 'v' || e.key === 'V') { e.preventDefault(); h.onDropVoicemail(); return; }
        if (e.key === 'k' || e.key === 'K') { e.preventDefault(); h.onOpenKeypad(); return; }
        const digit = parseInt(e.key, 10);
        if (digit >= 1 && digit <= 8) { e.preventDefault(); h.onDisposition(digit - 1); return; }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
