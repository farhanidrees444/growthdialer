import { dispositionLabel, fmtPhone, type CallLogRow } from '@/lib/calls/display';

export type DashboardRecentCall = {
  id: string;
  direction: 'inbound' | 'outbound' | null;
  from_number: string | null;
  to_number: string | null;
  duration_seconds: number | null;
  ended_at: string | null;
  disposition: string | null;
  lead_id: string | null;
  recording_url: string | null;
  display_at: string;
  leads: { name: string | null; company: string | null } | null;
};

/** Best timestamp for sorting / "time ago" when ended_at was never set. */
export function effectiveCallEndTime(call: {
  ended_at?: string | null;
  updated_at?: string | null;
  started_at?: string | null;
  created_at?: string | null;
}): string {
  return (
    call.ended_at
    ?? call.updated_at
    ?? call.started_at
    ?? call.created_at
    ?? new Date(0).toISOString()
  );
}

/** Calls that should appear in dashboard recent activity. */
export function isEligibleRecentCall(call: {
  ended_at?: string | null;
  disposition?: string | null;
  answered_at?: string | null;
  status?: string | null;
  duration_seconds?: number | null;
}): boolean {
  if (call.ended_at) return true;
  if (call.disposition) return true;
  if (call.answered_at) return true;
  if ((call.duration_seconds ?? 0) > 0) return true;
  if (call.status && ['completed', 'missed', 'answered', 'connected', 'in_progress'].includes(call.status)) {
    return true;
  }
  return false;
}

export function getRecentCallCounterparty(
  call: Pick<DashboardRecentCall, 'direction' | 'from_number' | 'to_number' | 'leads'>,
): string {
  const asLog: CallLogRow = {
    id: '',
    direction: call.direction,
    status: '',
    disposition: null,
    from_number: call.from_number,
    to_number: call.to_number,
    duration_seconds: null,
    started_at: null,
    created_at: new Date().toISOString(),
    answered_at: null,
    ended_at: null,
    recording_url: null,
    was_recorded: null,
    lead_id: null,
    leads: call.leads
      ? { id: '', name: call.leads.name, company: call.leads.company, phone: null }
      : null,
  };
  const raw = call.direction === 'inbound' ? call.from_number : call.to_number;
  const leadName = call.leads?.name?.trim();
  if (leadName) return leadName;
  return fmtPhone(raw);
}

export function getRecentCallHref(call: DashboardRecentCall): string {
  if (call.recording_url) return `/recordings/${call.id}`;
  if (call.lead_id) return `/leads/${call.lead_id}`;
  return '/call-logs';
}

export function getRecentDispositionLabel(disp: string | null): string {
  if (!disp) return 'No answer';
  return dispositionLabel(disp) ?? disp.replace(/_/g, ' ');
}
