"use client";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SequencesPage() {
  return (
    <>
      <DashboardHeader title="Sequences" subtitle="Multi-step outreach cadences" />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <Card className="p-8 max-w-2xl mx-auto text-center border-dashed">
          <Zap className="w-10 h-10 mx-auto text-primary mb-4" />
          <h2 className="text-lg font-semibold mb-2">Build your first sequence</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Import leads and automate touchpoints across email, calls, and follow-ups.
          </p>
          <Link href="/leads">
            <Button className="gap-2">
              Go to Leads
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </main>
    </>
  );
}
