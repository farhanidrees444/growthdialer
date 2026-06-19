"use client";

import { useState } from "react";
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
import CallsOverlay from "@/components/calls/calls-overlay";
import SaveAsLeadModal from "@/components/save-as-lead-modal";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { WorkspaceGate } from "@/components/workspace/workspace-gate";
import { CallsProvider } from "@/contexts/calls-context";
import { VoiceConnectionHud } from "@/components/voice/voice-connection-hud";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import { PremiumOverlays } from "@/components/premium/premium-overlays";
import { FloatingEdgeProvider } from "@/components/layout/floating-edge-provider";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { AmbientShell } from "@/components/dashboard/ambient-shell";
import { PageEnter } from "@/components/layout/page-enter";
import { resolveRouteAccent } from "@/lib/ui/route-accents";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { VoiceAccountBootstrap } from "@/components/voice/voice-account-bootstrap";
import { VoiceAudioUnlock } from "@/components/voice/voice-audio-unlock";

function DashboardOverlays({ userId }: { userId: string | undefined }) {
  const { showSaveAsLead, activePhone, dismissSaveAsLead } = useCallContext();
  return (
    <>
      <ActiveCallOverlay />
      <CallsOverlay />
      <VoiceConnectionHud />
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
  const session = useSupabaseSession();
  const userId = session?.user?.id;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <WorkspaceProvider>
      <PostHogIdentify />
      <VoiceAccountBootstrap />
      <VoiceAudioUnlock />
      <WebPhoneProvider>
        <CallProvider>
          <CallsProvider>
          <FloatingEdgeProvider>
          <CallOrchestratorProvider>
          <LeadsProvider>
            <MobileNavProvider>
            <ImportLeadsDialog />
            <div className="dashboard-shell relative flex h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-zinc-100">
              <AmbientShell accent={routeAccent.ambient} />
              <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.12]" aria-hidden />

              {!isOnboarding && (
                <TopHeader
                  isSidebarCollapsed={isSidebarCollapsed}
                  onSidebarCollapseToggle={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
                />
              )}
              <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
                {!isOnboarding && <Sidebar isDesktopCollapsed={isSidebarCollapsed} />}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
            </div>
            {!isOnboarding && <MobileBottomNav />}
            <DashboardOverlays userId={userId} />
            <PremiumOverlays />
            </MobileNavProvider>
          </LeadsProvider>
          </CallOrchestratorProvider>
          </FloatingEdgeProvider>
          </CallsProvider>
        </CallProvider>
      </WebPhoneProvider>
    </WorkspaceProvider>
  );
}
