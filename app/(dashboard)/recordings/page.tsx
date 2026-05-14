"use client";

export const dynamic = 'force-dynamic';

import { Play, Clock } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const recordings = [
  { id: "1", title: "Sarah Chen — discovery", company: "TechNova Inc.", duration: "12:04", date: "Apr 8, 2026" },
  { id: "2", title: "James Whitfield — follow-up", company: "BluePeak Systems", duration: "8:31", date: "Apr 7, 2026" },
  { id: "3", title: "Priya Nair — demo", company: "Vortex Analytics", duration: "24:18", date: "Apr 7, 2026" },
  { id: "4", title: "Marcus Webb — objection handling", company: "Nimbus Cloud", duration: "6:52", date: "Apr 6, 2026" },
];

export default function RecordingsPage() {
  return (
    <>
      <DashboardHeader title="Recordings" subtitle="Call library and AI summaries" />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-3 max-w-3xl">
          {recordings.map((r) => (
            <Card key={r.id} className="p-4 flex items-center gap-4">
              <Button size="icon" variant="outline" className="shrink-0 rounded-full" type="button" aria-label="Play recording">
                <Play className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="truncate">{r.company}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {r.duration}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {r.date}
              </Badge>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
