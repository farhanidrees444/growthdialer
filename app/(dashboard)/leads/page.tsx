"use client";

import DashboardHeader from "@/components/DashboardHeader";
import LeadsQueue from "@/components/LeadsQueue";
import { useLeads } from "@/contexts/leads-context";

export default function LeadsPage() {
  const { leads } = useLeads();
  const imported = leads.filter((l) => l.source === "import").length;

  return (
    <>
      <DashboardHeader
        title="Leads"
        subtitle={`${leads.length} in queue${imported ? ` · ${imported} from CSV` : ""}`}
        showImport
      />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <LeadsQueue />
      </main>
    </>
  );
}
