"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Phone, Mic, Sparkles, Bell, CreditCard, Shield,
  CheckCircle2, Loader2, Save, Radio, MicOff, Trash2,
  AlarmCheck, Brain, TrendingUp, Target,
  Info, HardDrive, Clock, Voicemail, Upload, Play, X as XIcon,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface UserSettings {
  recording_mode: 'always' | 'manual' | 'never';
  recording_disclaimer: boolean;
  recording_retention_days: number;
  recording_pause_on_dtmf: boolean;
  recording_auto_delete_short: boolean;
  ai_auto_transcribe: boolean;
  ai_auto_summarize: boolean;
  ai_detect_sentiment: boolean;
  ai_extract_talking_points: boolean;
  auto_drop_vm: boolean;
  local_presence_enabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  recording_mode: 'always',
  recording_disclaimer: true,
  recording_retention_days: 30,
  recording_pause_on_dtmf: true,
  recording_auto_delete_short: true,
  ai_auto_transcribe: true,
  ai_auto_summarize: true,
  ai_detect_sentiment: true,
  ai_extract_talking_points: true,
  auto_drop_vm: false,
  local_presence_enabled: false,
};

type TabKey = 'general' | 'calling' | 'recording' | 'ai' | 'voicemails' | 'notifications' | 'billing' | 'security';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'general',       label: 'General',       icon: Settings },
  { key: 'calling',       label: 'Calling',        icon: Phone },
  { key: 'recording',     label: 'Recording',      icon: Mic },
  { key: 'ai',            label: 'AI',             icon: Sparkles },
  { key: 'voicemails',    label: 'Voicemails',     icon: Voicemail },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'billing',       label: 'Billing',        icon: CreditCard },
  { key: 'security',      label: 'Security',       icon: Shield },
];

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[oklch(0.086_0.024_282)] p-5">
      <div className="mb-4">
        <p className="text-sm font-bold text-white">{title}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        checked ? "bg-emerald-500" : "bg-white/[0.12]",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
  iconColor = "text-slate-400",
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
            <Icon className={cn("h-3.5 w-3.5", iconColor)} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          {description && <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{description}</p>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function RecordingModeCard({
  mode,
  selected,
  onSelect,
}: {
  mode: 'always' | 'manual' | 'never';
  selected: boolean;
  onSelect: () => void;
}) {
  const configs = {
    always: {
      icon: Radio,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      label: "Always Record",
      description: "All calls recorded automatically",
      badge: "Recommended",
      badgeColor: "bg-emerald-500/15 text-emerald-400",
      detail: "Best for compliance, coaching, and AI insights",
    },
    manual: {
      icon: Mic,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      label: "Manual Control",
      description: "You decide to record each call",
      badge: null,
      badgeColor: "",
      detail: "Best for sensitive conversations",
    },
    never: {
      icon: MicOff,
      iconColor: "text-slate-400",
      iconBg: "bg-slate-500/10",
      label: "Never Record",
      description: "No recordings ever made",
      badge: null,
      badgeColor: "",
      detail: "Best for maximum privacy",
    },
  };

  const c = configs[mode];
  const Icon = c.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-emerald-500/40 bg-emerald-500/[0.06]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", c.iconBg)}>
          <Icon className={cn("h-4.5 w-4.5", c.iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{c.label}</p>
            {c.badge && (
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", c.badgeColor)}>
                {c.badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
          <p className="mt-1 text-[11px] text-slate-600">{c.detail}</p>
        </div>
        <div className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-emerald-400 bg-emerald-400" : "border-slate-600",
        )}>
          {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
        <Settings className="h-7 w-7 text-slate-600" />
      </div>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1.5 text-xs text-slate-600">Coming soon</p>
    </div>
  );
}

function GeneralTab({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [name, setName] = useState(userName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { full_name: name } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-4 max-w-lg">
      <SectionCard title="Profile" description="Your display name and account info">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">
              Display Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/30 transition"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">
              Email
            </label>
            <input
              value={userEmail}
              disabled
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-slate-600">Managed by your identity provider</p>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">
              Timezone
            </label>
            <input
              defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
              disabled
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved!" : "Save Profile"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function RecordingTab({
  settings,
  onChange,
  recordingStats,
}: {
  settings: UserSettings;
  onChange: (patch: Partial<UserSettings>) => void;
  recordingStats: { count: number; hours: number; storageMb: number };
}) {
  const retentionOptions = [7, 30, 90, 365];
  const storagePercent = Math.min(100, (recordingStats.storageMb / 1024) * 100);

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Recording Mode */}
      <SectionCard
        title="Recording Mode"
        description="Choose how calls are recorded across your account"
      >
        <div className="space-y-2">
          {(['always', 'manual', 'never'] as const).map((mode) => (
            <RecordingModeCard
              key={mode}
              mode={mode}
              selected={settings.recording_mode === mode}
              onSelect={() => onChange({ recording_mode: mode })}
            />
          ))}
        </div>
      </SectionCard>

      {/* Compliance Engine */}
      <SectionCard
        title="Auto-Compliance"
        description="Automatic legal protection for multi-party consent requirements"
      >
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
          <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-xs text-amber-300/80 leading-relaxed">
            We detect the lead's region via area code and flag calls that require two-party consent
            (California, Massachusetts, Illinois, Florida, EU countries, and more).
          </p>
        </div>
        <div>
          <ToggleRow
            label="Play recording disclaimer"
            description="Auto-triggered at call start for CA, MA, IL, EU, and other restricted regions"
            checked={settings.recording_disclaimer}
            onChange={(v) => onChange({ recording_disclaimer: v })}
            icon={AlarmCheck}
            iconColor="text-emerald-400"
          />
        </div>
      </SectionCard>

      {/* Storage & Retention */}
      <SectionCard title="Storage & Retention">
        {/* Storage bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-slate-600" />
              {recordingStats.storageMb.toFixed(0)} MB / 1,024 MB used
            </span>
            <span className="text-[11px] text-slate-600">{storagePercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${storagePercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                storagePercent > 80 ? "bg-red-500" : storagePercent > 60 ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-600">
            {recordingStats.count} recordings · {recordingStats.hours.toFixed(1)}h of audio
          </p>
        </div>

        {/* Retention */}
        <div>
          <label className="text-[11px] font-medium text-slate-500 mb-2 block uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Retention Period
          </label>
          <div className="flex gap-2 flex-wrap">
            {retentionOptions.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onChange({ recording_retention_days: days })}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  settings.recording_retention_days === days
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white",
                )}
              >
                {days === 365 ? "1 year" : `${days} days`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-600">Recordings older than this are automatically deleted</p>
        </div>
      </SectionCard>

      {/* Privacy & Security */}
      <SectionCard title="Privacy & Security">
        <ToggleRow
          label="Pause recording when keypad pressed"
          description="PCI compliance — protects credit card numbers entered via DTMF"
          checked={settings.recording_pause_on_dtmf}
          onChange={(v) => onChange({ recording_pause_on_dtmf: v })}
          icon={Shield}
          iconColor="text-violet-400"
        />
        <ToggleRow
          label="Auto-delete calls under 10 seconds"
          description="Skip processing and storage for accidental or dropped calls"
          checked={settings.recording_auto_delete_short}
          onChange={(v) => onChange({ recording_auto_delete_short: v })}
          icon={Trash2}
          iconColor="text-red-400/70"
        />
      </SectionCard>
    </div>
  );
}

function AiTab({ settings, onChange }: { settings: UserSettings; onChange: (patch: Partial<UserSettings>) => void }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <SectionCard
        title="AI Processing"
        description="Control which AI features run after each recorded call"
      >
        <ToggleRow
          label="Auto-transcribe recordings"
          description="Convert call audio to searchable text using our speech recognition engine"
          checked={settings.ai_auto_transcribe}
          onChange={(v) => onChange({ ai_auto_transcribe: v })}
          icon={Mic}
          iconColor="text-emerald-400"
        />
        <ToggleRow
          label="Generate AI summaries"
          description="Bullet-point summary, next steps, and suggested disposition from the AI engine"
          checked={settings.ai_auto_summarize}
          onChange={(v) => onChange({ ai_auto_summarize: v })}
          icon={Brain}
          iconColor="text-violet-400"
        />
        <ToggleRow
          label="Detect customer sentiment"
          description="Positive / neutral / negative scoring with confidence percentage"
          checked={settings.ai_detect_sentiment}
          onChange={(v) => onChange({ ai_detect_sentiment: v })}
          icon={TrendingUp}
          iconColor="text-amber-400"
        />
        <ToggleRow
          label="Extract talking points & objections"
          description="Identify key topics, buying signals, and objections raised during the call"
          checked={settings.ai_extract_talking_points}
          onChange={(v) => onChange({ ai_extract_talking_points: v })}
          icon={Target}
          iconColor="text-blue-400"
        />
      </SectionCard>

      <div className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <Sparkles className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-slate-300">Powered by AI</p>
          <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
            Transcription converts call audio to text. AI analysis generates summaries, sentiment scores, and objection detection with an automatic fallback for reliability.
          </p>
        </div>
      </div>
    </div>
  );
}

interface VoicemailRecord {
  id: string;
  name: string;
  audio_url: string;
  duration_seconds: number;
  drop_count: number;
  created_at: string;
}

function formatVmDuration(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${s}s`;
}

async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Math.round(audio.duration)); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
  });
}

function VoicemailsTab({
  autoDropVm,
  onAutoDropVmChange,
}: {
  autoDropVm: boolean;
  onAutoDropVmChange: (v: boolean) => void;
}) {
  const [voicemails, setVoicemails] = useState<VoicemailRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('voicemails')
      .select('id, name, audio_url, duration_seconds, drop_count, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setVoicemails(data as VoicemailRecord[]); });
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/')) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const duration = await getAudioDuration(file);
      const ext = file.name.split('.').pop() ?? 'mp3';
      const path = `${session.user.id}/${Date.now()}.${ext}`;

      const { data: up, error: upErr } = await supabase.storage
        .from('voicemail-recordings')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (upErr || !up) return;

      const { data: { publicUrl } } = supabase.storage
        .from('voicemail-recordings')
        .getPublicUrl(up.path);

      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 100);
      const { data: vm } = await supabase
        .from('voicemails')
        .insert({ user_id: session.user.id, name, audio_url: publicUrl, duration_seconds: duration })
        .select('id, name, audio_url, duration_seconds, drop_count, created_at')
        .single();

      if (vm) setVoicemails((prev) => [vm as VoicemailRecord, ...prev]);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileInput = useCallback((e: { target: HTMLInputElement }) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDelete = useCallback(async (vm: VoicemailRecord) => {
    const supabase = createClient();
    await supabase.from('voicemails').delete().eq('id', vm.id);
    // Also delete from storage
    const urlParts = vm.audio_url.split('/voicemail-recordings/');
    if (urlParts[1]) {
      await supabase.storage.from('voicemail-recordings').remove([decodeURIComponent(urlParts[1])]);
    }
    setVoicemails((prev) => prev.filter((v) => v.id !== vm.id));
  }, []);

  const togglePlay = useCallback((vm: VoicemailRecord) => {
    if (playingId === vm.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    const audio = new Audio(vm.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingId(vm.id);
  }, [playingId]);

  return (
    <div className="space-y-4 max-w-2xl">
      {/* AMD toggle */}
      <SectionCard
        title="Answering Machine Detection"
        description="Automatically drop a voicemail when an answering machine is detected — no rep action needed"
      >
        <ToggleRow
          label="Auto-drop voicemail on AMD"
          description="When enabled, the dialer detects voicemail systems and drops your saved voicemail automatically"
          checked={autoDropVm}
          onChange={onAutoDropVmChange}
          icon={Voicemail}
          iconColor="text-violet-400"
        />
      </SectionCard>

      {/* Upload zone */}
      <SectionCard
        title="Saved Voicemails"
        description="Upload pre-recorded voicemail messages. During a call, hit VM Drop to leave one instantly."
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
            dragOver
              ? "border-emerald-500/60 bg-emerald-500/[0.06]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
              <p className="text-sm text-slate-400">Uploading…</p>
            </>
          ) : (
            <>
              <Upload className="h-7 w-7 text-slate-500" />
              <p className="text-sm font-medium text-slate-300">
                Drop an audio file or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-400 underline-offset-2 hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-slate-600">MP3, WAV, M4A, OGG · max 5 MB</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileInput}
        />

        {/* Voicemail list */}
        {voicemails.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-600">No voicemails yet — upload one above</p>
        ) : (
          <div className="space-y-2">
            {voicemails.map((vm) => (
              <div
                key={vm.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => togglePlay(vm)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-slate-300 transition hover:border-white/25 hover:text-white"
                  aria-label={playingId === vm.id ? 'Pause' : 'Play'}
                >
                  {playingId === vm.id ? (
                    <span className="h-3 w-3 rounded-sm bg-current" />
                  ) : (
                    <Play className="h-3.5 w-3.5 translate-x-px" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{vm.name}</p>
                  <p className="text-[11px] text-slate-600">
                    {formatVmDuration(vm.duration_seconds)}
                    {vm.drop_count > 0 && ` · ${vm.drop_count} drop${vm.drop_count !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(vm)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-600 transition hover:text-rose-400"
                  aria-label="Delete voicemail"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('recording');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [recordingStats, setRecordingStats] = useState({ count: 0, hours: 0, storageMb: 0 });

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      setUserName(session.user.user_metadata?.full_name ?? '');
      setUserEmail(session.user.email ?? '');

      // Load settings
      const { data: s } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (s) {
        const loaded: UserSettings = {
          recording_mode: s.recording_mode ?? 'always',
          recording_disclaimer: s.recording_disclaimer ?? true,
          recording_retention_days: s.recording_retention_days ?? 30,
          recording_pause_on_dtmf: s.recording_pause_on_dtmf ?? true,
          recording_auto_delete_short: s.recording_auto_delete_short ?? true,
          ai_auto_transcribe: s.ai_auto_transcribe ?? true,
          ai_auto_summarize: s.ai_auto_summarize ?? true,
          ai_detect_sentiment: s.ai_detect_sentiment ?? true,
          ai_extract_talking_points: s.ai_extract_talking_points ?? true,
          auto_drop_vm: s.auto_drop_vm ?? false,
          local_presence_enabled: s.local_presence_enabled ?? false,
        };
        setSettings(loaded);
        setSavedSettings(loaded);
      } else {
        // Create default settings row
        await supabase.from('user_settings').insert({ user_id: session.user.id });
      }

      // Load recording stats
      const { data: calls } = await supabase
        .from('calls')
        .select('duration_seconds, recording_url')
        .eq('user_id', session.user.id)
        .not('recording_url', 'is', null);

      if (calls) {
        const totalSeconds = calls.reduce((s, c) => s + (c.duration_seconds ?? 0), 0);
        setRecordingStats({
          count: calls.length,
          hours: totalSeconds / 3600,
          // ~8 KB/s at 64 kbps compressed phone audio
          storageMb: totalSeconds * 0.008,
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleChange = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase
        .from('user_settings')
        .upsert({ user_id: session.user.id, ...settings }, { onConflict: 'user_id' });

      setSavedSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DashboardHeader title="Settings" subtitle="Manage your account and workspace" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar tabs */}
        <nav className="hidden w-52 shrink-0 flex-col gap-0.5 border-r border-white/[0.06] p-3 lg:flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left",
                activeTab === key
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {key === 'recording' && (
                <span className="ml-auto rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                  NEW
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Mobile tabs */}
        <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-none lg:hidden shrink-0 absolute top-[57px] left-0 right-0 z-10 bg-[oklch(0.056_0.018_286)]/95 backdrop-blur-xl px-3 py-2 gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                activeTab === key
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6 mt-10 lg:mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'general' && (
                  <GeneralTab userName={userName} userEmail={userEmail} />
                )}
                {activeTab === 'recording' && (
                  <RecordingTab
                    settings={settings}
                    onChange={handleChange}
                    recordingStats={recordingStats}
                  />
                )}
                {activeTab === 'ai' && (
                  <AiTab settings={settings} onChange={handleChange} />
                )}
                {activeTab === 'voicemails' && (
                  <VoicemailsTab
                    autoDropVm={settings.auto_drop_vm}
                    onAutoDropVmChange={(v) => handleChange({ auto_drop_vm: v })}
                  />
                )}
                {(activeTab === 'calling' || activeTab === 'notifications' || activeTab === 'billing' || activeTab === 'security') && (
                  <PlaceholderTab label={TABS.find((t) => t.key === activeTab)?.label ?? ''} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Floating Save button */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-500/30 transition hover:bg-emerald-500 disabled:opacity-70"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveSuccess ? "Saved!" : saving ? "Saving…" : "Save Changes"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
