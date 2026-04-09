"use client";

import Sidebar from "@/components/Sidebar";
import { LeadsProvider } from "@/contexts/leads-context";
import { ImportLeadsDialog } from "@/components/ImportLeadsDialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LeadsProvider>
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
        <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </LeadsProvider>
  );
}
