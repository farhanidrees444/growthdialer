export type CallDirection = 'inbound' | 'outbound' | null;

export interface CallLogRow {
  id: string;
  direction: CallDirection;
  status: string;
  disposition: string | null;
  from_number: string | null;
  to_number: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  created_at: string;
  answered_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  was_recorded: boolean | null;
  notes?: string | null;
  transcript?: string | null;
  ai_processing_status?: string | null;
  ai_error?: string | null;
  analytics_id?: string | null;
  ai_summary?: unknown;
  ai_next_steps?: unknown;
  ai_sentiment?: string | null;
  ai_sentiment_score?: number | null;
  lead_id: string | null;
  leads?: {
    id: string;
    name: string | null;
    company: string | null;
    phone: string | null;
  } | null;
}

export function fmtCallDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function fmtCallTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fmtPhone(num: string | null | undefined): string {
  if (!num) return 'Unknown';
  const trimmed = num.trim();
  if (/^restricted@/i.test(trimmed) || /^anonymous@/i.test(trimmed) || /^private@/i.test(trimmed)) {
    return 'Restricted / Private';
  }
  if (trimmed.includes('@') && !/^\+?\d/.test(trimmed)) {
    const user = trimmed.split('@')[0];
    return user ? `${user} (blocked ID)` : 'Unknown';
  }
  const d = trimmed.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return num;
}

export function isVoicemailCall(call: CallLogRow): boolean {
  return call.disposition === 'voicemail' || call.status === 'voicemail';
}

export function getCounterparty(call: CallLogRow): string {
  const raw = call.direction === 'inbound' ? call.from_number : call.to_number;
  const leadName = call.leads?.name?.trim();
  const phone = fmtPhone(raw);

  if (call.direction === 'inbound') {
    if (leadName && phone !== 'Unknown' && !phone.includes('blocked')) return `${leadName} · ${phone}`;
    if (leadName) return leadName;
    return phone;
  }

  if (leadName) return leadName;
  return phone;
}

/** Inbound caller number for secondary line in call log rows. */
export function getInboundCallerNumber(call: CallLogRow): string | null {
  if (call.direction !== 'inbound' || !call.from_number) return null;
  return fmtPhone(call.from_number);
}

export function isMissedCall(call: CallLogRow): boolean {
  if (isVoicemailCall(call)) return false;
  if (call.disposition === 'missed') return true;
  if (call.direction === 'inbound' && !call.answered_at) {
    return ['no_answer', 'canceled', 'failed', 'missed'].includes(call.status)
      || call.status === 'completed';
  }
  return false;
}

/** True when a human agent actually connected (not voicemail or PSTN-only duration). */
export function isConnected(call: CallLogRow): boolean {
  if (isVoicemailCall(call) || isMissedCall(call)) return false;
  if (call.direction === 'inbound') {
    return !!call.answered_at;
  }
  return !!call.answered_at
    || ['answered', 'connected', 'in_progress', 'completed'].includes(call.status);
}

const DISP_LABELS: Record<string, string> = {
  interested: 'Interested',
  callback: 'Callback',
  meeting_booked: 'Meeting',
  voicemail: 'Voicemail',
  not_interested: 'Not interested',
  wrong_number: 'Wrong number',
  gatekeeper: 'Gatekeeper',
  dnc: 'DNC',
  missed: 'Missed',
};

export function dispositionLabel(disp: string | null): string | null {
  if (!disp) return null;
  return DISP_LABELS[disp] ?? disp.replace(/_/g, ' ');
}

export const DISP_COLORS: Record<string, string> = {
  interested: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  callback: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  meeting_booked: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  voicemail: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  not_interested: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  wrong_number: 'bg-red-500/15 text-red-400 border-red-500/20',
  gatekeeper: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  dnc: 'bg-red-600/15 text-red-500 border-red-600/20',
  missed: 'bg-red-500/10 text-red-400 border-red-500/15',
  no_answer: 'bg-slate-500/10 text-slate-500 border-slate-500/15',
};

export type CallDateGroup = 'today' | 'yesterday' | 'this_week' | 'earlier';

export function callDateGroup(iso: string | null | undefined): CallDateGroup {
  if (!iso) return 'earlier';
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  if (d >= startOfToday) return 'today';
  if (d >= startOfYesterday) return 'yesterday';
  if (d >= startOfWeek) return 'this_week';
  return 'earlier';
}

export const DATE_GROUP_ORDER: CallDateGroup[] = ['today', 'yesterday', 'this_week', 'earlier'];

export const DATE_GROUP_LABELS: Record<CallDateGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  earlier: 'Earlier',
};

export function getCallStatusPill(call: CallLogRow): { label: string; className: string } {
  if (isVoicemailCall(call)) {
    return { label: 'Voicemail', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  }
  if (isMissedCall(call)) {
    return { label: 'Missed', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
  }
  if (isConnected(call)) {
    return { label: 'Connected', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  }
  return { label: 'No answer', className: 'bg-slate-500/10 text-slate-500 border-slate-500/15' };
}

export function getCallDetailHref(call: CallLogRow): string | null {
  if (call.recording_url || call.was_recorded) return `/recordings/${call.id}`;
  if (call.lead_id) return `/leads/${call.lead_id}`;
  return null;
}
