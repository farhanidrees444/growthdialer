'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Pause, Clock, Mic, Download, Sparkles, FileText, Search, Phone } from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface Recording {
  id: string;
  to_number: string | null;
  from_number: string | null;
  recording_url: string;
  duration_seconds: number | null;
  created_at: string;
  status: string | null;
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

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (playing) {
        el.pause();
        setPlaying(false);
      } else {
        await el.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error('Audio play error:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress((el.currentTime / el.duration) * 100);
        }}
        preload="none"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400 transition hover:bg-emerald-500/15"
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-px" />}
      </button>
      <div className="w-28 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
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
      {/* Animated mic */}
      <div className="relative mb-8">
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 -m-6 rounded-full bg-emerald-500/20"
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute inset-0 -m-3 rounded-full bg-emerald-500/15"
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.06]">
          <Mic className="h-9 w-9 text-emerald-400" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-white">Your call library is ready</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
        Every call you make will be recorded, transcribed, and analyzed by AI automatically.
      </p>

      {/* Feature badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {FEATURE_BADGES.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400"
          >
            <Icon className="h-3 w-3 text-emerald-400" />
            {label}
          </span>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/dialer"
        className="mt-8 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/10 px-6 py-3 text-sm font-bold text-emerald-300 transition hover:from-emerald-600/30"
      >
        <Phone className="h-4 w-4" />
        Start your first call
      </Link>
    </div>
  );
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) { setLoading(false); return; }

        const { data, error } = await supabase
          .from('calls')
          .select('id, to_number, from_number, recording_url, duration_seconds, created_at, status, leads(name, company)')
          .eq('user_id', session.user.id)
          .not('recording_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Recordings fetch error:', error);
          return;
        }

        setRecordings((data ?? []).filter((r) => r.recording_url) as unknown as Recording[]);
      } catch (err) {
        console.error('Recordings load error:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <>
      <DashboardHeader title="Recordings" subtitle="Call recordings — click play to listen" />
      <main className="flex-1 overflow-y-auto px-3 py-3 lg:px-6 lg:py-5">
        {loading ? (
          <div className="space-y-3 max-w-3xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className="space-y-2 lg:space-y-3 max-w-3xl"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {recordings.map((r) => {
              const displayName = r.leads?.name ?? r.to_number ?? 'Unknown';
              const company = r.leads?.company;
              return (
                <motion.div
                  key={r.id}
                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-3 lg:p-4 flex items-center gap-3 lg:gap-4 border-white/[0.07] bg-[oklch(0.086_0.024_282)] transition hover:border-white/10">
                    <AudioPlayer url={r.recording_url} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{displayName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        {company && <span className="truncate">{company}</span>}
                        {company && r.duration_seconds && <span className="text-slate-700">·</span>}
                        {r.duration_seconds && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDuration(r.duration_seconds)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                      <Badge variant="secondary" className="hidden sm:flex text-[10px] bg-white/[0.04] text-slate-500 border-white/[0.06]">
                        {formatDate(r.created_at)}
                      </Badge>
                      <a
                        href={r.recording_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/[0.06] text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"
                        title="Download recording"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </>
  );
}
