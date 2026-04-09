"use client";

export const dynamic = 'force-dynamic';

import DashboardHeader from "@/components/DashboardHeader";
import DialerWidget from "@/components/DialerWidget";

export default function DialerPage() {
  return (
    <>
      <DashboardHeader title="Dialer" subtitle="Parallel lines and live call controls" />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-lg mx-auto">
          <DialerWidget />
        </div>
      </main>
    </>
  );
}
