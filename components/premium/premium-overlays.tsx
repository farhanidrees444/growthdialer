'use client';

import dynamic from 'next/dynamic';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GlobalShortcutsModal } from '@/components/premium/global-shortcuts-modal';
import { MilestoneCelebration } from '@/components/premium/milestone-celebration';
import { MilestoneWatcher } from '@/components/premium/milestone-watcher';
import { useAppHotkeys } from '@/hooks/use-app-hotkeys';

const AppCommandPalette = dynamic(
  () => import('@/components/premium/app-command-palette').then((m) => m.AppCommandPalette),
  { ssr: false },
);

export function PremiumOverlays() {
  const pathname = usePathname();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const openCmd = useCallback(() => setCmdOpen(true), []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);

  useEffect(() => {
    const onShortcuts = () => setShortcutsOpen(true);
    window.addEventListener('gd:open-shortcuts', onShortcuts);
    return () => window.removeEventListener('gd:open-shortcuts', onShortcuts);
  }, []);

  useAppHotkeys(
    {
      onOpenCommandPalette: openCmd,
      onOpenShortcuts: openShortcuts,
      onNavigateList: (dir) => {
        window.dispatchEvent(new CustomEvent('gd:list-nav', { detail: { dir } }));
      },
      onOpenSelected: () => {
        window.dispatchEvent(new CustomEvent('gd:list-open', { detail: {} }));
      },
      onCallSelected: () => {
        window.dispatchEvent(new CustomEvent('gd:list-call', { detail: {} }));
      },
    },
    {
      enabled: !pathname?.startsWith('/workspace/setup'),
      listNavigationEnabled: true,
    },
  );

  return (
    <>
      <Suspense fallback={null}>
        <AppCommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </Suspense>
      <GlobalShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <MilestoneCelebration />
      <MilestoneWatcher />
    </>
  );
}
