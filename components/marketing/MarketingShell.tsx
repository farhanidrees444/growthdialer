import { MotionShell } from '@/components/marketing/live-floor/MotionShell';
import { Nav } from '@/components/marketing/live-floor/Nav';
import { Grain } from '@/components/marketing/live-floor/Grain';
import { SiteFooter } from '@/components/marketing/live-floor/SiteFooter';

/**
 * Shared on-brand chrome for secondary marketing pages — matte-black canvas,
 * grain, the cinematic Nav and the shared footer, wrapped in reduced-motion
 * config. `overflow-x-clip` (not hidden) so it never breaks sticky descendants.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionShell>
      <div className="relative min-h-screen bg-[#08080A] text-[#F5F5F7] antialiased">
        <Grain />
        <Nav />
        <main className="relative z-[2]">{children}</main>
        <SiteFooter />
      </div>
    </MotionShell>
  );
}
