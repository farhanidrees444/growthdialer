export interface WorkspaceDispositionDef {
  key: string;
  label: string;
  emoji: string;
  category: 'positive' | 'neutral' | 'negative';
  lead_status: string;
  sort_order: number;
  hotkey: number | null;
  triggers_callback: boolean;
  triggers_meeting: boolean;
  sets_dnc: boolean;
}

export const DEFAULT_DISPOSITIONS: WorkspaceDispositionDef[] = [
  { key: 'interested', label: 'Interested', emoji: '✅', category: 'positive', lead_status: 'connected', sort_order: 1, hotkey: 1, triggers_callback: false, triggers_meeting: false, sets_dnc: false },
  { key: 'meeting_booked', label: 'Meeting Booked', emoji: '📅', category: 'positive', lead_status: 'meeting_booked', sort_order: 2, hotkey: 2, triggers_callback: false, triggers_meeting: true, sets_dnc: false },
  { key: 'callback', label: 'Callback', emoji: '🔁', category: 'neutral', lead_status: 'callback', sort_order: 3, hotkey: 3, triggers_callback: true, triggers_meeting: false, sets_dnc: false },
  { key: 'voicemail', label: 'Voicemail', emoji: '📩', category: 'neutral', lead_status: 'contacted', sort_order: 4, hotkey: 4, triggers_callback: false, triggers_meeting: false, sets_dnc: false },
  { key: 'gatekeeper', label: 'Gatekeeper', emoji: '🚪', category: 'neutral', lead_status: 'contacted', sort_order: 5, hotkey: 5, triggers_callback: false, triggers_meeting: false, sets_dnc: false },
  { key: 'not_interested', label: 'Not Interested', emoji: '👎', category: 'negative', lead_status: 'not_interested', sort_order: 6, hotkey: 6, triggers_callback: false, triggers_meeting: false, sets_dnc: false },
  { key: 'wrong_number', label: 'Wrong Number', emoji: '❌', category: 'negative', lead_status: 'wrong_number', sort_order: 7, hotkey: 7, triggers_callback: false, triggers_meeting: false, sets_dnc: false },
  { key: 'dnc', label: 'Do Not Call', emoji: '🛑', category: 'negative', lead_status: 'do_not_call', sort_order: 8, hotkey: 8, triggers_callback: false, triggers_meeting: false, sets_dnc: true },
];

export function dispositionDefByKey(key: string): WorkspaceDispositionDef | undefined {
  return DEFAULT_DISPOSITIONS.find((d) => d.key === key);
}
