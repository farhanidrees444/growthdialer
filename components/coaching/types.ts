export type RubricBreakdown = {
  opener_strength?: number;
  discovery_depth?: number;
  objection_handling?: number;
  value_articulation?: number;
  close_attempt?: number;
};

export type CoachingMoment = {
  title?: string;
  detail?: string;
  suggested_script?: string;
  timestamp?: string;
};

export type CoachingScore = {
  id: string;
  call_id: string;
  agent_id: string;
  total_score: number;
  rubric_breakdown: RubricBreakdown;
  ai_summary: string;
  key_moments: CoachingMoment[];
  coachable_moments: CoachingMoment[];
  scored_at: string;
};

export type CoachingCall = {
  id: string;
  agent_id: string;
  prospect_name: string;
  prospect_company: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  disposition: string | null;
  score: number | null;
};

export type AgentRosterRow = {
  agent_id: string;
  full_name: string;
  role: string;
  avg_score: number;
  calls_this_week: number;
  trend: Array<{ label: string; score: number }>;
};

export type CoachingNote = {
  id: string;
  call_id: string;
  agent_id: string;
  coach_id: string;
  note: string;
  visible_to_agent: boolean;
  updated_at: string;
};

export type WeeklyReport = {
  id: string;
  week_start: string;
  week_end: string;
  strengths: string[];
  improvements: string[];
  drill: { title?: string; instructions?: string; script?: string };
  summary: string;
};

export type LiveCall = {
  id: string;
  call_id?: string;
  user_id?: string;
  agent_id?: string;
  agent_name?: string;
  prospect_name?: string;
  prospect_company?: string | null;
  lead_first_name?: string;
  lead_last_name?: string;
  lead_company?: string;
  to_number?: string | null;
  started_at?: string | null;
  answered_at?: string | null;
  created_at?: string | null;
  ai_sentiment_score?: number | null;
  talk_listen_ratio?: number | null;
};
