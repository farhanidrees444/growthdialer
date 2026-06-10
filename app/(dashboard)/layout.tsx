"use client";

import Sidebar from "@/components/Sidebar";
import { LeadsProvider } from "@/contexts/leads-context";
import { ImportLeadsDialog } from "@/components/ImportLeadsDialog";
import { MobileNavProvider } from "@/contexts/mobile-nav-context";
import { TopHeader } from "@/components/layout/top-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { WebPhoneProvider } from "@/contexts/webphone-context";
import { CallProvider, useCallContext } from "@/lib/call-context";
import { CallOrchestratorProvider } from "@/contexts/call-orchestrator-context";
import ActiveCallOverlay from "@/components/active-call-overlay";
import SaveAsLeadModal from "@/components/save-as-lead-modal";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { WorkspaceGate } from "@/components/workspace/workspace-gate";
import { IncomingCallPopup } from "@/components/call/incoming-call-popup";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import { PremiumOverlays } from "@/components/premium/premium-overlays";
import { FloatingEdgeProvider } from "@/components/layout/floating-edge-provider";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { AmbientShell } from "@/components/dashboard/ambient-shell";
import { PageEnter } from "@/components/layout/page-enter";
import { resolveRouteAccent } from "@/lib/ui/route-accents";
import { PostHogIdentify } from "@/components/PostHogIdentify";

function DashboardOverlays() {
  const { showSaveAsLead, activePhone, dismissSaveAsLead } = useCallContext();
  const session = useSupabaseSession();
  const userId = session?.user?.id;
  return (
    <>
      <ActiveCallOverlay />
      {userId && <IncomingCallPopup userId={userId} />}
      {showSaveAsLead && activePhone && (
        <SaveAsLeadModal phone={activePhone} onClose={dismissSaveAsLead} />
      )}
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/workspace/setup");
  const routeAccent = resolveRouteAccent(pathname);

  return (
    <WorkspaceProvider>
      <PostHogIdentify />
      <WebPhoneProvider>
        <CallProvider>
          <FloatingEdgeProvider>
          <CallOrchestratorProvider>
          <LeadsProvider>
            <MobileNavProvider>
            <ImportLeadsDialog />
            <div className="dashboard-shell relative flex h-[100dvh] overflow-hidden bg-zinc-950 text-zinc-100">
              <AmbientShell accent={routeAccent.ambient} />
              <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.12]" aria-hidden />

              {!isOnboarding && <Sidebar />}
              <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
                {!isOnboarding && <TopHeader />}
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col overflow-hidden",
                    !isOnboarding && "pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))] lg:pb-0",
                  )}
                >
                  <WorkspaceGate>
                    <PageEnter className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      {children}
                    </PageEnter>
                  </WorkspaceGate>
                </div>
              </div>
            </div>
            {!isOnboarding && <MobileBottomNav />}
            <DashboardOverlays />
            <PremiumOverlays />
            </MobileNavProvider>
          </LeadsProvider>
          </CallOrchestratorProvider>
          </FloatingEdgeProvider>
        </CallProvider>
      </WebPhoneProvider>
    </WorkspaceProvider>
  );
}
