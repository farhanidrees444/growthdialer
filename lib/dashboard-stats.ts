import type { LucideIcon } from "lucide-react";
import { Phone, Users, CalendarCheck, DollarSign } from "lucide-react";

export const dashboardStats: Array<{
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  delay: number;
}> = [
  {
    title: "Calls Today",
    value: "63",
    change: "+18%",
    positive: true,
    icon: Phone,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15",
    delay: 0,
  },
  {
    title: "Connect Rate",
    value: "34.9%",
    change: "+4.2%",
    positive: true,
    icon: Users,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    delay: 0.07,
  },
  {
    title: "Meetings Booked",
    value: "7",
    change: "+2",
    positive: true,
    icon: CalendarCheck,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/15",
    delay: 0.14,
  },
  {
    title: "Pipeline Value",
    value: "$48.2K",
    change: "-3.1%",
    positive: false,
    icon: DollarSign,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15",
    delay: 0.21,
  },
];
