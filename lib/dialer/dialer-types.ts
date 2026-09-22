export type DialerMode = 'browse' | 'preview' | 'live';

export type DispositionType =
  | 'interested'
  | 'callback'
  | 'meeting_booked'
  | 'voicemail'
  | 'not_interested'
  | 'wrong_number'
  | 'gatekeeper'
  | 'dnc';

export interface LeadRecord {
  id: string;
  name: string;
  title?: string;
  company?: string;
  phone: string;
  email?: string;
  status: string;
  ai_score?: number;
  last_called_at?: string;
  call_attempts?: number;
  tags?: string[];
  notes?: string;
  company_size?: string;
  industry?: string;
  revenue?: string;
  activity_summary?: string;
  profile_url?: string;
  dnc?: boolean;
  user_id?: string;
}

export interface CallRecord {
  id: string;
  lead_id?: string;
  to_number: string;
  from_number: string;
  status: string;
  disposition?: string;
  disposition_notes?: string;
  notes?: string;
  created_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  telnyx_call_id?: string;
}

export interface TodayStats {
  callsToday: number;
  connects: number;
  meetings: number;
  streak: number;
}

export const DISPOSITION_LABELS: Record<DispositionType, { label: string; icon: string; hotkey: string; color: 'positive' | 'neutral' | 'negative' }> = {
  interested:    { label: 'Interested',     icon: '🟢', hotkey: '1', color: 'positive' },
  meeting_booked:{ label: 'Meeting Booked', icon: '📅', hotkey: '2', color: 'positive' },
  callback:      { label: 'Callback',       icon: '🔄', hotkey: '3', color: 'positive' },
  voicemail:     { label: 'Voicemail',      icon: '📧', hotkey: '4', color: 'neutral'  },
  gatekeeper:    { label: 'Gatekeeper',     icon: '🔒', hotkey: '5', color: 'neutral'  },
  not_interested:{ label: 'Not Interested', icon: '👎', hotkey: '6', color: 'negative' },
  wrong_number:  { label: 'Wrong Number',   icon: '❌', hotkey: '7', color: 'negative' },
  dnc:           { label: 'Do Not Call',    icon: '🚫', hotkey: '8', color: 'negative' },
};

export const LEAD_STATUS_TO_DISPOSITION: Record<DispositionType, string> = {
  interested:     'connected',
  callback:       'callback',
  meeting_booked: 'meeting_booked',
  voicemail:      'contacted',
  not_interested: 'not_interested',
  wrong_number:   'wrong_number',
  gatekeeper:     'contacted',
  dnc:            'do_not_call',
};
