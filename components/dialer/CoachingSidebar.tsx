"use client";

import { useEffect, useState, useCallback } from 'react';
import { Clock, Phone, FileText, Activity, PhoneOff, PhoneMissed } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { LeadRecord } from '@/components/dialer/LeadCard';

interface CallHistoryRow {
  id: string;
  created_at: string;
  duration_seconds: number | null;
  status: string;
  disposition: string | null;
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
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function dispositionLabel(d: string | null): string {
  if (!d) return '—';
  return d.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function callStatusIcon(status: string) {
  if (status === 'completed' || status === 'answered') return <Phone className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === 'no-answer' || status === 'no_answer') return <PhoneMissed className="h-3.5 w-3.5 text-amber-400" />;
  return <PhoneOff className="h-3.5 w-3.5 text-slate-400" />;
}

export default function CoachingSidebar({ lead, notes, onSaveNotes }: CoachingSidebarProps) {
  const [supabase] = useState(() => createClient());
  const [callHistory, setCallHistory] = useState<CallHistoryRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [notesValue, setNotesValue] = useState(notes);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
    const [callsResult, activitiesResult] = await Promise.all([
      supabase
        .from('calls')
        .select('id,created_at,duration_seconds,status,disposition')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('activities')
        .select('id,created_at,type,description')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    setCallHistory((callsResult.data ?? []) as CallHistoryRow[]);
    setActivities((activitiesResult.data ?? []) as ActivityRow[]);
    setLoadingHistory(false);
  }, [lead?.id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!lead || lead.id === 'empty') {
    return null;
  }

  return (
    <aside className="hidden xl:flex xl:w-[300px] flex-col gap-4">
      {/* Call History */}
      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-emerald-400" />
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Call History</p>
        </div>
        {loadingHistory ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-900/60" />
            ))}
          </div>
        ) : callHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center">
            <PhoneMissed className="mx-auto h-6 w-6 text-slate-600" />
            <p className="mt-2 text-xs text-slate-500">No calls yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {callHistory.map((call) => (
              <div
                key={call.id}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-slate-900/60 px-3 py-2.5"
              >
                <div className="mt-0.5">{callStatusIcon(call.status)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white">{formatDate(call.created_at)}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(call.duration_seconds)}</span>
                    {call.disposition && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="truncate">{dispositionLabel(call.disposition)}</span>
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
      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notes</p>
        </div>
        <textarea
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          onBlur={() => {
            if (notesValue !== notes) onSaveNotes(notesValue);
          }}
          rows={5}
          placeholder="Add notes about this lead…"
          className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-emerald-400/30 focus:ring-0"
        />
      </div>

      {/* Activity */}
      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-400" />
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Activity</p>
        </div>
        {activities.length === 0 ? (
          <p className="text-xs text-slate-500">No activity recorded.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-slate-900/60 px-3 py-2.5">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60 mt-1.5" />
                <div className="min-w-0">
                  <p className="text-xs text-white leading-relaxed">{act.description}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{formatDate(act.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
