"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Phone, Mic, Sparkles, Bell, CreditCard, Shield,
  CheckCircle2, Loader2, Save, Radio, MicOff, Trash2,
  AlarmCheck, Brain, TrendingUp, Target,
  Info, HardDrive, Clock, Voicemail, Upload, Play, X as XIcon,
  Users, UserPlus, Crown, Mail, MoreVertical, UserMinus,
  Monitor, Smartphone, PhoneOff, PhoneIncoming, AlertTriangle, KeyRound,
  Building2,
} from "lucide-react";
import { WorkspaceSettingsPanel } from "@/components/settings/workspace-settings-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InboundHistoryPanel } from "@/components/calls/inbound-history-panel";
import { useSearchParams } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import { WorkspaceBillingPanel } from "@/components/billing/workspace-billing-panel";
import { ROLE_LABELS, ROLE_COLORS, type Role } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SoundDesignToggle } from "@/components/premium/sound-design-toggle";

// ─── Types ────────────────────────────────────────────────────────────────────

// Only DB-confirmed columns (migration 008 + migration 027).
// auto_drop_vm and local_presence_enabled do NOT exist in user_settings — removed.
interface UserSettings {
  recording_mode:              'always' | 'manual' | 'never';
  recording_disclaimer:        boolean;
  recording_retention_days:    number;
  recording_pause_on_dtmf:     boolean;
  recording_auto_delete_short: boolean;
  ai_auto_transcribe:          boolean;
  ai_auto_summarize:           boolean;
  ai_detect_sentiment:         boolean;
  ai_extract_talking_points:   boolean;
  inbound_mode:                'browser' | 'forward' | 'voicemail' | 'off';
  inbound_forward_number:      string;
  inbound_ring_seconds:        number;
  missed_call_notify:          boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  recording_mode:              'always',
  recording_disclaimer:        true,
  recording_retention_days:    30,
  recording_pause_on_dtmf:     true,
  recording_auto_delete_short: true,
  ai_auto_transcribe:          true,
  ai_auto_summarize:           true,
  ai_detect_sentiment:         true,
  ai_extract_talking_points:   true,
  inbound_mode:                'browser',
  inbound_forward_number:      '',
  inbound_ring_seconds:        25,
  missed_call_notify:          true,
};

type TabKey = 'profile' | 'workspace' | 'recording' | 'ai' | 'calling' | 'voicemails' | 'notifications' | 'billing' | 'team' | 'security';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'profile',       label: 'Profile',        icon: Settings },
  { key: 'workspace',     label: 'Workspace',      icon: Building2 },
  { key: 'recording',     label: 'Recording',      icon: Mic },
  { key: 'ai',            label: 'AI',             icon: Sparkles },
  { key: 'calling',       label: 'Inbound',        icon: Phone },
  { key: 'voicemails',    label: 'Voicemails',     icon: Voicemail },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'billing',       label: 'Billing',        icon: CreditCard },
  { key: 'team',          label: 'Team',           icon: Users },
  { key: 'security',      label: 'Security',       icon: Shield },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
      <div className="mb-4">
        <p className="text-sm font-bold text-white">{title}</p>
        {description && <p className="mt-0.5 text-xs text-white/35 leading-relaxed">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
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
        checked ? "bg-[#8B5CF6]" : "bg-white/[0.12]",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <motion.span
        layout
        className="inline-block h-4 w-4 rounded-full bg-white shadow"
        animate={{ x: checked ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      />
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange, icon: Icon, iconColor = "text-white/40" }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
  icon?: React.ElementType; iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
            <Icon className={cn("h-3.5 w-3.5", iconColor)} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{label}</p>
          {description && <p className="text-xs text-white/35 leading-relaxed mt-0.5">{description}</p>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [name, setName]         = useState(userName);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { full_name: name } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function sendPasswordReset() {
    setResetting(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setResetting(false);
    setResetSent(true);
    setTimeout(() => setResetSent(false), 4000);
  }

  return (
    <div className="space-y-4 max-w-lg">
      <SectionCard title="Profile" description="Your display name and account email">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-white/40 mb-1.5 block uppercase tracking-wider">
              Display Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#8B5CF6]/50 transition"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-white/40 mb-1.5 block uppercase tracking-wider">
              Email
            </label>
            <input
              value={userEmail}
              disabled
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 text-sm text-white/35 outline-none cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-white/25">Managed by your identity provider</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-white/40 mb-1.5 block uppercase tracking-wider">
              Timezone
            </label>
            <input
              defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
              disabled
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 text-sm text-white/35 outline-none cursor-not-allowed"
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved!" : "Save Profile"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Password" description="Send a password reset email to your account address">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">Change Password</p>
            <p className="text-xs text-white/35 mt-0.5">A reset link will be sent to {userEmail}</p>
          </div>
          <button
            type="button"
            onClick={sendPasswordReset}
            disabled={resetting || resetSent}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-60",
              resetSent
                ? "border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4]"
                : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/[0.15] hover:text-white",
            )}
          >
            {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : resetSent ? <CheckCircle2 className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
            {resetSent ? "Email sent!" : "Send Reset Email"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Recording Tab ────────────────────────────────────────────────────────────

function RecordingModeCard({ mode, selected, onSelect }: {
  mode: 'always' | 'manual' | 'never'; selected: boolean; onSelect: () => void;
}) {
  const configs = {
    always: {
      icon: Radio, iconColor: "text-[#06B6D4]", iconBg: "bg-[#06B6D4]/10",
      label: "Always Record", description: "All calls recorded automatically",
      badge: "Recommended", detail: "Best for compliance, coaching, and AI insights",
    },
    manual: {
      icon: Mic, iconColor: "text-amber-400", iconBg: "bg-amber-500/10",
      label: "Manual Control", description: "You decide to record each call",
      badge: null, detail: "Best for sensitive conversations",
    },
    never: {
      icon: MicOff, iconColor: "text-white/30", iconBg: "bg-white/[0.04]",
      label: "Never Record", description: "No recordings ever made",
      badge: null, detail: "Best for maximum privacy",
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
          ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/[0.06]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", c.iconBg)}>
          <Icon className={cn("h-4 w-4", c.iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{c.label}</p>
            {c.badge && (
              <span className="rounded-full bg-[#06B6D4]/15 px-2 py-0.5 text-[10px] font-bold text-[#06B6D4]">
                {c.badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/35">{c.description}</p>
          <p className="mt-1 text-[11px] text-white/25">{c.detail}</p>
        </div>
        <div className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-[#8B5CF6] bg-[#8B5CF6]" : "border-white/20",
        )}>
          {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

function RecordingTab({ settings, onChange, recordingStats }: {
  settings: UserSettings;
  onChange: (patch: Partial<UserSettings>) => void;
  recordingStats: { count: number; hours: number; storageMb: number };
}) {
  const retentionOptions = [7, 30, 90, 365];
  const storagePercent = Math.min(100, (recordingStats.storageMb / 1024) * 100);

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionCard title="Recording Mode" description="Choose how calls are recorded across your account">
        <div className="space-y-2">
          {(['always', 'manual', 'never'] as const).map((mode) => (
            <RecordingModeCard
              key={mode} mode={mode}
              selected={settings.recording_mode === mode}
              onSelect={() => onChange({ recording_mode: mode })}
            />
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/[0.05] p-3">
          <Info className="h-4 w-4 shrink-0 text-[#06B6D4] mt-0.5" />
          <p className="text-xs text-[#06B6D4]/80 leading-relaxed">
            <span className="font-semibold">30-second minimum:</span> Only calls lasting 30 seconds or more are saved. Shorter calls are discarded automatically — keeping your library clean.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Storage & Retention">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-white/25" />
              {recordingStats.storageMb.toFixed(0)} MB / 1,024 MB used
            </span>
            <span className="text-[11px] text-white/25 tabular-nums">{storagePercent.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${storagePercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn("h-full rounded-full",
                storagePercent > 80 ? "bg-red-500" : storagePercent > 60 ? "bg-amber-500" : "bg-[#8B5CF6]",
              )}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/25 tabular-nums">
            {recordingStats.count} recordings · {recordingStats.hours.toFixed(1)}h of audio
          </p>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-white/40 mb-2 block uppercase tracking-wider flex items-center gap-1.5">
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
                    ? "bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30"
                    : "border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white",
                )}
              >
                {days === 365 ? "1 year" : `${days} days`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-white/25">Recordings older than this are automatically deleted</p>
        </div>
      </SectionCard>

      <SectionCard title="Privacy & Compliance">
        <ToggleRow
          label="Enforce 30-second minimum"
          description="Discard recordings from calls shorter than 30 seconds — prevents storing accidental or dropped calls"
          checked={settings.recording_auto_delete_short}
          onChange={(v) => onChange({ recording_auto_delete_short: v })}
          icon={Trash2}
          iconColor="text-red-400/70"
        />
        <ToggleRow
          label="Play recording disclaimer"
          description="Auto-triggered at call start for regions requiring two-party consent (CA, MA, IL, EU, and more)"
          checked={settings.recording_disclaimer}
          onChange={(v) => onChange({ recording_disclaimer: v })}
          icon={AlarmCheck}
          iconColor="text-[#06B6D4]"
        />
        <ToggleRow
          label="Pause recording on keypad input"
          description="Protects credit card numbers and sensitive DTMF inputs from being recorded"
          checked={settings.recording_pause_on_dtmf}
          onChange={(v) => onChange({ recording_pause_on_dtmf: v })}
          icon={Shield}
          iconColor="text-[#8B5CF6]"
        />
      </SectionCard>
    </div>
  );
}

// ─── AI Tab ───────────────────────────────────────────────────────────────────

function AiTab({ settings, onChange }: { settings: UserSettings; onChange: (patch: Partial<UserSettings>) => void }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <SectionCard title="AI Processing" description="Control which AI features run after each recorded call">
        <ToggleRow
          label="Auto-transcribe recordings"
          description="Convert call audio to searchable text after the call ends — powers all other AI features"
          checked={settings.ai_auto_transcribe}
          onChange={(v) => onChange({ ai_auto_transcribe: v })}
          icon={Mic}
          iconColor="text-[#06B6D4]"
        />
        <ToggleRow
          label="Generate AI summaries"
          description="Bullet-point summary, next steps, and suggested disposition from the AI engine"
          checked={settings.ai_auto_summarize}
          onChange={(v) => onChange({ ai_auto_summarize: v })}
          icon={Brain}
          iconColor="text-[#8B5CF6]"
        />
        <ToggleRow
          label="Detect customer sentiment"
          description="Positive / neutral / negative scoring — visible in Recordings and Analytics"
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
          <p className="text-xs font-semibold text-white/70">How AI processing works</p>
          <p className="mt-0.5 text-[11px] text-white/35 leading-relaxed">
            After each recorded call, the recording pipeline transcribes audio via Whisper (Groq) then runs Gemini 2.0 Flash for analysis. Fallback to Groq LLaMA if Gemini is unavailable. These settings are read at the trigger point — turning off a feature stops new processing without affecting existing results.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Inbound Calling Tab ──────────────────────────────────────────────────────

const INBOUND_MODES = [
  { id: 'browser',   title: 'Ring in Browser',  desc: 'Answer calls right here in the app', icon: Monitor },
  { id: 'forward',   title: 'Forward to Phone', desc: 'Route to your personal number',       icon: Smartphone },
  { id: 'voicemail', title: 'Voicemail Only',   desc: 'Send straight to voicemail',          icon: Voicemail },
  { id: 'off',       title: 'Reject All',       desc: 'Decline all incoming calls',          icon: PhoneOff },
] as const;

function CallingTab({ settings, onChange }: { settings: UserSettings; onChange: (patch: Partial<UserSettings>) => void }) {
  const [fwdError, setFwdError] = useState('');

  function validateE164(val: string) {
    if (!val) return '';
    const digits = val.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return 'Enter a valid international number';
    return '';
  }

  function onFwdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange({ inbound_forward_number: val });
    setFwdError(validateE164(val));
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <SectionCard title="Inbound Call Routing" description="How incoming calls to your GrowthDialer numbers are handled">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-5">
          {INBOUND_MODES.map(({ id, title, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ inbound_mode: id })}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
                settings.inbound_mode === id
                  ? "border-[#06B6D4]/40 bg-[#06B6D4]/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]",
              )}
            >
              <Icon className={cn("h-5 w-5", settings.inbound_mode === id ? "text-[#06B6D4]" : "text-white/30")} />
              <p className={cn("text-sm font-semibold", settings.inbound_mode === id ? "text-white" : "text-white/60")}>
                {title}
              </p>
              <p className="text-xs text-white/35">{desc}</p>
            </button>
          ))}
        </div>

        {settings.inbound_mode === 'forward' && (
          <div className="mb-5 space-y-1.5">
            <label className="block text-xs font-semibold text-white/40">Forward-to number (E.164)</label>
            <input
              type="tel"
              value={settings.inbound_forward_number}
              onChange={onFwdChange}
              placeholder="+15551234567"
              className={cn(
                "w-full rounded-xl border bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition",
                fwdError ? "border-red-500/40" : "border-white/[0.07] focus:border-[#06B6D4]/40",
              )}
            />
            {fwdError
              ? <p className="text-xs text-red-400">{fwdError}</p>
              : <p className="text-xs text-white/25">All incoming calls forward to this number</p>
            }
          </div>
        )}

        {(settings.inbound_mode === 'browser' || settings.inbound_mode === 'forward') && (
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/40">Ring duration before voicemail</label>
              <span className="text-xs font-mono tabular-nums text-[#06B6D4]">{settings.inbound_ring_seconds}s</span>
            </div>
            <input
              type="range" min={10} max={45} step={5}
              value={settings.inbound_ring_seconds}
              onChange={(e) => onChange({ inbound_ring_seconds: Number(e.target.value) })}
              className="w-full accent-[#8B5CF6]"
            />
            <div className="flex justify-between text-[10px] text-white/25">
              <span>10s</span><span>45s</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white/80">Notify me of missed calls</p>
            <p className="text-xs text-white/35">In-app notification when you miss an inbound call</p>
          </div>
          <Toggle
            checked={settings.missed_call_notify}
            onChange={(v) => onChange({ missed_call_notify: v })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Inbound call history"
        description="Recent calls to your numbers — missed calls highlighted. Full logs live under Call Logs in the sidebar."
      >
        <InboundHistoryPanel />
      </SectionCard>
    </div>
  );
}

// ─── Voicemails Tab ───────────────────────────────────────────────────────────

interface VoicemailRecord {
  id: string; name: string; audio_url: string;
  duration_seconds: number; drop_count: number; created_at: string;
}

function fmtVmDur(s: number): string {
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
    audio.onerror         = () => { URL.revokeObjectURL(url); resolve(0); };
  });
}

function VoicemailsTab() {
  const [voicemails, setVoicemails] = useState<VoicemailRecord[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const [playingId, setPlayingId]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef     = useRef<HTMLAudioElement | null>(null);

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
      const ext  = file.name.split('.').pop() ?? 'mp3';
      const path = `${session.user.id}/${Date.now()}.${ext}`;

      const { data: up, error: upErr } = await supabase.storage
        .from('voicemail-recordings')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr || !up) return;

      const { data: { publicUrl } } = supabase.storage.from('voicemail-recordings').getPublicUrl(up.path);
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
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDelete = useCallback(async (vm: VoicemailRecord) => {
    const supabase = createClient();
    await supabase.from('voicemails').delete().eq('id', vm.id);
    const urlParts = vm.audio_url.split('/voicemail-recordings/');
    if (urlParts[1]) await supabase.storage.from('voicemail-recordings').remove([decodeURIComponent(urlParts[1])]);
    setVoicemails((prev) => prev.filter((v) => v.id !== vm.id));
  }, []);

  const togglePlay = useCallback((vm: VoicemailRecord) => {
    if (playingId === vm.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    const audio = new Audio(vm.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingId(vm.id);
  }, [playingId]);

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionCard
        title="Voicemail Drops"
        description="Pre-recorded messages. During a call, use VM Drop to leave one instantly without waiting for the beep."
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
            dragOver
              ? "border-[#8B5CF6]/60 bg-[#8B5CF6]/[0.06]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]",
          )}
        >
          {uploading ? (
            <><Loader2 className="h-7 w-7 animate-spin text-[#8B5CF6]" /><p className="text-sm text-white/40">Uploading…</p></>
          ) : (
            <>
              <Upload className="h-7 w-7 text-white/25" />
              <p className="text-sm font-medium text-white/60">
                Drop an audio file or{' '}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#8B5CF6] hover:underline underline-offset-2">
                  browse
                </button>
              </p>
              <p className="text-xs text-white/25">MP3, WAV, M4A, OGG · max 5 MB</p>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileInput} />

        {voicemails.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/25">No voicemails yet — upload one above</p>
        ) : (
          <div className="space-y-2">
            {voicemails.map((vm) => (
              <div key={vm.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <button
                  type="button"
                  onClick={() => togglePlay(vm)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-white/50 transition hover:border-[#8B5CF6]/40 hover:text-[#8B5CF6]"
                >
                  {playingId === vm.id
                    ? <span className="h-3 w-3 rounded-sm bg-current" />
                    : <Play className="h-3.5 w-3.5 translate-x-px" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{vm.name}</p>
                  <p className="text-[11px] text-white/30">
                    {fmtVmDur(vm.duration_seconds)}
                    {vm.drop_count > 0 && ` · ${vm.drop_count} drop${vm.drop_count !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(vm)}
                  className="shrink-0 rounded-lg p-1.5 text-white/25 transition hover:text-red-400"
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

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab({ settings, onChange }: {
  settings: UserSettings; onChange: (patch: Partial<UserSettings>) => void;
}) {
  return (
    <div className="space-y-4 max-w-lg">
      <SectionCard title="Call Notifications" description="Get notified when things happen with your calls">
        <ToggleRow
          label="Missed call notifications"
          description="Show an in-app notification banner whenever an inbound call is missed"
          checked={settings.missed_call_notify}
          onChange={(v) => onChange({ missed_call_notify: v })}
          icon={Bell}
          iconColor="text-[#8B5CF6]"
        />
      </SectionCard>

      <SectionCard title="Sound design" description="Optional audio feedback for calls and dispositions">
        <SoundDesignToggle />
      </SectionCard>

      <SectionCard title="Email Notifications">
        <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
          <div>
            <p className="text-sm font-medium text-white/60">Email digests</p>
            <p className="mt-1 text-xs text-white/30 leading-relaxed">
              Daily and weekly call summaries via email are coming soon. Your notification preferences will sync automatically when this launches.
            </p>
            <span className="mt-2 inline-block rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold text-white/30">
              Coming soon
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

function BillingTab() {
  return <WorkspaceBillingPanel />;
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab({
  userEmail,
  onDeleteRequest,
}: {
  userEmail: string;
  onDeleteRequest: () => void;
}) {
  const [resetSent, setResetSent]   = useState(false);
  const [resetting, setResetting]   = useState(false);

  async function sendPasswordReset() {
    setResetting(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setResetting(false);
    setResetSent(true);
    setTimeout(() => setResetSent(false), 4000);
  }

  return (
    <div className="space-y-4 max-w-lg">
      <SectionCard title="Password & Authentication">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">Change Password</p>
            <p className="text-xs text-white/35 mt-0.5">A secure reset link will be sent to {userEmail}</p>
          </div>
          <button
            type="button"
            onClick={sendPasswordReset}
            disabled={resetting || resetSent}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-60",
              resetSent
                ? "border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4]"
                : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/[0.15] hover:text-white",
            )}
          >
            {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : resetSent ? <CheckCircle2 className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
            {resetSent ? "Email sent!" : "Send Reset Email"}
          </button>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-sm font-bold text-red-400">Danger Zone</p>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/70">Delete Account</p>
            <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
              Permanently deletes your account, all calls, recordings, leads, and settings. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onDeleteRequest}
            className="shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────

function DeleteAccountModal({ onClose, userEmail }: { onClose: () => void; userEmail: string }) {
  const [input, setInput]     = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError]     = useState('');

  async function handleDelete() {
    if (input !== 'DELETE') { setError('Type DELETE exactly'); return; }
    setDeleting(true);
    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) { setError(data.error ?? 'Deletion failed'); setDeleting(false); return; }
      // Sign out and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch {
      setError('Network error — try again');
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-red-500/20 bg-[oklch(0.09_0.006_285)] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Delete Account</h3>
            <p className="mt-0.5 text-xs text-white/40">
              This permanently deletes {userEmail} and all associated data. There is no undo.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/40">
              Type <span className="font-mono text-red-400">DELETE</span> to confirm
            </label>
            <input
              autoFocus
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              placeholder="DELETE"
              className="w-full rounded-xl border border-red-500/20 bg-red-500/[0.04] px-3 py-2.5 text-sm font-mono text-red-300 placeholder:text-red-500/30 outline-none focus:border-red-500/40 transition"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/40 transition hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || input !== 'DELETE'}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Deleting…' : 'Delete Forever'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Team Tab (unchanged from working version) ────────────────────────────────

const ROLE_OPTIONS: Role[] = ['owner', 'admin', 'manager', 'agent', 'viewer'];

function InviteModal({ onClose }: { onClose: () => void }) {
  const { inviteMember, can } = useWorkspace();
  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState<Role>('agent');
  const [message, setMessage] = useState('');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');
  const [sent, setSent]     = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = can; // keep import alive

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Enter a valid email'); return; }
    setBusy(true); setError('');
    const result = await inviteMember(trimmed, role, message.trim() || undefined);
    setBusy(false);
    if (!result.ok) { setError(result.error ?? 'Failed to send'); return; }
    setSent(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.006_285)] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Invite team member</h3>
            <p className="mt-0.5 text-xs text-white/35">They'll receive a secure invite link by email</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/25 hover:text-white transition">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-[#06B6D4]" />
            <p className="text-sm font-semibold text-white">Invitation sent!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/40">Email address</label>
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="colleague@company.com" autoFocus
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#8B5CF6]/40 transition"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/40">Role</label>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {ROLE_OPTIONS.filter((r) => r !== 'owner').map((r) => (
                  <button
                    key={r} type="button" onClick={() => setRole(r)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-xs font-semibold transition",
                      role === r
                        ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6]"
                        : "border-white/[0.07] bg-white/[0.02] text-white/40 hover:text-white",
                    )}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/40">Personal message <span className="text-white/20">(optional)</span></label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                placeholder="Looking forward to having you on the team!"
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#8B5CF6]/40 transition"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/40 transition hover:text-white">
                Cancel
              </button>
              <button type="button" onClick={handleSend} disabled={busy || !email.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                {busy ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function TeamTab() {
  const {
    currentWorkspace, currentRole, members, membersLoading,
    removeMember, updateMemberRole, refreshMembers, can,
  } = useWorkspace();
  const [showInvite, setShowInvite] = useState(false);
  const [roleMenu, setRoleMenu]     = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const activeMembers  = members.filter((m) => m.status === 'active');
  const pendingInvites = members.filter((m) => m.status === 'invited');
  const canInvite      = can('INVITE_MEMBERS');
  const canChangeRoles = can('CHANGE_ROLES');
  const canRemove      = can('REMOVE_MEMBERS');

  const planLabel: Record<string, string> = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

  async function handleRoleChange(userId: string, role: Role) {
    setActionBusy(userId);
    await updateMemberRole(userId, role);
    setRoleMenu(null); setActionBusy(null);
  }

  async function handleRemove(userId: string) {
    setActionBusy(userId);
    await removeMember(userId);
    setActionBusy(null);
    setRemoveTarget(null);
  }

  if (!currentWorkspace) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-white/25">No workspace selected</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <SectionCard title="Workspace">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Name',  value: currentWorkspace.name },
            { label: 'Plan',  value: planLabel[currentWorkspace.plan] ?? currentWorkspace.plan },
            { label: 'Seats', value: `${activeMembers.length} / ${currentWorkspace.max_seats}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{label}</p>
              <p className="mt-0.5 text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Members">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-white/35">{activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}</p>
          {canInvite && (
            <button type="button" onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-3 py-1.5 text-xs font-semibold text-[#8B5CF6] transition hover:bg-[#8B5CF6]/15">
              <UserPlus className="h-3.5 w-3.5" /> Invite member
            </button>
          )}
        </div>
        {membersLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-white/25" />
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeMembers.map((member) => {
              const isOwner  = member.role === 'owner';
              const displayName = member.full_name || member.email || 'Unknown';
              const ini = displayName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
              return (
                <div key={member.id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
                    {ini}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{displayName}</p>
                      {isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
                    </div>
                    {member.email && member.full_name && (
                      <p className="truncate text-[11px] text-white/30">{member.email}</p>
                    )}
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", ROLE_COLORS[member.role])}>
                    {ROLE_LABELS[member.role]}
                  </span>
                  {(canChangeRoles || canRemove) && !isOwner && (
                    <div className="relative shrink-0">
                      <button type="button"
                        onClick={() => setRoleMenu(roleMenu === member.id ? null : member.id)}
                        disabled={actionBusy === member.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-40">
                        {actionBusy === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-3.5 w-3.5" />}
                      </button>
                      <AnimatePresence>
                        {roleMenu === member.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setRoleMenu(null)} aria-hidden />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-white/[0.10] bg-[oklch(0.1_0.006_285)] p-1.5 shadow-2xl"
                            >
                              {canChangeRoles && (
                                <>
                                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">Change role</p>
                                  {ROLE_OPTIONS.filter((r) => r !== 'owner').map((r) => (
                                    <button key={r} type="button" onClick={() => handleRoleChange(member.user_id, r)}
                                      className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition",
                                        member.role === r ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "text-white/40 hover:bg-white/[0.05] hover:text-white")}>
                                      {ROLE_LABELS[r]}
                                    </button>
                                  ))}
                                  <div className="my-1 border-t border-white/[0.06]" />
                                </>
                              )}
                              {canRemove && (
                                <button type="button"
                                  onClick={() => { setRoleMenu(null); setRemoveTarget(member.user_id); }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10">
                                  <UserMinus className="h-3 w-3" /> Remove member
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {pendingInvites.length > 0 && (
        <SectionCard title="Pending Invitations">
          <div className="space-y-1.5">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-4 py-3">
                <Mail className="h-4 w-4 shrink-0 text-amber-400/60" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/60">{inv.email}</p>
                  <p className="text-[11px] text-white/30">Invited as {ROLE_LABELS[inv.role]}</p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">Pending</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <AnimatePresence>
        {showInvite && <InviteModal onClose={() => { setShowInvite(false); void refreshMembers(); }} />}
      </AnimatePresence>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        title="Remove team member?"
        description="They will lose access to this workspace immediately. Their call history stays in the workspace."
        confirmLabel="Remove member"
        variant="destructive"
        loading={actionBusy !== null}
        onConfirm={() => { if (removeTarget) void handleRemove(removeTarget); }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab]     = useState<TabKey>('recording');
  const [settings, setSettings]       = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [userName, setUserName]       = useState('');
  const [userEmail, setUserEmail]     = useState('');
  const [recordingStats, setRecordingStats] = useState({ count: 0, hours: 0, storageMb: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'billing' || tab === 'team' || tab === 'security' || tab === 'profile' || tab === 'workspace' || tab === 'calling') {
      setActiveTab(tab as TabKey);
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      setUserName(session.user.user_metadata?.full_name ?? '');
      setUserEmail(session.user.email ?? '');

      const { data: s } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (s) {
        const loaded: UserSettings = {
          recording_mode:              (s.recording_mode as UserSettings['recording_mode']) ?? 'always',
          recording_disclaimer:        s.recording_disclaimer ?? true,
          recording_retention_days:    s.recording_retention_days ?? 30,
          recording_pause_on_dtmf:     s.recording_pause_on_dtmf ?? true,
          recording_auto_delete_short: s.recording_auto_delete_short ?? true,
          ai_auto_transcribe:          s.ai_auto_transcribe ?? true,
          ai_auto_summarize:           s.ai_auto_summarize ?? true,
          ai_detect_sentiment:         s.ai_detect_sentiment ?? true,
          ai_extract_talking_points:   s.ai_extract_talking_points ?? true,
          inbound_mode:                (s.inbound_mode as UserSettings['inbound_mode']) ?? 'browser',
          inbound_forward_number:      s.inbound_forward_number ?? '',
          inbound_ring_seconds:        s.inbound_ring_seconds ?? 25,
          missed_call_notify:          s.missed_call_notify ?? true,
        };
        setSettings(loaded);
        setSavedSettings(loaded);
      } else {
        await supabase.from('user_settings').insert({ user_id: session.user.id });
      }

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
          storageMb: totalSeconds * 0.008, // ~8 KB/s at 64 kbps
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
    setSaveError('');
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Explicit column list — only DB-confirmed columns (migrations 008 + 027).
      // DO NOT spread the full settings object — it would include non-existent
      // columns and cause PostgREST to return 422, silently failing the save.
      const toSave = {
        recording_mode:              settings.recording_mode,
        recording_disclaimer:        settings.recording_disclaimer,
        recording_retention_days:    settings.recording_retention_days,
        recording_pause_on_dtmf:     settings.recording_pause_on_dtmf,
        recording_auto_delete_short: settings.recording_auto_delete_short,
        ai_auto_transcribe:          settings.ai_auto_transcribe,
        ai_auto_summarize:           settings.ai_auto_summarize,
        ai_detect_sentiment:         settings.ai_detect_sentiment,
        ai_extract_talking_points:   settings.ai_extract_talking_points,
        inbound_mode:                settings.inbound_mode,
        inbound_forward_number:      settings.inbound_forward_number,
        inbound_ring_seconds:        settings.inbound_ring_seconds,
        missed_call_notify:          settings.missed_call_notify,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: session.user.id, ...toSave }, { onConflict: 'user_id' });

      if (error) {
        console.error('[SETTINGS] Save error:', error);
        setSaveError(error.message);
        return;
      }

      setSavedSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar tabs */}
        <nav className="hidden w-52 shrink-0 flex-col gap-0.5 border-r border-white/[0.06] p-3 lg:flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left",
                activeTab === key
                  ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                  : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-none lg:hidden shrink-0 absolute top-[57px] left-0 right-0 z-10 bg-[oklch(0.05_0.005_285)]/95 backdrop-blur-xl px-3 py-2 gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                activeTab === key
                  ? "bg-[#8B5CF6]/15 text-[#8B5CF6]"
                  : "text-white/30 hover:text-white/60",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6 mt-10 lg:mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-white/25" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              >
                {activeTab === 'profile' && (
                  <ProfileTab userName={userName} userEmail={userEmail} />
                )}
                {activeTab === 'workspace' && (
                  <WorkspaceSettingsPanel />
                )}
                {activeTab === 'recording' && (
                  <RecordingTab settings={settings} onChange={handleChange} recordingStats={recordingStats} />
                )}
                {activeTab === 'ai' && (
                  <AiTab settings={settings} onChange={handleChange} />
                )}
                {activeTab === 'calling' && (
                  <CallingTab settings={settings} onChange={handleChange} />
                )}
                {activeTab === 'voicemails' && (
                  <VoicemailsTab />
                )}
                {activeTab === 'notifications' && (
                  <NotificationsTab settings={settings} onChange={handleChange} />
                )}
                {activeTab === 'billing' && (
                  <BillingTab />
                )}
                {activeTab === 'team' && (
                  <TeamTab />
                )}
                {activeTab === 'security' && (
                  <SecurityTab userEmail={userEmail} onDeleteRequest={() => setShowDeleteModal(true)} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Floating save bar — only for settings that persist to user_settings */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[oklch(0.09_0.006_285)]/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
              {saveError && <p className="text-xs text-red-400">{saveError}</p>}
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition disabled:opacity-70"
                style={{ background: saving || saveSuccess ? undefined : 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : saveSuccess
                  ? <><CheckCircle2 className="h-4 w-4 text-[#06B6D4]" /> Saved!</>
                  : <><Save className="h-4 w-4" /> Save Changes</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal onClose={() => setShowDeleteModal(false)} userEmail={userEmail} />
        )}
      </AnimatePresence>
    </>
  );
}
