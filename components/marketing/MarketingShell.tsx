import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { SiteFooter } from '@/components/marketing/live-floor/SiteFooter';

/**
 * Shared on-brand chrome for secondary marketing pages — light canvas,
 * the light Nav and the structured footer, wrapped in reduced-motion
 * config. `overflow-x-clip` (not hidden) so it never breaks sticky descendants.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionShell>
      <div className="relative min-h-screen overflow-x-clip bg-white text-zinc-950 antialiased">
        <Nav />
        <main className="relative z-[2]">{children}</main>
        <SiteFooter />
      </div>
    </MotionShell>
  );
}
