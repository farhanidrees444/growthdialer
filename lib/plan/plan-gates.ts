export type PlanKey = 'trial' | 'starter' | 'growth' | 'pro';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export const PLAN_ORDER = ['trial', 'starter', 'growth', 'pro'] as const;

export const FEATURE_GATES = {
  trial: {
    ai_dialer: false,
    unlimited_calls: false,
    recordings: false,
    transcripts: false,
    voicemail_detection: false,
    local_numbers_limit: 0,
    crm_sync: false,
    ai_call_scoring: false,
    post_call_summaries: false,
    coaching_dashboard: false,
    live_monitor: false,
    whisper_barge_takeover: false,
    sequences: false,
    leaderboard: false,
    weekly_coaching_reports: false,
    api_access: false,
    webhooks: false,
    self_coaching_view: false,
    integrations_nango: false,
    priority_support: false,
  },
  starter: {
    ai_dialer: true,
    unlimited_calls: true,
    recordings: true,
    transcripts: true,
    voicemail_detection: true,
    local_numbers_limit: 1,
    crm_sync: true,
    ai_call_scoring: false,
    post_call_summaries: false,
    coaching_dashboard: false,
    live_monitor: false,
    whisper_barge_takeover: false,
    sequences: false,
    leaderboard: false,
    weekly_coaching_reports: false,
    api_access: false,
    webhooks: false,
    self_coaching_view: false,
    integrations_nango: false,
    priority_support: false,
  },
  growth: {
    ai_dialer: true,
    unlimited_calls: true,
    recordings: true,
    transcripts: true,
    voicemail_detection: true,
    local_numbers_limit: 3,
    crm_sync: true,
    ai_call_scoring: true,
    post_call_summaries: true,
    coaching_dashboard: true,
    live_monitor: false,
    whisper_barge_takeover: false,
    sequences: true,
    leaderboard: true,
    weekly_coaching_reports: false,
    api_access: false,
    webhooks: false,
    self_coaching_view: false,
    integrations_nango: false,
    priority_support: false,
  },
  pro: {
    ai_dialer: true,
    unlimited_calls: true,
    recordings: true,
    transcripts: true,
    voicemail_detection: true,
    local_numbers_limit: -1,
    crm_sync: true,
    ai_call_scoring: true,
    post_call_summaries: true,
    coaching_dashboard: true,
    live_monitor: true,
    whisper_barge_takeover: true,
    sequences: true,
    leaderboard: true,
    weekly_coaching_reports: true,
    api_access: true,
    webhooks: true,
    self_coaching_view: true,
    integrations_nango: true,
    priority_support: true,
  },
} as const;

export type FeatureKey = keyof typeof FEATURE_GATES.starter;

export function isFeatureEnabled(plan: PlanKey, feature: FeatureKey): boolean {
  const value = FEATURE_GATES[plan][feature];
  return typeof value === 'number' ? value !== 0 : value;
}

export function requiredPlanForFeature(feature: FeatureKey): Exclude<PlanKey, 'trial'> {
  for (const plan of ['starter', 'growth', 'pro'] as const) {
    if (isFeatureEnabled(plan, feature)) return plan;
  }
  return 'pro';
}

export const PLAN_LABELS: Record<PlanKey, string> = {
  trial: 'Trial',
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
};
