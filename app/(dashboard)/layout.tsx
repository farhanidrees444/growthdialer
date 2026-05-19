"use client";

import Link from "next/link";
import { Zap, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { LeadsProvider } from "@/contexts/leads-context";
import { ImportLeadsDialog } from "@/components/ImportLeadsDialog";
import { MobileNavProvider, useMobileNav } from "@/contexts/mobile-nav-context";
import { WebPhoneProvider } from "@/contexts/webphone-context";
import { CallProvider, useCallContext } from "@/lib/call-context";
import ActiveCallOverlay from "@/components/active-call-overlay";
import SaveAsLeadModal from "@/components/save-as-lead-modal";

function MobileTopBar() {
  const { toggle } = useMobileNav();
  return (
    <div className="shrink-0 lg:hidden flex h-12 items-center justify-between border-b border-white/10 bg-[oklch(0.056_0.018_286)]/90 px-4 backdrop-blur-xl z-20">
      <Link href="/dashboard" className="flex items-center gap-2 group">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand glow-brand-sm">
          <Zap className="h-3.5 w-3.5 text-[oklch(0.08_0.04_153)]" fill="currentColor" />
        </div>
        <span className="font-display text-sm font-bold text-white group-hover:text-white/95">
          Growth<span className="text-brand">Dialer</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
}

function DashboardOverlays() {
  const { showSaveAsLead, activePhone, dismissSaveAsLead } = useCallContext();
  return (
    <>
      <ActiveCallOverlay />
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
  return (
    <WebPhoneProvider>
      <CallProvider>
        <LeadsProvider>
          <MobileNavProvider>
            <ImportLeadsDialog />
            <div className="dashboard-shell relative flex h-screen overflow-hidden bg-background text-foreground">
              <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.35]" aria-hidden />
              <div
                className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-[min(90vw,800px)] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
                style={{ background: "radial-gradient(circle, oklch(0.82 0.27 153) 0%, transparent 70%)" }}
                aria-hidden
              />
              <div className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full opacity-[0.08] blur-3xl bg-[oklch(0.62_0.22_264)]" aria-hidden />

              <Sidebar />
              <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
                <MobileTopBar />
                {children}
              </div>
            </div>
            <DashboardOverlays />
          </MobileNavProvider>
        </LeadsProvider>
      </CallProvider>
    </WebPhoneProvider>
  );
}
