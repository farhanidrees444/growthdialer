import type { DialerQueueConfig } from '@/lib/dialer/queue-query';
import type { LeadRecord } from '@/lib/dialer/state-machine';

export type ParallelSessionStatus =
  | 'active'
  | 'paused'
  | 'dialing'
  | 'connected'
  | 'disposition'
  | 'ended';

export type ParallelLegStatus =
  | 'dialing'
  | 'ringing'
  | 'answered'
  | 'connected'
  | 'no_answer'
  | 'busy'
  | 'failed'
  | 'canceled'
  | 'voicemail';

export interface ParallelDialSession {
  id: string;
  user_id: string;
  workspace_id: string | null;
  status: ParallelSessionStatus;
  lines_count: number;
  total_batches: number;
  total_dialed: number;
  total_connects: number;
  total_meetings: number;
  amd_enabled: boolean;
  vm_drop_enabled: boolean;
  queue_config: DialerQueueConfig | null;
  started_at: string;
  ended_at: string | null;
}

export interface ParallelDialLeg {
  id: string;
  session_id: string;
  call_id: string | null;
  lead_id: string | null;
  lead_name: string | null;
  phone: string;
  telnyx_call_id: string | null;
  status: ParallelLegStatus;
  is_winner: boolean;
  batch_number: number;
  hangup_cause: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParallelSessionSummary {
  batches: number;
  dialed: number;
  connects: number;
  meetings: number;
  connect_rate: number;
  duration_seconds: number;
}

export interface ParallelBatchLead {
  lead: LeadRecord;
  phone: string;
}
