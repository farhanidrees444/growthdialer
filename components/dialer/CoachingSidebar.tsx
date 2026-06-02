'use client';

import { useEffect, useState, useCallback } from 'react';
import { Phone, FileText, Activity, PhoneOff, PhoneMissed, Clock, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { LeadRecord } from '@/components/dialer/LeadCard';

interface CallRow {
  id: string;
  created_at: string;
  status: string;
  disposition: string | null;
  answered_at: string | null;
  ended_at: string | null;
}

interface ActivityRow {
  id: string;
  created_at: string;
  type: string;
  description: string;
}

interface CoachingSidebarProps {
  lead: LeadRecord | null;
  notes: string;
  onSaveNotes: (value: string) => void;
  refreshKey?: number;
}

type SaveState = 'idle' | ', 'saving' | ', 'saved';

function computeDuration(answered_at: string | null, ended_at: string | null): string {
  if (!answered_at || !ended_at) return '—';
  const secs = Math.round(
    (new Date(ended_at).getTime() - new Date(answered_at).getTime()) / 1000,
  );
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed' || status === ', 'answered') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (status === 'no-answer' || status === ', 'no_answer' || status === ', 'busy') {
    return <PhoneMissed className="h-3.5 w-3.5 text-amber-400" />;
  }
  return <PhoneOff className="h-3.5 w-3.5 text-slate-500" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-300',
    answered: 'bg-emerald-500/10 text-emerald-300',
    initiated: 'bg-blue-500/10 text-blue-300',
    ringing: 'bg-amber-500/10 text-amber-300',
    'no-answer': 'bg-amber-500/10 text-amber-300',
    no_answer: 'bg-amber-500/10 text-amber-300',
    busy: 'bg-orange-500/10 text-orange-300',
    failed: 'bg-rose-500/10 text-rose-300',
  };
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${map[status] ?? 'bg-slate-700/60 text-slate-300'}`}>
      {status.replace('_' ')}
    </span>
  );
}

export default function CoachingSidebar({ lead, notes, onSaveNotes, refreshKey }: CoachingSidebarProps) {
  const [supabase] = useState(() => createClient());
  const [callHistory, setCallHistory] = useState<CallRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notesValue, setNotesValue] = useState(notes);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    setNotesValue(notes);
  }, [notes]);

  const fetchData = useCallback(async () => {
    if (!lead || lead.id === 'empty') {
      setCallHistory([]);
      setActivities([]);
      return;
    }
    setLoadingHistory(true);
    const [callsRes, activitiesRes] = await Promise.all([
      supabase
        .from('calls')
        .select('id,created_at,status,disposition,answered_at,ended_at')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('activities')
        .select('id,created_at,type,description')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);
    setCallHistory((callsRes.data ?? []) as CallRow[]);
    setActivities((activitiesRes.data ?? []) as ActivityRow[]);
    setLoadingHistory(false);
  }, [lead?.id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleSaveNotes = useCallback(async () => {
    if (notesValue === notes) return;
    setSaveState('saving');
    await onSaveNotes(notesValue);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  }, [notesValue, notes, onSaveNotes]);

  if (!lead || lead.id === 'empty') return null;

  return (
    <aside className="flex flex-col gap-4">
      {/* Call History */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Phone className="h-4 w-4 text-emerald-400" />
          <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Call History</p>
        </div>

        {loadingHistory ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : callHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.06] p-4 text-center">
            <PhoneMissed className="mx-auto h-5 w-5 text-slate-600" />
            <p className="mt-2 text-xs text-slate-500">No call history for this lead yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {callHistory.map((call) => (
              <div
                key={call.id}
                className="flex items-start gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="mt-0.5 shrink-0">
                  <StatusIcon status={call.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] text-white">{formatDate(call.created_at)}</p>
                    <StatusBadge status={call.status} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{computeDuration(call.answered_at, call.ended_at)}</span>
                    {call.disposition && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className="truncate capitalize">{call.disposition.replace('_' ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Notes</p>
          </div>
          {saveState === 'saving' && (
            <span className="text-[10px] text-slate-500 animate-pulse">Saving…</span>
          )}
          {saveState === 'saved' && (
            <span className="text-[10px] text-emerald-400">Saved ✓</span>
          )}
        </div>
        <textarea
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          onBlur={handleSaveNotes}
          rows={5}
          placeholder="Add notes about this lead…"
          className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30"
        />
      </div>

      {/* Activity */}
      {activities.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Activity</p>
          </div>
          <div className="space-y-2">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                <div className="min-w-0">
                  <p className="text-xs leading-relaxed text-white">{act.description}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{formatDate(act.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
