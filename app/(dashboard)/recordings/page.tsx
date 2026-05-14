"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Clock, Mic } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Recording {
  id: string;
  to_number: string | null;
  from_number: string | null;
  recording_url: string;
  duration_seconds: number | null;
  created_at: string;
  status: string | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
      console.error("Audio play error:", err);
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
      <Button
        size="icon"
        variant="outline"
        className="shrink-0 rounded-full h-8 w-8"
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </Button>
      <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
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
          .from("calls")
          .select("id, to_number, from_number, recording_url, duration_seconds, created_at, status")
          .eq("user_id", session.user.id)
          .not("recording_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Recordings fetch error:", error);
          return;
        }

        setRecordings((data ?? []).filter((r) => r.recording_url) as Recording[]);
      } catch (err) {
        console.error("Recordings load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <>
      <DashboardHeader title="Recordings" subtitle="Call recordings — click play to listen" />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="space-y-3 max-w-3xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Mic className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">No recordings yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Recordings will appear here after calls with recording enabled are completed.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {recordings.map((r) => (
              <Card key={r.id} className="p-4 flex items-center gap-4 border-white/10 bg-[oklch(0.086_0.024_282)]/90">
                <AudioPlayer url={r.recording_url} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {r.to_number ?? "Unknown number"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="truncate">{r.from_number ?? "—"}</span>
                    {r.duration_seconds && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {formatDuration(r.duration_seconds)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {formatDate(r.created_at)}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
