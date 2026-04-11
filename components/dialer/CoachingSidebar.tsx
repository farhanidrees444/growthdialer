import BattleCards from '@/components/dialer/BattleCards';
import LeadIntel from '@/components/dialer/LeadIntel';
import { Activity, ShieldCheck, Sparkles } from 'lucide-react';

interface CoachingSidebarProps {
  leadName: string;
  companyName: string;
  companySize: string;
  industry: string;
  revenue: string;
  activity: string;
  profileUrl?: string;
  notes: string;
}

export default function CoachingSidebar({ leadName, companyName, companySize, industry, revenue, activity, profileUrl, notes }: CoachingSidebarProps) {
  return (
    <aside className="hidden xl:block xl:w-[320px]">
      <div className="space-y-5">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">AI Coach</p>
              <p className="mt-2 text-xl font-semibold text-white">Live call intelligence</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse" /> Live
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/90 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Objection</p>
              <p className="mt-2 text-sm text-white">Price concern detected. Highlight ROI in minutes, not months.</p>
            </div>
            <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/90 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Signal</p>
              <p className="mt-2 text-sm text-white">Prospect asked about timeline. Probe buying urgency now.</p>
            </div>
            <div className="rounded-3xl border border-emerald-400/10 bg-slate-900/90 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Tip</p>
              <p className="mt-2 text-sm text-white">Ask about their current tool and what they wish it did better.</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/90 p-4">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Talk ratio</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl bg-slate-950/90 p-3 text-sm text-slate-300">
                <div className="flex items-center justify-between text-slate-400"><span>Rep</span><span>45%</span></div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[45%] rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="rounded-3xl bg-slate-950/90 p-3 text-sm text-slate-300">
                <div className="flex items-center justify-between text-slate-400"><span>Prospect</span><span>55%</span></div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[55%] rounded-full bg-sky-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <BattleCards />

        <LeadIntel
          companyName={companyName}
          companySize={companySize}
          industry={industry}
          revenue={revenue}
          activity={activity}
          profileUrl={profileUrl}
          notes={notes}
        />
      </div>
    </aside>
  );
}
