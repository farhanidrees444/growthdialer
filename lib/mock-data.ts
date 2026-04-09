// Mock data for demo — replace with real DB queries in production

export type ContactStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "customer";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: ContactStatus;
  score: number;
  lastContacted: string | null;
  attempts: number;
  tags: string[];
  notes: string;
  createdAt: string;
}

export const mockContacts: Contact[] = [
  {
    id: "c1",
    firstName: "James",
    lastName: "Whitfield",
    email: "james@bluepeak.io",
    phone: "+1 (415) 555-0142",
    company: "BluePeak Systems",
    title: "CTO",
    status: "qualified",
    score: 92,
    lastContacted: "2026-04-07",
    attempts: 3,
    tags: ["SaaS", "Series B"],
    notes: "Interested in enterprise plan. Follow up after board meeting.",
    createdAt: "2026-03-15",
  },
  {
    id: "c2",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya@vortex.ai",
    phone: "+1 (628) 555-0193",
    company: "Vortex Analytics",
    title: "Director of Operations",
    status: "contacted",
    score: 85,
    lastContacted: "2026-04-06",
    attempts: 2,
    tags: ["Enterprise"],
    notes: "Had a 30 min call. Evaluating competitors. Demo scheduled.",
    createdAt: "2026-03-20",
  },
  {
    id: "c3",
    firstName: "Marcus",
    lastName: "Webb",
    email: "m.webb@nimbuscloud.com",
    phone: "+1 (312) 555-0178",
    company: "Nimbus Cloud",
    title: "VP Engineering",
    status: "contacted",
    score: 78,
    lastContacted: "2026-04-05",
    attempts: 3,
    tags: ["Cloud", "Mid-Market"],
    notes: "",
    createdAt: "2026-03-22",
  },
  {
    id: "c4",
    firstName: "Elena",
    lastName: "Kowalski",
    email: "elena@meridiancorp.com",
    phone: "+1 (213) 555-0166",
    company: "Meridian Corp",
    title: "Head of Sales",
    status: "new",
    score: 61,
    lastContacted: null,
    attempts: 0,
    tags: ["Outbound"],
    notes: "",
    createdAt: "2026-04-01",
  },
  {
    id: "c5",
    firstName: "Raj",
    lastName: "Patel",
    email: "raj@stackify.ai",
    phone: "+1 (669) 555-0131",
    company: "Stackify AI",
    title: "CEO",
    status: "qualified",
    score: 88,
    lastContacted: "2026-04-07",
    attempts: 1,
    tags: ["AI", "Startup"],
    notes: "Warm intro from Ryan. Very interested. Budget confirmed.",
    createdAt: "2026-03-28",
  },
  {
    id: "c6",
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah@technova.com",
    phone: "+1 (555) 842-7391",
    company: "TechNova Inc.",
    title: "VP of Sales",
    status: "customer",
    score: 95,
    lastContacted: "2026-04-08",
    attempts: 5,
    tags: ["Customer", "Growth Plan"],
    notes: "Closed! On Growth plan. Check in monthly.",
    createdAt: "2026-02-10",
  },
  {
    id: "c7",
    firstName: "David",
    lastName: "Kim",
    email: "d.kim@apexgrowth.co",
    phone: "+1 (408) 555-0117",
    company: "Apex Growth Co.",
    title: "Head of Revenue",
    status: "new",
    score: 72,
    lastContacted: null,
    attempts: 0,
    tags: ["Inbound"],
    notes: "",
    createdAt: "2026-04-07",
  },
  {
    id: "c8",
    firstName: "Nina",
    lastName: "Olsen",
    email: "nina@novaspark.io",
    phone: "+1 (720) 555-0149",
    company: "NovaSpark Tech",
    title: "COO",
    status: "unqualified",
    score: 42,
    lastContacted: "2026-04-03",
    attempts: 2,
    tags: ["Cold"],
    notes: "Not a fit right now. Too early stage. Revisit in 6 months.",
    createdAt: "2026-03-18",
  },
];

export const mockTeamMembers = [
  { id: "t1", name: "Alex Rivera", role: "SDR Lead", avatar: "AR", calls: 284, connects: 117, meetings: 24, pipeline: 142000, rank: 1, streak: 7 },
  { id: "t2", name: "Maria Santos", role: "SDR", avatar: "MS", calls: 261, connects: 98, meetings: 19, pipeline: 114000, rank: 2, streak: 4 },
  { id: "t3", name: "Jason Park", role: "AE", avatar: "JP", calls: 198, connects: 82, meetings: 17, pipeline: 198000, rank: 3, streak: 3 },
  { id: "t4", name: "Keisha Brown", role: "SDR", avatar: "KB", calls: 237, connects: 89, meetings: 16, pipeline: 96000, rank: 4, streak: 5 },
  { id: "t5", name: "Tom Harrison", role: "SDR", avatar: "TH", calls: 184, connects: 63, meetings: 12, pipeline: 72000, rank: 5, streak: 1 },
];

export const mockVoicemails = [
  { id: "v1", name: "Standard Intro", duration: "0:28", uses: 142, lastUsed: "Today", category: "intro" },
  { id: "v2", name: "Follow-Up #1 (Soft)", duration: "0:22", uses: 89, lastUsed: "Yesterday", category: "followup" },
  { id: "v3", name: "Follow-Up #2 (Direct)", duration: "0:19", uses: 67, lastUsed: "2 days ago", category: "followup" },
  { id: "v4", name: "Demo Request", duration: "0:31", uses: 54, lastUsed: "3 days ago", category: "demo" },
  { id: "v5", name: "Final Attempt", duration: "0:25", uses: 38, lastUsed: "1 week ago", category: "followup" },
];

export const mockCallLogs = [
  { id: "l1", contact: "Sarah Chen", company: "TechNova Inc.", duration: "4:32", outcome: "meeting", time: "10:24 AM", sentiment: "positive" },
  { id: "l2", contact: "James Whitfield", company: "BluePeak Systems", duration: "2:15", outcome: "callback", time: "10:08 AM", sentiment: "neutral" },
  { id: "l3", contact: "Priya Nair", company: "Vortex Analytics", duration: "0:00", outcome: "voicemail", time: "9:51 AM", sentiment: null },
  { id: "l4", contact: "Marcus Webb", company: "Nimbus Cloud", duration: "1:44", outcome: "not_interested", time: "9:33 AM", sentiment: "negative" },
  { id: "l5", contact: "Raj Patel", company: "Stackify AI", duration: "6:18", outcome: "meeting", time: "9:15 AM", sentiment: "positive" },
];
