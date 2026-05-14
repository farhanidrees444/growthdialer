import { CalendarClock, CheckCircle2, MessageSquare, RefreshCcw, Slash, Zap } from 'lucide-react';

interface DispositionPanelProps {
  disposition: string;
  notes: string;
  onDispositionChange: (value: string) => void;
  onSaveNotes: (value: string) => void;
  onSchedule: (value: string) => void;
  onSaveAndNext: () => void;
}

const dispositions = [
  'Connected',
  'Voicemail Left',
  'No Answer',
  'Busy',
  'Wrong Number',
  'Not Interested',
  'Meeting Booked',
  'Callback',
];

export default function DispositionPanel({ disposition, notes, onDispositionChange, onSaveNotes, onSchedule, onSaveAndNext }: DispositionPanelProps) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Disposition</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Save call outcome</h3>
        </div>
        <div className="rounded-full bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Auto advance on save</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dispositions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onDispositionChange(option)}
            className={`rounded-3xl border px-4 py-3 text-sm text-left transition ${disposition === option ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-slate-900/80 text-slate-300 hover:border-emerald-400/20 hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-2">
              {option === 'Connected' && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
              {option === 'Voicemail Left' && <MessageSquare className="h-4 w-4 text-slate-300" />}
              {option === 'Callback' && <CalendarClock className="h-4 w-4 text-slate-300" />}
              {option === 'No Answer' && <Slash className="h-4 w-4 text-amber-300" />}
              {option === 'Busy' && <RefreshCcw className="h-4 w-4 text-slate-300" />}
              {option === 'Wrong Number' && <Zap className="h-4 w-4 text-rose-300" />}
              <span>{option}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
        <label className="block text-sm text-slate-400">Call notes</label>
        <textarea
          value={notes}
          onChange={(event) => onSaveNotes(event.target.value)}
          rows={5}
          className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/30 focus:ring-emerald-400/20"
          placeholder="Add context, objection details, and next steps for this lead."
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
          <span className="block text-slate-500">Schedule callback</span>
          <input
            type="datetime-local"
            onChange={(event) => onSchedule(event.target.value)}
            className="mt-3 w-full bg-transparent text-sm text-white outline-none"
          />
        </label>

        <button
          type="button"
          onClick={onSaveAndNext}
          className="rounded-3xl bg-emerald-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(0,255,102,0.2)] transition hover:bg-emerald-400"
        >
          Save & Next
        </button>
      </div>
    </div>
  );
}
