export type NumberHealthTier = 'unknown' | 'healthy' | 'good' | 'watch' | 'at_risk' | 'critical';

export type NumberHealthAction = 'none' | 'run_spam_check' | 'monitor' | 'review_connect_rate' | 'urgent';

export type NumberHealthSnapshot = {
  computed_health: number | null;
  reputation_score: number | null;
  health_label: string;
  health_tier: NumberHealthTier;
  health_insight: string;
  action_required: NumberHealthAction;
  has_call_data: boolean;
  has_reputation_check: boolean;
};

type ComputeInput = {
  spam_status: string | null;
  spam_score: number | null;
  last_spam_check: string | null;
  total_calls: number;
  connect_rate: number;
};

/** Minimum outbound calls before connect-rate penalties apply. */
export const MIN_CALLS_FOR_CONNECT_SCORING = 10;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tierFromHealth(health: number | null, hasData: boolean): NumberHealthTier {
  if (!hasData || health === null) return 'unknown';
  if (health >= 80) return 'healthy';
  if (health >= 60) return 'good';
  if (health >= 40) return 'watch';
  if (health >= 20) return 'at_risk';
  return 'critical';
}

function labelFromTier(tier: NumberHealthTier, hasCalls: boolean, hasReputation: boolean): string {
  if (tier === 'unknown') {
    if (!hasCalls && !hasReputation) return 'New';
    if (hasCalls && !hasReputation) return 'Building data';
    return 'Not checked';
  }
  if (tier === 'healthy') return 'Healthy';
  if (tier === 'good') return 'Good';
  if (tier === 'watch') return 'Watch';
  if (tier === 'at_risk') return 'At risk';
  return 'Critical';
}

function resolveTier(
  health: number,
  hasData: boolean,
  hasReputation: boolean,
  hasCalls: boolean,
  totalCalls: number,
): NumberHealthTier {
  const base = tierFromHealth(health, hasData);
  if (base === 'healthy' && !hasReputation && hasCalls) return 'good';
  // Low sample — don't alarm on connect rate yet
  if (hasCalls && !hasReputation && totalCalls < MIN_CALLS_FOR_CONNECT_SCORING && base === 'critical') {
    return 'unknown';
  }
  if (hasCalls && !hasReputation && totalCalls < MIN_CALLS_FOR_CONNECT_SCORING && base === 'at_risk') {
    return 'watch';
  }
  return base;
}

function buildInsight(input: {
  tier: NumberHealthTier;
  hasCalls: boolean;
  hasReputation: boolean;
  total_calls: number;
  connect_rate: number;
  spam_status: string;
  action: NumberHealthAction;
}): string {
  const { tier, hasCalls, hasReputation, total_calls, connect_rate, spam_status, action } = input;

  if (action === 'run_spam_check' && !hasReputation && !hasCalls) {
    return 'Run a spam check and place a few calls to establish a baseline score.';
  }
  if (action === 'run_spam_check' && !hasReputation && hasCalls) {
    return `Spam check unlocks carrier reputation (${total_calls} call${total_calls === 1 ? '' : 's'} logged).`;
  }
  if (action === 'monitor') {
    return `Only ${total_calls} call${total_calls === 1 ? '' : 's'} in 30 days — scores stabilize after ${MIN_CALLS_FOR_CONNECT_SCORING}+ dials.`;
  }
  if (action === 'review_connect_rate') {
    return `${connect_rate}% connect rate across ${total_calls} calls — consider rotating this caller ID.`;
  }
  if (spam_status === 'blocked') return 'Number is blocked on spam lists — stop dialing until resolved.';
  if (spam_status === 'flagged') return 'Flagged on carrier lists — monitor connect rate closely.';
  if (tier === 'healthy') return 'Strong reputation and connect performance.';
  if (tier === 'good') return 'Performing well — keep monitoring weekly.';
  if (tier === 'watch') return 'Mixed signals — run spam checks and watch connect rate.';
  return 'Deliverability may be impaired — review usage and spam status.';
}

/** Carrier reputation from spam check (higher = better). Null until a check has run. */
export function reputationFromSpam(spam_score: number | null, last_spam_check: string | null): number | null {
  if (!last_spam_check) return null;
  return clampScore(100 - (spam_score ?? 0));
}

export function computeNumberHealth(input: ComputeInput): NumberHealthSnapshot {
  const spamStatus = input.spam_status ?? 'clean';
  const hasCalls = input.total_calls > 0;
  const hasReputation = Boolean(input.last_spam_check);
  const reputation = reputationFromSpam(input.spam_score, input.last_spam_check);
  const lowSample = hasCalls && input.total_calls < MIN_CALLS_FOR_CONNECT_SCORING;

  if (!hasCalls && !hasReputation) {
    return {
      computed_health: null,
      reputation_score: null,
      health_label: 'New',
      health_tier: 'unknown',
      health_insight: buildInsight({
        tier: 'unknown',
        hasCalls: false,
        hasReputation: false,
        total_calls: 0,
        connect_rate: 0,
        spam_status: spamStatus,
        action: 'run_spam_check',
      }),
      action_required: 'run_spam_check',
      has_call_data: false,
      has_reputation_check: false,
    };
  }

  let health: number;
  let action: NumberHealthAction = 'none';

  if (reputation !== null) {
    health = reputation;
  } else if (lowSample) {
    health = 70;
    action = 'monitor';
  } else {
    health = 65;
    if (input.connect_rate >= 25) health += 10;
    else if (input.connect_rate >= 15) health += 5;
    else if (input.connect_rate > 0 && input.connect_rate < 10) health -= 15;
    else if (hasCalls && input.connect_rate === 0) {
      health -= 25;
      action = 'review_connect_rate';
    }
  }

  if (spamStatus === 'low_risk') health -= 20;
  if (spamStatus === 'flagged') {
    health -= 50;
    action = 'urgent';
  }
  if (spamStatus === 'blocked') {
    health = Math.min(health, 10);
    action = 'urgent';
  }

  if (hasCalls && input.total_calls > 200) health -= 15;

  if (!hasReputation && hasCalls) action = action === 'none' ? 'run_spam_check' : action;

  const computed = lowSample && !hasReputation ? null : clampScore(health);
  const hasData = hasCalls || hasReputation;
  const tier = resolveTier(computed ?? health, hasData, hasReputation, hasCalls, input.total_calls);
  const label =
    lowSample && !hasReputation
      ? 'Building data'
      : labelFromTier(tier, hasCalls, hasReputation);

  return {
    computed_health: computed,
    reputation_score: reputation,
    health_label: label,
    health_tier: tier,
    health_insight: buildInsight({
      tier,
      hasCalls,
      hasReputation,
      total_calls: input.total_calls,
      connect_rate: input.connect_rate,
      spam_status: spamStatus,
      action,
    }),
    action_required: action,
    has_call_data: hasCalls,
    has_reputation_check: hasReputation,
  };
}

export function averageComputedHealth(
  items: Array<{ computed_health?: number | null }>,
): number | null {
  const scored = items
    .map((n) => n.computed_health)
    .filter((h): h is number => typeof h === 'number');
  if (!scored.length) return null;
  return Math.round(scored.reduce((s, h) => s + h, 0) / scored.length);
}

export const HEALTH_TIER_STYLES: Record<
  NumberHealthTier,
  { text: string; bar: string; badge: string; ring: string }
> = {
  unknown: {
    text: 'text-slate-400',
    bar: 'bg-slate-600',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    ring: 'stroke-slate-600',
  },
  healthy: {
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ring: 'stroke-emerald-500',
  },
  good: {
    text: 'text-cyan-400',
    bar: 'bg-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    ring: 'stroke-cyan-500',
  },
  watch: {
    text: 'text-amber-400',
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ring: 'stroke-amber-400',
  },
  at_risk: {
    text: 'text-orange-400',
    bar: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    ring: 'stroke-orange-500',
  },
  critical: {
    text: 'text-red-400',
    bar: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    ring: 'stroke-red-500',
  },
};

export function healthScoreColor(health: number | null): string {
  if (health === null) return HEALTH_TIER_STYLES.unknown.text;
  if (health >= 80) return HEALTH_TIER_STYLES.healthy.text;
  if (health >= 60) return HEALTH_TIER_STYLES.good.text;
  if (health >= 40) return HEALTH_TIER_STYLES.watch.text;
  return HEALTH_TIER_STYLES.at_risk.text;
}

export function healthScoreBar(health: number | null): string {
  if (health === null) return HEALTH_TIER_STYLES.unknown.bar;
  if (health >= 80) return HEALTH_TIER_STYLES.healthy.bar;
  if (health >= 60) return HEALTH_TIER_STYLES.good.bar;
  if (health >= 40) return HEALTH_TIER_STYLES.watch.bar;
  return HEALTH_TIER_STYLES.at_risk.bar;
}

export function formatHealthPercent(health: number | null): string {
  return health === null ? '—' : `${health}%`;
}

export function formatReputationScore(reputation: number | null): string {
  return reputation === null ? 'Not checked' : `${reputation}/100`;
}

export function sortNumbersByPriority<
  T extends {
    is_default?: boolean;
    action_required?: NumberHealthAction;
    health_tier?: NumberHealthTier;
    computed_health?: number | null;
  },
>(items: T[]): T[] {
  const actionWeight: Record<NumberHealthAction, number> = {
    urgent: 0,
    review_connect_rate: 1,
    run_spam_check: 2,
    monitor: 3,
    none: 4,
  };
  const tierWeight: Record<NumberHealthTier, number> = {
    critical: 0,
    at_risk: 1,
    watch: 2,
    unknown: 3,
    good: 4,
    healthy: 5,
  };

  return [...items].sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    const aw = actionWeight[a.action_required ?? 'none'] - actionWeight[b.action_required ?? 'none'];
    if (aw !== 0) return aw;
    const tw = tierWeight[a.health_tier ?? 'unknown'] - tierWeight[b.health_tier ?? 'unknown'];
    if (tw !== 0) return tw;
    return (a.computed_health ?? 999) - (b.computed_health ?? 999);
  });
}
