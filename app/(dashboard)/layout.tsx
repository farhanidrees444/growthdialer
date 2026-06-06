"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Users, Headphones, Settings, Building2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { LeadsProvider } from "@/contexts/leads-context";
import { ImportLeadsDialog } from "@/components/ImportLeadsDialog";
import { MobileNavProvider } from "@/contexts/mobile-nav-context";
import { TopHeader } from "@/components/layout/top-header";
import { WebPhoneProvider } from "@/contexts/webphone-context";
import { CallProvider, useCallContext } from "@/lib/call-context";
import { CallOrchestratorProvider } from "@/contexts/call-orchestrator-context";
import ActiveCallOverlay from "@/components/active-call-overlay";
import SaveAsLeadModal from "@/components/save-as-lead-modal";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { WorkspaceGate } from "@/components/workspace/workspace-gate";
import { IncomingCallPopup } from "@/components/call/incoming-call-popup";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import { Grain } from "@/components/marketing/live-floor/Grain";
import { cn } from "@/lib/utils";

const BOTTOM_TABS = [
  { icon: LayoutDashboard, label: "Home",     href: "/dashboard" },
  { icon: Phone,           label: "Dialer",   href: "/dialer" },
  { icon: Users,           label: "Leads",    href: "/leads" },
  { icon: Building2,       label: "Team",     href: "/team" },
  { icon: Headphones,      label: "Recordings", href: "/recordings" },
  { icon: Settings,        label: "Settings", href: "/settings" },
] as const;

function MobileBottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-end border-t border-white/[0.08] bg-[oklch(0.05_0.005_285)]/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      {BOTTOM_TABS.map(({ icon: Icon, label, href }) => {
        const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 min-h-[56px] justify-center transition-colors",
              active ? "text-[oklch(0.64_0.21_293)]" : "text-slate-500 hover:text-slate-300",
            )}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[oklch(0.64_0.21_293)]" />
            )}
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}


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

  return (
    <WorkspaceProvider>
      <WebPhoneProvider>
        <CallProvider>
          <CallOrchestratorProvider>
          <LeadsProvider>
            <MobileNavProvider>
            <ImportLeadsDialog />
            <div className="dashboard-shell relative flex h-screen overflow-hidden bg-background text-foreground">
              <Grain />
              <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.35]" aria-hidden />
              <div
                className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-[min(90vw,800px)] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
                style={{ background: "radial-gradient(circle, oklch(0.64 0.21 293) 0%, transparent 70%)" }}
                aria-hidden
              />
              <div className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full opacity-[0.08] blur-3xl bg-[oklch(0.71_0.13_207)]" aria-hidden />

              {!isOnboarding && <Sidebar />}
              <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
                {!isOnboarding && <TopHeader />}
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col overflow-hidden",
                    !isOnboarding && "pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-0",
                  )}
                >
                  <WorkspaceGate>{children}</WorkspaceGate>
                </div>
              </div>
            </div>
            {!isOnboarding && <MobileBottomTabBar />}
            <DashboardOverlays />
            </MobileNavProvider>
          </LeadsProvider>
          </CallOrchestratorProvider>
        </CallProvider>
      </WebPhoneProvider>
    </WorkspaceProvider>
  );
}
