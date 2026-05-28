'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, Mail, Building2, Briefcase, ExternalLink,
  Edit3, Check, X, Trash2, Clock, PhoneMissed, Mic,
  FileText, Tag, Plus, Loader2, ChevronRight,
  PlayCircle, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useCallContext } from '@/lib/call-context';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FullLead {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company: string | null;
  phone: string;
  email: string | null;
  ai_score: number | null;
  status: string;
  call_attempts: number | null;
  last_called_at: string | null;
  notes: string | null;
  tags: string[] | null;
  linkedin: string | null;
  source: string | null;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  label: string;
  detail: string | null;
  created_at: string;
  meta?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(iso);
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:            { bg: 'bg-slate-500/15',   text: 'text-slate-300' },
  queued:         { bg: 'bg-blue-500/15',    text: 'text-blue-300' },
  contacted:      { bg: 'bg-amber-500/15',   text: 'text-amber-300' },
  connected:      { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  callback:       { bg: 'bg-amber-500/15',   text: 'text-amber-300' },
  meeting_booked: { bg: 'bg-violet-500/15',  text: 'text-violet-300' },
  not_interested: { bg: 'bg-red-500/15',     text: 'text-red-400' },
  do_not_call:    { bg: 'bg-rose-900/40',    text: 'text-rose-400' },
  wrong_number:   { bg: 'bg-red-500/15',     text: 'text-red-400' },
};

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-purple-400',
  'from-amber-500 to-orange-400',
  'from-blue-500 to-cyan-400',
  'from-rose-500 to-pink-400',
];

function avatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ─── Inline editable field ────────────────────────────────────────────────────

function InlineField({
  label,
  value,
  onSave,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (v: string) => Promise<void>;
  type?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => { setDraft(value); setEditing(true); setTimeout(() => inputRef.current?.select(), 10); };
  const cancel = () => { setDraft(value); setEditing(false); };

  const save = async () => {
    if (draft.trim() === value.trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="group">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
            className="flex-1 rounded-lg border border-emerald-500/30 bg-white/[0.04] px-2.5 py-1.5 text-sm text-white outline-none"
            placeholder={placeholder}
          />
          <button type="button" onClick={save} disabled={saving} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </button>
          <button type="button" onClick={cancel} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 hover:text-white">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={startEdit}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-white hover:bg-white/[0.04] transition group/field"
          title="Click to edit"
        >
          <span className={value ? '' : 'text-slate-600 italic'}>{value || `Add ${label.toLowerCase()}…`}</span>
          <Edit3 className="h-3 w-3 text-slate-700 opacity-0 group-hover/field:opacity-100 transition shrink-0" />
        </div>
      )}
    </div>
  );
}

// ─── Timeline event card ──────────────────────────────────────────────────────

function TimelineItem({ event }: { event: TimelineEvent }) {
  const icons: Record<string, ReactNode> = {
    call:              <Phone className="h-3.5 w-3.5" />,
    'call.hangup':     <PhoneMissed className="h-3.5 w-3.5" />,
    'call.answered':   <Mic className="h-3.5 w-3.5" />,
    'recording.saved': <PlayCircle className="h-3.5 w-3.5" />,
    note_added:        <MessageSquare className="h-3.5 w-3.5" />,
    import:            <FileText className="h-3.5 w-3.5" />,
    created:           <Plus className="h-3.5 w-3.5" />,
  };

  const colors: Record<string, string> = {
    call:              'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    'call.hangup':     'bg-red-500/15 text-red-400 border-red-500/20',
    'call.answered':   'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    'recording.saved': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    note_added:        'bg-blue-500/15 text-blue-400 border-blue-500/20',
    import:            'bg-amber-500/15 text-amber-400 border-amber-500/20',
    created:           'bg-slate-500/15 text-slate-400 border-slate-500/20',
  };

  const type = event.type;
  const icon = icons[type] ?? <ChevronRight className="h-3.5 w-3.5" />;
  const color = colors[type] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20';
  const recUrl = event.meta?.recording_url as string | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${color}`}>
          {icon}
        </div>
        <div className="mt-1 flex-1 w-px bg-white/[0.05]" />
      </div>
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white leading-tight">{event.label}</p>
          <span className="shrink-0 text-[10px] text-slate-600 tabular-nums">{formatRelative(event.created_at)}</span>
        </div>
        {event.detail && (
          <p className="mt-0.5 text-xs text-slate-500">{event.detail}</p>
        )}
        {recUrl && (
          <a
            href={recUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-400 hover:bg-violet-500/15 transition"
          >
            <PlayCircle className="h-3 w-3" /> Play recording
          </a>
        )}
        {Boolean(event.meta?.notes) && (
          <p className="mt-1 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-400 italic">
            &ldquo;{String(event.meta?.notes ?? '').slice(0, 120)}&rdquo;
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/[0.06]" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 rounded bg-white/[0.06]" />
          <div className="h-3 w-24 rounded bg-white/[0.04]" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 rounded-lg bg-white/[0.04]" />
      ))}
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirmModal({ name, onConfirm, onCancel }: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)] p-6 shadow-2xl"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15">
          <Trash2 className="h-5 w-5 text-red-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">Delete {name}?</h3>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          This lead will be moved to trash and automatically deleted after 30 days.
          You can restore it from the Trash tab on the Leads page.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.06] transition">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { startCall } = useCallContext();
  const leadId = params.id as string;

  const [lead, setLead] = useState<FullLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }

      supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('user_id', session.user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || !data) { toast.error('Lead not found'); router.push('/leads'); return; }
          setLead(data as FullLead);
          setLoading(false);
        });
    });
  }, [leadId, router]);

  useEffect(() => {
    if (!leadId) return;
    setTimelineLoading(true);
    fetch(`/api/leads/${leadId}/activity`)
      .then((r) => r.json())
      .then((d) => { setTimeline(d.timeline ?? []); })
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoading(false));
  }, [leadId]);

  const patchLead = useCallback(async (updates: Partial<FullLead>) => {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update');
    const { lead: updated } = await res.json();
    setLead(updated);
    toast.success('Saved');
    return updated;
  }, [leadId]);

  const handleDelete = useCallback(async () => {
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    toast.success(`${lead?.name} deleted`);
    router.push('/leads');
  }, [leadId, lead?.name, router]);

  const handleSaveNote = useCallback(async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const combined = [lead?.notes, newNote.trim()].filter(Boolean).join('\n\n');
      await patchLead({ notes: combined });
      setNewNote('');
    } finally {
      setSavingNote(false);
    }
  }, [newNote, lead?.notes, patchLead]);

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-12 items-center gap-3 border-b border-white/[0.06] px-4 lg:px-6">
          <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row gap-0">
            <div className="w-full lg:w-[380px] border-b lg:border-b-0 lg:border-r border-white/[0.06]">
              <ProfileSkeleton />
            </div>
            <div className="flex-1 p-5">
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/[0.04]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const grad = avatarGradient(lead.name);
  const { bg: sBg, text: sText } = STATUS_COLORS[lead.status] ?? { bg: 'bg-slate-500/15', text: 'text-slate-300' };
  const totalCalls = lead.call_attempts ?? 0;

  return (
    <>
      <AnimatePresence>
        {showDelete && (
          <DeleteConfirmModal
            name={lead.name}
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 lg:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void startCall(lead.phone, {
              id: lead.id, name: lead.name, company: lead.company ?? '',
              phone: lead.phone, title: lead.title ?? '',
              email: lead.email ?? undefined, linkedin: lead.linkedin ?? undefined,
              ai_score: lead.ai_score ?? 0, status: lead.status as never,
              call_attempts: lead.call_attempts ?? 0,
              last_called_at: lead.last_called_at ?? undefined,
              notes: lead.notes ?? undefined, tags: lead.tags ?? [],
              company_size: undefined, industry: undefined, revenue: undefined,
              activity_summary: undefined, profile_url: undefined, dnc: false,
            })}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
          >
            <Phone className="h-3.5 w-3.5" />
            Call Now
          </button>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] text-slate-600 hover:border-red-500/30 hover:text-red-400 transition"
            aria-label="Delete lead"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">

        {/* Left panel: profile */}
        <div className="w-full shrink-0 overflow-y-auto border-b border-white/[0.06] lg:w-[380px] lg:border-b-0 lg:border-r">
          <div className="p-5">
            {/* Avatar + name */}
            <div className="mb-5 flex items-start gap-4">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-xl font-bold text-white shadow-lg`}>
                {getInitials(lead.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-white leading-tight truncate">{lead.name}</h1>
                {lead.title && <p className="text-sm text-slate-500 truncate">{lead.title}</p>}
                {lead.company && (
                  <p className="flex items-center gap-1 text-xs text-slate-600 truncate mt-0.5">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {lead.company}
                  </p>
                )}
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${sBg} ${sText}`}>
                  {lead.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-3">
              <InlineField label="First Name" value={lead.first_name ?? ''} onSave={(v) => patchLead({ first_name: v })} />
              <InlineField label="Last Name" value={lead.last_name ?? ''} onSave={(v) => patchLead({ last_name: v })} />
              <InlineField label="Company" value={lead.company ?? ''} onSave={(v) => patchLead({ company: v })} placeholder="Add company…" />
              <InlineField label="Title" value={lead.title ?? ''} onSave={(v) => patchLead({ title: v })} placeholder="Add title…" />
              <InlineField label="Phone" value={lead.phone} onSave={(v) => patchLead({ phone: v })} type="tel" />
              <InlineField label="Email" value={lead.email ?? ''} onSave={(v) => patchLead({ email: v })} type="email" placeholder="Add email…" />
            </div>

            {/* Tags */}
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {(lead.tags ?? []).length > 0
                  ? (lead.tags ?? []).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))
                  : <span className="text-xs text-slate-600 italic">No tags</span>
                }
              </div>
            </div>

            {/* Source + created */}
            <div className="mt-4 space-y-1.5">
              {lead.source && (
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Briefcase className="h-3 w-3" />
                  Source: <span className="text-slate-500 capitalize">{lead.source}</span>
                </p>
              )}
              <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Clock className="h-3 w-3" />
                Added {formatDate(lead.created_at)}
              </p>
              {lead.linkedin && (
                <a href={lead.linkedin} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition">
                  <ExternalLink className="h-3 w-3" />
                  LinkedIn
                </a>
              )}
            </div>

            {/* Stats strip */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                { label: 'Total Calls', value: totalCalls },
                { label: 'Last Contact', value: formatRelative(lead.last_called_at) },
                { label: 'AI Score', value: lead.ai_score != null ? `${lead.ai_score}/100` : '—' },
                { label: 'Status', value: lead.status.replace(/_/g, ' ') },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <p className="text-[10px] text-slate-600">{label}</p>
                  <p className="text-sm font-semibold text-white capitalize truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Status selector */}
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Status</p>
              <select
                value={lead.status}
                onChange={(e) => patchLead({ status: e.target.value })}
                className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/25 appearance-none cursor-pointer"
              >
                {['new','queued','contacted','connected','callback','meeting_booked','not_interested','do_not_call','wrong_number'].map((s) => (
                  <option key={s} value={s} className="bg-[#111] capitalize">{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right panel: timeline + notes */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {/* Notes */}
            <div className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                Notes
              </h2>
              {lead.notes && (
                <div className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {lead.notes}
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note…"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25 transition"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={!newNote.trim() || savingNote}
                  className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-30 transition"
                >
                  {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Activity timeline */}
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
              <Clock className="h-4 w-4 text-slate-500" />
              Activity Timeline
            </h2>

            {timelineLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-7 w-7 rounded-xl bg-white/[0.05] shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-3 w-36 rounded bg-white/[0.05]" />
                      <div className="h-2.5 w-20 rounded bg-white/[0.03]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                  <Clock className="h-5 w-5 text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-white">No activity yet</p>
                <p className="mt-1 text-xs text-slate-500">Call history and events will appear here</p>
              </div>
            ) : (
              <div>
                {timeline.map((event, idx) => (
                  <TimelineItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
