import { Link2, Briefcase, Activity, FileText } from 'lucide-react';

interface LeadIntelProps {
  companyName: string;
  companySize: string;
  industry: string;
  revenue: string;
  activity: string;
  profileUrl?: string;
  notes: string;
}

export default function LeadIntel({ companyName, companySize, industry, revenue, activity, profileUrl, notes }: LeadIntelProps) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Lead intelligence</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Company profile</h3>
        </div>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 transition hover:border-emerald-400/20">
            <Link2 className="h-4 w-4" /> View
          </a>
        )}
      </div>

      <div className="space-y-4 text-sm text-slate-300">
        <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2 text-slate-400"><Briefcase className="h-4 w-4" /> Latest firmographics</div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-slate-500">Size</p>
              <p className="mt-1 text-white">{companySize}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Industry</p>
              <p className="mt-1 text-white">{industry}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Revenue</p>
              <p className="mt-1 text-white">{revenue}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2 text-slate-400"><Activity className="h-4 w-4" /> Recent activity</div>
          <p className="text-sm text-slate-300">{activity}</p>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2 text-slate-400"><FileText className="h-4 w-4" /> Previous notes</div>
          <p className="text-sm text-slate-300">{notes || 'No notes recorded yet.'}</p>
        </div>
      </div>
    </div>
  );
}
