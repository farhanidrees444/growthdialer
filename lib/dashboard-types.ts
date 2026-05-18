export interface HourlyMetricPoint {
  hour: number;
  label: string;
  calls: number;
  connected: number;
  meetings: number;
  ai: number;
}

export interface AIHoursSaved {
  total: number;
  transcription: number;
  disposition: number;
  summary: number;
  dollarValue: number;
}

export interface NumberStat {
  number: string;
  answerRate: number;
  status: 'clean' | 'warn' | 'flagged';
}

export interface SpamShield {
  health: number;
  numbers: NumberStat[];
  lastChecked: string;
}

export interface SystemMetricsData {
  sparkline: HourlyMetricPoint[];
  aiHoursSaved: AIHoursSaved;
  spamShield: SpamShield;
  hasRealData: boolean;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'call' | 'ai' | 'system' | 'error';
  message: string;
}
