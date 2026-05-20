'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Play, Pause, Clock, Mic, Download, Sparkles, FileText, Search, Phone,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface Recording {
  id: string;
  to_number: string | null;
  from_number: string | null;
  recording_url: string;
  duration_seconds: number | null;
  created_at: string;
  disposition: string | null;
  analytics_id: string | null;
  ai_processing_status: string | null;
  analytics: {
    id: string;
    sentiment: string | null;
    sentiment_score: number | null;
    summary: unknown;
    talking_points: string[] | null;
    suggested_disposition: string | null;
  } | null;
  leads: { name: string | null; company: string | null } | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getSummaryBullets(summary: unknown): string[] {
  if (!summary) return [];
  if (Array.isArray(summary)) return summary.slice(0, 1);
  if (typeof summary === 'object' && summary !== null && 'bullets' in summary) {
    const b = (summary as { bullets: unknown }).bullets;
    if (Array.isArray(b)) return b.slice(0, 1);
  }
  return [];
}

function SentimentBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  if (score > 0.2) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
      <TrendingUp className="h-3 w-3" /> Positive
    </span>
  );
  if (score < -0.2) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400">
      <TrendingDown className="h-3 w-3" /> Negative
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
      <Minus className="h-3 w-3" /> Neutral
    </span>
  );
}

function DispositionBadge({ disp }: { disp: string | null }) {
  if (!disp) return null;
  const colors: Record<string, string> = {
    interested: 'bg-emerald-500/15 text-emerald-400',
    callback: 'bg-amber-500/15 text-amber-400',
    meeting_booked: 'bg-violet-500/15 text-violet-400',
    not_interested: 'bg-slate-500/15 text-slate-400',
    voicemail: 'bg-blue-500/15 text-blue-400',
    no_answer: 'bg-slate-500/10 text-slate-600',
    wrong_number: 'bg-red-500/15 text-red-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${colors[disp] ?? 'bg-white/[0.05] text-slate-500'}`}>
      {disp.replace(/_/g, ' ')}
    </span>
  );
}

function MiniPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { await el.play().catch(() => {}); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} src={url} preload="none"
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el?.duration) setProgress((el.currentTime / el.duration) * 100);
        }}
      />
      <button type="button" onClick={toggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400 transition hover:bg-emerald-500/15"
      >
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 translate-x-px" />}
      </button>
      <div className="w-20 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

const FEATURE_BADGES = [
  { icon: Mic, label: 'Auto-recording' },
  { icon: FileText, label: 'Transcription' },
  { icon: Sparkles, label: 'AI Insights' },
  { icon: Search, label: 'Searchable' },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-8">
        <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 -m-6 rounded-full bg-emerald-500/20" />
        <motion.div animate={{ scale: [1, 1.06, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute inset-0 -m-3 rounded-full bg-emerald-500/15" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.06]">
          <Mic className="h-9 w-9 text-emerald-400" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-white">Your call library is ready</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
        Every call you make will be recorded, transcribed, and analyzed by AI automatically.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {FEATURE_BADGES.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
            <Icon className="h-3 w-3 text-emerald-400" />{label}
          </span>
        ))}
      </div>
      <Link href="/dialer" className="mt-8 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/10 px-6 py-3 text-sm font-bold text-emerald-300 transition hover:from-emerald-600/30">
        <Phone className="h-4 w-4" /> Start your first call
      </Link>
    </div>
  );
}

const RECORDINGS_SELECT = `
  id, to_number, from_number, recording_url, duration_seconds, created_at,
  disposition, analytics_id, ai_processing_status,
  leads(name, company),
  analytics:call_analytics(id, sentiment, sentiment_score, summary, talking_points, suggested_disposition)
`;

const DISPOSITION_FILTERS = [
  { id: 'interested', label: 'Interested' },
  { id: 'callback', label: 'Callback' },
  { id: 'meeting_booked', label: 'Meeting' },
  { id: 'voicemail', label: 'Voicemail' },
  { id: 'not_interested', label: 'Not Interested' },
  { id: 'no_answer', label: 'No Answer' },
];

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDisp, setFilterDisp] = useState<string | null>(null);

  const [supabase] = useState(() => createClient());

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { setLoading(false); return; }
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('calls')
        .select(RECORDINGS_SELECT)
        .eq('user_id', session.user.id)
        .not('recording_url', 'is', null)
        .or('duration_seconds.gte.30,duration_seconds.is.null')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) { console.error('Recordings fetch error:', error); return; }
      setRecordings((data ?? []).filter((r) => r.recording_url) as unknown as Recording[]);
    } catch (err) {
      console.error('Recordings load error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: update when AI processing completes
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('recordings-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Recording>;
          setRecordings((prev) =>
            prev.map((r) =>
              r.id === updated.id
                ? { ...r, ...updated }
                : r,
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_analytics' },
        () => { load(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase, load]);

  const filteredRecordings = recordings.filter((r) => {
    if (filterDisp && (r.disposition ?? (Array.isArray(r.analytics) ? r.analytics[0] : r.analytics)?.suggested_disposition) !== filterDisp) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (r.leads?.name ?? r.to_number ?? '').toLowerCase();
      const company = (r.leads?.company ?? '').toLowerCase();
      if (!name.includes(q) && !company.includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <DashboardHeader title="Recordings" subtitle="AI-analyzed call recordings" />
      <main className="flex-1 overflow-y-auto px-3 py-3 lg:px-6 lg:py-5">
        {!loading && recordings.length > 0 && (
          <div className="mb-4 max-w-4xl space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search by name or company…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-white/[0.14] focus:bg-white/[0.05]"
              />
            </div>
            {/* Disposition filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilterDisp(null)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${!filterDisp ? 'border-brand/40 bg-brand/10 text-brand' : 'border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-300'}`}
              >
                All
              </button>
              {DISPOSITION_FILTERS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterDisp(prev => prev === f.id ? null : f.id)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${filterDisp === f.id ? 'border-brand/40 bg-brand/10 text-brand' : 'border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {loading ? (
          <div className="space-y-3 max-w-4xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <EmptyState />
        ) : filteredRecordings.length === 0 ? (
          <div className="flex max-w-4xl flex-col items-center gap-3 py-16">
            <Search className="h-8 w-8 text-slate-700" />
            <p className="text-sm text-slate-500">No recordings match your search</p>
            <button type="button" onClick={() => { setSearchQuery(''); setFilterDisp(null); }} className="text-xs font-semibold text-brand hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div className="space-y-3 max-w-4xl"
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {filteredRecordings.map((r) => {
              const name = r.leads?.name ?? r.to_number ?? 'Unknown';
              const company = r.leads?.company;
              const ai = Array.isArray(r.analytics) ? r.analytics[0] : r.analytics;
              const bullets = getSummaryBullets(ai?.summary);
              const talkingPoints = ai?.talking_points?.slice(0, 3) ?? [];
              const disp = ai?.suggested_disposition ?? r.disposition;

              return (
                <motion.div key={r.id}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.22 }}
                >
                  <Link href={`/recordings/${r.id}`}
                    className="group block rounded-2xl border border-white/[0.07] bg-[oklch(0.086_0.024_282)] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-4">
                      {/* Left: player */}
                      <div className="shrink-0">
                        <MiniPlayer url={r.recording_url} />
                      </div>

                      {/* Center: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">{name}</span>
                          {company && <span className="text-xs text-slate-500">{company}</span>}
                          <DispositionBadge disp={disp} />
                          {ai && <SentimentBadge score={ai.sentiment_score ?? null} />}
                        </div>

                        {/* AI summary bullet */}
                        {bullets.length > 0 && (
                          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-1">
                            <Sparkles className="inline h-3 w-3 text-amber-400/80 mr-1" />
                            {bullets[0]}
                          </p>
                        )}

                        {/* Talking point chips */}
                        {talkingPoints.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {talkingPoints.map((pt: string) => (
                              <span key={pt} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-500">
                                {pt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: meta */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatDuration(r.duration_seconds)}
                        </div>
                        <span className="text-[10px] text-slate-500">{formatDate(r.created_at)}</span>
                        <div className="flex items-center gap-1.5">
                          {r.ai_processing_status === 'processing' && !ai && (
                            <span className="flex items-center gap-1 rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-400 animate-pulse">
                              <Sparkles className="h-2.5 w-2.5" /> AI analyzing…
                            </span>
                          )}
                          {ai && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400/80">
                              <Sparkles className="h-2.5 w-2.5" /> Analyzed
                            </span>
                          )}
                          <a href={r.recording_url} download target="_blank" rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-[10px] text-emerald-500/70 group-hover:text-emerald-400 transition">
                          View Analysis →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </>
  );
}
