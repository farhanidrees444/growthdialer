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
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  {
    id: 2,
    type: "call",
    text: "Connected with Priya Nair",
    sub: "Vortex Analytics · 2:34 duration · 32 min ago",
    icon: PhoneCall,
    iconClass: "bg-blue-100 text-blue-600",
  },
  {
    id: 3,
    type: "missed",
    text: "No answer — Marcus Webb",
    sub: "Nimbus Cloud · Attempt 3 · 45 min ago",
    icon: PhoneMissed,
    iconClass: "bg-red-100 text-red-500",
  },
  {
    id: 4,
    type: "note",
    text: "Note added for Elena Kowalski",
    sub: "Meridian Corp · 1 hr ago",
    icon: MessageSquare,
    iconClass: "bg-purple-100 text-purple-600",
  },
  {
    id: 5,
    type: "email",
    text: "Follow-up email sent to Raj Patel",
    sub: "Stackify AI · 2 hrs ago",
    icon: Mail,
    iconClass: "bg-amber-100 text-amber-600",
  },
];

export default function RecentActivity() {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="font-semibold text-sm">Recent Activity</h2>
        <button className="text-xs text-primary hover:underline">Clear</button>
      </div>
      <div className="divide-y">
        {activities.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
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
