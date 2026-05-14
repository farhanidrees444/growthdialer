"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MoreHorizontal, Building2 } from "lucide-react";

type LeadStatus = "hot" | "warm" | "cold";

interface Lead {
  id: number;
  name: string;
  title: string;
  company: string;
  score: number;
  status: LeadStatus;
  attempts: number;
  tags: string[];
}
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const leads: Lead[] = [
  {
    id: 1,
    name: "James Whitfield",
    title: "CTO",
    company: "BluePeak Systems",
    score: 92,
    status: "hot",
    attempts: 0,
    tags: ["SaaS", "Series B"],
  },
  {
    id: 2,
    name: "Priya Nair",
    title: "Director of Ops",
    company: "Vortex Analytics",
    score: 85,
    status: "warm",
    attempts: 1,
    tags: ["Enterprise"],
  },
  {
    id: 3,
    name: "Marcus Webb",
    title: "VP Engineering",
    company: "Nimbus Cloud",
    score: 78,
    status: "warm",
    attempts: 2,
    tags: ["Cloud", "Mid-Market"],
  },
  {
    id: 4,
    name: "Elena Kowalski",
    title: "Head of Sales",
    company: "Meridian Corp",
    score: 61,
    status: "cold",
    attempts: 3,
    tags: ["Outbound"],
  },
  {
    id: 5,
    name: "Raj Patel",
    title: "CEO",
    company: "Stackify AI",
    score: 88,
    status: "hot",
    attempts: 0,
    tags: ["AI", "Startup"],
  },
];

const statusConfig = {
  hot: { label: "Hot", class: "bg-red-100 text-red-700" },
  warm: { label: "Warm", class: "bg-amber-100 text-amber-700" },
  cold: { label: "Cold", class: "bg-blue-100 text-blue-700" },
};

const scoreColor = (score: number) => {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-muted-foreground";
};

export default function LeadsQueue() {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h2 className="font-semibold text-sm">Leads Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">48 remaining today</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-7">
          View All
        </Button>
      </div>

      <div className="divide-y">
        {leads.map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                {lead.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{lead.name}</p>
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 rounded-full font-medium",
                    statusConfig[lead.status].class
                  )}
                >
                  {statusConfig[lead.status].label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate">
                  {lead.title} · {lead.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <div className={cn("text-sm font-bold tabular-nums", scoreColor(lead.score))}>
                  {lead.score}
                </div>
                <div className="text-[10px] text-muted-foreground">score</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <Phone className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <Mail className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
