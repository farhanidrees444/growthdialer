"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Menu, LayoutDashboard, Phone, Users, Headphones, Settings } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { LeadsProvider } from "@/contexts/leads-context";
import { ImportLeadsDialog } from "@/components/ImportLeadsDialog";
import { MobileNavProvider, useMobileNav } from "@/contexts/mobile-nav-context";
import { WebPhoneProvider } from "@/contexts/webphone-context";
import { CallProvider, useCallContext } from "@/lib/call-context";
import ActiveCallOverlay from "@/components/active-call-overlay";
import SaveAsLeadModal from "@/components/save-as-lead-modal";
import { cn } from "@/lib/utils";

const BOTTOM_TABS = [
  { icon: LayoutDashboard, label: "Home",     href: "/dashboard" },
  { icon: Phone,           label: "Dialer",   href: "/dialer" },
  { icon: Users,           label: "Leads",    href: "/leads" },
  { icon: Headphones,      label: "Recordings", href: "/recordings" },
  { icon: Settings,        label: "Settings", href: "/settings" },
] as const;

function MobileBottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-end border-t border-white/[0.08] bg-[oklch(0.056_0.018_286)]/95 backdrop-blur-xl"
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
              active ? "text-[oklch(0.82_0.27_153)]" : "text-slate-500 hover:text-slate-300",
            )}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[oklch(0.82_0.27_153)]" />
            )}
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

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
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-bottom-bar lg:pb-0">
                  {children}
                </div>
              </div>
            </div>
            <MobileBottomTabBar />
            <DashboardOverlays />
          </MobileNavProvider>
        </LeadsProvider>
      </CallProvider>
    </WebPhoneProvider>
  );
}
