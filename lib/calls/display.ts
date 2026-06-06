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
  const d = num.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return num;
}

export function getCounterparty(call: CallLogRow): string {
  const raw = call.direction === 'inbound' ? call.from_number : call.to_number;
  const leadName = call.leads?.name?.trim();
  if (leadName) return leadName;
  return fmtPhone(raw);
}

export function isMissedCall(call: CallLogRow): boolean {
  if (call.disposition === 'missed') return true;
  if (call.direction === 'inbound' && !call.answered_at) {
    return ['no_answer', 'canceled', 'failed', 'missed'].includes(call.status);
  }
  return false;
}

export function isConnected(call: CallLogRow): boolean {
  return !!call.answered_at || ['answered', 'connected', 'in_progress', 'completed'].includes(call.status);
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
