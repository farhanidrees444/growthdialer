"use client";

import { motion } from "framer-motion";
import {
  PhoneCall,
  PhoneMissed,
  CalendarCheck,
  MessageSquare,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "meeting",
    text: "Meeting booked with James Whitfield",
    sub: "BluePeak Systems · 15 min ago",
    icon: CalendarCheck,
    iconClass: "bg-emerald-500/15 text-emerald-400",
  },
  {
    id: 2,
    type: "call",
    text: "Connected with Priya Nair",
    sub: "Vortex Analytics · 2:34 duration · 32 min ago",
    icon: PhoneCall,
    iconClass: "bg-sky-500/15 text-sky-400",
  },
  {
    id: 3,
    type: "missed",
    text: "No answer — Marcus Webb",
    sub: "Nimbus Cloud · Attempt 3 · 45 min ago",
    icon: PhoneMissed,
    iconClass: "bg-red-500/15 text-red-400",
  },
  {
    id: 4,
    type: "note",
    text: "Note added for Elena Kowalski",
    sub: "Meridian Corp · 1 hr ago",
    icon: MessageSquare,
    iconClass: "bg-purple-500/15 text-purple-400",
  },
  {
    id: 5,
    type: "email",
    text: "Follow-up email sent to Raj Patel",
    sub: "Stackify AI · 2 hrs ago",
    icon: Mail,
    iconClass: "bg-amber-500/15 text-amber-300",
  },
];

export default function RecentActivity() {
  return (
    <Card className="flex flex-col border-white/10 bg-[oklch(0.086_0.024_282)]/95 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="font-display text-sm font-semibold">Recent activity</h2>
        <button type="button" className="text-xs text-brand hover:underline">
          Clear
        </button>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {activities.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.04]"
          >
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", item.iconClass)}>
              <item.icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{item.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
